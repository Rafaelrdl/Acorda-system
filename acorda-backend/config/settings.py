"""
Django settings for Acorda Backend.
"""
import os
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=False, cast=bool)

# Fail loudly in production if SECRET_KEY is still the insecure default
if not DEBUG and str(SECRET_KEY).startswith('django-insecure'):
    raise RuntimeError(
        'SECRET_KEY insegura detectada em produção. '
        'Defina a variável de ambiente SECRET_KEY com uma chave forte.'
    )

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())

# ── Jazzmin Admin Theme ───────────────────────────────────────
JAZZMIN_SETTINGS = {
    # Branding
    "site_title": "Acorda Admin",
    "site_header": "Acorda",
    "site_brand": "Acorda",
    "site_logo": None,
    "login_logo": None,
    "login_logo_dark": None,
    "site_logo_classes": "img-circle",
    "site_icon": None,
    "welcome_sign": "Bem-vindo ao painel administrativo do Acorda",
    "copyright": "Acorda App",

    # Search model
    "search_model": ["accounts.User", "billing.Subscription", "billing.Payment"],

    # Top menu
    "topmenu_links": [
        {"name": "Início", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "API Docs", "url": "/api/", "new_window": True},
        {"model": "accounts.User"},
    ],

    # User menu
    "usermenu_links": [
        {"name": "Suporte", "url": "https://somosacorda.com/suporte", "new_window": True, "icon": "fas fa-headset"},
    ],

    # Side menu
    "show_sidebar": True,
    "navigation_expanded": True,
    "hide_apps": [],
    "hide_models": [],
    "order_with_respect_to": [
        "accounts",
        "billing",
        "core",
        "django_celery_beat",
        "token_blacklist",
    ],

    # App/model icons
    "icons": {
        "accounts": "fas fa-users-cog",
        "accounts.User": "fas fa-user",
        "accounts.ActivationToken": "fas fa-key",
        "accounts.PasswordResetToken": "fas fa-unlock-alt",
        "billing": "fas fa-credit-card",
        "billing.Plan": "fas fa-tags",
        "billing.Subscription": "fas fa-file-invoice-dollar",
        "billing.Payment": "fas fa-money-bill-wave",
        "billing.UsageRecord": "fas fa-chart-bar",
        "core.Task": "fas fa-tasks",
        "core.Goal": "fas fa-bullseye",
        "core.KeyResult": "fas fa-chart-line",
        "core.Habit": "fas fa-redo",
        "core.HabitLog": "fas fa-check-double",
        "core.Project": "fas fa-project-diagram",
        "core.InboxItem": "fas fa-inbox",
        "core.PomodoroSession": "fas fa-clock",
        "core.PomodoroPreset": "fas fa-stopwatch",
        "core.CalendarBlock": "fas fa-calendar-alt",
        "core.DailyNote": "fas fa-sticky-note",
        "core.UserSettings": "fas fa-cog",
        "core.Reference": "fas fa-bookmark",
        "core.GoogleCalendarConnection": "fab fa-google",
        "core.GoogleCalendarEvent": "fas fa-calendar-check",
        "core.FinanceCategory": "fas fa-wallet",
        "core.FinanceAccount": "fas fa-university",
        "core.Transaction": "fas fa-exchange-alt",
        "core.Income": "fas fa-hand-holding-usd",
        "core.FixedExpense": "fas fa-file-invoice",
        "core.FinanceAuditLog": "fas fa-history",
        "core.Book": "fas fa-book",
        "core.ReadingLog": "fas fa-book-reader",
        "core.PDFDocument": "fas fa-file-pdf",
        "core.PDFHighlight": "fas fa-highlighter",
        "core.PDFFile": "fas fa-file-upload",
        "core.Subject": "fas fa-graduation-cap",
        "core.StudySession": "fas fa-chalkboard-teacher",
        "core.ConsentLog": "fas fa-shield-alt",
        "core.RecordedStudySession": "fas fa-microphone",
        "core.ReviewScheduleItem": "fas fa-calendar-day",
        "core.WellnessProgram": "fas fa-spa",
        "core.WellnessCheckIn": "fas fa-heartbeat",
        "core.WellnessDayAction": "fas fa-running",
        "core.WorkoutExercise": "fas fa-dumbbell",
        "core.WorkoutPlan": "fas fa-clipboard-list",
        "core.WorkoutPlanItem": "fas fa-list-ol",
        "core.WorkoutSession": "fas fa-fire",
        "core.WorkoutSetLog": "fas fa-weight",
        "core.WorkoutPlanDayStatus": "fas fa-calendar-check",
        "core.DietMealTemplate": "fas fa-utensils",
        "core.DietMealEntry": "fas fa-carrot",
        "core.DataExport": "fas fa-download",
        "django_celery_beat": "fas fa-cogs",
        "token_blacklist": "fas fa-ban",
        "auth": "fas fa-shield-alt",
    },

    # Custom CSS/JS
    "custom_css": None,
    "custom_js": None,
    "use_google_fonts_cdn": True,
    "show_ui_builder": False,
    "changeform_format": "horizontal_tabs",
    "changeform_format_overrides": {
        "accounts.User": "collapsible",
        "billing.Payment": "horizontal_tabs",
    },
    "related_modal_active": False,
    "language_chooser": False,
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-dark",
    "accent": "accent-primary",
    "navbar": "navbar-dark navbar-primary",
    "no_navbar_border": False,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-primary",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": False,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "darkly",
    "dark_mode_theme": "darkly",
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success",
    },
}

