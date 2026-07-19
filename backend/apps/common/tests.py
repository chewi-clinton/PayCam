from unittest.mock import patch, MagicMock

from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from apps.common.test_utils import FakeRedisMixin
from .throttling import PaymentInitiateThrottle, LoginRateThrottle

HEALTH_URL = "/api/v1/health/"
APP_LOGIN_URL = "/api/v1/app/login/"


class HealthEndpointTests(TestCase):
    @patch("apps.common.views.redis.from_url")
    def test_healthy(self, mock_from_url):
        mock_from_url.return_value = MagicMock(ping=MagicMock(return_value=True))
        response = APIClient().get(HEALTH_URL)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "ok")
        self.assertEqual(response.data["database"], "connected")
        self.assertEqual(response.data["redis"], "connected")

    @patch("apps.common.views.redis.from_url", side_effect=ConnectionError)
    def test_degraded_when_redis_down(self, mock_from_url):
        response = APIClient().get(HEALTH_URL)
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["status"], "degraded")
        self.assertEqual(response.data["redis"], "disconnected")

    def test_no_auth_required(self):
        response = APIClient().get(HEALTH_URL)
        self.assertIn(response.status_code, (200, 503))


class ThrottleTests(FakeRedisMixin, TestCase):
    def tearDown(self):
        cache.clear()  # don't leak throttle counters into other tests
        super().tearDown()

    def test_api_key_throttle_keys_on_api_key_not_ip(self):
        throttle = PaymentInitiateThrottle()
        request = MagicMock()
        request.auth = MagicMock(id=42)
        key = throttle.get_cache_key(request, view=None)
        self.assertIn("42", key)
        self.assertIn("payments_initiate", key)

    def test_api_key_throttle_skips_unauthenticated(self):
        throttle = PaymentInitiateThrottle()
        request = MagicMock()
        request.auth = None
        self.assertIsNone(throttle.get_cache_key(request, view=None))

    @patch.object(LoginRateThrottle, "rate", "2/min", create=True)
    def test_login_throttle_returns_429_over_limit(self):
        client = APIClient()
        payload = {"phone_number": "237670123456", "pin": "1234"}
        for _ in range(2):
            response = client.post(APP_LOGIN_URL, payload, format="json")
            self.assertNotEqual(response.status_code, 429)
        response = client.post(APP_LOGIN_URL, payload, format="json")
        self.assertEqual(response.status_code, 429)
