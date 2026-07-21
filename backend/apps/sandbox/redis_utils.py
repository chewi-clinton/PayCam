import redis
from datetime import datetime, timedelta, timezone
from django.conf import settings

_redis_client = None


def get_redis_client():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


def _today_key(phone_number):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"faucet:{phone_number}:{today}"


def has_claimed_today(phone_number):
    return get_redis_client().exists(_today_key(phone_number)) == 1


def mark_claimed_today(phone_number):
    seconds_until_midnight = _seconds_until_midnight()
    get_redis_client().setex(_today_key(phone_number), seconds_until_midnight, "1")


def _seconds_until_midnight():
    now = datetime.now(timezone.utc)
    tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return int((tomorrow - now).total_seconds())


def next_faucet_time():
    now = datetime.now(timezone.utc)
    tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return tomorrow.isoformat().replace("+00:00", "Z")

def get_crypto_faucet_claim(wallet_id):
    key = f"crypto_faucet:{wallet_id}"
    return get_redis_client().get(key)


def store_crypto_faucet_claim(wallet_id):
    key = f"crypto_faucet:{wallet_id}"
    get_redis_client().setex(key, 86400, "claimed")
