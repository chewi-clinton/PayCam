from django.test import TestCase

from .utils import sign_webhook_payload, verify_webhook_signature


class WebhookSignatureTests(TestCase):
    def test_sign_and_verify_round_trip(self):
        payload = '{"event":"payment.success","data":{"reference":"TXN_X"}}'
        secret = "whsec_live_testsecret"
        header = sign_webhook_payload(payload, secret)
        self.assertTrue(header.startswith("t="))
        self.assertIn(",v1=", header)
        self.assertTrue(verify_webhook_signature(payload, header, secret))

    def test_tampered_payload_fails(self):
        secret = "whsec_live_testsecret"
        header = sign_webhook_payload('{"amount":"5000"}', secret)
        self.assertFalse(verify_webhook_signature('{"amount":"9000"}', header, secret))

    def test_wrong_secret_fails(self):
        payload = '{"event":"payment.success"}'
        header = sign_webhook_payload(payload, "whsec_live_A")
        self.assertFalse(verify_webhook_signature(payload, header, "whsec_live_B"))

    def test_malformed_header_fails(self):
        self.assertFalse(verify_webhook_signature("{}", "", "secret"))
        self.assertFalse(verify_webhook_signature("{}", "garbage", "secret"))
