import hashlib
import json
from .tasks import send_fcm_push
from django.conf import settings
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.paycam_auth.api_key_authentication import APIKeyAuthentication
from apps.common.throttling import PaymentInitiateThrottle, PaymentReadThrottle
from apps.mobile_app.models import MobileAppUser
from apps.webhooks.tasks import fire_webhook
from .models import Transaction
from .serializers import InitiatePaymentSerializer, TransactionSerializer
from .utils import generate_transaction_reference
from .errors import error_response
from .redis_utils import get_idempotency_record, store_idempotency_record


@extend_schema(
    tags=["Payments"],
    summary="Initiate a MoMo payment",
    description="Merchant initiates a Mobile Money payment to a registered customer. Customer receives FCM push and must approve/decline in the Flutter app.",
    request=InitiatePaymentSerializer,
    responses={
        201: {"description": "Payment created", "example": {"reference": "TXN_20240101_Ab3Xk9Lm2Qr", "status": "pending", "payment_url": "https://pay.paycam.cm/pay/TXN_20240101_Ab3Xk9Lm2Qr", "expires_at": "2024-01-01T10:15:00Z"}},
        200: {"description": "Idempotent duplicate — same key, same body"},
        400: {"description": "Invalid request (wrong currency, payment method, or insufficient funds)"},
        404: {"description": "Customer not found"},
        409: {"description": "Idempotency key mismatch — same key, different body"},
    },
)
class InitiatePaymentView(generics.CreateAPIView):
    authentication_classes = [APIKeyAuthentication]
    serializer_class = InitiatePaymentSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [PaymentInitiateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if data["currency"] != "XAF":
            body, code = error_response("PAY_CAM_4000")
            return Response(body, status=code)

        if data["payment_method"] not in ("mtn_momo", "orange_money"):
            body, code = error_response("PAY_CAM_4000")
            return Response(body, status=code)

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
                            "payment_url": f"https://pay.paycam.cm/pay/{txn.reference}",
                            "expires_at": txn.expires_at,
                            "idempotency_key": idempotency_key,
                        },
                        status=status.HTTP_200_OK,
                    )

        try:
            customer = MobileAppUser.objects.get(phone_number=data["phone_number"], is_active=True)
        except MobileAppUser.DoesNotExist:
            body, code = error_response("PAY_CAM_4001")
            return Response(body, status=code)

        reference = generate_transaction_reference()
        expires_at = timezone.now() + timezone.timedelta(minutes=settings.PAYMENT_EXPIRY_MINUTES)

        txn = Transaction.objects.create(
            reference=reference,
            merchant=request.user,
            api_key=request.auth,
            customer_user=customer,
            amount=data["amount"],
            currency=data["currency"],
            phone_number=customer.phone_number,
            network=customer.network,
            payment_method=data["payment_method"],
            status="pending",
            description=data.get("description"),
            external_reference=data.get("external_reference"),
            idempotency_key=idempotency_key,
            webhook_url=data.get("webhook_url"),
            redirect_url=data.get("redirect_url"),
            expires_at=expires_at,
        )

        if idempotency_key:
            store_idempotency_record(idempotency_key, reference, body_hash)
        send_fcm_push.delay(txn.id)
        fire_webhook.delay(txn.id, "payment.pending")
        return Response(
            {
                "reference": txn.reference,
                "status": txn.status,
                "payment_url": f"https://pay.paycam.cm/pay/{txn.reference}",
                "expires_at": txn.expires_at,
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(
    tags=["Payments"],
    summary="Get payment status",
    description="Retrieve a single transaction by reference. Scoped to the authenticated merchant.",
)
class PaymentDetailView(generics.RetrieveAPIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [PaymentReadThrottle]
    serializer_class = TransactionSerializer
    lookup_field = "reference"
    lookup_url_kwarg = "reference"

    def get_queryset(self):
        return Transaction.objects.filter(merchant=self.request.user)


@extend_schema(
    tags=["Payments"],
    summary="List merchant payments",
    description="Paginated list of all transactions for the authenticated merchant.",
)
class PaymentListView(generics.ListAPIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [PaymentReadThrottle]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(merchant=self.request.user)
