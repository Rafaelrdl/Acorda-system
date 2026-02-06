"""
Signals for accounts app.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User
from .tasks import send_welcome_email


@receiver(post_save, sender=User)
def user_activated(sender, instance, created, **kwargs):
    """Send welcome email when user is activated."""
    if not created and instance.status == User.Status.ACTIVE:
        # Check if user was just activated (has activated_at but no welcome sent)
        update_fields = kwargs.get('update_fields')
        if update_fields and 'status' in update_fields:
            send_welcome_email.delay(str(instance.id))
