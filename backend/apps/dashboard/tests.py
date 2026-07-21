from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.common.test_utils import make_merchant, make_api_key, make_customer, merchant_jwt
from apps.payments.models import Transaction

SUMMARY_URL = "/api/v1/dashboard/summary/"


class DashboardSummaryTests(TestCase):
    def setUp(self):
        self.merchant = make_merchant()
        _, self.api_key = make_api_key(self.merchant)
        self.customer = make_customer()
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {merchant_jwt(self.merchant)}")

    def _make_txn(self, status, amount="1000.00", currency="XAF", suffix="A"):
        return Transaction.objects.create(
            reference=f"TXN_20260101_SUMMARY{suffix}",
            merchant=self.merchant,
            api_key=self.api_key,
            customer_user=self.customer,
            amount=amount,
            currency=currency,
            phone_number=self.customer.phone_number,
            network="MTN",
            payment_method="mtn_momo",
            status=status,
            expires_at=timezone.now() + timezone.timedelta(minutes=15),
        )

    def test_empty_summary(self):
        response = self.client.get(SUMMARY_URL)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["transaction_count"], 0)
        self.assertEqual(response.data["gross_volume_xaf"], "0.00")
        self.assertEqual(response.data["success_rate"], 0.0)
        self.assertEqual(response.data["last_7_days"], [])

    def test_aggregates_across_statuses(self):
        self._make_txn("success", amount="1000.00", suffix="1")
        self._make_txn("success", amount="2500.00", suffix="2")
        self._make_txn("pending", amount="500.00", suffix="3")
        self._make_txn("failed", amount="300.00", suffix="4")

        response = self.client.get(SUMMARY_URL)
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertEqual(data["transaction_count"], 4)
        self.assertEqual(data["success_count"], 2)
        self.assertEqual(data["pending_count"], 1)
        self.assertEqual(data["failed_count"], 1)
        self.assertEqual(data["gross_volume_xaf"], "3500.00")
        self.assertEqual(data["success_rate"], 50.0)
        self.assertEqual(len(data["last_7_days"]), 1)
        self.assertEqual(data["last_7_days"][0]["count"], 2)
        self.assertEqual(data["last_7_days"][0]["volume"], "3500.00")

    def test_scoped_to_merchant(self):
        self._make_txn("success", amount="1000.00", suffix="5")
        other = make_merchant(email="dashboard-summary-other@example.com")
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {merchant_jwt(other)}")
        response = client.get(SUMMARY_URL)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["transaction_count"], 0)

    def test_requires_authentication(self):
        client = APIClient()
        response = client.get(SUMMARY_URL)
        self.assertIn(response.status_code, (401, 403))
