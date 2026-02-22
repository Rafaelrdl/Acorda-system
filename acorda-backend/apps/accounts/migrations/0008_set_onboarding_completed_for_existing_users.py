"""
Data migration: mark all existing active users as having completed onboarding.
New users created after this migration will default to onboarding_completed=False.
"""
from django.db import migrations


def set_onboarding_completed(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    # All existing active users have already gone through the app — mark as done
    User.objects.filter(status='active').update(onboarding_completed=True)


def reverse_set_onboarding_completed(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.all().update(onboarding_completed=False)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0007_add_onboarding_completed"),
    ]

    operations = [
        migrations.RunPython(
            set_onboarding_completed,
            reverse_set_onboarding_completed,
        ),
    ]
