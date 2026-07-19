from decimal import Decimal
from django.utils import timezone
from django.db import transaction as db_transaction
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from drf_spectacular.utils import extend_schema
from apps.paycam_auth.api_key_authentication import APIKeyAuthentication
from apps.mobile_app.models import MobileAppUser, Wallet, CryptoWallet
from apps.payments.errors import error_response
from .serializers import FaucetSerializer, CryptoFaucetSerializer
from .redis_utils import (
    has_claimed_today,
    mark_claimed_today,
    next_faucet_time,
    get_crypto_faucet_claim,
    store_crypto_faucet_claim,
)


@extend_schema(
    tags=["Sandbox"],
    summary="Claim test XAF credits",
    description="Grants 10,000 XAF to a customer's wallet once per UTC day. Test-key only.",
    responses={
        200: {"description": "Credits granted"},
        400: {"description": "Already claimed today"},
        404: {"description": "Customer not found"},
    },
)
class FaucetView(generics.CreateAPIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = FaucetSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = serializer.validated_data["phone_number"]

        try:
            customer = MobileAppUser.objects.get(phone_number=phone_number, is_active=True)
        except MobileAppUser.DoesNotExist:
            body, code = error_response("PAY_CAM_4001")
            return Response(body, status=code)

        if has_claimed_today(phone_number):
            body, code = error_response("PAY_CAM_4005")
            body["next_faucet_at"] = next_faucet_time()
            return Response(body, status=code)

        with db_transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(user=customer)
            wallet.balance = wallet.balance + settings.FAUCET_AMOUNT
            wallet.save(update_fields=["balance"])

        mark_claimed_today(phone_number)

        return Response(
            {
                "phone_number": phone_number,
                "amount_credited": settings.FAUCET_AMOUNT,
                "new_balance": str(wallet.balance),
                "currency": "XAF",
                "next_faucet_at": next_faucet_time(),
            },
            status=status.HTTP_200_OK,
        )


FAUCET_AMOUNTS = {
    "BTC": "0.0005",
    "ETH": "0.01",
    "USDT": "50.00",
}


@extend_schema(
    tags=["Sandbox"],
    summary="Crypto faucet",
    description="Grants test crypto balance to a customer wallet. Test-key only. Once per day per wallet.",
    request=CryptoFaucetSerializer,
)
class CryptoFaucetView(generics.GenericAPIView):
    authentication_classes = [APIKeyAuthentication]
    serializer_class = CryptoFaucetSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with db_transaction.atomic():
            wallet = CryptoWallet.objects.select_for_update().filter(
                currency=data["currency"],
                testnet_address=data["testnet_address"],
            ).first()

            if not wallet:
                body, code = error_response("PAY_CAM_4004")
                return Response(body, status=code)

            if get_crypto_faucet_claim(wallet.id):
                body, code = error_response("PAY_CAM_4005")
                return Response(body, status=code)

            amount = FAUCET_AMOUNTS[data["currency"]]
            wallet.balance = wallet.balance + Decimal(amount)
            wallet.save(update_fields=["balance", "updated_at"])
            store_crypto_faucet_claim(wallet.id)

        tomorrow = timezone.now() + timezone.timedelta(days=1)
        next_faucet = tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)

        return Response(
            {
                "currency": data["currency"],
                "testnet_address": data["testnet_address"],
                "amount_credited": amount,
                "new_balance": str(wallet.balance),
                "next_faucet_at": next_faucet.isoformat(),
            },
            status=status.HTTP_200_OK,
        )
