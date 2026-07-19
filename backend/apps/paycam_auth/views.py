import secrets
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.conf import settings
from apps.common.throttling import LoginRateThrottle
from .models import User, APIKey
from .serializers import (
    UserRegisterSerializer,
    UserSerializer,
    LoginSerializer,
    TOTPSetupSerializer,
    TOTPVerifySerializer,
    APIKeySerializer,
    APIKeyCreateSerializer,
    EmailVerifySerializer,
)
from .utils import (
    generate_jwt,
    decode_jwt,
    generate_totp_secret,
    get_totp_uri,
    verify_totp,
    encrypt_totp_secret,
    decrypt_totp_secret,
    generate_api_key,
    hash_api_key,
    generate_webhook_secret,
    generate_otp,
    store_email_otp,
    verify_email_otp,
    send_email_otp,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        otp = generate_otp()
        store_email_otp(user.id, otp, ttl_minutes=10)
        email_sent = send_email_otp(user.email, otp)
        if not email_sent:
            user.delete()
            return Response(
                {
                    "error": "email_delivery_failed",
                    "code": "PAY_CAM_5000",
                    "message": "Failed to send verification email. Please try again.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(
            {
                "message": "Account created. Please check your email for verification code.",
                "user_id": user.id,
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class EmailVerifyView(generics.GenericAPIView):
    serializer_class = EmailVerifySerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "invalid_request", "code": "PAY_CAM_4000", "message": "Invalid email."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user.is_active:
            return Response(
                {"error": "already_verified", "code": "PAY_CAM_4000", "message": "Email already verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if verify_email_otp(user.id, otp):
            user.is_active = True
            user.save(update_fields=["is_active"])
            return Response(
                {"message": "Email verified successfully. You can now log in."},
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"error": "invalid_otp", "code": "PAY_CAM_4000", "message": "Invalid or expired verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]
        totp_code = serializer.validated_data.get("totp_code", "")
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "unauthorized", "code": "PAY_CAM_4011", "message": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.check_password(password):
            return Response(
                {"error": "unauthorized", "code": "PAY_CAM_4011", "message": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            return Response(
                {"error": "unauthorized", "code": "PAY_CAM_4011", "message": "Account not verified. Please verify your email."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if user.role == "admin" and not user.totp_enabled:
            return Response(
                {
                    "error": "unauthorized",
                    "code": "PAY_CAM_4011",
                    "message": "Admin accounts require 2FA to be enabled before login.",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if user.totp_enabled:
            if not totp_code:
                return Response(
                    {"error": "unauthorized", "code": "PAY_CAM_4011", "message": "2FA code required."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            secret = decrypt_totp_secret(user.totp_secret)
            if not verify_totp(secret, totp_code):
                return Response(
                    {"error": "unauthorized", "code": "PAY_CAM_4011", "message": "Invalid 2FA code."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        token = generate_jwt(user.id, user.token_version)
        return Response(
            {
                "access_token": token,
                "token_type": "Bearer",
                "expires_in": settings.JWT_ACCESS_EXPIRE_MINUTES * 60,
            },
            status=status.HTTP_200_OK,
        )


class TOTPSetupView(generics.GenericAPIView):
    serializer_class = TOTPSetupSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["password"]):
            return Response(
                {"error": "unauthorized", "code": "PAY_CAM_4011", "message": "Invalid password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if user.totp_enabled:
            return Response(
                {"error": "invalid_request", "code": "PAY_CAM_4000", "message": "2FA already enabled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        secret = generate_totp_secret()
        user.totp_secret = encrypt_totp_secret(secret)
        user.save(update_fields=["totp_secret"])
        uri = get_totp_uri(secret, user.email)
        return Response(
            {
                "secret": secret,
                "uri": uri,
                "message": "Scan this QR code with Google Authenticator, then verify.",
            },
            status=status.HTTP_200_OK,
        )


class TOTPVerifyView(generics.GenericAPIView):
    serializer_class = TOTPVerifySerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if user.totp_enabled:
            return Response(
                {"error": "invalid_request", "code": "PAY_CAM_4000", "message": "2FA already enabled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not user.totp_secret:
            return Response(
                {"error": "invalid_request", "code": "PAY_CAM_4000", "message": "Setup 2FA first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        secret = decrypt_totp_secret(user.totp_secret)
        if not verify_totp(secret, serializer.validated_data["code"]):
            return Response(
                {"error": "unauthorized", "code": "PAY_CAM_4011", "message": "Invalid 2FA code."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        user.totp_enabled = True
        user.save(update_fields=["totp_enabled"])
        return Response(
            {"message": "2FA enabled successfully."},
            status=status.HTTP_200_OK,
        )


class APIKeyListView(generics.ListAPIView):
    serializer_class = APIKeySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return APIKey.objects.filter(merchant=self.request.user)


class APIKeyCreateView(generics.GenericAPIView):
    serializer_class = APIKeyCreateSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.totp_enabled:
            return Response(
                {"error": "unauthorized", "code": "PAY_CAM_4011", "message": "Enable 2FA before generating API keys."},
                status=status.HTTP_403_FORBIDDEN,
            )
        secret = decrypt_totp_secret(user.totp_secret)
        if not verify_totp(secret, serializer.validated_data["totp_code"]):
            return Response(
                {"error": "unauthorized", "code": "PAY_CAM_4011", "message": "Invalid 2FA code."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        raw_key, prefix = generate_api_key()
        key_hash = hash_api_key(raw_key)
        webhook_secret = generate_webhook_secret()
        api_key = APIKey.objects.create(
            merchant=user,
            key_hash=key_hash,
            prefix=prefix,
            webhook_secret=webhook_secret,
            environment="live",
        )
        return Response(
            {
                "api_key": raw_key,
                "webhook_secret": webhook_secret,
                "key": APIKeySerializer(api_key).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LogoutView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        user.revoke_all_tokens()
        return Response(
            {"message": "Logged out. All tokens revoked."},
            status=status.HTTP_200_OK,
        )


class ProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
