from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from apps.common.test_utils import FakeRedisMixin, make_merchant, merchant_jwt
from .models import User

REGISTER_URL = "/api/v1/auth/register/"
VERIFY_URL = "/api/v1/auth/verify-email/"
LOGIN_URL = "/api/v1/auth/login/"


class MerchantRegisterTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()

    @patch("apps.paycam_auth.views.send_email_otp", return_value=True)
    def test_register_hashes_password(self, mock_send):
        response = self.client.post(
            REGISTER_URL,
            {
                "email": "new@example.com",
                "password": "Str0ngPass!123",
                "first_name": "New",
                "last_name": "Merchant",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(email="new@example.com")
        # Regression guard for the plaintext-password bug: the stored
        # value must be a working Django hash, never the raw password.
        self.assertNotEqual(user.password, "Str0ngPass!123")
        self.assertTrue(user.check_password("Str0ngPass!123"))
        self.assertFalse(user.is_active)  # active only after email verify
        mock_send.assert_called_once()

    @patch("apps.paycam_auth.views.generate_otp", return_value="654321")
    @patch("apps.paycam_auth.views.send_email_otp", return_value=True)
    def test_email_verification_activates_account(self, mock_send, mock_otp):
        self.client.post(
            REGISTER_URL,
            {
                "email": "new@example.com",
                "password": "Str0ngPass!123",
                "first_name": "New",
                "last_name": "Merchant",
            },
            format="json",
        )
        response = self.client.post(
            VERIFY_URL, {"email": "new@example.com", "otp": "654321"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(User.objects.get(email="new@example.com").is_active)
        self.assertIn("access_token", response.data)
        self.assertEqual(response.data["token_type"], "Bearer")


class MerchantLoginTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.merchant = make_merchant()
        self.client = APIClient()

    def test_login_returns_jwt(self):
        response = self.client.post(
            LOGIN_URL,
            {"email": "merchant@example.com", "password": "Str0ngPass!123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.data)

    def test_wrong_password_rejected(self):
        response = self.client.post(
            LOGIN_URL,
            {"email": "merchant@example.com", "password": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_unverified_account_rejected(self):
        user = make_merchant(email="unverified@example.com")
        user.is_active = False
        user.save(update_fields=["is_active"])
        response = self.client.post(
            LOGIN_URL,
            {"email": "unverified@example.com", "password": "Str0ngPass!123"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_logout_revokes_tokens(self):
        old_version = self.merchant.token_version
        self.merchant.revoke_all_tokens()
        self.merchant.refresh_from_db()
        self.assertEqual(self.merchant.token_version, old_version + 1)


PROFILE_URL = "/api/v1/auth/profile/"


class ProfileUpdateTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.merchant = make_merchant()
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {merchant_jwt(self.merchant)}")

    def test_update_business_profile(self):
        response = self.client.patch(
            PROFILE_URL,
            {
                "business_name": "Jean's Boutique",
                "logo_url": "https://example.com/logo.png",
                "default_webhook_url": "https://example.com/webhooks/paycam",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.merchant.refresh_from_db()
        self.assertEqual(self.merchant.business_name, "Jean's Boutique")
        self.assertEqual(self.merchant.logo_url, "https://example.com/logo.png")
        self.assertEqual(self.merchant.default_webhook_url, "https://example.com/webhooks/paycam")

    def test_update_ignores_protected_fields(self):
        response = self.client.patch(
            PROFILE_URL,
            {"business_name": "Renamed Co", "role": "admin", "email": "hijacked@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.merchant.refresh_from_db()
        self.assertEqual(self.merchant.business_name, "Renamed Co")
        self.assertEqual(self.merchant.role, "merchant")
        self.assertEqual(self.merchant.email, "merchant@example.com")

    def test_unauthenticated_rejected(self):
        self.client.credentials()
        response = self.client.patch(PROFILE_URL, {"business_name": "Nope"}, format="json")
        self.assertIn(response.status_code, (401, 403))


FORGOT_PASSWORD_URL = "/api/v1/auth/forgot-password/"
RESET_PASSWORD_URL = "/api/v1/auth/reset-password/"


class ForgotPasswordTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.merchant = make_merchant()
        self.client = APIClient()

    @patch("apps.paycam_auth.views.send_password_reset_otp", return_value=True)
    def test_forgot_password_sends_otp_for_known_email(self, mock_send):
        response = self.client.post(
            FORGOT_PASSWORD_URL, {"email": "merchant@example.com"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        mock_send.assert_called_once()

    @patch("apps.paycam_auth.views.send_password_reset_otp", return_value=True)
    def test_forgot_password_does_not_leak_unknown_email(self, mock_send):
        response = self.client.post(
            FORGOT_PASSWORD_URL, {"email": "nobody@example.com"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        mock_send.assert_not_called()

    @patch("apps.paycam_auth.views.generate_otp", return_value="111222")
    @patch("apps.paycam_auth.views.send_password_reset_otp", return_value=True)
    def test_reset_password_with_valid_otp(self, mock_send, mock_otp):
        self.client.post(FORGOT_PASSWORD_URL, {"email": "merchant@example.com"}, format="json")
        response = self.client.post(
            RESET_PASSWORD_URL,
            {"email": "merchant@example.com", "otp": "111222", "new_password": "NewStr0ngPass!"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.merchant.refresh_from_db()
        self.assertTrue(self.merchant.check_password("NewStr0ngPass!"))

    @patch("apps.paycam_auth.views.generate_otp", return_value="111222")
    @patch("apps.paycam_auth.views.send_password_reset_otp", return_value=True)
    def test_reset_password_revokes_existing_tokens(self, mock_send, mock_otp):
        old_version = self.merchant.token_version
        self.client.post(FORGOT_PASSWORD_URL, {"email": "merchant@example.com"}, format="json")
        self.client.post(
            RESET_PASSWORD_URL,
            {"email": "merchant@example.com", "otp": "111222", "new_password": "NewStr0ngPass!"},
            format="json",
        )
        self.merchant.refresh_from_db()
        self.assertEqual(self.merchant.token_version, old_version + 1)

    @patch("apps.paycam_auth.views.send_password_reset_otp", return_value=True)
    def test_reset_password_rejects_wrong_otp(self, mock_send):
        self.client.post(FORGOT_PASSWORD_URL, {"email": "merchant@example.com"}, format="json")
        response = self.client.post(
            RESET_PASSWORD_URL,
            {"email": "merchant@example.com", "otp": "000000", "new_password": "NewStr0ngPass!"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.merchant.refresh_from_db()
        self.assertTrue(self.merchant.check_password("Str0ngPass!123"))
