"""
Celery tasks for accounts app.
"""
from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings


@shared_task
def send_activation_email(user_id: str, token: str):
    """Send account activation email."""
    from .models import User
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return
    
    activation_url = f"{settings.FRONTEND_URL}/ativar?token={token}"
    
    context = {
        'user': user,
        'activation_url': activation_url,
        'expiry_hours': settings.ACTIVATION_TOKEN_EXPIRY_HOURS,
    }
    
    html_message = render_to_string('emails/activation.html', context)
    plain_message = render_to_string('emails/activation.txt', context)
    
    send_mail(
        subject='🚀 Ative sua conta no Acorda',
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


@shared_task
def send_password_reset_email(user_id: str, token: str):
    """Send password reset email."""
    from .models import User
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return
    
    reset_url = f"{settings.FRONTEND_URL}/redefinir-senha?token={token}"
    
    context = {
        'user': user,
        'reset_url': reset_url,
        'expiry_hours': settings.PASSWORD_RESET_TOKEN_EXPIRY_HOURS,
    }
    
    html_message = render_to_string('emails/password_reset.html', context)
    plain_message = render_to_string('emails/password_reset.txt', context)
    
    send_mail(
        subject='🔑 Redefinir senha - Acorda',
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


@shared_task
def send_welcome_email(user_id: str):
    """Send welcome email after activation."""
    from .models import User
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return
    
    context = {
        'user': user,
        'app_url': settings.FRONTEND_URL,
    }
    
    html_message = render_to_string('emails/welcome.html', context)
    plain_message = render_to_string('emails/welcome.txt', context)
    
    send_mail(
        subject='🎉 Bem-vindo ao Acorda!',
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )
