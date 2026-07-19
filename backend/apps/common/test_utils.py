"""
Shared helpers for the test suite.

Redis-backed helpers keep a module-level `_redis_client` singleton; the
mixin below swaps each one for a shared fakeredis instance so tests can
run without a real Redis, then restores the singletons afterwards.
"""
import fakeredis
import jwt
from django.conf import settings
from django.utils import timezone

from apps.paycam_auth.models import User, APIKey
from apps.paycam_auth.utils import generate_api_key, hash_api_key, generate_webhook_secret
from apps.mobile_app.models import MobileAppUser, Wallet, CryptoWallet
from apps.mobile_app.utils import hash_pin

_REDIS_MODULES = (
    "apps.mobile_app.utils",
    "apps.payments.redis_utils",
    "apps.sandbox.redis_utils",
    "apps.paycam_auth.utils",
)


class FakeRedisMixin:
    """Points every get_redis_client() singleton at one fakeredis server."""

    def setUp(self):
        super().setUp()
        self.fake_redis = fakeredis.FakeRedis(decode_responses=True)
        self._redis_originals = {}
        import importlib
        for path in _REDIS_MODULES:
            module = importlib.import_module(path)
            self._redis_originals[path] = module._redis_client
            module._redis_client = self.fake_redis

    def tearDown(self):
        import importlib
        for path, original in self._redis_originals.items():
            importlib.import_module(path)._redis_client = original
        super().tearDown()


def make_merchant(email="merchant@example.com", password="Str0ngPass!123"):
    return User.objects.create_user(
        email=email,
        password=password,
        first_name="Test",
        last_name="Merchant",
        is_active=True,
    )


def make_api_key(merchant):
    """Creates an APIKey row; returns (raw_key, api_key_instance)."""
    raw_key, prefix = generate_api_key()
    api_key = APIKey.objects.create(
        merchant=merchant,
        key_hash=hash_api_key(raw_key),
        prefix=prefix,
        webhook_secret=generate_webhook_secret(),
        environment="live",
    )
    return raw_key, api_key


def make_customer(phone_number="237670123456", pin="1234", balance=0, with_crypto=False):
    user = MobileAppUser.objects.create(
        phone_number=phone_number,
        full_name="Jean Pierre",
        pin_hash=hash_pin(pin),
        network="MTN",
        email="jean@example.com",
    )
    Wallet.objects.create(user=user, network=user.network, balance=balance)
    if with_crypto:
        for currency, network, address in (
            ("BTC", "bitcoin_testnet", f"tb1q{user.id:039d}"),
            ("ETH", "sepolia", f"0xeth{user.id:037d}"),
            ("USDT", "sepolia", f"0xusdt{user.id:036d}"),
        ):
            CryptoWallet.objects.create(
                user=user, currency=currency, testnet_address=address,
                network=network, balance=0,
            )
    return user


def app_jwt(user, minutes=5):
    now = timezone.now()
    payload = {
        "user_id": user.id,
        "type": "mobile_app",
        "iat": now,
        "exp": now + timezone.timedelta(minutes=minutes),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
