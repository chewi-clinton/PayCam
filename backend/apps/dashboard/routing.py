from django.urls import re_path
from .consumers import MerchantDashboardConsumer

websocket_urlpatterns = [
    re_path(r"^ws/dashboard/$", MerchantDashboardConsumer.as_asgi()),
]
