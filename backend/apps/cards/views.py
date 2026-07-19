import hashlib
import json
from django.conf import settings
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.paycam_auth.api_key_authentication import APIKeyAuthentication
from apps.common.throttling import PaymentInitiateThrottle
from apps.payments.models import Transaction
from apps.payments.utils import generate_transaction_reference
from apps.payments.errors import error_response
from apps.payments.redis_utils import get_idempotency_record, store_idempotency_record
from apps.payments.currency import convert_to_xaf, ExchangeRateUnavailable
from apps.webhooks.tasks import fire_webhook
from .serializers import CardPaymentSerializer
from .validators import (
    normalize_card_number,
    is_valid_card_number_format,
    luhn_check,
    is_valid_cvv,
    is_expiry_valid,
)
from .test_cards import lookup_test_card

# Maps a test card's fixed "behavior" to the resulting transaction
# status and, where relevant, the error code returned to the merchant.
# "success" has no error -- it's a 201 with status="success" directly,
# matching how MoMo's approve flow returns success with no error body.
BEHAVIOR_TO_ERROR_CODE = {
    "declined": "PAY_CAM_4003",
    "insufficient_funds": "PAY_CAM_4002",
    "disputed": "PAY_CAM_4003",  # disputed still surfaces as a decline to the merchant at initiate time
}


@extend_schema(
    tags=["Card Payments"],
    summary="Initiate a card payment",
    description=(
        "Merchant charges a PayCam-owned test card. Card payments happen entirely "
        "on the web payment page -- no Flutter app involvement. Luhn validation "
        "runs before checking the test card table; CVV must be exactly 3 digits."
    ),
    request=CardPaymentSerializer,
    responses={
        201: {"description": "Card succeeded", "example": {"reference": "TXN_20240101_Ab3Xk9Lm2Qr", "status": "success"}},
        200: {"description": "Idempotent duplicate -- same key, same body"},
        400: {"description": "Invalid card number (Luhn failure), invalid CVV, declined, insufficient funds, or disputed"},
        409: {"description": "Idempotency key mismatch -- same key, different body"},
    },
)
class CardInitiateView(generics.CreateAPIView):
    authentication_classes = [APIKeyAuthentication]
    serializer_class = CardPaymentSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [PaymentInitiateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        idempotency_key = request.headers.get("Idempotency-Key")
        body_hash = hashlib.sha256(json.dumps(request.data, sort_keys=True).encode()).hexdigest()

        if idempotency_key:
            existing = get_idempotency_record(idempotency_key)
            if existing:
                if existing["body_hash"] != body_hash:
                    body, code = error_response("PAY_CAM_4006")
                    return Response(body, status=code)
                txn = Transaction.objects.filter(reference=existing["reference"]).first()
                if txn:
                    return Response(
                        {
                            "reference": txn.reference,
                            "status": txn.status,
                            "idempotency_key": idempotency_key,
                        },
                        status=status.HTTP_200_OK,
                    )

        # --- Step 1: format + Luhn validation (BEFORE touching the test card table) ---
        card_number = normalize_card_number(data["card_number"])
        if not is_valid_card_number_format(card_number) or not luhn_check(card_number):
            body, code = error_response("PAY_CAM_4008")
            return Response(body, status=code)

        # --- Step 2: CVV validation ---
        if not is_valid_cvv(data["cvv"]):
            body, code = error_response("PAY_CAM_4009")
            return Response(body, status=code)

        # --- Step 3: expiry sanity check ---
        now = timezone.now()
        if not is_expiry_valid(data["expiry_month"], data["expiry_year"], now.year, now.month):
            body, code = error_response("PAY_CAM_4000")
            body["message"] = "Card expiry date is invalid or in the past."
            return Response(body, status=code)

        # --- Step 4: test card lookup ---
        test_card = lookup_test_card(card_number)
        if test_card is None:
            # Luhn-valid but not one of PayCam's known test cards -- there's
            # no real issuer behind it in this simulated environment, so it
            # can never succeed. Distinct message from the explicit
            # "always declined" test card so merchants can tell a typo
            # apart from a deliberate decline-path test.
            body, code = error_response("PAY_CAM_4003")
            body["message"] = "Card not recognized. Use one of PayCam's documented test cards."
            return Response(body, status=code)

        behavior = test_card["behavior"]

        # --- Step 5: currency conversion (for bookkeeping; card amount is charged as-submitted) ---
        try:
            xaf_equivalent = convert_to_xaf(data["amount"], data["currency"])
        except ExchangeRateUnavailable:
            body, code = error_response("PAY_CAM_5000")
            body["message"] = (
                "Exchange rate temporarily unavailable for this currency. Please retry shortly."
            )
            return Response(body, status=code)

        reference = generate_transaction_reference()
        expires_at = now + timezone.timedelta(minutes=settings.PAYMENT_EXPIRY_MINUTES)

        # Card behavior maps directly to a final transaction status --
        # unlike MoMo, there's no pending-then-approve step. The card
        # "processor" (PayCam itself) decides synchronously, same as a
        # real card network's authorization response.
        final_status = "success" if behavior == "success" else "failed"

        txn = Transaction.objects.create(
            reference=reference,
            merchant=request.user,
            api_key=request.auth,
            customer_user=None,  # card payments have no PayCam mobile-app customer
            amount=data["amount"],
            currency=data["currency"],
            payment_method="card",
            status=final_status,
            description=data.get("description"),
            external_reference=data.get("external_reference"),
            idempotency_key=idempotency_key,
            webhook_url=data.get("webhook_url"),
            redirect_url=data.get("redirect_url"),
            expires_at=expires_at,
        )

        if idempotency_key:
            store_idempotency_record(idempotency_key, reference, body_hash)

        event_name = "payment.success" if final_status == "success" else "payment.failed"
        fire_webhook.delay(txn.id, event_name)

        try:
            from apps.dashboard.utils import push_transaction_update
            push_transaction_update(txn)
        except ImportError:
            pass  # dashboard app not present in this deployment -- safe to skip

        if behavior == "success":
            return Response(
                {
                    "reference": txn.reference,
                    "status": txn.status,
                    "amount": str(txn.amount),
                    "currency": txn.currency,
                    "xaf_equivalent": str(xaf_equivalent),
                    "card_network": test_card["network"],
                },
                status=status.HTTP_201_CREATED,
            )

        error_code = BEHAVIOR_TO_ERROR_CODE[behavior]
        body, code = error_response(error_code)
        body["reference"] = txn.reference
        return Response(body, status=code)
