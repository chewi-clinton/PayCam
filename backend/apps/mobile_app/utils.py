import json
import random
import bcrypt
import redis
from django.conf import settings

MTN_PREFIXES = {"650", "651", "652", "653", "654", "670", "671", "672", "678", "679", "680"}
ORANGE_PREFIXES = {"655", "656", "657", "658", "659", "695", "696"}

_redis_client = None


def get_redis_client():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


def normalize_phone(phone_number):
    phone_number = phone_number.strip().replace(" ", "")
    if phone_number.startswith("+"):
        phone_number = phone_number[1:]
    if not phone_number.startswith("237") and len(phone_number) == 9:
        phone_number = "237" + phone_number
    return phone_number


def detect_network(phone_number):
    phone_number = normalize_phone(phone_number)
    if not phone_number.startswith("237") or len(phone_number) < 6:
        return None
    prefix = phone_number[3:6]
    if prefix in MTN_PREFIXES:
        return "MTN"
    if prefix in ORANGE_PREFIXES:
        return "ORANGE"
    return None


def hash_pin(pin):
    return bcrypt.hashpw(pin.encode(), bcrypt.gensalt()).decode()


def verify_pin(pin, pin_hash):
    return bcrypt.checkpw(pin.encode(), pin_hash.encode())


def generate_otp():
    return str(random.randint(100000, 999999))


def store_login_otp(user_id, otp):
    key = f"otp:login:{user_id}"
    get_redis_client().setex(key, 300, otp)


def verify_login_otp(user_id, otp):
    key = f"otp:login:{user_id}"
    stored = get_redis_client().get(key)
    if stored and stored == otp:
        get_redis_client().delete(key)
        return True
    return False


def get_pin_attempts(user_id):
    key = f"pin_attempts:{user_id}"
    val = get_redis_client().get(key)
    return int(val) if val else 0


def increment_pin_attempts(user_id):
    key = f"pin_attempts:{user_id}"
    client = get_redis_client()
    attempts = client.incr(key)
    if attempts == 1:
        client.expire(key, settings.PIN_LOCKOUT_MINUTES * 60)
    return attempts


def clear_pin_attempts(user_id):
    get_redis_client().delete(f"pin_attempts:{user_id}")


def get_otp_attempts(user_id):
    key = f"otp_attempts:{user_id}"
    val = get_redis_client().get(key)
    return int(val) if val else 0


def increment_otp_attempts(user_id):
    key = f"otp_attempts:{user_id}"
    client = get_redis_client()
    attempts = client.incr(key)
    if attempts == 1:
        client.expire(key, settings.PIN_LOCKOUT_MINUTES * 60)
    return attempts


def clear_otp_attempts(user_id):
    get_redis_client().delete(f"otp_attempts:{user_id}")


def store_change_pin_otp(user_id, otp):
    key = f"otp:change_pin:{user_id}"
    get_redis_client().setex(key, 300, otp)


def verify_change_pin_otp(user_id, otp):
    key = f"otp:change_pin:{user_id}"
    stored = get_redis_client().get(key)
    if stored and stored == otp:
        get_redis_client().delete(key)
        return True
    return False


def store_pending_registration(phone_number, otp, data):
    key = f"otp:register:{phone_number}"
    get_redis_client().setex(key, 600, json.dumps({"otp": otp, **data}))


def get_pending_registration(phone_number):
    key = f"otp:register:{phone_number}"
    stored = get_redis_client().get(key)
    return json.loads(stored) if stored else None


def clear_pending_registration(phone_number):
    get_redis_client().delete(f"otp:register:{phone_number}")