"""
Management command to create the default superuser idempotently.
Safe to run on every deploy — skips if user already exists.
"""
import os
from django.core.management.base import BaseCommand
from apps.accounts.models import User


class Command(BaseCommand):
    help = 'Create default admin superuser if it does not exist yet.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            default=os.environ.get('ADMIN_EMAIL', 'admin@somosacorda.com'),
            help='Admin email (default: admin@somosacorda.com or ADMIN_EMAIL env)',
        )
        parser.add_argument(
            '--username',
            default=os.environ.get('ADMIN_USERNAME', 'Admin'),
            help='Admin display name (default: Admin or ADMIN_USERNAME env)',
        )
        parser.add_argument(
            '--password',
            default=os.environ.get('ADMIN_PASSWORD', ''),
            help='Admin password (REQUIRED: set via ADMIN_PASSWORD env var)',
        )

    def handle(self, *args, **options):
        email = options['email']
        username = options['username']
        password = options['password']

        if not password:
            self.stdout.write(self.style.ERROR(
                'ADMIN_PASSWORD env var is required. Skipping superuser creation.'
            ))
            return

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(
                f'Superuser "{email}" already exists — skipping.'
            ))
            return

        User.objects.create_superuser(  # type: ignore[attr-defined]
            email=email,
            password=password,
            name=username,
        )
        self.stdout.write(self.style.SUCCESS(
            f'Superuser "{email}" created successfully.'
        ))
