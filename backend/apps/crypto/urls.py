from django.urls import path
from .views import CryptoInitiateView

urlpatterns = [
    path("initiate/", CryptoInitiateView.as_view(), name="crypto-initiate"),
]