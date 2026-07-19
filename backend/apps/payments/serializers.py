from rest_framework import serializers
from .models import Transaction


class InitiatePaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    currency = serializers.CharField(max_length=10)
    phone_number = serializers.CharField(max_length=20, required=False)
    payment_method = serializers.CharField(max_length=20)
    description = serializers.CharField(max_length=255, required=False)
    external_reference = serializers.CharField(max_length=100, required=False)
    webhook_url = serializers.URLField(required=False)
    redirect_url = serializers.URLField(required=False)
    idempotency_key = serializers.CharField(max_length=100, required=False)


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            "reference", "status", "amount", "currency", "payment_method",
            "phone_number", "description", "external_reference",
            "created_at", "updated_at",
        ]