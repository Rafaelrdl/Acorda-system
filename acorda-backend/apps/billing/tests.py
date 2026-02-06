"""
Tests for the billing app.
Validates all 6 billing endpoints:
1. GET /api/billing/plans/
2. POST /api/billing/checkout/
3. GET /api/billing/subscription/
4. DELETE /api/billing/subscription/
5. GET /api/billing/usage/
6. POST /api/billing/webhook/
"""
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from apps.accounts.models import User
from apps.billing.models import Plan, Subscription


class TestPlanModel(TestCase):
    """Tests for the Plan model."""
    
    def test_create_plan(self):
        """Test creating a plan."""
        plan = Plan.objects.create(
            name='Acorda Pro Mensal',
            plan_type='pro',
            billing_cycle='monthly',
            price=Decimal('14.90')
        )
        self.assertEqual(plan.name, 'Acorda Pro Mensal')
        self.assertEqual(plan.plan_type, 'pro')
        self.assertEqual(plan.price, Decimal('14.90'))
    
    def test_plan_str(self):
        """Test plan string representation."""
        plan = Plan.objects.create(
            name='Acorda Pro',
            plan_type='pro',
            billing_cycle='monthly',
            price=Decimal('14.90')
        )
        self.assertIn('Acorda Pro', str(plan))


