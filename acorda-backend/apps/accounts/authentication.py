"""
Custom JWT authentication that reads tokens from HttpOnly cookies.
Falls back to Authorization header if cookies are not present.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings


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


class CookieJWTAuthentication(JWTAuthentication):
    """
    JWT authentication that reads from cookies first, then falls back to header.
    """
    
    def authenticate(self, request):
        # First, try to get token from cookie
        access_token = request.COOKIES.get(ACCESS_TOKEN_COOKIE)
        
        if access_token:
            # Validate the token from cookie
            try:
                validated_token = self.get_validated_token(access_token)
                user = self.get_user(validated_token)
                return (user, validated_token)
            except InvalidToken:
                # Token invalid, try header as fallback
                pass
        
        # Fall back to header-based authentication
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
