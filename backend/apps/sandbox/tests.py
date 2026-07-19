from django.test import TestCase
from rest_framework.test import APIClient

from apps.common.test_utils import FakeRedisMixin, make_merchant, make_api_key, make_customer
from apps.mobile_app.models import CryptoWallet

FAUCET_URL = "/api/v1/sandbox/faucet/"
CRYPTO_FAUCET_URL = "/api/v1/sandbox/crypto-faucet/"


class FaucetTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.merchant = make_merchant()
        self.raw_key, _ = make_api_key(self.merchant)
        self.customer = make_customer(with_crypto=True)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.raw_key}")

    def test_faucet_credits_wallet(self):
        response = self.client.post(
            FAUCET_URL, {"phone_number": "237670123456"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["amount_credited"], 10000)
        self.customer.wallet.refresh_from_db()
        self.assertEqual(float(self.customer.wallet.balance), 10000.0)

    def test_faucet_once_per_day(self):
        self.client.post(FAUCET_URL, {"phone_number": "237670123456"}, format="json")
        response = self.client.post(
            FAUCET_URL, {"phone_number": "237670123456"}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "PAY_CAM_4005")
        self.customer.wallet.refresh_from_db()
        self.assertEqual(float(self.customer.wallet.balance), 10000.0)  # credited once

    def test_faucet_unknown_customer(self):
        response = self.client.post(
            FAUCET_URL, {"phone_number": "237670999999"}, format="json"
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["code"], "PAY_CAM_4001")

    def test_crypto_faucet_credits_wallet(self):
        wallet = CryptoWallet.objects.get(user=self.customer, currency="ETH")
        response = self.client.post(
            CRYPTO_FAUCET_URL,
            {"currency": "ETH", "testnet_address": wallet.testnet_address},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        wallet.refresh_from_db()
        self.assertEqual(float(wallet.balance), 0.01)

    def test_crypto_faucet_once_per_day(self):
        wallet = CryptoWallet.objects.get(user=self.customer, currency="ETH")
        payload = {"currency": "ETH", "testnet_address": wallet.testnet_address}
        self.client.post(CRYPTO_FAUCET_URL, payload, format="json")
        response = self.client.post(CRYPTO_FAUCET_URL, payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "PAY_CAM_4005")

    def test_crypto_faucet_unknown_wallet(self):
        response = self.client.post(
            CRYPTO_FAUCET_URL,
            {"currency": "ETH", "testnet_address": "0xdeadbeef"},
            format="json",
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["code"], "PAY_CAM_4004")
