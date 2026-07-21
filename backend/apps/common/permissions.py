from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Grants access only to authenticated users with role="admin" (PayCam staff)."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")
