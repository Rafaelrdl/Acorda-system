"""
Management command to seed billing plans (idempotent).

Usage:
    python manage.py seed_plans

Creates or updates the 5 active plans:
  - Leve mensal, Leve anual
  - Pro mensal, Pro anual
  - Vitalício (lifetime, equivale ao Pro)

Also deactivates the legacy 'pro_ia' plans.
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.billing.models import Plan


PLANS = [
    {
        'plan_type': 'leve',
        'billing_cycle': 'monthly',
        'defaults': {
            'name': 'Acorda Leve Mensal',
            'price': Decimal('12.90'),
            'currency': 'BRL',
            'has_ai': False,
            'ai_requests_limit': None,
            'is_active': True,
            'pdf_max_count': 20,
            'pdf_max_total_mb': 500,
            'pdf_max_file_mb': 25,
        },
    },
    {
        'plan_type': 'leve',
        'billing_cycle': 'yearly',
        'defaults': {
            'name': 'Acorda Leve Anual',
            'price': Decimal('129.00'),
            'currency': 'BRL',
            'has_ai': False,
            'ai_requests_limit': None,
            'is_active': True,
            'pdf_max_count': 20,
            'pdf_max_total_mb': 500,
            'pdf_max_file_mb': 25,
        },
    },
    {
        'plan_type': 'pro',
        'billing_cycle': 'monthly',
        'defaults': {
            'name': 'Acorda Pro Mensal',
            'price': Decimal('21.90'),
            'currency': 'BRL',
            'has_ai': False,
            'ai_requests_limit': None,
            'is_active': True,
            'pdf_max_count': 120,
            'pdf_max_total_mb': 5120,
            'pdf_max_file_mb': 50,
        },
    },
    {
        'plan_type': 'pro',
        'billing_cycle': 'yearly',
        'defaults': {
            'name': 'Acorda Pro Anual',
            'price': Decimal('219.00'),
            'currency': 'BRL',
            'has_ai': False,
            'ai_requests_limit': None,
            'is_active': True,
            'pdf_max_count': 120,
            'pdf_max_total_mb': 5120,
            'pdf_max_file_mb': 50,
        },
    },
    {
        'plan_type': 'lifetime',
        'billing_cycle': 'lifetime',
        'defaults': {
            'name': 'Acorda Vitalício',
            'price': Decimal('319.00'),
            'currency': 'BRL',
            'has_ai': False,
            'ai_requests_limit': None,
            'is_active': True,
            'pdf_max_count': 120,
            'pdf_max_total_mb': 5120,
            'pdf_max_file_mb': 50,
        },
    },
]


class Command(BaseCommand):
    help = 'Seed billing plans (idempotent update_or_create).'

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for plan_data in PLANS:
            _obj, created = Plan.objects.update_or_create(
                plan_type=plan_data['plan_type'],
                billing_cycle=plan_data['billing_cycle'],
                defaults=plan_data['defaults'],
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(
                    f"  CREATED {plan_data['defaults']['name']}"
                ))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(
                    f"  UPDATED {plan_data['defaults']['name']}"
                ))

        # Deactivate legacy pro_ia plans
        deactivated = Plan.objects.filter(
            plan_type='pro_ia', is_active=True
        ).update(is_active=False)
        if deactivated:
            self.stdout.write(self.style.WARNING(
                f"  DEACTIVATED {deactivated} legacy pro_ia plan(s)"
            ))

        self.stdout.write(self.style.SUCCESS(
            f"\nDone: {created_count} created, {updated_count} updated, {deactivated} deactivated."
        ))
