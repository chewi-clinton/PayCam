import os

import pyotp
from django.core.management.base import BaseCommand

from apps.paycam_auth.models import User
from apps.paycam_auth.utils import encrypt_totp_secret


class Command(BaseCommand):
    """One-off bootstrap: create (or update) a 2FA-enabled admin account.

    Reads ADMIN_EMAIL / ADMIN_PASSWORD from the environment rather than
    accepting them as arguments so credentials never end up in shell
    history or deploy command strings.
    """

    help = "Create or update an admin-role user with 2FA already enabled, from ADMIN_EMAIL/ADMIN_PASSWORD env vars."

    def handle(self, *args, **options):
        email = os.environ.get("ADMIN_EMAIL")
        password = os.environ.get("ADMIN_PASSWORD")
        if not email or not password:
            self.stdout.write(self.style.WARNING("ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping."))
            return

        secret = os.environ.get("ADMIN_TOTP_SECRET") or pyotp.random_base32()
        user, created = User.objects.get_or_create(
            email=email,
            defaults={"first_name": "PayCam", "last_name": "Admin", "role": "admin", "is_active": True},
        )
        user.set_password(password)
        user.role = "admin"
        user.is_active = True
        user.is_suspended = False
        user.totp_secret = encrypt_totp_secret(secret)
        user.totp_enabled = True
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} admin account: {email}"))
        self.stdout.write(self.style.SUCCESS(f"TOTP_SECRET={secret}"))
