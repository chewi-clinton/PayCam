import bcrypt
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import APIKey


class APIKeyAuthentication(BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith(f"{self.keyword} "):
            return None
        raw_key = auth_header.split(" ", 1)[1].strip()
        if not raw_key.startswith("sk_live_"):
            return None
        prefix = raw_key[:14]
        candidates = APIKey.objects.filter(prefix=prefix, is_active=True)
        matched_key = None
        for candidate in candidates:
            if bcrypt.checkpw(raw_key.encode(), candidate.key_hash.encode()):
                matched_key = candidate
                break
        if matched_key is None:
            raise AuthenticationFailed("Invalid or expired API key.")
        matched_key.last_used_at = timezone.now()
        matched_key.save(update_fields=["last_used_at"])
        return (matched_key.merchant, matched_key)