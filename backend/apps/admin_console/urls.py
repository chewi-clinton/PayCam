from django.urls import path
from .views import (
    MerchantListView,
    MerchantDetailView,
    MerchantTransactionsView,
    MerchantSuspendView,
    MerchantReactivateView,
    APIKeyRevokeView,
)

urlpatterns = [
    path("merchants/", MerchantListView.as_view(), name="admin-merchant-list"),
    path("merchants/<int:pk>/", MerchantDetailView.as_view(), name="admin-merchant-detail"),
    path(
        "merchants/<int:pk>/transactions/",
        MerchantTransactionsView.as_view(),
        name="admin-merchant-transactions",
    ),
    path("merchants/<int:pk>/suspend/", MerchantSuspendView.as_view(), name="admin-merchant-suspend"),
    path(
        "merchants/<int:pk>/reactivate/",
        MerchantReactivateView.as_view(),
        name="admin-merchant-reactivate",
    ),
    path("api-keys/<int:pk>/revoke/", APIKeyRevokeView.as_view(), name="admin-api-key-revoke"),
]
