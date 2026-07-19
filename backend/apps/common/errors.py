from rest_framework.response import Response


ERROR_CODES = {
    "PAY_CAM_4000": {
        "error": "invalid_request",
        "status": 400,
        "message": "Missing or invalid request parameters",
    },
    "PAY_CAM_4001": {
        "error": "customer_not_found",
        "status": 404,
        "message": "Phone number not registered on PayCam",
    },
    "PAY_CAM_4002": {
        "error": "insufficient_funds",
        "status": 400,
        "message": "Customer wallet balance too low",
    },
    "PAY_CAM_4005": {
        "error": "faucet_already_claimed",
        "status": 400,
        "message": "Faucet already claimed today",
    },
    "PAY_CAM_4006": {
        "error": "idempotency_key_mismatch",
        "status": 409,
        "message": "Idempotency key matches but request body differs",
    },
    "PAY_CAM_4007": {
        "error": "payment_expired",
        "status": 400,
        "message": "Payment request has expired",
    },
    "PAY_CAM_4011": {
        "error": "unauthorized",
        "status": 401,
        "message": "Invalid or expired API key",
    },
    "PAY_CAM_4012": {
        "error": "webhook_signature_invalid",
        "status": 400,
        "message": "Webhook signature verification failed",
    },
    "PAY_CAM_5000": {
        "error": "internal_error",
        "status": 500,
        "message": "An unexpected error occurred",
    },
}


def paycam_error(code):
    data = ERROR_CODES[code].copy()
    data["code"] = code
    data["docs_url"] = f"https://docs.paycam.cm/errors#{code}"
    del data["status"]
    return Response(data, status=ERROR_CODES[code]["status"])