from decimal import Decimal
from unittest.mock import patch

from django.conf import settings
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.common.test_utils import FakeRedisMixin, make_merchant, make_api_key, make_customer, app_jwt
from apps.payments.models import Transaction
from .models import MobileAppUser, CryptoWallet
from .utils import detect_network, normalize_phone

REGISTER_URL = "/api/v1/app/register/"
REGISTER_VERIFY_URL = "/api/v1/app/register/verify-otp/"
LOGIN_URL = "/api/v1/app/login/"
PENDING_URL = "/api/v1/app/payments/pending/"


class PhoneUtilsTests(TestCase):
    def test_normalize_adds_country_code(self):
        self.assertEqual(normalize_phone("670123456"), "237670123456")
        self.assertEqual(normalize_phone("+237670123456"), "237670123456")
        self.assertEqual(normalize_phone("237 670 123 456"), "237670123456")

    def test_detect_network(self):
        self.assertEqual(detect_network("237670123456"), "MTN")
        self.assertEqual(detect_network("237650123456"), "MTN")
        self.assertEqual(detect_network("237655123456"), "ORANGE")
        self.assertEqual(detect_network("237695123456"), "ORANGE")
        self.assertIsNone(detect_network("237600123456"))


class AppRegisterTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()

    @patch("apps.mobile_app.views.send_email_otp", return_value=True)
    def test_register_sends_otp_without_creating_user(self, mock_send):
        response = self.client.post(
            REGISTER_URL,
            {
                "phone_number": "237670123456",
                "full_name": "Jean Pierre",
                "pin": "1234",
                "email": "jean@example.com",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["delivery_method"], "email")
        self.assertEqual(MobileAppUser.objects.count(), 0)
        mock_send.assert_called_once()

    @patch("apps.mobile_app.views.generate_otp", return_value="123456")
    @patch("apps.mobile_app.views.send_email_otp", return_value=True)
    def test_verify_otp_creates_wallets_and_returns_token(self, mock_send, mock_otp):
        self.client.post(
            REGISTER_URL,
            {
                "phone_number": "237670123456",
                "full_name": "Jean Pierre",
                "pin": "1234",
                "email": "jean@example.com",
            },
            format="json",
        )
        response = self.client.post(
            REGISTER_VERIFY_URL,
            {"phone_number": "237670123456", "otp": "123456"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("token", response.data)
        user = MobileAppUser.objects.get(phone_number="237670123456")
        self.assertEqual(user.network, "MTN")
        self.assertNotEqual(user.pin_hash, "1234")  # never stored raw
        self.assertEqual(user.wallet.balance, settings.FAUCET_AMOUNT)
        crypto_balances = dict(
            CryptoWallet.objects.filter(user=user).values_list("currency", "balance")
        )
        self.assertEqual(set(crypto_balances), {"BTC", "ETH", "USDT"})
        for currency, expected in settings.CRYPTO_FAUCET_AMOUNTS.items():
            self.assertEqual(crypto_balances[currency], Decimal(expected))

    @patch("apps.mobile_app.views.generate_otp", return_value="123456")
    @patch("apps.mobile_app.views.send_email_otp", return_value=True)
    def test_wrong_registration_otp_rejected(self, mock_send, mock_otp):
        self.client.post(
            REGISTER_URL,
            {
                "phone_number": "237670123456",
                "full_name": "Jean Pierre",
                "pin": "1234",
                "email": "jean@example.com",
            },
            format="json",
        )
        response = self.client.post(
            REGISTER_VERIFY_URL,
            {"phone_number": "237670123456", "otp": "000000"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(MobileAppUser.objects.count(), 0)

    def test_unknown_prefix_blocked(self):
        response = self.client.post(
            REGISTER_URL,
            {
                "phone_number": "237600123456",
                "full_name": "Jean Pierre",
                "pin": "1234",
                "email": "jean@example.com",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(MobileAppUser.objects.count(), 0)


class AppLoginTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.customer = make_customer()
        self.client = APIClient()

    def test_unregistered_phone_404(self):
        response = self.client.post(
            LOGIN_URL, {"phone_number": "237670999999", "pin": "1234"}, format="json"
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["error"], "account_not_found")

    def test_correct_pin_returns_token(self):
        response = self.client.post(
            LOGIN_URL, {"phone_number": "237670123456", "pin": "1234"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        token = response.data["token"]
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        pending = client.get(PENDING_URL)
        self.assertEqual(pending.status_code, 200)

    def test_wrong_pin_decrements_remaining(self):
        response = self.client.post(
            LOGIN_URL, {"phone_number": "237670123456", "pin": "9999"}, format="json"
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.data["remaining_attempts"], 2)

    def test_three_wrong_pins_lock_account(self):
        for _ in range(3):
            self.client.post(
                LOGIN_URL, {"phone_number": "237670123456", "pin": "9999"}, format="json"
            )
        response = self.client.post(
            LOGIN_URL, {"phone_number": "237670123456", "pin": "1234"}, format="json"
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["error"], "account_locked")

class ApproveDeclineTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.merchant = make_merchant()
        _, self.api_key = make_api_key(self.merchant)
        self.customer = make_customer(balance=10000, with_crypto=True)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {app_jwt(self.customer)}")

    def _make_txn(self, amount="5000.00", minutes=15, status="pending", **kwargs):
        from apps.payments.utils import generate_transaction_reference
        return Transaction.objects.create(
            reference=generate_transaction_reference(),
            merchant=self.merchant,
            api_key=self.api_key,
            customer_user=self.customer,
            amount=amount,
            currency=kwargs.pop("currency", "XAF"),
            phone_number=self.customer.phone_number,
            network="MTN",
            payment_method=kwargs.pop("payment_method", "mtn_momo"),
            status=status,
            expires_at=timezone.now() + timezone.timedelta(minutes=minutes),
            **kwargs,
        )

    @patch("apps.mobile_app.views.push_transaction_update")
    @patch("apps.mobile_app.views.fire_webhook.delay")
    def test_approve_debits_wallet(self, mock_webhook, mock_push):
        txn = self._make_txn()
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(f"/api/v1/app/payments/{txn.reference}/approve/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "success")
        self.customer.wallet.refresh_from_db()
        self.assertEqual(float(self.customer.wallet.balance), 5000.0)
        mock_webhook.assert_called_once_with(txn.id, "payment.success")
        mock_push.assert_called_once()

    @patch("apps.mobile_app.views.push_transaction_update")
    @patch("apps.mobile_app.views.fire_webhook.delay")
    def test_approve_insufficient_funds(self, mock_webhook, mock_push):
        txn = self._make_txn(amount="99999.00")
        response = self.client.post(f"/api/v1/app/payments/{txn.reference}/approve/")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "PAY_CAM_4002")
        self.customer.wallet.refresh_from_db()
        self.assertEqual(float(self.customer.wallet.balance), 10000.0)

    @patch("apps.mobile_app.views.push_transaction_update")
    @patch("apps.mobile_app.views.fire_webhook.delay")
    def test_double_approve_rejected(self, mock_webhook, mock_push):
        txn = self._make_txn()
        with self.captureOnCommitCallbacks(execute=True):
            first = self.client.post(f"/api/v1/app/payments/{txn.reference}/approve/")
        self.assertEqual(first.status_code, 200)
        second = self.client.post(f"/api/v1/app/payments/{txn.reference}/approve/")
        self.assertEqual(second.status_code, 400)
        self.customer.wallet.refresh_from_db()
        self.assertEqual(float(self.customer.wallet.balance), 5000.0)  # debited once

    @patch("apps.mobile_app.views.push_transaction_update")
    @patch("apps.mobile_app.views.fire_webhook.delay")
    def test_approve_expired_marks_expired(self, mock_webhook, mock_push):
        txn = self._make_txn(minutes=-1)
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(f"/api/v1/app/payments/{txn.reference}/approve/")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "PAY_CAM_4007")
        txn.refresh_from_db()
        self.assertEqual(txn.status, "expired")
        mock_webhook.assert_called_once_with(txn.id, "payment.expired")

    @patch("apps.mobile_app.views.push_transaction_update")
    @patch("apps.mobile_app.views.fire_webhook.delay")
    def test_decline_marks_failed(self, mock_webhook, mock_push):
        txn = self._make_txn()
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(f"/api/v1/app/payments/{txn.reference}/decline/")
        self.assertEqual(response.status_code, 200)
        txn.refresh_from_db()
        self.assertEqual(txn.status, "failed")
        self.customer.wallet.refresh_from_db()
        self.assertEqual(float(self.customer.wallet.balance), 10000.0)
        mock_webhook.assert_called_once_with(txn.id, "payment.failed")

    def test_other_customers_transaction_not_found(self):
        other = make_customer(phone_number="237671000001")
        txn = self._make_txn()
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {app_jwt(other)}")
        response = client.post(f"/api/v1/app/payments/{txn.reference}/approve/")
        self.assertEqual(response.status_code, 404)

    def test_pending_lists_only_unexpired(self):
        live = self._make_txn()
        self._make_txn(minutes=-5)  # expired — must not appear
        response = self.client.get(PENDING_URL)
        self.assertEqual(response.status_code, 200)
        references = [item["reference"] for item in response.data["pending"]]
        self.assertEqual(references, [live.reference])

    @patch("apps.crypto.tasks.monitor_crypto_payment.delay")
    def test_crypto_approve_debits_crypto_wallet(self, mock_monitor):
        wallet = CryptoWallet.objects.get(user=self.customer, currency="ETH")
        wallet.balance = "0.5"
        wallet.save(update_fields=["balance"])
        txn = self._make_txn(
            amount="0.00200000", currency="ETH", payment_method="crypto_eth"
        )
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(f"/api/v1/app/payments/{txn.reference}/approve/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["crypto_tx_hash"].startswith("0x"))
        wallet.refresh_from_db()
        self.assertEqual(float(wallet.balance), 0.498)
        mock_monitor.assert_called_once_with(txn.id)

    def test_payment_lookup_uses_4013_for_missing(self):
        response = self.client.get("/api/v1/app/payments/lookup/TXN_NOPE/")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["code"], "PAY_CAM_4013")


class WalletAndHistoryTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.merchant = make_merchant()
        _, self.api_key = make_api_key(self.merchant)
        self.customer = make_customer(balance=7500, with_crypto=True)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {app_jwt(self.customer)}")

    def test_wallet_returns_balances(self):
        response = self.client.get("/api/v1/app/wallet/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["wallet"]["balance"], "7500.00")
        self.assertEqual(len(response.data["crypto_wallets"]), 3)

    def test_transactions_lists_customer_history(self):
        from apps.payments.utils import generate_transaction_reference
        txn = Transaction.objects.create(
            reference=generate_transaction_reference(),
            merchant=self.merchant,
            api_key=self.api_key,
            customer_user=self.customer,
            amount="1000.00",
            currency="XAF",
            phone_number=self.customer.phone_number,
            network="MTN",
            payment_method="mtn_momo",
            status="success",
            description="Test order",
            expires_at=timezone.now(),
        )
        response = self.client.get("/api/v1/app/transactions/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["transactions"][0]["reference"], txn.reference)
        self.assertEqual(response.data["transactions"][0]["description"], "Test order")


class ChangePinTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.customer = make_customer(balance=1000)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {app_jwt(self.customer)}")

    @patch("apps.mobile_app.views.send_email_otp", return_value=True)
    def test_wrong_old_pin_rejected(self, mock_send):
        response = self.client.post(
            "/api/v1/app/change-pin/request/", {"old_pin": "0000"}, format="json"
        )
        self.assertEqual(response.status_code, 401)
        mock_send.assert_not_called()

    @patch("apps.mobile_app.views.generate_otp", return_value="654321")
    @patch("apps.mobile_app.views.send_email_otp", return_value=True)
    def test_full_change_pin_flow(self, mock_send, mock_otp):
        request_resp = self.client.post(
            "/api/v1/app/change-pin/request/", {"old_pin": "1234"}, format="json"
        )
        self.assertEqual(request_resp.status_code, 200)

        confirm_resp = self.client.post(
            "/api/v1/app/change-pin/confirm/",
            {"otp": "654321", "new_pin": "9999"},
            format="json",
        )
        self.assertEqual(confirm_resp.status_code, 200)

        self.customer.refresh_from_db()
        from .utils import verify_pin
        self.assertTrue(verify_pin("9999", self.customer.pin_hash))
        self.assertFalse(verify_pin("1234", self.customer.pin_hash))

    @patch("apps.mobile_app.views.generate_otp", return_value="654321")
    @patch("apps.mobile_app.views.send_email_otp", return_value=True)
    def test_wrong_otp_does_not_change_pin(self, mock_send, mock_otp):
        self.client.post("/api/v1/app/change-pin/request/", {"old_pin": "1234"}, format="json")
        response = self.client.post(
            "/api/v1/app/change-pin/confirm/",
            {"otp": "000000", "new_pin": "9999"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)
        self.customer.refresh_from_db()
        from .utils import verify_pin
        self.assertTrue(verify_pin("1234", self.customer.pin_hash))
