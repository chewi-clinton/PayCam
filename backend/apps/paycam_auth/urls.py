from django.urls import path
from .views import (
    RegisterView,
    EmailVerifyView,
    LoginView,
    TOTPSetupView,
    TOTPVerifyView,
    APIKeyListView,
    APIKeyCreateView,
    LogoutView,
    ProfileView,
    LogoUploadView,
    ForgotPasswordView,
    ResetPasswordView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("verify-email/", EmailVerifyView.as_view(), name="verify-email"),
    path("login/", LoginView.as_view(), name="login"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("2fa/setup/", TOTPSetupView.as_view(), name="totp-setup"),
    path("2fa/verify/", TOTPVerifyView.as_view(), name="totp-verify"),
    path("api-keys/", APIKeyListView.as_view(), name="api-key-list"),
    path("api-keys/create/", APIKeyCreateView.as_view(), name="api-key-create"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("profile/logo/", LogoUploadView.as_view(), name="profile-logo"),
]
