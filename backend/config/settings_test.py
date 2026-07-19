"""
Test settings: run the suite without Postgres, Redis, or RabbitMQ.

    python manage.py test --settings=config.settings_test

Redis-backed helpers (OTP storage, idempotency, lockouts) are patched
with fakeredis inside the tests themselves.
"""
from .settings import *  # noqa: F401,F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    }
}

# Celery: never touch a broker from tests. Tasks are mocked where the
# code under test calls .delay().
CELERY_TASK_ALWAYS_EAGER = False
CELERY_BROKER_URL = "memory://"

# bcrypt at the default cost factor makes the suite take minutes (every
# API key, PIN, and password hash pays ~0.3s). Tests only need the
# round-trip to work, not to be slow-by-design.
import bcrypt  # noqa: E402

_orig_gensalt = bcrypt.gensalt
bcrypt.gensalt = lambda rounds=4, prefix=b"2b": _orig_gensalt(rounds, prefix)

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# The whole suite shares one client IP and one locmem cache, so the
# real 10/min login limit trips across unrelated tests. Throttle logic
# is exercised explicitly in apps.common.tests; here it just needs to
# stay out of the way.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_THROTTLE_RATES": {
        "payments_initiate": "10000/min",
        "payments_read": "10000/min",
        "login": "10000/min",
    },
}
