"""
Pytest configuration for Acorda Backend tests.
"""
import os
import django
from django.conf import settings


def pytest_configure():
    """Configure Django settings for tests.
    
    By default tests run with DEBUG=True. To run with production-like
    settings set the ACORDA_TEST_PROD environment variable:
        ACORDA_TEST_PROD=1 pytest
    """
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

    prod_mode = os.environ.get('ACORDA_TEST_PROD', '') == '1'

    if prod_mode:
        os.environ.setdefault('DEBUG', 'False')
        # Provide a test-only secret key when running prod-like tests
        os.environ.setdefault('SECRET_KEY', 'test-only-secret-key-not-for-production')
    else:
        os.environ.setdefault('DEBUG', 'True')

    # Reconfigure Django settings if already configured
    if settings.configured:
        settings.DEBUG = not prod_mode
        settings.SECURE_SSL_REDIRECT = False  # Never redirect in test runner
