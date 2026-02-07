"""
Pytest configuration for Acorda Backend tests.
"""
import os
import django
from django.conf import settings

# ---- Early env setup (runs at import time, BEFORE Django settings load) ----
# When running prod-like tests (ACORDA_TEST_PROD=1), SECRET_KEY and DEBUG
# must be set BEFORE settings.py is imported, otherwise the RuntimeError
# guard fires on the insecure default key.
_prod_mode = os.environ.get('ACORDA_TEST_PROD', '') == '1'
if _prod_mode:
    os.environ['DEBUG'] = 'False'
    os.environ.setdefault('SECRET_KEY', 'test-only-secret-key-not-for-production')


def pytest_configure():
    """Configure Django settings for tests.
    
    By default tests run with DEBUG=True. To run with production-like
    settings set the ACORDA_TEST_PROD environment variable:
        ACORDA_TEST_PROD=1 pytest
    """
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

    if not _prod_mode:
        os.environ.setdefault('DEBUG', 'True')

    # Reconfigure Django settings if already configured
    if settings.configured:
        settings.DEBUG = not _prod_mode
        settings.SECURE_SSL_REDIRECT = False  # Never redirect in test runner
