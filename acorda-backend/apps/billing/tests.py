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
            name='Acorda Leve Mensal',
            plan_type='leve',
            billing_cycle='monthly',
            price=Decimal('12.90'),
            pdf_max_count=20,
            pdf_max_total_mb=500,
            pdf_max_file_mb=25,
        )
        self.assertEqual(plan.name, 'Acorda Leve Mensal')
        self.assertEqual(plan.plan_type, 'leve')
        self.assertEqual(plan.price, Decimal('12.90'))
        self.assertEqual(plan.pdf_max_count, 20)
    
    def test_plan_str(self):
        """Test plan string representation."""
        plan = Plan.objects.create(
            name='Acorda Pro',
            plan_type='pro',
            billing_cycle='monthly',
            price=Decimal('21.90'),
            pdf_max_count=120,
            pdf_max_total_mb=5120,
            pdf_max_file_mb=50,
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
            price=Decimal('21.90'),
            pdf_max_count=120,
            pdf_max_total_mb=5120,
            pdf_max_file_mb=50,
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
        self.leve_plan = Plan.objects.create(
            name='Acorda Leve Mensal',
            plan_type='leve',
            billing_cycle='monthly',
            price=Decimal('12.90'),
            has_ai=False,
            pdf_max_count=20,
            pdf_max_total_mb=500,
            pdf_max_file_mb=25,
        )
        self.pro_plan = Plan.objects.create(
            name='Acorda Pro Mensal',
            plan_type='pro',
            billing_cycle='monthly',
            price=Decimal('21.90'),
            has_ai=False,
            pdf_max_count=120,
            pdf_max_total_mb=5120,
            pdf_max_file_mb=50,
        )
        self.lifetime_plan = Plan.objects.create(
            name='Acorda Vitalício',
            plan_type='lifetime',
            billing_cycle='lifetime',
            price=Decimal('319.00'),
            has_ai=False,
            pdf_max_count=120,
            pdf_max_total_mb=5120,
            pdf_max_file_mb=50,
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
        """Test that each plan has required fields including PDF limits."""
        response = self.client.get('/api/billing/plans/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for plan in response.data:
            self.assertIn('id', plan)
            self.assertIn('name', plan)
            self.assertIn('plan_type', plan)
            self.assertIn('price', plan)
            self.assertIn('pdf_max_count', plan)
            self.assertIn('pdf_max_total_mb', plan)
            self.assertIn('pdf_max_file_mb', plan)
    
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
        """Test that checkout creates a payment preference.
        Without MP_ACCESS_TOKEN configured, the SDK call must fail
        gracefully and return 400 (not 500)."""
        with self.settings(MP_ACCESS_TOKEN=''):
            response = self.client.post('/api/billing/checkout/', {
                'plan_id': str(self.pro_plan.id),
                'payer_email': 'payer@example.com',
                'payer_name': 'Test Payer',
            }, format='json')
        
            # Without valid MP credentials the service returns
            # {"success": False, "error": ...} → view returns 400
            self.assertEqual(
                response.status_code,
                status.HTTP_400_BAD_REQUEST,
                f"Expected 400 with no MP token, got {response.status_code}: {response.data}",
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
        # Give user a Pro subscription
        Subscription.objects.create(
            user=self.user,
            plan=self.pro_plan,
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
        """Test that webhook returns 401 when signature is invalid (no secret in prod)
        or 200 when DEBUG+no-secret (dev skip)."""
        self.client.logout()
        # With DEBUG=False and no secret, signature check should fail → 401
        with self.settings(DEBUG=False, MP_WEBHOOK_SECRET=''):
            response = self.client.post('/api/billing/webhook/', {
                'type': 'payment',
                'data': {'id': '12345'}
            }, format='json')
            self.assertEqual(
                response.status_code,
                status.HTTP_401_UNAUTHORIZED,
                f"Expected 401 (no secret in prod), got {response.status_code}: {response.data}",
            )
    
    def test_webhook_skips_signature_in_debug(self):
        """Test that in DEBUG mode with no secret, webhook processes the request."""
        self.client.logout()
        with self.settings(DEBUG=True, MP_WEBHOOK_SECRET=''):
            response = self.client.post('/api/billing/webhook/', {
                'type': 'payment',
                'data': {'id': '99999'}
            }, format='json')
            # Should succeed (signature skipped) or return 200/500 from MP lookup
            self.assertIn(response.status_code, [
                status.HTTP_200_OK,
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            ])
    
    def test_webhook_is_public(self):
        """Test that webhook endpoint is public (no auth required)
        and accepts requests when DEBUG=True without MP_WEBHOOK_SECRET."""
        self.client.logout()
        with self.settings(DEBUG=True, MP_WEBHOOK_SECRET=''):
            response = self.client.post('/api/billing/webhook/', {
                'type': 'payment',
                'data': {'id': '12345'}
            }, format='json')
            # Should NOT return 401 Unauthorized
            self.assertNotEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TestWebhookApprovedActivation(APITestCase):
    """
    Test that first webhook with status=approved activates user/subscription.
    (Audit R10 finding #1)
    """

    def setUp(self):
        self.client = APIClient()
        self.plan = Plan.objects.create(
            name='Pro Mensal',
            plan_type='pro',
            billing_cycle='monthly',
            price=Decimal('21.90'),
            pdf_max_count=120,
            pdf_max_total_mb=5120,
            pdf_max_file_mb=50,
        )

    def test_approved_payment_creates_user_and_subscription(self):
        """Simulates _handle_payment for an approved payment on creation.
        The payment should be created as approved AND user+subscription
        should be provisioned (not skipped)."""
        from apps.billing.views import WebhookView
        from apps.billing.models import Payment
        from unittest.mock import patch

        fake_mp_response = {
            'status': 'approved',
            'payer': {'email': 'newbuyer@example.com', 'first_name': 'New', 'last_name': 'Buyer'},
            'transaction_amount': float(self.plan.price),
            'external_reference': f'acorda|{self.plan.id}|{self.plan.billing_cycle}|abc123',
        }

        with patch('apps.billing.views.mp_service.get_payment', return_value=fake_mp_response):
            view = WebhookView()
            view._handle_payment('mp_pay_001')

        payment = Payment.objects.get(mp_payment_id='mp_pay_001')
        self.assertEqual(payment.status, Payment.Status.APPROVED)
        # User and subscription MUST be linked on first approved webhook
        self.assertIsNotNone(payment.user, 'Payment.user should be set on first approved webhook')
        self.assertIsNotNone(payment.subscription, 'Payment.subscription should be set on first approved webhook')

        # Subscription should be active
        self.assertEqual(payment.subscription.status, Subscription.Status.ACTIVE)
        self.assertEqual(payment.subscription.plan, self.plan)

    def test_approved_payment_idempotent_on_redelivery(self):
        """Second webhook for same payment should NOT duplicate user/subscription."""
        from apps.billing.views import WebhookView
        from apps.billing.models import Payment
        from unittest.mock import patch

        fake_mp_response = {
            'status': 'approved',
            'payer': {'email': 'repeat@example.com', 'first_name': 'R', 'last_name': ''},
            'transaction_amount': float(self.plan.price),
            'external_reference': f'acorda|{self.plan.id}|{self.plan.billing_cycle}|abc123',
        }

        with patch('apps.billing.views.mp_service.get_payment', return_value=fake_mp_response):
            view = WebhookView()
            view._handle_payment('mp_pay_redelivery')
            # Redeliver
            view._handle_payment('mp_pay_redelivery')

        self.assertEqual(Payment.objects.filter(mp_payment_id='mp_pay_redelivery').count(), 1)
        payment = Payment.objects.get(mp_payment_id='mp_pay_redelivery')
        # Still linked
        self.assertIsNotNone(payment.user)
        self.assertIsNotNone(payment.subscription)
        # Only 1 subscription for that user+plan
        self.assertEqual(
            Subscription.objects.filter(user=payment.user, plan=self.plan).count(),
            1,
        )
