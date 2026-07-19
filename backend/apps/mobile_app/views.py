from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.conf import settings
from django.db import transaction as db_transaction
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from .models import MobileAppUser, Wallet, CryptoWallet
from .serializers import (
    FCMTokenSerializer,
    AppRegisterSerializer,
    MobileAppUserSerializer,
    WalletSerializer,
    CryptoWalletSerializer,
    AppLoginSerializer,
    AppOTPVerifySerializer,
    TransactionActionSerializer,
    ChangePinRequestSerializer,
    ChangePinConfirmSerializer,
)
import secrets
from apps.common.throttling import LoginRateThrottle
from apps.payments.errors import error_response
from apps.webhooks.tasks import fire_webhook
from apps.dashboard.utils import push_transaction_update
from .authentication import MobileAppJWTAuthentication
from .crypto_utils import generate_wallet_for_currency
from .utils import (
    normalize_phone,
    verify_pin,
    hash_pin,
    generate_otp,
    store_login_otp,
    verify_login_otp,
    get_pin_attempts,
    increment_pin_attempts,
    clear_pin_attempts,
    get_otp_attempts,
    increment_otp_attempts,
    clear_otp_attempts,
    store_change_pin_otp,
    verify_change_pin_otp,
)
from apps.paycam_auth.utils import send_email_otp
from apps.payments.models import Transaction
import jwt


