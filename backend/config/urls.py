from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from apps.common.views import HealthView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", HealthView.as_view(), name="health"),
    path("api/v1/auth/", include("apps.paycam_auth.urls")),
    path("api/v1/payments/", include("apps.payments.urls")),
    path("api/v1/payments/card/", include("apps.cards.urls")),
    path("api/v1/payments/crypto/", include("apps.crypto.urls")),
    path("api/v1/webhooks/", include("apps.webhooks.urls")),
    path("api/v1/app/", include("apps.mobile_app.urls")),
    path("api/v1/sandbox/", include("apps.sandbox.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
