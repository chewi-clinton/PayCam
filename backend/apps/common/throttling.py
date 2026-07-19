"""
Rate limiting per the PayCam spec (section 8.5):

    POST /payments/initiate        60/min  per API key
    GET  /payments/{ref}, list    120/min  per API key
    login endpoints                10/min  per IP

Counters live in the default Django cache (Redis). Views opt in via
throttle_classes; nothing is throttled globally.
"""
from rest_framework.throttling import SimpleRateThrottle


class BaseAPIKeyThrottle(SimpleRateThrottle):
    """Rate-limits per API key (request.auth is the APIKey row)."""

    def get_cache_key(self, request, view):
        api_key = getattr(request, "auth", None)
        if api_key is None or not hasattr(api_key, "id"):
            return None  # unauthenticated requests are rejected by auth anyway
        return self.cache_format % {"scope": self.scope, "ident": api_key.id}


class PaymentInitiateThrottle(BaseAPIKeyThrottle):
    scope = "payments_initiate"


class PaymentReadThrottle(BaseAPIKeyThrottle):
    scope = "payments_read"


class LoginRateThrottle(SimpleRateThrottle):
    """Rate-limits login attempts per client IP."""

    scope = "login"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}
