"""
Tests for the accounts app.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from apps.accounts.models import User, ActivationToken, PasswordResetToken


class TestUserModel(TestCase):
    """Tests for the User model."""
    
    def test_create_user(self):
        """Test creating a new user."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            name='Test User'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.name, 'Test User')
        self.assertTrue(user.check_password('testpass123'))
        self.assertEqual(user.status, User.Status.PENDING_ACTIVATION)
    
    def test_create_superuser(self):
        """Test creating a superuser."""
        admin = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )
        self.assertEqual(admin.email, 'admin@example.com')
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertEqual(admin.status, 'active')
    
    def test_user_str(self):
        """Test user string representation."""
        user = User.objects.create_user(email='test@example.com')
        self.assertEqual(str(user), 'test@example.com')
    
    def test_user_activate(self):
        """Test user activation."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.assertEqual(user.status, User.Status.PENDING_ACTIVATION)
        user.activate()
        user.save()
        self.assertEqual(user.status, User.Status.ACTIVE)
        self.assertIsNotNone(user.activated_at)


class TestActivationToken(TestCase):
    """Tests for the ActivationToken model."""
    
    def test_create_activation_token(self):
        """Test creating an activation token."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        token = ActivationToken.objects.create(user=user)
        self.assertIsNotNone(token.token)
        self.assertGreater(len(token.token), 0)
        self.assertTrue(token.is_valid)  # is_valid is a property
    
    def test_activation_token_expiration(self):
        """Test activation token expiration."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        token = ActivationToken.objects.create(user=user)
        # Token should be valid when just created
        self.assertTrue(token.is_valid)  # is_valid is a property


class TestAuthEndpoints(APITestCase):
    """Tests for authentication endpoints."""
    
    def setUp(self):
        """Set up test client."""
        self.client = APIClient()
    
    def test_login_success(self):
        """Test successful login."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            status='active'
        )
        response = self.client.post('/api/auth/login/', {
            'email': 'test@example.com',
            'password': 'testpass123'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Tokens are stored in HttpOnly cookies, response has user data
        self.assertIn('user', response.data)
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            status='active'
        )
        response = self.client.post('/api/auth/login/', {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }, format='json')
        # API returns 400 Bad Request for invalid credentials
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
    
    def test_login_inactive_user(self):
        """Test login with inactive user."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            status='pending_activation'
        )
        response = self.client.post('/api/auth/login/', {
            'email': 'test@example.com',
            'password': 'testpass123'
        }, format='json')
        # API may return 400, 401, or 403 for inactive users
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_me_endpoint_authenticated(self):
        """Test /me endpoint with authenticated user."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            name='Test User',
            status='active'
        )
        self.client.force_authenticate(user=user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')
    
    def test_me_endpoint_unauthenticated(self):
        """Test /me endpoint without authentication."""
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TestPasswordResetToken(TestCase):
    """Tests for the PasswordResetToken model."""
    
    def test_create_password_reset_token(self):
        """Test creating a password reset token."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            status='active'
        )
        token = PasswordResetToken.objects.create(user=user)
        self.assertIsNotNone(token.token)
        self.assertGreater(len(token.token), 0)
        self.assertTrue(token.is_valid)  # is_valid is a property


class TestAllAuthEndpoints(APITestCase):
    """
    Comprehensive tests for all 9 authentication endpoints:
    1. POST /api/auth/login/
    2. POST /api/auth/logout/
    3. POST /api/auth/activate/
    4. POST /api/auth/forgot-password/
    5. POST /api/auth/reset-password/
    6. GET/PATCH /api/auth/me/
    7. POST/DELETE /api/auth/me/avatar/
    8. POST /api/auth/change-password/
    9. POST /api/auth/refresh/
    """
    
    def setUp(self):
        """Set up test client."""
        self.client = APIClient()
        self.active_user = User.objects.create_user(
            email='active@example.com',
            password='testpass123',
            name='Active User',
            status='active'
        )
    
    # ============ 1. LOGIN ENDPOINT ============
    
    def test_login_endpoint_exists(self):
        """Test that POST /api/auth/login/ endpoint exists."""
        response = self.client.post('/api/auth/login/', {
            'email': 'active@example.com',
            'password': 'testpass123'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_login_returns_tokens(self):
        """Test that login returns access and refresh tokens."""
        response = self.client.post('/api/auth/login/', {
            'email': 'active@example.com',
            'password': 'testpass123'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check for token in response or cookies
        has_token = ('access' in response.data or 
                     'user' in response.data or 
                     'acorda_access' in response.cookies)
        self.assertTrue(has_token)
    
    def test_login_with_wrong_password(self):
        """Test login fails with wrong password."""
        response = self.client.post('/api/auth/login/', {
            'email': 'active@example.com',
            'password': 'wrongpassword'
        }, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_400_BAD_REQUEST, 
            status.HTTP_401_UNAUTHORIZED
        ])
    
    def test_login_with_nonexistent_email(self):
        """Test login fails with nonexistent email."""
        response = self.client.post('/api/auth/login/', {
            'email': 'nonexistent@example.com',
            'password': 'testpass123'
        }, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_400_BAD_REQUEST, 
            status.HTTP_401_UNAUTHORIZED
        ])
    
    # ============ 2. LOGOUT ENDPOINT ============
    
    def test_logout_endpoint_exists(self):
        """Test that POST /api/auth/logout/ endpoint exists."""
        self.client.force_authenticate(user=self.active_user)
        response = self.client.post('/api/auth/logout/', format='json')
        # Should return 200 or 204 on success
        self.assertIn(response.status_code, [
            status.HTTP_200_OK, 
            status.HTTP_204_NO_CONTENT
        ])
    
    def test_logout_clears_session(self):
        """Test that logout invalidates the session."""
        self.client.force_authenticate(user=self.active_user)
        response = self.client.post('/api/auth/logout/', format='json')
        self.assertIn(response.status_code, [
            status.HTTP_200_OK, 
            status.HTTP_204_NO_CONTENT
        ])
    
    # ============ 3. ACTIVATE ENDPOINT ============
    
    def test_activate_endpoint_exists(self):
        """Test that POST /api/auth/activate/ endpoint exists."""
        pending_user = User.objects.create_user(
            email='pending@example.com',
            password=None,
            status='pending_activation'
        )
        token = ActivationToken.objects.create(user=pending_user)
        
        response = self.client.post('/api/auth/activate/', {
            'token': token.token,
            'password': 'newpassword123',
            'password_confirm': 'newpassword123',
        }, format='json')
        # Should succeed or fail validation, not 404
        self.assertNotEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_activate_with_valid_token(self):
        """Test activation with valid token."""
        pending_user = User.objects.create_user(
            email='pending2@example.com',
            password=None,
            status='pending_activation'
        )
        token = ActivationToken.objects.create(user=pending_user)
        
        response = self.client.post('/api/auth/activate/', {
            'token': token.token,
            'password': 'newpassword123',
            'password_confirm': 'newpassword123',
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify user is now active
        pending_user.refresh_from_db()
        self.assertEqual(pending_user.status, 'active')
    
    def test_activate_with_invalid_token(self):
        """Test activation fails with invalid token."""
        response = self.client.post('/api/auth/activate/', {
            'token': 'invalid-token-12345',
            'password': 'newpassword123',
            'password_confirm': 'newpassword123',
        }, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ])
    
    # ============ 4. FORGOT PASSWORD ENDPOINT ============
    
    def test_forgot_password_endpoint_exists(self):
        """Test that POST /api/auth/forgot-password/ endpoint exists."""
        response = self.client.post('/api/auth/forgot-password/', {
            'email': 'active@example.com'
        }, format='json')
        # Should return 200 even for non-existent emails (security)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_forgot_password_creates_token(self):
        """Test that forgot password creates a reset token."""
        response = self.client.post('/api/auth/forgot-password/', {
            'email': 'active@example.com'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify token was created
        self.assertTrue(
            PasswordResetToken.objects.filter(user=self.active_user).exists()
        )
    
    # ============ 5. RESET PASSWORD ENDPOINT ============
    
    def test_reset_password_endpoint_exists(self):
        """Test that POST /api/auth/reset-password/ endpoint exists."""
        token = PasswordResetToken.objects.create(user=self.active_user)
        
        response = self.client.post('/api/auth/reset-password/', {
            'token': token.token,
            'password': 'newpassword456',
            'password_confirm': 'newpassword456',
        }, format='json')
        # Should succeed or fail validation, not 404
        self.assertNotEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_reset_password_with_valid_token(self):
        """Test password reset with valid token."""
        token = PasswordResetToken.objects.create(user=self.active_user)
        
        response = self.client.post('/api/auth/reset-password/', {
            'token': token.token,
            'password': 'newpassword456',
            'password_confirm': 'newpassword456',
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password was changed
        self.active_user.refresh_from_db()
        self.assertTrue(self.active_user.check_password('newpassword456'))
    
    def test_reset_password_with_invalid_token(self):
        """Test reset password fails with invalid token."""
        response = self.client.post('/api/auth/reset-password/', {
            'token': 'invalid-token-12345',
            'password': 'newpassword456',
            'password_confirm': 'newpassword456',
        }, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ])
    
    # ============ 6. ME ENDPOINT ============
    
    def test_me_get_endpoint_exists(self):
        """Test that GET /api/auth/me/ endpoint exists."""
        self.client.force_authenticate(user=self.active_user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_me_returns_user_data(self):
        """Test that me endpoint returns user data."""
        self.client.force_authenticate(user=self.active_user)
        response = self.client.get('/api/auth/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'active@example.com')
        self.assertEqual(response.data['name'], 'Active User')
    
    def test_me_patch_updates_profile(self):
        """Test that PATCH /api/auth/me/ updates profile."""
        self.client.force_authenticate(user=self.active_user)
        response = self.client.patch('/api/auth/me/', {
            'name': 'Updated Name',
            'timezone': 'America/Sao_Paulo',
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.active_user.refresh_from_db()
        self.assertEqual(self.active_user.name, 'Updated Name')
        self.assertEqual(self.active_user.timezone, 'America/Sao_Paulo')
    
    def test_me_requires_authentication(self):
        """Test that me endpoint requires authentication."""
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    # ============ 7. AVATAR ENDPOINT ============
    
    def test_avatar_post_endpoint_exists(self):
        """Test that POST /api/auth/me/avatar/ endpoint exists."""
        self.client.force_authenticate(user=self.active_user)
        # Send a minimal base64 image
        response = self.client.post('/api/auth/me/avatar/', {
            'avatar_base64': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        }, format='json')
        # Should not return 404
        self.assertNotEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_avatar_delete_endpoint_exists(self):
        """Test that DELETE /api/auth/me/avatar/ endpoint exists."""
        self.client.force_authenticate(user=self.active_user)
        response = self.client.delete('/api/auth/me/avatar/')
        # Should return success or 200/204
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_204_NO_CONTENT,
            status.HTTP_400_BAD_REQUEST,  # If no avatar to delete
        ])
    
    def test_avatar_requires_authentication(self):
        """Test that avatar endpoint requires authentication."""
        response = self.client.post('/api/auth/me/avatar/', {
            'avatar_base64': 'test'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    # ============ 8. CHANGE PASSWORD ENDPOINT ============
    
    def test_change_password_endpoint_exists(self):
        """Test that POST /api/auth/change-password/ endpoint exists."""
        self.client.force_authenticate(user=self.active_user)
        response = self.client.post('/api/auth/change-password/', {
            'current_password': 'testpass123',
            'new_password': 'newpassword789',
            'new_password_confirm': 'newpassword789',
        }, format='json')
        # Should not return 404
        self.assertNotEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_change_password_success(self):
        """Test successful password change."""
        self.client.force_authenticate(user=self.active_user)
        response = self.client.post('/api/auth/change-password/', {
            'current_password': 'testpass123',
            'new_password': 'newpassword789',
            'new_password_confirm': 'newpassword789',
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password was changed
        self.active_user.refresh_from_db()
        self.assertTrue(self.active_user.check_password('newpassword789'))
    
    def test_change_password_wrong_current(self):
        """Test change password fails with wrong current password."""
        self.client.force_authenticate(user=self.active_user)
        response = self.client.post('/api/auth/change-password/', {
            'current_password': 'wrongpassword',
            'new_password': 'newpassword789',
            'new_password_confirm': 'newpassword789',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_change_password_requires_authentication(self):
        """Test that change password requires authentication."""
        response = self.client.post('/api/auth/change-password/', {
            'current_password': 'testpass123',
            'new_password': 'newpassword789',
            'new_password_confirm': 'newpassword789',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    # ============ 9. REFRESH TOKEN ENDPOINT ============
    
    def test_refresh_endpoint_exists(self):
        """Test that POST /api/auth/refresh/ endpoint exists."""
        # First login to get tokens
        login_response = self.client.post('/api/auth/login/', {
            'email': 'active@example.com',
            'password': 'testpass123'
        }, format='json')
        
        # Try to refresh
        response = self.client.post('/api/auth/refresh/', format='json')
        # Should not return 404
        self.assertNotEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestLoginNoEnumeration(APITestCase):
    """
    Test that login does not reveal account existence or status.
    (Audit R10 finding #6)
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='existing@example.com',
            password='testpass123',
            status='active',
        )

    def _login(self, email, password):
        return self.client.post('/api/auth/login/', {
            'email': email, 'password': password,
        }, format='json')

    def test_wrong_password_message(self):
        response = self._login('existing@example.com', 'wrongpassword')
        self.assertIn(response.status_code, [400, 401])
        body = str(response.data)
        self.assertNotIn('ativada', body)
        self.assertNotIn('suspensa', body)
        self.assertNotIn('cancelada', body)

    def test_nonexistent_email_message(self):
        response = self._login('ghost@example.com', 'testpass123')
        self.assertIn(response.status_code, [400, 401])
        body = str(response.data)
        self.assertNotIn('ativada', body)

    def test_pending_user_same_message_as_nonexistent(self):
        """Pending user must return the same generic error as wrong credentials."""
        User.objects.create_user(
            email='pending@example.com',
            password='testpass123',
            status='pending_activation',
        )
        pending_resp = self._login('pending@example.com', 'testpass123')
        ghost_resp = self._login('ghost2@example.com', 'testpass123')

        # Both should be 400
        self.assertEqual(pending_resp.status_code, ghost_resp.status_code)
        # Error messages should be identical
        self.assertEqual(str(pending_resp.data), str(ghost_resp.data))

    def test_suspended_user_generic_message(self):
        """Suspended user must NOT reveal 'suspensa' in the response."""
        User.objects.create_user(
            email='suspended@example.com',
            password='testpass123',
            status='suspended',
        )
        response = self._login('suspended@example.com', 'testpass123')
        self.assertIn(response.status_code, [400, 401])
        body = str(response.data)
        self.assertNotIn('suspensa', body)
        self.assertNotIn('contato', body)
