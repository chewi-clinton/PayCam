import json
import redis
from django.conf import settings

_redis_client = None


def get_redis_client():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


def store_idempotency_record(key, reference, body_hash):
    redis_key = f"idempotency:{key}"
    value = json.dumps({"reference": reference, "body_hash": body_hash})
    get_redis_client().setex(redis_key, 86400, value)


def get_idempotency_record(key):
    redis_key = f"idempotency:{key}"
    raw = get_redis_client().get(redis_key)
    if not raw:
        return None
    return json.loads(raw)