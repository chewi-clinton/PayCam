from rest_framework import serializers
from .models import WebhookLog


class WebhookLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookLog
        fields = "__all__"