from django.urls import path
from .views import FaucetView, CryptoFaucetView

urlpatterns = [
    path("faucet/", FaucetView.as_view(), name="faucet"),
    path("crypto-faucet/", CryptoFaucetView.as_view(), name="crypto-faucet"),
]