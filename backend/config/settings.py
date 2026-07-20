import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "drf_spectacular",
    "corsheaders",
    "django_celery_beat",
    "channels",
    "apps.dashboard",
    "apps.cards",
    "apps.paycam_auth",
    "apps.payments",
    "apps.webhooks",
    "apps.mobile_app",
    "apps.sandbox",
    "apps.crypto",
    "apps.common",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "paycam"),
        "USER": os.getenv("DB_USER", "paycam"),
        "PASSWORD": os.getenv("DB_PASSWORD", "paycam"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    }
}

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [REDIS_URL],
        },
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.paycam_auth.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.LimitOffsetPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_RATES": {
        "payments_initiate": "60/min",
        "payments_read": "120/min",
        "login": "10/min",
    },
}

AUTH_USER_MODEL = "paycam_auth.User"

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://paycam.cm",
    "https://dashboard.paycam.cm",
]

CELERY_BROKER_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

JWT_SECRET = SECRET_KEY
JWT_ACCESS_EXPIRE_MINUTES = 30
JWT_REFRESH_EXPIRE_DAYS = 7

TOTP_ISSUER_NAME = "PayCam"

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")

FCM_SERVICE_ACCOUNT_PATH = os.getenv("FCM_SERVICE_ACCOUNT_PATH", "")

INFURA_API_KEY = os.getenv("INFURA_API_KEY", "")

EXCHANGE_RATE_API_KEY = os.getenv("EXCHANGE_RATE_API_KEY", "")

PAYMENT_EXPIRY_MINUTES = 15
SESSION_TIMEOUT_MINUTES = 30
PIN_LOCKOUT_MINUTES = 10
MAX_PIN_ATTEMPTS = 3
MAX_OTP_ATTEMPTS = 3
FAUCET_AMOUNT = 10000

from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    "expire-pending-payments": {
        "task": "apps.payments.tasks.expire_pending_payments",
        "schedule": crontab(minute="*"),
    },
    "update-exchange-rates": {
        "task": "apps.payments.tasks.update_exchange_rates",
        "schedule": crontab(hour=0, minute=5),
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "PayCam API — V3 (MoMo + Cards + Crypto)",
    "DESCRIPTION": "PayCam V3: Mobile Money, Card Payments, and Crypto (BTC/ETH/USDT testnet) for African students.",
    "VERSION": "3.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": r"/api/v1",
    "TAGS": [
        {"name": "Authentication", "description": "V1 — Merchant registration, login, TOTP, API keys"},
        {"name": "Payments", "description": "V1 — Mobile Money (MTN/Orange) payments."},
        {"name": "Card Payments", "description": "V2 — International card payments (PayCam-owned test cards, Luhn validation, multi-currency)."},
        {"name": "Crypto Payments", "description": "V3 — BTC/ETH/USDT testnet crypto payments."},
        {"name": "Sandbox", "description": "V1 — Test credit faucet (XAF + crypto)."},
        {"name": "Mobile App", "description": "V1 — Flutter app customer endpoints (registration, login, payment approval)."},
        {"name": "Webhooks", "description": "V1 — Webhook delivery logs and verification utilities"},
    ],
}

FIREBASE_CREDENTIALS_PATH = os.environ.get("FIREBASE_CREDENTIALS_PATH")
