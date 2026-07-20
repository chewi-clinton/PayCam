from rest_framework import serializers
from .models import WebhookLog


class WebhookLogSerializer(serializers.ModelSerializer):
    transaction_reference = serializers.CharField(source="transaction.reference", read_only=True)

    class Meta:
        model = WebhookLog
        fields = "__all__"
