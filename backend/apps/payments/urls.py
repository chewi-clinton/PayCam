from django.urls import path
from .views import InitiatePaymentView, PaymentDetailView, PaymentListView

urlpatterns = [
    path("initiate/", InitiatePaymentView.as_view(), name="initiate-payment"),
    path("", PaymentListView.as_view(), name="payment-list"),
    path("<str:reference>/", PaymentDetailView.as_view(), name="payment-detail"),
]