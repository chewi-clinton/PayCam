from rest_framework import serializers


class FaucetSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)

from rest_framework import serializers


class CryptoFaucetSerializer(serializers.Serializer):
    currency = serializers.ChoiceField(choices=["BTC", "ETH", "USDT"])
    testnet_address = serializers.CharField(max_length=100)
