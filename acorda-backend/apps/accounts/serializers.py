"""
Serializers for accounts app.
"""
import logging

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, ActivationToken, PasswordResetToken

logger = logging.getLogger(__name__)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user data."""
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'status', 
            'timezone', 'avatar_url', 'enabled_modules', 'appearance', 'week_starts_on',
            'onboarding_completed',
            'created_at', 'last_login'
        ]
        read_only_fields = ['id', 'email', 'status', 'created_at', 'last_login']


class LoginSerializer(serializers.Serializer):
    """Serializer for login requests."""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    def validate(self, data):
        email = data.get('email', '').lower().strip()
        password = data.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('E-mail e senha são obrigatórios.')
        
        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Credenciais inválidas.')
        
        # Check account status — generic message to prevent enumeration;
        # detailed reason logged server-side only.
        if user.status != User.Status.ACTIVE:
            logger.info(
                'Login blocked for %s: account status is %s',
                email, user.status,
            )
            raise serializers.ValidationError('Credenciais inválidas.')
        
        # Authenticate
        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError('Credenciais inválidas.')
        
        data['user'] = user
        return data


class ActivateAccountSerializer(serializers.Serializer):
    """Serializer for account activation."""
    
    token = serializers.CharField()
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    name = serializers.CharField(max_length=150, required=False)
    
    def validate_token(self, value):
        try:
            activation_token = ActivationToken.objects.select_related('user').get(token=value)
        except ActivationToken.DoesNotExist:
            raise serializers.ValidationError('Token inválido.')
        
        if not activation_token.is_valid:
            raise serializers.ValidationError('Token expirado ou já utilizado.')
        
        self.activation_token = activation_token
        return value
    
    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({
                'password_confirm': 'As senhas não coincidem.'
            })
        return data
    
    def save(self):
        user = self.activation_token.user
        data: dict = self.validated_data  # type: ignore[assignment]
        user.set_password(data['password'])
        
        if data.get('name'):
            user.name = data['name']
        
        user.activate()
        self.activation_token.use()
        
        return user


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for forgot password requests."""
    
    email = serializers.EmailField()
    
    def validate_email(self, value):
        email = value.lower().strip()
        try:
            user = User.objects.get(email=email)
            # Only allow reset for active accounts; silently ignore others
            # to prevent account status enumeration.
            if user.status == User.Status.ACTIVE:
                self.user = user
            else:
                self.user = None
        except User.DoesNotExist:
            # Don't reveal if email exists or not
            self.user = None
        return email


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for password reset."""
    
    token = serializers.CharField()
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate_token(self, value):
        try:
            reset_token = PasswordResetToken.objects.select_related('user').get(token=value)
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError('Token inválido.')
        
        if not reset_token.is_valid:
            raise serializers.ValidationError('Token expirado ou já utilizado.')
        
        self.reset_token = reset_token
        return value
    
    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({
                'password_confirm': 'As senhas não coincidem.'
            })
        return data
    
    def save(self):
        user = self.reset_token.user
        data: dict = self.validated_data  # type: ignore[assignment]
        user.set_password(data['password'])
        user.save(update_fields=['password', 'updated_at'])
        self.reset_token.use()
        
        # Invalidate all other reset tokens for this user
        PasswordResetToken.objects.filter(
            user=user,
            used_at__isnull=True
        ).exclude(id=self.reset_token.id).update(used_at=self.reset_token.used_at)
        
        return user


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    
    class Meta:
        model = User
        fields = ['name', 'timezone', 'avatar_url', 'enabled_modules', 'appearance', 'week_starts_on', 'onboarding_completed']


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""
    
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Senha atual incorreta.')
        return value
    
    def validate(self, data):
        if data.get('new_password') != data.get('new_password_confirm'):
            raise serializers.ValidationError({
                'new_password_confirm': 'As senhas não coincidem.'
            })
        return data
    
    def save(self):
        user = self.context['request'].user
        data: dict = self.validated_data  # type: ignore[assignment]
        user.set_password(data['new_password'])
        user.save(update_fields=['password', 'updated_at'])
        return user
