"""
Views for accounts app.
"""
import base64
import uuid
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError
from django.utils import timezone
from django.core.files.base import ContentFile
from django.conf import settings

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
from .authentication import (
    set_auth_cookies,
    clear_auth_cookies,
    get_refresh_token_from_cookie,
    REFRESH_TOKEN_COOKIE,
)


class LoginView(APIView):
    """Login endpoint - returns JWT tokens in HttpOnly cookies."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
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
                token = RefreshToken(refresh_token)
                token.blacklist()
        except TokenError:
            # Token already blacklisted or invalid - that's fine
            pass
        except Exception:
            pass
        
        # Always clear cookies
        clear_auth_cookies(response)
        
        return response


class ActivateAccountView(APIView):
    """Activate account with token and set password."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ActivateAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        
        # Generate tokens for auto-login
        refresh = RefreshToken.for_user(user)
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
    
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = getattr(serializer, 'user', None)
        
        if user:
            # Create reset token
            reset_token = PasswordResetToken.objects.create(user=user)
            
            # Send email async
            send_password_reset_email.delay(user.id, reset_token.token)
        
        # Always return success to prevent email enumeration
        return Response({
            'detail': 'Se o e-mail existir, você receberá instruções para redefinir sua senha.'
        })


class ResetPasswordView(APIView):
    """Reset password with token."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        
        # Generate tokens for auto-login
        refresh = RefreshToken.for_user(user)
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
                
                # Decode base64
                decoded = base64.b64decode(encoded)
                
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
                if user.avatar_url and not user.avatar_url.startswith('data:'):
                    try:
                        old_name = user.avatar_url.lstrip('/')
                        if not old_name.startswith('http') and default_storage.exists(old_name):
                            default_storage.delete(old_name)
                    except Exception:
                        pass

                user.avatar_url = avatar_url
                user.save(update_fields=['avatar_url', 'updated_at'])
                
                return Response({
                    'detail': 'Avatar atualizado com sucesso!',
                    'avatar_url': user.avatar_url,
                    'user': UserSerializer(user).data
                })
                
            except Exception as e:
                return Response(
                    {'detail': f'Erro ao processar imagem: {str(e)}'},
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
            
            # Validate size (max 5MB)
            if file.size > 5 * 1024 * 1024:
                return Response(
                    {'detail': 'A imagem deve ter no máximo 5MB.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Save file to storage (local or S3)
            from django.core.files.storage import default_storage
            ext = file.name.rsplit('.', 1)[-1] if '.' in file.name else 'png'
            filename = f"avatars/avatar_{user.id}_{uuid.uuid4().hex[:8]}.{ext}"
            saved_path = default_storage.save(filename, file)
            avatar_url = default_storage.url(saved_path)

            # Delete old avatar file
            if user.avatar_url and not user.avatar_url.startswith('data:'):
                try:
                    old_name = user.avatar_url.lstrip('/')
                    if not old_name.startswith('http') and default_storage.exists(old_name):
                        default_storage.delete(old_name)
                except Exception:
                    pass

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
        user.avatar_url = None
        user.save(update_fields=['avatar_url', 'updated_at'])
        
        return Response({
            'detail': 'Avatar removido com sucesso!',
            'user': UserSerializer(user).data
        })


class RefreshTokenView(APIView):
    """Refresh access token - reads from cookie or body."""
    
    permission_classes = [AllowAny]
    
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
            old_refresh = RefreshToken(refresh_token)
            
            # Blacklist old token if rotation is enabled
            if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS', False):
                old_refresh.blacklist()
            
            # Create new tokens
            user_id = old_refresh.payload.get('user_id')
            user = User.objects.get(id=user_id)
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
