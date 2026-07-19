from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import WebhookLog
from .serializers import WebhookLogSerializer


class WebhookLogListView(generics.ListAPIView):
    serializer_class = WebhookLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WebhookLog.objects.filter(transaction__merchant=self.request.user)