@extend_schema(
    tags=["Mobile App"],
    summary="Resolve a scanned payment QR code",
    description="Given a transaction reference (extracted from a scanned QR payload), returns the payment details for the authenticated customer to review and approve/decline. Only returns transactions belonging to the requesting customer.",
)
class PaymentLookupView(generics.RetrieveAPIView):
    authentication_classes = [MobileAppJWTAuthentication]
    permission_classes = [IsAuthenticated]
    lookup_field = "reference"

    def get(self, request, *args, **kwargs):
        reference = kwargs.get("reference")
        txn = Transaction.objects.filter(
            reference=reference, customer_user=request.user
        ).first()
        if not txn:
            body, code = error_response("PAY_CAM_4013")
            return Response(body, status=code)
        return Response(
            {
                "reference": txn.reference,
                "amount": str(txn.amount),
                "currency": txn.currency,
                "payment_method": txn.payment_method,
                "status": txn.status,
                "merchant_name": txn.merchant.first_name or "Merchant",
                "expires_at": txn.expires_at.isoformat() if txn.expires_at else None,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Mobile App"],
    summary="List customer crypto wallets",
    description="Returns the authenticated customer's PayCam-generated testnet wallets (BTC, ETH, USDT).",
)
class CryptoWalletListView(generics.ListAPIView):
    authentication_classes = [MobileAppJWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = CryptoWalletSerializer

    def get_queryset(self):
        return self.request.user.crypto_wallets.all()


@extend_schema(
    tags=["Mobile App"],
    summary="Register customer",
    description="Customer registers with phone number, full name, PIN, and email. Network auto-detected from phone prefix. Wallet created automatically and pre-funded with the sandbox faucet amount.",
)
class AppRegisterView(generics.CreateAPIView):
    queryset = MobileAppUser.objects.all()
    serializer_class = AppRegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        Wallet.objects.create(user=user, network=user.network, balance=settings.FAUCET_AMOUNT)

        crypto_wallets = []
        for currency in ("BTC", "ETH", "USDT"):
            address, network = generate_wallet_for_currency(currency)
            crypto_wallets.append(
                CryptoWallet.objects.create(
                    user=user, currency=currency, testnet_address=address,
                    network=network, balance=0,
                )
            )

        return Response(
            {
                "message": "Account created.",
                "user": MobileAppUserSerializer(user).data,
                "wallet": WalletSerializer(user.wallet).data,
                "crypto_wallets": CryptoWalletSerializer(crypto_wallets, many=True).data,
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(
    tags=["Mobile App"],
    summary="Customer login (PIN)",
    description="Enter PIN. If correct, 6-digit OTP sent to email. Account locked after 3 failed PIN attempts.",
)
class AppLoginView(generics.GenericAPIView):
    serializer_class = AppLoginSerializer
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = normalize_phone(serializer.validated_data["phone_number"])
        pin = serializer.validated_data["pin"]
        try:
            user = MobileAppUser.objects.get(phone_number=phone_number, is_active=True)
        except MobileAppUser.DoesNotExist:
            return Response(
                {"error": "account_not_found", "message": "Phone number not registered on PayCam."},
                status=status.HTTP_404_NOT_FOUND,
            )
        attempts = get_pin_attempts(user.id)
        if attempts >= settings.MAX_PIN_ATTEMPTS:
            return Response(
                {"error": "account_locked", "message": f"Account locked. Try again in {settings.PIN_LOCKOUT_MINUTES} minutes."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not verify_pin(pin, user.pin_hash):
            new_attempts = increment_pin_attempts(user.id)
            remaining = max(0, settings.MAX_PIN_ATTEMPTS - new_attempts)
            return Response(
                {
                    "error": "invalid_pin",
                    "message": "Invalid PIN.",
                    "remaining_attempts": remaining,
                    "locked": remaining == 0,
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        clear_pin_attempts(user.id)
        otp = generate_otp()
        store_login_otp(user.id, otp)
        sent = send_email_otp(user.email, otp)
        if not sent:
            return Response(
                {"error": "otp_delivery_failed", "message": "Failed to deliver OTP to email."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(
            {
                "message": "OTP sent.",
                "delivery_method": "email",
                "expires_in_seconds": 300,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Mobile App"],
    summary="Verify OTP",
    description="Enter 6-digit OTP from email. Returns JWT valid for 5 minutes. Account locked after 3 failed attempts.",
)
class AppOTPVerifyView(generics.GenericAPIView):
    serializer_class = AppOTPVerifySerializer
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = normalize_phone(serializer.validated_data["phone_number"])
        otp = serializer.validated_data["otp"]
        try:
            user = MobileAppUser.objects.get(phone_number=phone_number, is_active=True)
        except MobileAppUser.DoesNotExist:
            return Response(
                {"error": "account_not_found", "message": "Phone number not registered on PayCam."},
                status=status.HTTP_404_NOT_FOUND,
            )
        attempts = get_otp_attempts(user.id)
        if attempts >= settings.MAX_OTP_ATTEMPTS:
            return Response(
                {"error": "account_locked", "message": f"Too many failed OTP attempts. Try again in {settings.PIN_LOCKOUT_MINUTES} minutes."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not verify_login_otp(user.id, otp):
            new_attempts = increment_otp_attempts(user.id)
            remaining = max(0, settings.MAX_OTP_ATTEMPTS - new_attempts)
            return Response(
                {
                    "error": "invalid_otp",
                    "message": "Invalid or expired OTP.",
                    "remaining_attempts": remaining,
                    "locked": remaining == 0,
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        clear_otp_attempts(user.id)
        now = timezone.now()
        payload = {
            "user_id": user.id,
            "type": "mobile_app",
            "iat": now,
            "exp": now + timezone.timedelta(minutes=settings.SESSION_TIMEOUT_MINUTES),
        }
        token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
        return Response(
            {
                "token": token,
                "token_type": "Bearer",
                "expires_in_minutes": settings.SESSION_TIMEOUT_MINUTES,
                "user": MobileAppUserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Mobile App"],
    summary="List pending payment requests",
    description="Customer polls for incoming MoMo payment requests. Used as FCM fallback.",
)
class PendingPaymentsView(generics.GenericAPIView):
    authentication_classes = [MobileAppJWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionActionSerializer

    def get(self, request, *args, **kwargs):
        user = request.user
        now = timezone.now()
        pending = Transaction.objects.filter(
            customer_user=user,
            status="pending",
            expires_at__gt=now,
        ).order_by("expires_at")
        results = []
        for txn in pending:
            results.append({
                "reference": txn.reference,
                "merchant_name": txn.merchant.first_name if txn.merchant else "Unknown",
                "amount": str(txn.amount),
                "currency": txn.currency,
                "description": txn.description or txn.payment_method,
                "expires_at": txn.expires_at.isoformat(),
            })
        return Response({"pending": results}, status=status.HTTP_200_OK)


@extend_schema(
    tags=["Mobile App"],
    summary="Approve a payment",
    description="Customer approves a pending payment. Deducts amount from wallet balance and fires payment.success webhook.",
    responses={
        200: {"description": "Payment approved", "example": {"reference": "TXN_...", "status": "success"}},
        400: {"description": "Not pending or expired"},
        404: {"description": "Transaction not found"},
    },
)
class ApprovePaymentView(generics.GenericAPIView):
    authentication_classes = [MobileAppJWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionActionSerializer

    def post(self, request, *args, **kwargs):
        reference = kwargs.get("reference")
        user = request.user

        # Lock the transaction row for the whole approve so a concurrent
        # approve of the same payment (double-tap, replayed request) blocks
        # here and then fails the pending-status check instead of debiting
        # the wallet twice.
        with db_transaction.atomic():
            try:
                txn = Transaction.objects.select_for_update().get(
                    reference=reference, customer_user=user
                )
            except Transaction.DoesNotExist:
                return Response(
                    {"error": "not_found", "message": "Transaction not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if txn.status != "pending":
                body, code = error_response("PAY_CAM_4000")
                body["message"] = "Transaction is not in a pending state."
                return Response(body, status=code)

            if txn.expires_at < timezone.now():
                txn.status = "expired"
                txn.save(update_fields=["status"])
                db_transaction.on_commit(lambda: fire_webhook.delay(txn.id, "payment.expired"))
                db_transaction.on_commit(lambda: push_transaction_update(txn))
                body, code = error_response("PAY_CAM_4007")
                return Response(body, status=code)

            if txn.payment_method.startswith("crypto_"):
                from apps.crypto.tasks import monitor_crypto_payment

                currency = txn.currency
                wallet = CryptoWallet.objects.select_for_update().filter(
                    user=user, currency=currency
                ).first()

                if not wallet:
                    body, code = error_response("PAY_CAM_4004")
                    return Response(body, status=code)

                if wallet.balance < txn.amount:
                    body, code = error_response("PAY_CAM_4002")
                    return Response(body, status=code)

                wallet.balance = wallet.balance - txn.amount
                wallet.save(update_fields=["balance", "updated_at"])

                tx_hash = "0x" + secrets.token_hex(32) if currency != "BTC" else secrets.token_hex(32)

                txn.crypto_tx_hash = tx_hash
                txn.save(update_fields=["crypto_tx_hash", "updated_at"])

                db_transaction.on_commit(lambda: monitor_crypto_payment.delay(txn.id))

                return Response(
                    {
                        "reference": txn.reference,
                        "status": "pending",
                        "message": "Transaction broadcast. Monitoring blockchain for confirmations.",
                        "crypto_tx_hash": tx_hash,
                    },
                    status=status.HTTP_200_OK,
                )

            wallet = Wallet.objects.select_for_update().get(user=user)
            if wallet.balance < txn.amount:
                body, code = error_response("PAY_CAM_4002")
                return Response(body, status=code)

            wallet.balance = wallet.balance - txn.amount
            wallet.save(update_fields=["balance"])
            txn.status = "success"
            txn.save(update_fields=["status"])
            db_transaction.on_commit(lambda: fire_webhook.delay(txn.id, "payment.success"))
            db_transaction.on_commit(lambda: push_transaction_update(txn))

        return Response(
            {"reference": txn.reference, "status": txn.status},
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Mobile App"],
    summary="Decline a payment",
    description="Customer declines a pending payment. Fires payment.failed webhook.",
    responses={
        200: {"description": "Payment declined", "example": {"reference": "TXN_...", "status": "failed"}},
        400: {"description": "Not pending or expired"},
        404: {"description": "Transaction not found"},
    },
)
class DeclinePaymentView(generics.GenericAPIView):
    authentication_classes = [MobileAppJWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionActionSerializer

    def post(self, request, *args, **kwargs):
        reference = kwargs.get("reference")
        user = request.user

        # Same locking discipline as approve: a decline racing an approve
        # must not flip an already-successful transaction to failed.
        with db_transaction.atomic():
            try:
                txn = Transaction.objects.select_for_update().get(
                    reference=reference, customer_user=user
                )
            except Transaction.DoesNotExist:
                return Response(
                    {"error": "not_found", "message": "Transaction not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if txn.status != "pending":
                body, code = error_response("PAY_CAM_4000")
                body["message"] = "Transaction is not in a pending state."
                return Response(body, status=code)

            if txn.expires_at < timezone.now():
                txn.status = "expired"
                txn.save(update_fields=["status"])
                db_transaction.on_commit(lambda: fire_webhook.delay(txn.id, "payment.expired"))
                db_transaction.on_commit(lambda: push_transaction_update(txn))
                body, code = error_response("PAY_CAM_4007")
                return Response(body, status=code)

            txn.status = "failed"
            txn.save(update_fields=["status"])
            db_transaction.on_commit(lambda: fire_webhook.delay(txn.id, "payment.failed"))
            db_transaction.on_commit(lambda: push_transaction_update(txn))

        return Response(
            {"reference": txn.reference, "status": txn.status},
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Mobile App"],
    summary="Register/update FCM token",
    description="Flutter app calls this on launch and whenever Firebase rotates the token. Required for push notifications to work — without it, the app falls back to polling GET /app/payments/pending.",
    responses={200: {"description": "Token saved"}},
)
class FCMTokenView(generics.GenericAPIView):
    authentication_classes = [MobileAppJWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = FCMTokenSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.fcm_token = serializer.validated_data["fcm_token"]
        user.fcm_token_updated_at = timezone.now()
        user.save(update_fields=["fcm_token", "fcm_token_updated_at"])
        return Response({"message": "FCM token saved."}, status=status.HTTP_200_OK)


@extend_schema(
    tags=["Mobile App"],
    summary="Get wallet balances",
    description="Returns the customer's MoMo wallet and crypto wallets with balances.",
)
class WalletView(generics.GenericAPIView):
    authentication_classes = [MobileAppJWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = WalletSerializer

    def get(self, request, *args, **kwargs):
        user = request.user
        return Response(
            {
                "user": MobileAppUserSerializer(user).data,
                "wallet": WalletSerializer(user.wallet).data,
                "crypto_wallets": CryptoWalletSerializer(
                    user.crypto_wallets.all(), many=True
                ).data,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Mobile App"],
    summary="Customer transaction history",
    description="Paginated list of the customer's transactions (all statuses), newest first.",
)
class CustomerTransactionsView(generics.GenericAPIView):
    authentication_classes = [MobileAppJWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionActionSerializer

    def get(self, request, *args, **kwargs):
        txns = (
            Transaction.objects.filter(customer_user=request.user)
            .select_related("merchant")
            .order_by("-created_at")[:100]
        )
        results = [
            {
                "reference": t.reference,
                "merchant_name": t.merchant.first_name if t.merchant else "Merchant",
                "amount": str(t.amount),
                "currency": t.currency,
                "payment_method": t.payment_method,
                "status": t.status,
                "description": t.description or t.payment_method,
                "created_at": t.created_at.isoformat(),
                "updated_at": t.updated_at.isoformat(),
            }
            for t in txns
        ]
        return Response({"transactions": results}, status=status.HTTP_200_OK)


@extend_schema(
    tags=["Mobile App"],
    summary="Request PIN change (step 1)",
    description="Verifies the customer's current PIN and sends a 6-digit OTP to email. Required before ChangePinConfirmView.",
)
class ChangePinRequestView(generics.GenericAPIView):
    authentication_classes = [MobileAppJWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePinRequestSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user

        if not verify_pin(serializer.validated_data["old_pin"], user.pin_hash):
            return Response(
                {"error": "invalid_pin", "message": "Current PIN is incorrect."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        otp = generate_otp()
        store_change_pin_otp(user.id, otp)
        sent = send_email_otp(user.email, otp)
        if not sent:
            return Response(
                {"error": "otp_delivery_failed", "message": "Failed to deliver OTP to email."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(
            {"message": "OTP sent.", "delivery_method": "email", "expires_in_seconds": 300},
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Mobile App"],
    summary="Confirm PIN change (step 2)",
    description="Verifies the OTP from ChangePinRequestView and sets the new PIN.",
)
class ChangePinConfirmView(generics.GenericAPIView):
    authentication_classes = [MobileAppJWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePinConfirmSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user

        if not verify_change_pin_otp(user.id, serializer.validated_data["otp"]):
            return Response(
                {"error": "invalid_otp", "message": "Invalid or expired OTP."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user.pin_hash = hash_pin(serializer.validated_data["new_pin"])
        user.save(update_fields=["pin_hash"])
        return Response({"message": "PIN changed successfully."}, status=status.HTTP_200_OK)
