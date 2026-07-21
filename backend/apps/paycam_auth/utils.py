import jwt
import pyotp
import bcrypt
import secrets
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from django.conf import settings
from cryptography.fernet import Fernet

# ========== OTP ==========

import random
import redis
from django.conf import settings

_redis_client = None

def get_redis_client():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


def generate_otp():
    return str(random.randint(100000, 999999))


def store_email_otp(user_id, otp, ttl_minutes=10):
    key = f"otp:email_verify:{user_id}"
    get_redis_client().setex(key, ttl_minutes * 60, otp)


def verify_email_otp(user_id, otp):
    key = f"otp:email_verify:{user_id}"
    stored = get_redis_client().get(key)
    if stored and stored == otp:
        get_redis_client().delete(key)
        return True
    return False


def store_password_reset_otp(user_id, otp, ttl_minutes=10):
    key = f"otp:password_reset:{user_id}"
    get_redis_client().setex(key, ttl_minutes * 60, otp)


def verify_password_reset_otp(user_id, otp):
    key = f"otp:password_reset:{user_id}"
    stored = get_redis_client().get(key)
    if stored and stored == otp:
        get_redis_client().delete(key)
        return True
    return False


# ========== Brevo Email ==========

import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

def send_email_otp(to_email, otp):
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key["api-key"] = settings.BREVO_API_KEY
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": to_email}],
        sender={"email": "dr@trimaxapharmacy.com", "name": "PayCam"},
        subject="Your PayCam Verification Code",
        html_content=f"""
        <h2>PayCam Email Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 4px;">{otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this, ignore this email.</p>
        """
    )
    
    try:
        api_instance.send_transac_email(send_smtp_email)
        return True
    except ApiException as e:
        print(f"Brevo email error: {e}")
        return False


def send_password_reset_otp(to_email, otp):
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key["api-key"] = settings.BREVO_API_KEY

    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": to_email}],
        sender={"email": "dr@trimaxapharmacy.com", "name": "PayCam"},
        subject="Reset your PayCam password",
        html_content=f"""
        <h2>PayCam Password Reset</h2>
        <p>Your password reset code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 4px;">{otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        """
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        return True
    except ApiException as e:
        print(f"Brevo email error: {e}")
        return False


# ========== JWT ==========

def generate_jwt(user_id, token_version):
    now = datetime.now(timezone.utc)
    payload = {
        "user_id": user_id,
        "token_version": token_version,
        "iat": now,
        "exp": now + timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def decode_jwt(token):
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ========== TOTP ==========

def generate_totp_secret():
    return pyotp.random_base32()


def get_totp_uri(secret, email):
    return pyotp.totp.TOTP(secret).provisioning_uri(
        name=email,
        issuer_name=settings.TOTP_ISSUER_NAME,
    )


def verify_totp(secret, code):
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)


# ========== API Key ==========

def generate_api_key():
    raw = "sk_live_" + secrets.token_urlsafe(32)
    prefix = raw[:14]
    return raw, prefix


def hash_api_key(raw_key):
    return bcrypt.hashpw(raw_key.encode(), bcrypt.gensalt()).decode()


def verify_api_key(raw_key, key_hash):
    return bcrypt.checkpw(raw_key.encode(), key_hash.encode())


def generate_webhook_secret():
    return "whsec_live_" + secrets.token_urlsafe(32)


# ========== Encryption ==========

_fernet = None

def get_fernet():
    global _fernet
    if _fernet is None:
        key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()[:32]
        key_b64 = __import__('base64').urlsafe_b64encode(key)
        _fernet = Fernet(key_b64)
    return _fernet


def encrypt_totp_secret(secret):
    return get_fernet().encrypt(secret.encode()).decode()


def decrypt_totp_secret(encrypted):
    return get_fernet().decrypt(encrypted.encode()).decode()