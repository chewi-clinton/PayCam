from django.urls import path
from .views import WebhookLogListView

urlpatterns = [
    path("logs/", WebhookLogListView.as_view(), name="webhook-logs"),
]