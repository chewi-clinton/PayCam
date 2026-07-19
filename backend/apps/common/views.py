import redis
from django.conf import settings
from django.db import connection
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema


@extend_schema(
    tags=["Health"],
    summary="Health check",
    description="Reports API, database, and Redis status. No authentication required.",
    responses={200: {"description": "Service healthy"}, 503: {"description": "A dependency is down"}},
)
class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        db_status = "connected"
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception:
            db_status = "disconnected"

        redis_status = "connected"
        try:
            redis.from_url(settings.REDIS_URL, socket_connect_timeout=2).ping()
        except Exception:
            redis_status = "disconnected"

        healthy = db_status == "connected" and redis_status == "connected"
        return Response(
            {
                "status": "ok" if healthy else "degraded",
                "version": "3.0.0",
                "database": db_status,
                "redis": redis_status,
            },
            status=status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
        )
