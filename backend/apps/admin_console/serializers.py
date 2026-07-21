from rest_framework import serializers
from apps.paycam_auth.models import User
from apps.paycam_auth.serializers import APIKeySerializer


class MerchantListSerializer(serializers.ModelSerializer):
    api_key_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "business_name",
            "is_suspended", "totp_enabled", "api_key_count", "created_at",
        ]


class MerchantDetailSerializer(serializers.ModelSerializer):
    api_keys = APIKeySerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "business_name", "logo_url",
            "default_webhook_url", "is_suspended", "totp_enabled", "api_keys", "created_at",
        ]
