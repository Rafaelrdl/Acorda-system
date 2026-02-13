"""
User and authentication models for Acorda.
"""
import uuid
import secrets
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from django.conf import settings


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('O e-mail é obrigatório')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('status', 'active')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser precisa ter is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser precisa ter is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for Acorda.
    Uses email for authentication instead of username.
    """
    
    class Status(models.TextChoices):
        PENDING_ACTIVATION = 'pending_activation', 'Aguardando Ativação'
        ACTIVE = 'active', 'Ativo'
        SUSPENDED = 'suspended', 'Suspenso'
        CANCELLED = 'cancelled', 'Cancelado'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField('E-mail', unique=True, db_index=True)
    name = models.CharField('Nome', max_length=150, blank=True)
    
    # Status
    status = models.CharField(
        'Status',
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING_ACTIVATION,
        db_index=True
    )
    
    # Django admin permissions
    is_staff = models.BooleanField('É staff', default=False)
    is_active = models.BooleanField('Conta ativa', default=True)
    
    # Timestamps
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    last_login = models.DateTimeField('Último login', null=True, blank=True)
    activated_at = models.DateTimeField('Ativado em', null=True, blank=True)
    
    # Settings
    timezone = models.CharField('Fuso horário', max_length=50, default='America/Sao_Paulo')
    avatar_url = models.TextField('Avatar (Data URL)', blank=True, null=True)
    enabled_modules = models.JSONField(
        'Módulos ativos',
        default=dict,
        help_text='Dicionário com módulos habilitados: {financas: true, leitura: true, ...}'
    )
    appearance = models.CharField(
        'Tema',
        max_length=10,
        choices=[('light', 'Claro'), ('dark', 'Escuro')],
        default='dark'
    )
    week_starts_on = models.IntegerField(
        'Início da semana',
        choices=[(0, 'Domingo'), (1, 'Segunda-feira')],
        default=1
    )
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        return self.name or self.email
    
    def get_short_name(self):
        return self.name.split()[0] if self.name else self.email.split('@')[0]
    
    def activate(self):
        """Activate user account."""
        self.status = self.Status.ACTIVE
        self.activated_at = timezone.now()
        self.save(update_fields=['status', 'activated_at', 'updated_at'])
    
    @property
    def is_activated(self):
        return self.status == self.Status.ACTIVE


class ActivationToken(models.Model):
    """Token for activating user accounts after purchase."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='activation_tokens',
        verbose_name='Usuário'
    )
    token = models.CharField('Token', max_length=64, unique=True, db_index=True)
    
    # Timestamps
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    expires_at = models.DateTimeField('Expira em')
    used_at = models.DateTimeField('Usado em', null=True, blank=True)
    
    class Meta:
        verbose_name = 'Token de Ativação'
        verbose_name_plural = 'Tokens de Ativação'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'Ativação para {self.user.email}'
    
    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(48)
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(
                hours=settings.ACTIVATION_TOKEN_EXPIRY_HOURS
            )
        super().save(*args, **kwargs)
    
    @property
    def is_valid(self):
        """Check if token is valid (not expired and not used)."""
        return self.used_at is None and self.expires_at > timezone.now()
    
    def use(self):
        """Mark token as used."""
        self.used_at = timezone.now()
        self.save(update_fields=['used_at'])


class PasswordResetToken(models.Model):
    """Token for password reset requests."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens',
        verbose_name='Usuário'
    )
    token = models.CharField('Token', max_length=64, unique=True, db_index=True)
    
    # Timestamps
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    expires_at = models.DateTimeField('Expira em')
    used_at = models.DateTimeField('Usado em', null=True, blank=True)
    
    class Meta:
        verbose_name = 'Token de Reset de Senha'
        verbose_name_plural = 'Tokens de Reset de Senha'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'Reset para {self.user.email}'
    
    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(48)
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(
                hours=settings.PASSWORD_RESET_TOKEN_EXPIRY_HOURS
            )
        super().save(*args, **kwargs)
    
    @property
    def is_valid(self):
        """Check if token is valid."""
        return self.used_at is None and self.expires_at > timezone.now()
    
    def use(self):
        """Mark token as used."""
        self.used_at = timezone.now()
        self.save(update_fields=['used_at'])
