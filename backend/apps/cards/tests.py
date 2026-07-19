from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from apps.common.test_utils import FakeRedisMixin, make_merchant, make_api_key
from apps.payments.models import Transaction, ExchangeRate
from .validators import luhn_check, is_valid_cvv, is_expiry_valid, normalize_card_number

CARD_URL = "/api/v1/payments/card/initiate/"


class ValidatorTests(TestCase):
    def test_luhn_accepts_valid_cards(self):
        for number in ("4242424242424242", "5555555555554444", "4000000000000002"):
            self.assertTrue(luhn_check(number))

    def test_luhn_rejects_invalid(self):
        self.assertFalse(luhn_check("4242424242424241"))
        self.assertFalse(luhn_check("1234567890123456"))

    def test_normalize_strips_spaces_and_dashes(self):
        self.assertEqual(normalize_card_number("4242 4242-4242 4242"), "4242424242424242")

    def test_cvv_three_digits_only(self):
        self.assertTrue(is_valid_cvv("123"))
        self.assertFalse(is_valid_cvv("12"))
        self.assertFalse(is_valid_cvv("1234"))
        self.assertFalse(is_valid_cvv("12a"))

    def test_expiry(self):
        self.assertTrue(is_expiry_valid(12, 2030, 2026, 7))
        self.assertFalse(is_expiry_valid(6, 2026, 2026, 7))  # last month
        self.assertFalse(is_expiry_valid(13, 2030, 2026, 7))  # bad month


@patch("apps.cards.views.fire_webhook.delay")
class CardInitiateTests(FakeRedisMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.merchant = make_merchant()
        self.raw_key, self.api_key = make_api_key(self.merchant)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.raw_key}")

    def _payload(self, **overrides):
        payload = {
            "amount": "50.00",
            "currency": "XAF",
            "card_number": "4242 4242 4242 4242",
            "expiry_month": 12,
            "expiry_year": 2030,
            "cvv": "123",
            "description": "Card order",
        }
        payload.update(overrides)
        return payload

    def test_success_card(self, mock_webhook):
        response = self.client.post(CARD_URL, self._payload(), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["card_network"], "visa")
        txn = Transaction.objects.get(reference=response.data["reference"])
        self.assertEqual(txn.status, "success")
        self.assertEqual(txn.description, "Card order")
        mock_webhook.assert_called_once_with(txn.id, "payment.success")

    def test_declined_card(self, mock_webhook):
        response = self.client.post(
            CARD_URL, self._payload(card_number="4000 0000 0000 0002"), format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "PAY_CAM_4003")
        txn = Transaction.objects.get(reference=response.data["reference"])
        self.assertEqual(txn.status, "failed")
        mock_webhook.assert_called_once_with(txn.id, "payment.failed")

    def test_insufficient_funds_card(self, mock_webhook):
        response = self.client.post(
            CARD_URL, self._payload(card_number="4000 0000 0000 9995"), format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "PAY_CAM_4002")

    def test_luhn_failure_rejected_without_transaction(self, mock_webhook):
        response = self.client.post(
            CARD_URL, self._payload(card_number="4242 4242 4242 4241"), format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "PAY_CAM_4008")
        self.assertEqual(Transaction.objects.count(), 0)
        mock_webhook.assert_not_called()

    def test_invalid_cvv_rejected(self, mock_webhook):
        response = self.client.post(CARD_URL, self._payload(cvv="12"), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "PAY_CAM_4009")

    def test_expired_card_rejected(self, mock_webhook):
        response = self.client.post(
            CARD_URL, self._payload(expiry_year=2020), format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "PAY_CAM_4000")

    def test_unknown_luhn_valid_card_declined(self, mock_webhook):
        # 4111111111111111 passes Luhn but is not a PayCam test card
        response = self.client.post(
            CARD_URL, self._payload(card_number="4111 1111 1111 1111"), format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "PAY_CAM_4003")
        self.assertIn("test cards", response.data["message"])

    def test_foreign_currency_needs_exchange_rate(self, mock_webhook):
        response = self.client.post(
            CARD_URL, self._payload(currency="USD"), format="json"
        )
        self.assertEqual(response.status_code, 500)  # no rate row yet

        ExchangeRate.objects.create(
            from_currency="USD", to_currency="XAF", rate="600.0", source="test"
        )
        response = self.client.post(
            CARD_URL, self._payload(currency="USD"), format="json"
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["xaf_equivalent"], "30000.00")
