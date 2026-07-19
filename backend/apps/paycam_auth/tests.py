from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from apps.common.test_utils import FakeRedisMixin, make_merchant
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