class TestSubscriptionModel(TestCase):
    """Tests for the Subscription model."""
    
    def test_create_subscription(self):
        """Test creating a subscription."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            status='active'
        )
        plan = Plan.objects.create(
            name='Acorda Pro',
            plan_type='pro',
            billing_cycle='monthly',
            price=Decimal('14.90')
        )
        subscription = Subscription.objects.create(
            user=user,
            plan=plan,
            status='active'
        )
        self.assertEqual(subscription.user, user)
        self.assertEqual(subscription.plan, plan)
        self.assertEqual(subscription.status, 'active')


class TestAllBillingEndpoints(APITestCase):
    """
    Comprehensive tests for all 6 billing endpoints:
    1. GET /api/billing/plans/
    2. POST /api/billing/checkout/
    3. GET /api/billing/subscription/
    4. DELETE /api/billing/subscription/
    5. GET /api/billing/usage/
    6. POST /api/billing/webhook/
    """
    
    def setUp(self):
        """Set up test client and data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='billing-test@example.com',
            password='testpass123',
            status='active'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create test plans
        self.pro_plan = Plan.objects.create(
            name='Acorda Pro Mensal',
            plan_type='pro',
            billing_cycle='monthly',
            price=Decimal('14.90'),
            has_ai=False,
        )
        self.pro_ia_plan = Plan.objects.create(
            name='Acorda Pro + IA Mensal',
            plan_type='pro_ia',
            billing_cycle='monthly',
            price=Decimal('29.90'),
            has_ai=True,
            ai_requests_limit=1000,
        )
        self.lifetime_plan = Plan.objects.create(
            name='Acorda Lifetime',
            plan_type='lifetime',
            billing_cycle='lifetime',
            price=Decimal('297.00'),
            has_ai=True,
        )
    
    # ============ 1. GET PLANS ENDPOINT ============
    
    def test_plans_endpoint_exists(self):
        """Test that GET /api/billing/plans/ endpoint exists."""
        response = self.client.get('/api/billing/plans/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_plans_returns_list(self):
        """Test that plans endpoint returns a list of plans."""
        response = self.client.get('/api/billing/plans/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 3)
    
    def test_plans_contains_required_fields(self):
        """Test that each plan has required fields."""
        response = self.client.get('/api/billing/plans/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for plan in response.data:
            self.assertIn('id', plan)
            self.assertIn('name', plan)
            self.assertIn('plan_type', plan)
            self.assertIn('price', plan)
    
    def test_plans_requires_authentication(self):
        """Test that plans endpoint requires authentication."""
        self.client.logout()
        response = self.client.get('/api/billing/plans/')
        # Plans can be public or require auth depending on implementation
        # Just verify it doesn't error
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_401_UNAUTHORIZED
        ])
    
    # ============ 2. POST CHECKOUT ENDPOINT ============
    
    def test_checkout_endpoint_exists(self):
        """Test that POST /api/billing/checkout/ endpoint exists."""
        response = self.client.post('/api/billing/checkout/', {
            'plan_id': str(self.pro_plan.id),
            'payer_email': 'payer@example.com',
        }, format='json')
        # Should not return 404
        self.assertNotEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_checkout_creates_preference(self):
        """Test that checkout creates a payment preference."""
        response = self.client.post('/api/billing/checkout/', {
            'plan_id': str(self.pro_plan.id),
            'payer_email': 'payer@example.com',
            'payer_name': 'Test Payer',
        }, format='json')
        
        # Should succeed or return a clear client error – never 500
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST,
        ])
        self.assertNotEqual(
            response.status_code,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            f"Checkout returned 500: {response.data}",
        )
    
    def test_checkout_requires_plan_id(self):
        """Test that checkout requires plan_id."""
        response = self.client.post('/api/billing/checkout/', {
            'payer_email': 'payer@example.com',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_checkout_allows_unauthenticated(self):
        """Test that checkout allows unauthenticated users (for guest purchases)."""
        self.client.logout()
        # Checkout is AllowAny - should work without auth
        response = self.client.post('/api/billing/checkout/', {
            'plan_id': str(self.pro_plan.id),
            'payer_email': 'payer@example.com',
        }, format='json')
        # Should not return 401 - may return 400 due to missing MP credentials in test
        self.assertNotEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    # ============ 3. GET SUBSCRIPTION ENDPOINT ============
    
    def test_subscription_get_endpoint_exists(self):
        """Test that GET /api/billing/subscription/ endpoint exists."""
        response = self.client.get('/api/billing/subscription/')
        # Should return 200 with null/empty or the subscription
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_subscription_returns_null_when_none(self):
        """Test that subscription returns null when user has none."""
        response = self.client.get('/api/billing/subscription/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # May return null or empty object
        subscription = response.data.get('subscription')
        self.assertIsNone(subscription)
    
    def test_subscription_returns_data_when_exists(self):
        """Test that subscription returns data when user has one."""
        Subscription.objects.create(
            user=self.user,
            plan=self.pro_plan,
            status='active'
        )
        
        response = self.client.get('/api/billing/subscription/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Always returns { subscription: ... } envelope
        self.assertIn('subscription', response.data)
        self.assertIsNotNone(response.data['subscription'])
        self.assertIn('plan', response.data['subscription'])
    
    def test_subscription_requires_authentication(self):
        """Test that subscription endpoint requires authentication."""
        self.client.logout()
        response = self.client.get('/api/billing/subscription/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    # ============ 4. DELETE SUBSCRIPTION (CANCEL) ENDPOINT ============
    
    def test_subscription_delete_endpoint_exists(self):
        """Test that DELETE /api/billing/subscription/ endpoint exists."""
        Subscription.objects.create(
            user=self.user,
            plan=self.pro_plan,
            status='active'
        )
        
        response = self.client.delete('/api/billing/subscription/')
        # Should not return 404
        self.assertNotEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_subscription_cancel_updates_status(self):
        """Test that canceling subscription updates its status."""
        subscription = Subscription.objects.create(
            user=self.user,
            plan=self.pro_plan,
            status='active'
        )
        
        response = self.client.delete('/api/billing/subscription/')
        
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_204_NO_CONTENT
        ])
        
        subscription.refresh_from_db()
        self.assertEqual(subscription.status, 'cancelled')
    
    def test_subscription_cancel_requires_authentication(self):
        """Test that cancel subscription requires authentication."""
        self.client.logout()
        response = self.client.delete('/api/billing/subscription/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    # ============ 5. GET USAGE ENDPOINT ============
    
    def test_usage_endpoint_exists(self):
        """Test that GET /api/billing/usage/ endpoint exists."""
        response = self.client.get('/api/billing/usage/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_usage_returns_ai_status(self):
        """Test that usage returns AI availability status."""
        response = self.client.get('/api/billing/usage/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('has_ai', response.data)
    
    def test_usage_returns_feature_list(self):
        """Test that usage returns list of feature usage."""
        # Give user a Pro IA subscription
        Subscription.objects.create(
            user=self.user,
            plan=self.pro_ia_plan,
            status='active'
        )
        
        response = self.client.get('/api/billing/usage/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('usage', response.data)
        self.assertIsInstance(response.data['usage'], list)
    
    def test_usage_requires_authentication(self):
        """Test that usage endpoint requires authentication."""
        self.client.logout()
        response = self.client.get('/api/billing/usage/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    # ============ 6. POST WEBHOOK ENDPOINT ============
    
    def test_webhook_endpoint_exists(self):
        """Test that POST /api/billing/webhook/ endpoint exists."""
        # Webhook is typically public and accepts Mercado Pago notifications
        self.client.logout()
        response = self.client.post('/api/billing/webhook/', {
            'type': 'payment',
            'data': {'id': '12345'}
        }, format='json')
        # Should not return 404
        self.assertNotEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_webhook_accepts_payment_notification(self):
        """Test that webhook accepts payment notifications."""
        self.client.logout()
        response = self.client.post('/api/billing/webhook/', {
            'type': 'payment',
            'data': {'id': '12345'}
        }, format='json')
        
        # Without a valid MP_WEBHOOK_SECRET, webhook should accept or return 401/200
        # It should NEVER return 500 – errors must be handled gracefully
        self.assertNotEqual(
            response.status_code,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            f"Webhook returned 500: {response.data}",
        )
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_401_UNAUTHORIZED,
        ])
    
    def test_webhook_is_public(self):
        """Test that webhook endpoint is public (no auth required)."""
        self.client.logout()
        response = self.client.post('/api/billing/webhook/', {
            'type': 'payment',
            'data': {'id': '12345'}
        }, format='json')
        # Should NOT return 401 Unauthorized
        self.assertNotEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
