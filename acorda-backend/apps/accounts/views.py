"""
Views for accounts app.
"""
import base64
import logging
import uuid
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.utils import timezone
from rest_framework.exceptions import Throttled
from django.core.files.base import ContentFile
from django.conf import settings
from django.middleware.csrf import get_token
from django.db import transaction

from .models import User, PasswordResetToken
from .serializers import (
    UserSerializer,
    LoginSerializer,
    ActivateAccountSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer,
)
from .tasks import send_password_reset_email
from apps.core.utils import safe_delay
from rest_framework.throttling import AnonRateThrottle
from .authentication import (
    set_auth_cookies,
    clear_auth_cookies,
    get_refresh_token_from_cookie,
    REFRESH_TOKEN_COOKIE,
)

logger = logging.getLogger(__name__)


class AuthAnonThrottle(AnonRateThrottle):
    """Strict rate limit for authentication endpoints.
    
    Gracefully degrades if the cache backend (e.g. Redis) is unavailable,
    instead of returning 500, while keeping a safe default throttle policy.
    """
    rate = '10/min'

    def allow_request(self, request, view):
        try:
            return super().allow_request(request, view)
        except (ConnectionError, TimeoutError) as exc:
            logger.error('Throttle cache unavailable for AuthAnonThrottle', exc_info=exc)
            # Fail closed: raise 429 instead of disabling rate limiting entirely.
            raise Throttled(detail='Rate limiting temporarily unavailable, please try again later.')


class PasswordResetThrottle(AnonRateThrottle):
    """Strict rate limit for password reset / forgot password.
    
    Gracefully degrades if the cache backend (e.g. Redis) is unavailable,
    instead of returning 500, while keeping a safe default throttle policy.
    """
    rate = '5/hour'

    def allow_request(self, request, view):
        try:
            return super().allow_request(request, view)
        except (ConnectionError, TimeoutError) as exc:
            logger.error('Throttle cache unavailable for PasswordResetThrottle', exc_info=exc)
            # Fail closed: raise 429 instead of disabling rate limiting entirely.
            raise Throttled(detail='Rate limiting temporarily unavailable, please try again later.')


class LoginView(APIView):
    """Login endpoint - returns JWT tokens in HttpOnly cookies."""
    
    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonThrottle]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']  # type: ignore[index]
        
        # Update last login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Build response with user data only (no tokens in body for security)
        response_data = {
            'user': UserSerializer(user).data
        }
        
        # In development, also include tokens in response for easier debugging
        if settings.DEBUG:
            response_data['access'] = access_token
            response_data['refresh'] = refresh_token
        
        response = Response(response_data)
        
        # Set HttpOnly cookies
        set_auth_cookies(response, access_token, refresh_token)
        
        return response


