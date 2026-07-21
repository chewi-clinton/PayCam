import hmac
import hashlib
import time


def sign_webhook_payload(payload_string, webhook_secret):
    timestamp = str(int(time.time()))
    signed_payload = f"{timestamp}.{payload_string}"
    signature = hmac.new(
        webhook_secret.encode("utf-8"),
        signed_payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    header_value = f"t={timestamp},v1={signature}"
    return header_value


def verify_webhook_signature(payload_string, signature_header, webhook_secret):
    if not signature_header:
        return False
    try:
        parts = signature_header.split(",")
        t_part = parts[0].split("=")[1]
        v1_part = parts[1].split("=")[1]
        timestamp = t_part
        expected_signature = v1_part
    except (IndexError, ValueError):
        return False

    signed_payload = f"{timestamp}.{payload_string}"
    computed = hmac.new(
        webhook_secret.encode("utf-8"),
        signed_payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(computed, expected_signature)