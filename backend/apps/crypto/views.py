import hashlib
import json
import io
import base64
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
from apps.payments.tasks import send_fcm_push
from apps.webhooks.tasks import fire_webhook
from apps.mobile_app.models import CryptoWallet
from .serializers import CryptoPaymentSerializer

try:
    import qrcode
    _HAS_QRCODE = True
except ImportError:
    _HAS_QRCODE = False


@extend_schema(
    tags=["Crypto Payments"],
    summary="Initiate a crypto payment",
    description="Merchant initiates a crypto payment to a customer's PayCam-generated testnet wallet address.",
    request=CryptoPaymentSerializer,
    responses={
        201: {"description": "Crypto payment initiated"},
        200: {"description": "Idempotent duplicate"},
        400: {"description": "Invalid wallet or request"},
        409: {"description": "Idempotency key mismatch"},
    },
)
class CryptoInitiateView(generics.CreateAPIView):
    authentication_classes = [APIKeyAuthentication]
    serializer_class = CryptoPaymentSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [PaymentInitiateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        idempotency_key = request.headers.get("Idempotency-Key")
        body_hash = hashlib.sha256(
            json.dumps(request.data, sort_keys=True).encode()
        ).hexdigest()

        if idempotency_key:
            existing = get_idempotency_record(idempotency_key)
            if existing:
                if existing["body_hash"] != body_hash:
                    body, code = error_response("PAY_CAM_4006")
                    return Response(body, status=code)
                txn = Transaction.objects.filter(
                    reference=existing["reference"]
                ).first()
                if txn:
                    return Response(
                        {
                            "reference": txn.reference,
                            "status": txn.status,
                            "idempotency_key": idempotency_key,
                        },
                        status=status.HTTP_200_OK,
                    )

        wallet_address = data["crypto_wallet_address"]
        wallet = CryptoWallet.objects.filter(
            testnet_address=wallet_address
        ).select_related("user").first()

        if not wallet:
            body, code = error_response("PAY_CAM_4004")
            body["message"] = (
                "Wallet address not registered on PayCam. "
                "Only PayCam-generated addresses are accepted."
            )
            return Response(body, status=code)

        customer = wallet.user

        reference = generate_transaction_reference()
        now = timezone.now()
        expires_at = now + timezone.timedelta(minutes=settings.PAYMENT_EXPIRY_MINUTES)

        payment_method = f"crypto_{data['currency'].lower()}"

        txn = Transaction.objects.create(
            reference=reference,
            merchant=request.user,
            api_key=request.auth,
            customer_user=customer,
            amount=data["amount"],
            currency=data["currency"],
            payment_method=payment_method,
            status="pending",
            description=data.get("description"),
            external_reference=data.get("external_reference"),
            crypto_wallet_address=wallet_address,
            idempotency_key=idempotency_key,
            webhook_url=data.get("webhook_url") or request.user.default_webhook_url,
            redirect_url=data.get("redirect_url"),
            expires_at=expires_at,
        )

        if idempotency_key:
            store_idempotency_record(idempotency_key, reference, body_hash)

        qr_payload = {
            "reference": txn.reference,
            "amount": str(txn.amount),
            "currency": txn.currency,
            "merchant": request.user.first_name or "Merchant",
            "description": txn.description,
            "wallet_address": wallet_address,
            "expires_at": expires_at.isoformat(),
        }
        qr_b64 = self._generate_qr(json.dumps(qr_payload))

        send_fcm_push.delay(txn.id)
        fire_webhook.delay(txn.id, "payment.pending")

        return Response(
            {
                "reference": txn.reference,
                "status": txn.status,
                "payment_url": f"https://pay.paycam.cm/pay/{txn.reference}",
                "qr_code": qr_b64,
                "expires_at": expires_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )

    def _generate_qr(self, data: str) -> str:
        if not _HAS_QRCODE:
            return ""
        qr = qrcode.make(data)
        buffer = io.BytesIO()
        qr.save(buffer, format="PNG")
        return f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode()}"