class LogoutView(APIView):
    """Logout endpoint - blacklists refresh token and clears cookies."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        response = Response({'detail': 'Logout realizado com sucesso.'})
        
        try:
            # Try to get refresh token from cookie first, then from request body
            refresh_token = get_refresh_token_from_cookie(request)
            if not refresh_token:
                refresh_token = request.data.get('refresh')
            
            if refresh_token:
                token = RefreshToken(refresh_token)  # type: ignore[arg-type]
                token.blacklist()
        except TokenError:
            # Token already blacklisted or invalid - that's fine
            pass
        except Exception:
            logger.exception("Unexpected error during logout token blacklist")
        
        # Always clear cookies
        clear_auth_cookies(response)
        
        return response


class ActivateAccountView(APIView):
    """Activate account with token and set password."""
    
    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonThrottle]
    
    def post(self, request):
        serializer = ActivateAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        
        # Generate tokens for auto-login
        refresh = RefreshToken.for_user(user)  # type: ignore[arg-type]
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Build response
        response_data = {
            'detail': 'Conta ativada com sucesso!',
            'user': UserSerializer(user).data
        }
        
        # In development, also include tokens in response
        if settings.DEBUG:
            response_data['access'] = access_token
            response_data['refresh'] = refresh_token
        
        response = Response(response_data)
        
        # Set HttpOnly cookies
        set_auth_cookies(response, access_token, refresh_token)
        
        return response


class ForgotPasswordView(APIView):
    """Request password reset email."""
    
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetThrottle]
    
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = getattr(serializer, 'user', None)
        
        if user:
            # Create reset token
            reset_token = PasswordResetToken.objects.create(user=user)
            
            # Send email async
            safe_delay(send_password_reset_email, user.id, reset_token.token)
        
        # Always return success to prevent email enumeration
        return Response({
            'detail': 'Se o e-mail existir, você receberá instruções para redefinir sua senha.'
        })


class ResetPasswordView(APIView):
    """Reset password with token."""
    
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetThrottle]
    
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        
        # Generate tokens for auto-login
        refresh = RefreshToken.for_user(user)  # type: ignore[arg-type]
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Build response
        response_data = {
            'detail': 'Senha redefinida com sucesso!',
            'user': UserSerializer(user).data
        }
        
        # In development, also include tokens in response
        if settings.DEBUG:
            response_data['access'] = access_token
            response_data['refresh'] = refresh_token
        
        response = Response(response_data)
        
        # Set HttpOnly cookies
        set_auth_cookies(response, access_token, refresh_token)
        
        return response


class MeView(APIView):
    """Get current user data."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        serializer = UpdateProfileSerializer(
            request.user, 
            data=request.data, 
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    """Change password for authenticated user."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({'detail': 'Senha alterada com sucesso!'})


def _storage_name_from_url(avatar_url: str) -> str | None:
    """
    Convert an avatar URL (e.g. '/media/avatars/avatar_xxx.png')
    to a storage-relative name (e.g. 'avatars/avatar_xxx.png').
    Returns None when the URL cannot be resolved to a local file.
    """
    if not avatar_url:
        return None
    # External URLs or data URIs are not local files
    if avatar_url.startswith(('data:', 'http://', 'https://')):
        return None
    # Strip leading '/' then strip the MEDIA_URL prefix ('media/')
    name = avatar_url.lstrip('/')
    media_prefix = settings.MEDIA_URL.strip('/')
    if media_prefix and name.startswith(media_prefix + '/'):
        name = name[len(media_prefix) + 1:]
    return name or None


def _delete_avatar_file(avatar_url: str) -> None:
    """Safely delete the physical avatar file from storage."""
    name = _storage_name_from_url(avatar_url)
    if not name:
        return
    from django.core.files.storage import default_storage
    try:
        if default_storage.exists(name):
            default_storage.delete(name)
    except Exception:
        logger.exception("Failed to delete avatar file: %s", avatar_url)


class UploadAvatarView(APIView):
    """Upload user avatar."""
    
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def post(self, request):
        user = request.user
        
        # Handle base64 image from JSON
        if 'avatar_base64' in request.data:
            try:
                # Expected format: "data:image/png;base64,iVBORw0KGgo..."
                data_url = request.data['avatar_base64']
                
                # Parse base64 data
                if ';base64,' in data_url:
                    header, encoded = data_url.split(';base64,')
                    # Get file extension
                    file_ext = header.split('/')[-1] if '/' in header else 'png'
                    content_type = header.replace('data:', '')
                else:
                    encoded = data_url
                    file_ext = 'png'
                    content_type = 'image/png'
                
                # Validate MIME type
                allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
                if content_type not in allowed_types:
                    return Response(
                        {'detail': 'Formato de imagem não suportado. Use JPEG, PNG, GIF ou WebP.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Validate extension
                allowed_exts = ['jpeg', 'jpg', 'png', 'gif', 'webp']
                if file_ext.lower() not in allowed_exts:
                    file_ext = 'png'  # safe fallback
                
                # Decode base64
                decoded = base64.b64decode(encoded)
                
                # Validate actual image content with Pillow
                try:
                    import io
                    from PIL import Image
                    img = Image.open(io.BytesIO(decoded))
                    img.verify()
                except Exception:
                    return Response(
                        {'detail': 'Arquivo não é uma imagem válida.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Validate size (max 5MB)
                if len(decoded) > 5 * 1024 * 1024:
                    return Response(
                        {'detail': 'A imagem deve ter no máximo 5MB.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Save avatar as file (works with local storage or S3)
                filename = f"avatars/avatar_{user.id}_{uuid.uuid4().hex[:8]}.{file_ext}"
                from django.core.files.storage import default_storage
                saved_path = default_storage.save(filename, ContentFile(decoded))
                avatar_url = default_storage.url(saved_path)
                
                # Delete old avatar file if it exists and is a file path
                _delete_avatar_file(user.avatar_url)

                user.avatar_url = avatar_url
                user.save(update_fields=['avatar_url', 'updated_at'])
                
                return Response({
                    'detail': 'Avatar atualizado com sucesso!',
                    'avatar_url': user.avatar_url,
                    'user': UserSerializer(user).data
                })
                
            except Exception:
                return Response(
                    {'detail': 'Erro ao processar imagem. Verifique o formato e tente novamente.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Handle file upload
        elif 'avatar' in request.FILES:
            file = request.FILES['avatar']
            
            # Validate file type
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            if file.content_type not in allowed_types:
                return Response(
                    {'detail': 'Formato de imagem não suportado. Use JPEG, PNG, GIF ou WebP.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate extension (prevent arbitrary extensions like .exe, .php)
            allowed_exts = {'jpeg', 'jpg', 'png', 'gif', 'webp'}
            ext = file.name.rsplit('.', 1)[-1].lower() if '.' in file.name else 'png'
            if ext not in allowed_exts:
                ext = 'png'  # safe fallback
            
            # Validate size (max 5MB)
            if file.size > 5 * 1024 * 1024:
                return Response(
                    {'detail': 'A imagem deve ter no máximo 5MB.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate actual image content with Pillow
            try:
                from PIL import Image
                file.seek(0)
                img = Image.open(file)
                img.verify()
                file.seek(0)
            except Exception:
                return Response(
                    {'detail': 'Arquivo não é uma imagem válida.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Save file to storage (local or S3)
            from django.core.files.storage import default_storage
            filename = f"avatars/avatar_{user.id}_{uuid.uuid4().hex[:8]}.{ext}"
            saved_path = default_storage.save(filename, file)
            avatar_url = default_storage.url(saved_path)

            # Delete old avatar file
            _delete_avatar_file(user.avatar_url)

            user.avatar_url = avatar_url
            user.save(update_fields=['avatar_url', 'updated_at'])
            
            return Response({
                'detail': 'Avatar atualizado com sucesso!',
                'avatar_url': user.avatar_url,
                'user': UserSerializer(user).data
            })
        
        return Response(
            {'detail': 'Nenhuma imagem enviada.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def delete(self, request):
        """Remove user avatar."""
        user = request.user
        old_url = user.avatar_url

        user.avatar_url = None
        user.save(update_fields=['avatar_url', 'updated_at'])

        # Delete physical file from storage
        if old_url:
            _delete_avatar_file(old_url)
        
        return Response({
            'detail': 'Avatar removido com sucesso!',
            'user': UserSerializer(user).data
        })


class RefreshTokenView(APIView):
    """Refresh access token - reads from cookie or body."""
    
    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonThrottle]
    
    def post(self, request):
        # Try to get refresh token from cookie first, then from request body
        refresh_token = get_refresh_token_from_cookie(request)
        if not refresh_token:
            refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token não fornecido.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Validate and rotate refresh token
            old_refresh = RefreshToken(refresh_token)  # type: ignore[arg-type]
            
            # Validate user BEFORE blacklisting old token
            user_id = old_refresh.payload.get('user_id')
            user = User.objects.get(id=user_id)

            # Block refresh for suspended / cancelled / pending accounts
            if user.status not in (User.Status.ACTIVE,):
                resp = Response(
                    {'detail': 'Conta inativa ou suspensa.', 'code': 'user_inactive'},
                    status=status.HTTP_403_FORBIDDEN
                )
                clear_auth_cookies(resp)
                return resp

            # Blacklist old token only after user validation passes
            if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS', False):
                old_refresh.blacklist()

            new_refresh = RefreshToken.for_user(user)
            
            access_token = str(new_refresh.access_token)
            new_refresh_token = str(new_refresh)
            
            # Build response
            response_data = {}
            
            # In development, also include tokens in response
            if settings.DEBUG:
                response_data['access'] = access_token
                response_data['refresh'] = new_refresh_token
            
            response = Response(response_data)
            
            # Set new cookies
            set_auth_cookies(response, access_token, new_refresh_token)
            
            return response
            
        except TokenError as e:
            return Response(
                {'detail': 'Token inválido ou expirado.', 'code': 'token_not_valid'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except User.DoesNotExist:
            return Response(
                {'detail': 'Usuário não encontrado.'},
                status=status.HTTP_401_UNAUTHORIZED
            )


class DeleteAccountView(APIView):
    """
    Delete all user data and deactivate the account.
    This satisfies the LGPD/GDPR right-to-erasure requirement and ensures
    "apagar todos os dados" really removes server-side data.
    """

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def delete(self, request):
        user = request.user

        # Delete all syncable entities for this user
        from apps.sync.serializers import ENTITY_MODELS
        for model in ENTITY_MODELS.values():
            model.objects.filter(user=user).delete()

        # Delete PDF files
        from apps.core.models import PDFFile
        for pdf in PDFFile.objects.filter(user=user):
            if pdf.file:
                pdf.file.delete(save=False)
            pdf.delete()

        # Cancel active subscriptions
        from apps.billing.models import Subscription, Payment
        Subscription.objects.filter(user=user).update(
            status='cancelled',
            cancelled_at=timezone.now(),
        )

        # Anonymise billing PII (LGPD right-to-erasure)
        # We keep Payment records for legal/fiscal retention but strip
        # personally identifiable fields.
        Payment.objects.filter(user=user).update(
            payer_email='deleted@anon.invalid',
            payer_name='',
            metadata={},
        )

        # Deactivate user (keep record for audit but mark as cancelled)
        user.status = User.Status.CANCELLED
        user.is_active = False
        user.name = ''
        user.email = f'deleted_{user.id}@anon.invalid'
        user.avatar_url = None
        user.enabled_modules = {}
        user.save()

        response = Response({'detail': 'Conta e dados excluídos com sucesso.'})
        clear_auth_cookies(response)
        return response


class CSRFTokenView(APIView):
    """
    Issue a CSRF token for double-submit cookie protection.

    The frontend calls ``GET /api/auth/csrf/`` on startup, receives the
    token in the JSON body (since cross-origin JS can't read the cookie)
    and sends it back as ``X-CSRFToken`` on every unsafe request.
    """

    permission_classes = [AllowAny]
    # This view MUST be exempt from CSRF itself – it creates the token.
    authentication_classes = []

    def get(self, request):
        token = get_token(request)          # sets csrftoken cookie via middleware
        return Response({'csrfToken': token})
