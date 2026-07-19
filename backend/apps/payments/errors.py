def error_response(code):
    errors = {
        "PAY_CAM_4000": {
            "error": "invalid_request",
            "status": 400,
            "message": "Missing or invalid request parameters.",
        },
        "PAY_CAM_4001": {
            "error": "customer_not_found",
            "status": 404,
            "message": "Phone number not registered on PayCam.",
        },
        "PAY_CAM_4002": {
            "error": "insufficient_funds",
            "status": 400,
            "message": "Customer wallet balance too low.",
        },
        "PAY_CAM_4003": {
            "error": "card_declined",
            "status": 400,
            "message": "Card was declined.",
        },
        "PAY_CAM_4004": {
            "error": "crypto_wallet_not_found",
            "status": 404,
            "message": "Wallet address not registered on PayCam. Only PayCam-generated addresses are accepted.",
        },
        "PAY_CAM_4005": {
            "error": "faucet_already_claimed",
            "status": 400,
            "message": "Faucet already claimed today.",
        },
        "PAY_CAM_4006": {
            "error": "idempotency_key_mismatch",
            "status": 409,
            "message": "Idempotency key matches but request body differs.",
        },
        "PAY_CAM_4007": {
            "error": "payment_expired",
            "status": 400,
            "message": "Payment request has expired.",
        },
        "PAY_CAM_4008": {
            "error": "invalid_card_number",
            "status": 400,
            "message": "Card number failed Luhn validation.",
        },
        "PAY_CAM_4009": {
            "error": "invalid_cvv",
            "status": 400,
            "message": "CVV must be 3 digits.",
        },
        "PAY_CAM_4010": {
            "error": "account_locked",
            "status": 403,
            "message": "Account temporarily locked due to too many failed attempts.",
        },
        "PAY_CAM_4011": {
            "error": "unauthorized",
            "status": 401,
            "message": "Invalid or expired API key.",
        },
        "PAY_CAM_4012": {
            "error": "webhook_signature_invalid",
            "status": 400,
            "message": "Webhook signature verification failed.",
        },
        "PAY_CAM_4013": {
            "error": "transaction_not_found",
            "status": 404,
            "message": "Transaction not found or does not belong to this customer.",
        },
        "PAY_CAM_5000": {
            "error": "internal_error",
            "status": 500,
            "message": "An unexpected error occurred.",
        },
    }
    entry = errors[code]
    return {
        "error": entry["error"],
        "code": code,
        "message": entry["message"],
        "docs_url": f"https://docs.paycam.cm/errors#{code}",
    }, entry["status"]
