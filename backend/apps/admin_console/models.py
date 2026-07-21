import secrets
from django.db import models
from django.utils import timezone
from apps.paycam_auth.models import User


def generate_invite_token():
    return secrets.token_urlsafe(32)


def default_invite_expiry():
    return timezone.now() + timezone.timedelta(hours=24)


class AdminInvite(models.Model):
    email = models.EmailField()
    token = models.CharField(max_length=64, unique=True, default=generate_invite_token)
    invited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="sent_invites")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_invite_expiry)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "admin_invites"

    def __str__(self):
        return f"invite:{self.email}"

    @property
    def is_valid(self):
        return self.accepted_at is None and self.expires_at > timezone.now()
