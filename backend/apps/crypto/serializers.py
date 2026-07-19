from rest_framework import serializers


class CryptoPaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=20, decimal_places=8)
    currency = serializers.ChoiceField(choices=["BTC", "ETH", "USDT"])
    crypto_wallet_address = serializers.CharField(max_length=100)
    description = serializers.CharField(max_length=255, required=False)
    external_reference = serializers.CharField(max_length=100, required=False)
    webhook_url = serializers.URLField(required=False)
    redirect_url = serializers.URLField(required=False)
    idempotency_key = serializers.CharField(max_length=100, required=False)
