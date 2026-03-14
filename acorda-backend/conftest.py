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
else:
    # Default tests run with DEBUG=True (prevents RuntimeError on insecure key)
    os.environ.setdefault('DEBUG', 'True')
    # Force Redis off in hermetic tests so settings.py can't enable it via REDIS_URL
    os.environ['REDIS_URL'] = ''

def pytest_configure():
    """Configure Django settings for tests.
    
    By default tests run with DEBUG=True and use SQLite + LocMemCache
    so they don't depend on external PostgreSQL/Redis instances.
    To run with production-like settings set the ACORDA_TEST_PROD
    environment variable:
        ACORDA_TEST_PROD=1 pytest
    """
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

    if not _prod_mode:
        os.environ.setdefault('DEBUG', 'True')
        # Force SQLite for hermetic tests (no external DB dependency)
        os.environ.setdefault('DATABASE_URL', 'sqlite:///test_db.sqlite3')

    # Reconfigure Django settings if already configured
    if settings.configured:
        settings.DEBUG = not _prod_mode
        settings.SECURE_SSL_REDIRECT = False  # Never redirect in test runner

        if not _prod_mode:
            # Force lightweight backends so tests pass without PostgreSQL/Redis
            settings.DATABASES['default'] = {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': ':memory:',
            }
            settings.CACHES = {
                'default': {
                    'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
                }
            }

    # Ensure STATIC_ROOT directory exists so whitenoise doesn't warn
    import pathlib
    static_root = pathlib.Path(settings.STATIC_ROOT)
    static_root.mkdir(exist_ok=True)
