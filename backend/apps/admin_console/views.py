from django.conf import settings
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.common.permissions import IsAdminRole
from apps.common.throttling import AdminInviteAcceptRateThrottle
from apps.paycam_auth.models import User, APIKey
from apps.paycam_auth.utils import generate_jwt, generate_totp_secret, get_totp_uri, encrypt_totp_secret
from apps.payments.models import Transaction
from apps.payments.serializers import TransactionSerializer
from .models import AdminInvite
from .serializers import (
    MerchantListSerializer,
    MerchantDetailSerializer,
    AdminInviteCreateSerializer,
    AdminInviteAcceptSerializer,
)
from .utils import send_admin_invite_email


@extend_schema(tags=["Admin"], summary="List merchants")
class MerchantListView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = MerchantListSerializer

    def get_queryset(self):
        queryset = User.objects.filter(role="merchant").annotate(
            api_key_count=Count("api_keys")
        ).order_by("-created_at")
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(business_name__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )
        return queryset


@extend_schema(tags=["Admin"], summary="Retrieve a merchant")
class MerchantDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = MerchantDetailSerializer
    queryset = User.objects.filter(role="merchant")


@extend_schema(tags=["Admin"], summary="List a merchant's transactions")
class MerchantTransactionsView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(merchant_id=self.kwargs["pk"]).order_by("-created_at")


@extend_schema(tags=["Admin"], summary="Suspend a merchant")
class MerchantSuspendView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        merchant = get_object_or_404(User, pk=pk, role="merchant")
        merchant.is_suspended = True
        merchant.save(update_fields=["is_suspended"])
        return Response(MerchantDetailSerializer(merchant).data, status=status.HTTP_200_OK)


@extend_schema(tags=["Admin"], summary="Reactivate a suspended merchant")
class MerchantReactivateView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        merchant = get_object_or_404(User, pk=pk, role="merchant")
        merchant.is_suspended = False
        merchant.save(update_fields=["is_suspended"])
        return Response(MerchantDetailSerializer(merchant).data, status=status.HTTP_200_OK)


@extend_schema(tags=["Admin"], summary="Revoke a merchant's API key")
class APIKeyRevokeView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        api_key = get_object_or_404(APIKey, pk=pk)
        api_key.is_active = False
        api_key.save(update_fields=["is_active"])
        return Response({"message": "API key revoked."}, status=status.HTTP_200_OK)


@extend_schema(tags=["Admin"], summary="Invite a new admin")
class AdminInviteCreateView(generics.GenericAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = AdminInviteCreateSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "invalid_request", "code": "PAY_CAM_4000", "message": "An account with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invite = AdminInvite.objects.create(email=email, invited_by=request.user)
        invite_link = f"{settings.ADMIN_FRONTEND_URL}/accept-invite?token={invite.token}"
        send_admin_invite_email(email, invite_link)
        return Response({"message": "Invite sent."}, status=status.HTTP_201_CREATED)


@extend_schema(tags=["Admin"], summary="Accept an admin invite")
class AdminInviteAcceptView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = AdminInviteAcceptSerializer
    throttle_classes = [AdminInviteAcceptRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]
        password = serializer.validated_data["password"]

        try:
            invite = AdminInvite.objects.get(token=token)
        except AdminInvite.DoesNotExist:
            return Response(
                {"error": "invalid_request", "code": "PAY_CAM_4000", "message": "Invalid or expired invite."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not invite.is_valid:
            return Response(
                {"error": "invalid_request", "code": "PAY_CAM_4000", "message": "Invalid or expired invite."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if User.objects.filter(email=invite.email).exists():
            return Response(
                {"error": "invalid_request", "code": "PAY_CAM_4000", "message": "An account with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        secret = generate_totp_secret()
        user = User.objects.create_user(
            email=invite.email,
            password=password,
            first_name="PayCam",
            last_name="Admin",
            role="admin",
            is_active=True,
        )
        user.totp_secret = encrypt_totp_secret(secret)
        user.totp_enabled = True
        user.save(update_fields=["totp_secret", "totp_enabled"])

        invite.accepted_at = timezone.now()
        invite.save(update_fields=["accepted_at"])

        token_jwt = generate_jwt(user.id, user.token_version)
        return Response(
            {
                "access_token": token_jwt,
                "token_type": "Bearer",
                "expires_in": settings.JWT_ACCESS_EXPIRE_MINUTES * 60,
                "totp_secret": secret,
                "totp_uri": get_totp_uri(secret, user.email),
            },
            status=status.HTTP_201_CREATED,
        )
