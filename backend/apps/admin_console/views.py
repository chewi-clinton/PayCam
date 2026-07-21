from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.common.permissions import IsAdminRole
from apps.paycam_auth.models import User, APIKey
from apps.payments.models import Transaction
from apps.payments.serializers import TransactionSerializer
from .serializers import MerchantListSerializer, MerchantDetailSerializer


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