# Application definition
INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_celery_beat',
    
    # Local apps
    'apps.accounts',
    'apps.billing',
    'apps.core',
    'apps.sync',
    'apps.integrations',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL', default='sqlite:///db.sqlite3'),  # type: ignore[arg-type]
        conn_max_age=600,
    )
}

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Password hashing with Argon2
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
]

# Internationalization
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# File upload limits
FILE_UPLOAD_MAX_MEMORY_SIZE = 52428800  # 50 MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 52428800  # 50 MB

# Storage configuration (Django 4.2+ STORAGES dict)
# Use CompressedStaticFilesStorage to avoid post-processing failures
# with third-party CSS referencing missing source maps (e.g. Jazzmin/Bootswatch)
STORAGES = {
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedStaticFilesStorage',
    },
}

# Optional S3 storage (django-storages)
AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME', default='')
if AWS_STORAGE_BUCKET_NAME:
    INSTALLED_APPS.append('storages')
    AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID', default='')
    AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY', default='')
    AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='')
    AWS_S3_ENDPOINT_URL = config('AWS_S3_ENDPOINT_URL', default='')
    AWS_S3_CUSTOM_DOMAIN = config('AWS_S3_CUSTOM_DOMAIN', default='')
    AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
    STORAGES['default'] = {
        'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
    }
else:
    STORAGES['default'] = {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    }

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.accounts.authentication.CookieJWTAuthentication',  # Cookie-based JWT (primary)
        'rest_framework_simplejwt.authentication.JWTAuthentication',  # Header-based JWT (fallback)
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    # Throttling disabled in DEBUG mode for development
    'DEFAULT_THROTTLE_CLASSES': [] if DEBUG else [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    },
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=config('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', default=60, cast=int)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=config('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=7, cast=int)
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# CORS
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://localhost:5174,http://localhost:3000',
    cast=Csv()
)
CORS_ALLOW_CREDENTIALS = True  # Required for cookies to be sent cross-origin

# CSRF - Trust the same origins as CORS
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='http://localhost,http://localhost:80,http://localhost:5173,http://localhost:5174,http://localhost:3000',
    cast=Csv()
)

# Cookie settings for authentication
AUTH_COOKIE_SECURE = not DEBUG  # Secure in production
# SameSite policy: 'Lax' for same-site, 'None' for cross-site (requires Secure=True)
AUTH_COOKIE_SAMESITE = config('AUTH_COOKIE_SAMESITE', default='None' if not DEBUG else 'Lax')

# CSRF cookie settings – aligned with auth cookies for cross-site SPA
CSRF_COOKIE_SECURE = AUTH_COOKIE_SECURE
CSRF_COOKIE_SAMESITE = AUTH_COOKIE_SAMESITE
CSRF_COOKIE_HTTPONLY = False  # Frontend JS must read the token value

# Celery
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

# Email
EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.console.EmailBackend'
)
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='Acorda <contato@somosacorda.com>')

# SendGrid (if using)
SENDGRID_API_KEY = config('SENDGRID_API_KEY', default='')
if SENDGRID_API_KEY:
    EMAIL_BACKEND = 'anymail.backends.sendgrid.EmailBackend'
    ANYMAIL = {
        'SENDGRID_API_KEY': SENDGRID_API_KEY,
    }

# SMTP (Hostinger or any SMTP provider)
EMAIL_HOST = config('EMAIL_HOST', default='')
if EMAIL_HOST and not SENDGRID_API_KEY:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_PORT = config('EMAIL_PORT', default=465, cast=int)
    EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
    EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
    EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=False, cast=bool)
    EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=True, cast=bool)

# Mercado Pago
MP_ACCESS_TOKEN = config('MP_ACCESS_TOKEN', default='', cast=str)
MP_PUBLIC_KEY = config('MP_PUBLIC_KEY', default='', cast=str)
MP_WEBHOOK_SECRET = config('MP_WEBHOOK_SECRET', default='', cast=str)

# Frontend URL (for email links)
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')

# Backend URL (for webhooks / notification URLs)
BACKEND_URL = config('BACKEND_URL', default='http://localhost:8000')

# Reverse proxy headers (nginx, ALB, etc.)
USE_X_FORWARDED_HOST = config('USE_X_FORWARDED_HOST', default=False, cast=bool)
USE_X_FORWARDED_PORT = config('USE_X_FORWARDED_PORT', default=False, cast=bool)

# Token expiration
ACTIVATION_TOKEN_EXPIRY_HOURS = 48
PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 24

# Security settings for production
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    # Required when running behind a reverse proxy (nginx, ALB, Cloudflare, etc.)
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# ── Google OAuth (Code Model) ─────────────────────────────────
GOOGLE_OAUTH_CLIENT_ID = config('GOOGLE_OAUTH_CLIENT_ID', default='')
GOOGLE_OAUTH_CLIENT_SECRET = config('GOOGLE_OAUTH_CLIENT_SECRET', default='')

# Cache – use Redis when available for shared deduplication across workers
_REDIS_URL = config('REDIS_URL', default='')
if _REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': _REDIS_URL,
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }

# ── Logging ──────────────────────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {name} {module} {message}',
            'style': '{',
        },
        'json': {
            'format': '{levelname} {asctime} {name} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose' if DEBUG else 'json',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG' if DEBUG else 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO' if DEBUG else 'WARNING',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'WARNING',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'celery': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# ── Email backend validation for production ──────────────────────────
if not DEBUG and EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
    import warnings
    warnings.warn(
        'EMAIL_BACKEND is set to console in production. '
        'Users will NOT receive emails (activation, password reset). '
        'Set SENDGRID_API_KEY or configure a proper email backend.',
        RuntimeWarning,
        stacklevel=1,
    )
