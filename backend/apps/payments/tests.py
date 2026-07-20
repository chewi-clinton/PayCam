from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.common.test_utils import FakeRedisMixin, make_merchant, make_api_key, make_customer, merchant_jwt
from .models import Transaction
from .utils import generate_transaction_reference

INITIATE_URL = "/api/v1/payments/initiate/"


class TransactionReferenceTests(TestCase):
    def test_reference_format(self):
        ref = generate_transaction_reference()
        today = timezone.now().strftime("%Y%m%d")
        self.assertTrue(ref.startswith(f"TXN_{today}_"))
        suffix = ref.split("_")[-1]
        self.assertEqual(len(suffix), 12)
        self.assertTrue(suffix.isalnum())


@patch("apps.payments.views.fire_webhook.delay")
@patch("apps.payments.views.send_fcm_push.delay")
class InitiatePaymentTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.merchant = make_merchant()
        self.raw_key, self.api_key = make_api_key(self.merchant)
        self.customer = make_customer()
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.raw_key}")

    def _payload(self, **overrides):
        payload = {
            "amount": "5000.00",
            "currency": "XAF",
            "phone_number": "237670123456",
            "payment_method": "mtn_momo",
            "description": "Order #001",
            "external_reference": "ORD-001",
        }
        payload.update(overrides)
        return payload

    def test_initiate_success(self, mock_fcm, mock_webhook):
        response = self.client.post(INITIATE_URL, self._payload(), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "pending")
        txn = Transaction.objects.get(reference=response.data["reference"])
        self.assertEqual(txn.merchant, self.merchant)
        self.assertEqual(txn.customer_user, self.customer)
        self.assertEqual(txn.network, "MTN")
        self.assertEqual(txn.description, "Order #001")
        self.assertEqual(txn.external_reference, "ORD-001")
        mock_fcm.assert_called_once_with(txn.id)
        mock_webhook.assert_called_once_with(txn.id, "payment.pending")

    def test_unregistered_phone_returns_4001(self, mock_fcm, mock_webhook):
        response = self.client.post(
            INITIATE_URL, self._payload(phone_number="237670999999"), format="json"
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["code"], "PAY_CAM_4001")
        mock_fcm.assert_not_called()

    def test_non_xaf_currency_rejected(self, mock_fcm, mock_webhook):
        response = self.client.post(
            INITIATE_URL, self._payload(currency="USD"), format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "PAY_CAM_4000")

    def test_invalid_payment_method_rejected(self, mock_fcm, mock_webhook):
        response = self.client.post(
            INITIATE_URL, self._payload(payment_method="card"), format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "PAY_CAM_4000")

    def test_idempotency_duplicate_returns_200_with_original(self, mock_fcm, mock_webhook):
        payload = self._payload()
        first = self.client.post(
            INITIATE_URL, payload, format="json", headers={"Idempotency-Key": "key-1"}
        )
        self.assertEqual(first.status_code, 201)
        second = self.client.post(
            INITIATE_URL, payload, format="json", headers={"Idempotency-Key": "key-1"}
        )
        self.assertEqual(second.status_code, 200)
        self.assertEqual(second.data["reference"], first.data["reference"])
        self.assertEqual(Transaction.objects.count(), 1)

    def test_idempotency_body_mismatch_returns_409(self, mock_fcm, mock_webhook):
        self.client.post(
            INITIATE_URL, self._payload(), format="json", headers={"Idempotency-Key": "key-2"}
        )
        response = self.client.post(
            INITIATE_URL,
            self._payload(amount="9000.00"),
            format="json",
            headers={"Idempotency-Key": "key-2"},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["code"], "PAY_CAM_4006")

    def test_missing_api_key_rejected(self, mock_fcm, mock_webhook):
        client = APIClient()
        response = client.post(INITIATE_URL, self._payload(), format="json")
        self.assertIn(response.status_code, (401, 403))


class PaymentReadTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.merchant = make_merchant()
        self.raw_key, self.api_key = make_api_key(self.merchant)
        self.customer = make_customer()
        self.txn = Transaction.objects.create(
            reference="TXN_20260101_TESTREAD0001",
            merchant=self.merchant,
            api_key=self.api_key,
            customer_user=self.customer,
            amount="5000.00",
            currency="XAF",
            phone_number=self.customer.phone_number,
            network="MTN",
            payment_method="mtn_momo",
            status="pending",
            expires_at=timezone.now() + timezone.timedelta(minutes=15),
        )
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.raw_key}")

    def test_detail_returns_transaction(self):
        response = self.client.get(f"/api/v1/payments/{self.txn.reference}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["reference"], self.txn.reference)

    def test_detail_scoped_to_merchant(self):
        other = make_merchant(email="other@example.com")
        other_key, _ = make_api_key(other)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {other_key}")
        response = client.get(f"/api/v1/payments/{self.txn.reference}/")
        self.assertEqual(response.status_code, 404)

    def test_list_paginated(self):
        response = self.client.get("/api/v1/payments/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)

    def test_dashboard_jwt_can_list_and_read(self):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {merchant_jwt(self.merchant)}")
        list_response = client.get("/api/v1/payments/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.data["count"], 1)
        detail_response = client.get(f"/api/v1/payments/{self.txn.reference}/")
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.data["reference"], self.txn.reference)

    def test_dashboard_jwt_scoped_to_merchant(self):
        other = make_merchant(email="dashboard-other@example.com")
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {merchant_jwt(other)}")
        response = client.get(f"/api/v1/payments/{self.txn.reference}/")
        self.assertEqual(response.status_code, 404)
