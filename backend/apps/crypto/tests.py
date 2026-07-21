from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from apps.common.test_utils import FakeRedisMixin, make_merchant, make_api_key, make_customer
from apps.mobile_app.models import CryptoWallet
from apps.payments.models import Transaction

CRYPTO_URL = "/api/v1/payments/crypto/initiate/"


@patch("apps.crypto.views.fire_webhook.delay")
@patch("apps.crypto.views.send_fcm_push.delay")
class CryptoInitiateTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.merchant = make_merchant()
        self.raw_key, self.api_key = make_api_key(self.merchant)
        self.customer = make_customer(with_crypto=True)
        self.eth_wallet = CryptoWallet.objects.get(user=self.customer, currency="ETH")
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.raw_key}")

    def _payload(self, **overrides):
        payload = {
            "amount": "0.00200000",
            "currency": "ETH",
            "crypto_wallet_address": self.eth_wallet.testnet_address,
            "description": "Hosting renewal",
        }
        payload.update(overrides)
        return payload

    def test_initiate_creates_pending_transaction(self, mock_fcm, mock_webhook):
        response = self.client.post(CRYPTO_URL, self._payload(), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "pending")
        self.assertIn("qr_code", response.data)
        txn = Transaction.objects.get(reference=response.data["reference"])
        self.assertEqual(txn.payment_method, "crypto_eth")
        self.assertEqual(txn.customer_user, self.customer)
        self.assertEqual(txn.crypto_wallet_address, self.eth_wallet.testnet_address)
        self.assertEqual(txn.description, "Hosting renewal")
        mock_fcm.assert_called_once_with(txn.id)
        mock_webhook.assert_called_once_with(txn.id, "payment.pending")

    def test_external_wallet_rejected_with_4004(self, mock_fcm, mock_webhook):
        response = self.client.post(
            CRYPTO_URL,
            self._payload(crypto_wallet_address="0x000000000000000000000000000000000000dEaD"),
            format="json",
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["code"], "PAY_CAM_4004")
        self.assertEqual(Transaction.objects.count(), 0)
        mock_fcm.assert_not_called()

    def test_invalid_currency_rejected(self, mock_fcm, mock_webhook):
        response = self.client.post(
            CRYPTO_URL, self._payload(currency="DOGE"), format="json"
        )
        self.assertEqual(response.status_code, 400)
