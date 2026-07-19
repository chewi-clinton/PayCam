from rest_framework import authentication, exceptions
from .models import User
from .utils import decode_jwt


class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ")[1]
        payload = decode_jwt(token)

        if not payload:
            raise exceptions.AuthenticationFailed("Invalid or expired token.")

        try:
            user = User.objects.get(id=payload["user_id"])
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed("User not found.")

        if user.token_version != payload["token_version"]:
            raise exceptions.AuthenticationFailed("Token revoked.")

        return (user, None)