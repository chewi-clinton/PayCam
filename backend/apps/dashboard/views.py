from datetime import timedelta
from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import generics
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.payments.models import Transaction


@extend_schema(
    tags=["Dashboard"],
    summary="Merchant dashboard summary",
    description="Aggregate transaction stats for the authenticated merchant: gross volume, "
    "success rate, status breakdown, and a 7-day daily series for charting.",
)
class DashboardSummaryView(generics.GenericAPIView):
    def get(self, request, *args, **kwargs):
        transactions = Transaction.objects.filter(merchant=request.user)

        status_counts = transactions.aggregate(
            total=Count("id"),
            success=Count("id", filter=Q(status="success")),
            pending=Count("id", filter=Q(status="pending")),
            failed=Count("id", filter=Q(status__in=["failed", "expired"])),
        )

        gross_volume_xaf = transactions.filter(status="success", currency="XAF").aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0")
        gross_volume_xaf = gross_volume_xaf.quantize(Decimal("0.01"))

        total = status_counts["total"] or 0
        success = status_counts["success"] or 0
        success_rate = round((success / total) * 100, 1) if total else 0.0

        since = timezone.now() - timedelta(days=7)
        daily = (
            transactions.filter(created_at__gte=since, status="success", currency="XAF")
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(volume=Sum("amount"), count=Count("id"))
            .order_by("date")
        )

        return Response(
            {
                "gross_volume_xaf": str(gross_volume_xaf),
                "transaction_count": total,
                "success_count": success,
                "pending_count": status_counts["pending"] or 0,
                "failed_count": status_counts["failed"] or 0,
                "success_rate": success_rate,
                "last_7_days": [
                    {
                        "date": row["date"].isoformat(),
                        "volume": str(row["volume"].quantize(Decimal("0.01"))),
                        "count": row["count"],
                    }
                    for row in daily
                ],
            }
        )
