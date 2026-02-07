"""
Custom JWT authentication that reads tokens from HttpOnly cookies.
Falls back to Authorization header if cookies are not present.

When authenticating via cookie, CSRF is enforced using Django's
double-submit cookie pattern (same approach as DRF SessionAuthentication).
Header-based auth (Bearer token) is CSRF-exempt by design.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from django.conf import settings
from django.middleware.csrf import CsrfViewMiddleware


# Cookie names
ACCESS_TOKEN_COOKIE = 'acorda_access'
REFRESH_TOKEN_COOKIE = 'acorda_refresh'

# Cookie settings — read from settings so deploy config is respected
COOKIE_SETTINGS = {
    'httponly': True,
    'secure': getattr(settings, 'AUTH_COOKIE_SECURE', not settings.DEBUG),
    'samesite': getattr(settings, 'AUTH_COOKIE_SAMESITE', 'Lax'),
    'path': '/',
}


class _CSRFCheck(CsrfViewMiddleware):
    """
    Thin wrapper so CsrfViewMiddleware returns the failure reason
    instead of an HttpResponseForbidden.
    """

    def _reject(self, request, reason):
        return reason


class CookieJWTAuthentication(JWTAuthentication):
    """
    JWT authentication that reads from cookies first, then falls back to header.
    Also enforces that the user account is active (status == 'active').

    CSRF enforcement:
      • Cookie-based auth ➜ CSRF validated (double-submit cookie)
      • Header-based auth ➜ CSRF skipped (already secure)
    """

    def get_user(self, validated_token):
        """Override to block suspended/cancelled users even if token is valid."""
        user = super().get_user(validated_token)
        # Import here to avoid circular imports
        from .models import User
        if user.status not in (User.Status.ACTIVE,):
            raise AuthenticationFailed(
                'Conta inativa ou suspensa.',
                code='user_inactive',
            )
        return user

    @staticmethod
    def _enforce_csrf(request):
        """
        Enforce CSRF validation for cookie-authenticated requests.
        Mirrors the approach used by DRF's SessionAuthentication.
        Safe methods (GET, HEAD, OPTIONS) are allowed through by Django's
        CsrfViewMiddleware itself – only unsafe methods are checked.
        """
        check = _CSRFCheck(lambda req: None)
        # Populate request.META['CSRF_COOKIE'] from the csrftoken cookie
        check.process_request(request)
        reason = check.process_view(request, None, (), {})
        if reason:
            raise PermissionDenied(f'CSRF Failed: {reason}')

    def authenticate(self, request):
        # First, try to get token from cookie
        access_token = request.COOKIES.get(ACCESS_TOKEN_COOKIE)
        
        if access_token:
            # Validate the token from cookie
            try:
                validated_token = self.get_validated_token(access_token)
                user = self.get_user(validated_token)
                # Cookie-based auth → enforce CSRF on unsafe methods
                self._enforce_csrf(request)
                return (user, validated_token)
            except InvalidToken:
                # Token invalid, try header as fallback
                pass
        
        # Fall back to header-based authentication (no CSRF needed)
        return super().authenticate(request)


def set_auth_cookies(response, access_token: str, refresh_token: str):
    """
    Set authentication tokens as HttpOnly cookies on the response.
    """
    # Access token - shorter lived
    response.set_cookie(
        ACCESS_TOKEN_COOKIE,
        access_token,
        max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
        **COOKIE_SETTINGS
    )
    
    # Refresh token - longer lived
    response.set_cookie(
        REFRESH_TOKEN_COOKIE,
        refresh_token,
        max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
        **COOKIE_SETTINGS
    )


def clear_auth_cookies(response):
    """
    Clear authentication cookies from the response.
    """
    response.delete_cookie(ACCESS_TOKEN_COOKIE, path='/')
    response.delete_cookie(REFRESH_TOKEN_COOKIE, path='/')


def get_refresh_token_from_cookie(request) -> str | None:
    """
    Get the refresh token from the request cookies.
    """
    return request.COOKIES.get(REFRESH_TOKEN_COOKIE)
