from rest_framework import serializers
from .models import MobileAppUser, Wallet, CryptoWallet
from .utils import normalize_phone, detect_network, hash_pin, verify_pin


class AppRegisterSerializer(serializers.ModelSerializer):
    pin = serializers.CharField(write_only=True, min_length=4, max_length=4)
    email = serializers.EmailField(required=True)

    class Meta:
        model = MobileAppUser
        fields = ["phone_number", "full_name", "pin", "email"]

    def validate_phone_number(self, value):
        normalized = normalize_phone(value)
        if not normalized.startswith("237") or len(normalized) != 12:
            raise serializers.ValidationError("Invalid Cameroon phone number. Expected format: 237XXXXXXXXX.")
        return normalized

    def validate_pin(self, value):
        if not value.isdigit() or len(value) != 4:
            raise serializers.ValidationError("PIN must be exactly 4 digits.")
        return value

    def validate(self, attrs):
        phone_number = attrs.get("phone_number")
        network = detect_network(phone_number)
        if network is None:
            raise serializers.ValidationError(
                {"phone_number": "Unknown phone prefix. Registration blocked. Only MTN and Orange Cameroon numbers are supported."}
            )
        attrs["network"] = network
        return attrs

    def create(self, validated_data):
        pin = validated_data.pop("pin")
        validated_data["pin_hash"] = hash_pin(pin)
        return super().create(validated_data)


class MobileAppUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = MobileAppUser
        fields = ["id", "phone_number", "full_name", "network", "is_active", "created_at"]


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ["network", "balance", "updated_at"]


class CryptoWalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = CryptoWallet
        fields = ["currency", "testnet_address", "balance", "network", "updated_at"]


class AppLoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    pin = serializers.CharField(write_only=True, min_length=4, max_length=4)


class AppOTPVerifySerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    otp = serializers.CharField(min_length=6, max_length=6)


class TransactionActionSerializer(serializers.Serializer):
    pass


class FCMTokenSerializer(serializers.Serializer):
    fcm_token = serializers.CharField(max_length=500)


class ChangePinRequestSerializer(serializers.Serializer):
    old_pin = serializers.CharField(min_length=4, max_length=4)


class ChangePinConfirmSerializer(serializers.Serializer):
    otp = serializers.CharField(min_length=6, max_length=6)
    new_pin = serializers.CharField(min_length=4, max_length=4)

    def validate_new_pin(self, value):
        if not value.isdigit() or len(value) != 4:
            raise serializers.ValidationError("PIN must be exactly 4 digits.")
        return value
