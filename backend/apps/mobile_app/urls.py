from django.urls import path
from .views import (
    AppRegisterView,
    AppLoginView,
    AppOTPVerifyView,
    PendingPaymentsView,
    ApprovePaymentView,
    DeclinePaymentView,
    FCMTokenView,
    CryptoWalletListView,
    PaymentLookupView,
    WalletView,
    CustomerTransactionsView,
    ChangePinRequestView,
    ChangePinConfirmView,
)

urlpatterns = [
    path("register/", AppRegisterView.as_view(), name="app-register"),
    path("login/", AppLoginView.as_view(), name="app-login"),
    path("verify-otp/", AppOTPVerifyView.as_view(), name="app-verify-otp"),
    path("payments/pending/", PendingPaymentsView.as_view(), name="pending-payments"),
    path("payments/<str:reference>/approve/", ApprovePaymentView.as_view(), name="approve-payment"),
    path("payments/<str:reference>/decline/", DeclinePaymentView.as_view(), name="decline-payment"),
    path("fcm-token/", FCMTokenView.as_view(), name="fcm-token"),
    path("crypto-wallets/", CryptoWalletListView.as_view(), name="crypto-wallets"),
    path("payments/lookup/<str:reference>/", PaymentLookupView.as_view(), name="payment-lookup"),
    path("wallet/", WalletView.as_view(), name="app-wallet"),
    path("transactions/", CustomerTransactionsView.as_view(), name="app-transactions"),
    path("change-pin/request/", ChangePinRequestView.as_view(), name="change-pin-request"),
    path("change-pin/confirm/", ChangePinConfirmView.as_view(), name="change-pin-confirm"),
]