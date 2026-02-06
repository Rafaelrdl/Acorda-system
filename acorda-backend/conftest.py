"""
Pytest configuration for Acorda Backend tests.
"""
import os
import django
from django.conf import settings


def pytest_configure():
    """Set DEBUG=True for all tests to avoid SSL redirect issues."""
    os.environ.setdefault('DEBUG', 'True')
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    
    # Reconfigure Django settings if already configured
    if settings.configured:
        settings.DEBUG = True
        settings.SECURE_SSL_REDIRECT = False
