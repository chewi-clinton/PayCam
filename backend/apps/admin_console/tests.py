from django.test import TestCase
from rest_framework.test import APIClient

from apps.common.test_utils import FakeRedisMixin, make_merchant, make_api_key, merchant_jwt
from apps.paycam_auth.models import User

MERCHANTS_URL = "/api/v1/admin/merchants/"
LOGIN_URL = "/api/v1/auth/login/"


def make_admin(email="admin@example.com", password="AdminPass!123"):
    return User.objects.create_user(
        email=email,
        password=password,
        first_name="Ops",
        last_name="Admin",
        role="admin",
        is_active=True,
    )


class AdminConsolePermissionTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.merchant = make_merchant()
        self.admin = make_admin()
        self.client = APIClient()

    def test_merchant_role_rejected_on_every_endpoint(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {merchant_jwt(self.merchant)}")
        for path in [
            MERCHANTS_URL,
            f"/api/v1/admin/merchants/{self.merchant.id}/",
            f"/api/v1/admin/merchants/{self.merchant.id}/transactions/",
        ]:
            response = self.client.get(path)
            self.assertEqual(response.status_code, 403, path)

        for path in [
            f"/api/v1/admin/merchants/{self.merchant.id}/suspend/",
            f"/api/v1/admin/merchants/{self.merchant.id}/reactivate/",
        ]:
            response = self.client.post(path)
            self.assertEqual(response.status_code, 403, path)

    def test_unauthenticated_rejected(self):
        response = self.client.get(MERCHANTS_URL)
        self.assertIn(response.status_code, (401, 403))

    def test_admin_role_allowed(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {merchant_jwt(self.admin)}")
        response = self.client.get(MERCHANTS_URL)
        self.assertEqual(response.status_code, 200)


class MerchantListTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.admin = make_admin()
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {merchant_jwt(self.admin)}")

    def test_list_only_includes_merchants(self):
        make_merchant(email="one@example.com")
        make_merchant(email="two@example.com")
        response = self.client.get(MERCHANTS_URL)
        self.assertEqual(response.status_code, 200)
        emails = {m["email"] for m in response.data["results"]}
        self.assertEqual(emails, {"one@example.com", "two@example.com"})
        self.assertNotIn(self.admin.email, emails)

    def test_search_filters_by_email_and_business_name(self):
        make_merchant(email="jean@example.com")
        pierre = make_merchant(email="pierre@example.com")
        pierre.business_name = "Boutique Pierre"
        pierre.save(update_fields=["business_name"])

        response = self.client.get(MERCHANTS_URL, {"search": "pierre"})
        self.assertEqual(response.status_code, 200)
        emails = {m["email"] for m in response.data["results"]}
        self.assertEqual(emails, {"pierre@example.com"})

    def test_list_includes_api_key_count(self):
        merchant = make_merchant()
        make_api_key(merchant)
        make_api_key(merchant)
        response = self.client.get(MERCHANTS_URL)
        row = next(m for m in response.data["results"] if m["email"] == merchant.email)
        self.assertEqual(row["api_key_count"], 2)


class MerchantDetailTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.admin = make_admin()
        self.merchant = make_merchant()
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {merchant_jwt(self.admin)}")

    def test_detail_includes_api_keys(self):
        make_api_key(self.merchant)
        response = self.client.get(f"/api/v1/admin/merchants/{self.merchant.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["api_keys"]), 1)

    def test_detail_404_for_unknown_merchant(self):
        response = self.client.get("/api/v1/admin/merchants/999999/")
        self.assertEqual(response.status_code, 404)


class SuspendReactivateTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.admin = make_admin()
        self.merchant = make_merchant()
        self.raw_key, self.api_key = make_api_key(self.merchant)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {merchant_jwt(self.admin)}")

    def test_suspend_blocks_login(self):
        response = self.client.post(f"/api/v1/admin/merchants/{self.merchant.id}/suspend/")
        self.assertEqual(response.status_code, 200)
        self.merchant.refresh_from_db()
        self.assertTrue(self.merchant.is_suspended)

        anon = APIClient()
        login_response = anon.post(
            LOGIN_URL, {"email": self.merchant.email, "password": "Str0ngPass!123"}, format="json"
        )
        self.assertEqual(login_response.status_code, 401)

    def test_suspend_blocks_api_key_auth(self):
        self.client.post(f"/api/v1/admin/merchants/{self.merchant.id}/suspend/")
        payer = APIClient()
        payer.credentials(HTTP_AUTHORIZATION=f"Bearer {self.raw_key}")
        response = payer.get("/api/v1/payments/")
        self.assertIn(response.status_code, (401, 403))

    def test_suspend_blocks_dashboard_jwt(self):
        self.client.post(f"/api/v1/admin/merchants/{self.merchant.id}/suspend/")
        merchant_client = APIClient()
        merchant_client.credentials(HTTP_AUTHORIZATION=f"Bearer {merchant_jwt(self.merchant)}")
        response = merchant_client.get("/api/v1/auth/profile/")
        self.assertIn(response.status_code, (401, 403))

    def test_reactivate_restores_access(self):
        self.client.post(f"/api/v1/admin/merchants/{self.merchant.id}/suspend/")
        response = self.client.post(f"/api/v1/admin/merchants/{self.merchant.id}/reactivate/")
        self.assertEqual(response.status_code, 200)
        self.merchant.refresh_from_db()
        self.assertFalse(self.merchant.is_suspended)

        anon = APIClient()
        login_response = anon.post(
            LOGIN_URL, {"email": self.merchant.email, "password": "Str0ngPass!123"}, format="json"
        )
        self.assertEqual(login_response.status_code, 200)


class APIKeyRevokeTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.admin = make_admin()
        self.merchant = make_merchant()
        self.raw_key, self.api_key = make_api_key(self.merchant)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {merchant_jwt(self.admin)}")

    def test_revoke_disables_key(self):
        response = self.client.post(f"/api/v1/admin/api-keys/{self.api_key.id}/revoke/")
        self.assertEqual(response.status_code, 200)
        self.api_key.refresh_from_db()
        self.assertFalse(self.api_key.is_active)

        payer = APIClient()
        payer.credentials(HTTP_AUTHORIZATION=f"Bearer {self.raw_key}")
        payment_response = payer.get("/api/v1/payments/")
        self.assertIn(payment_response.status_code, (401, 403))
