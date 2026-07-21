from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_active", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ("merchant", "merchant"),
        ("admin", "admin"),
    ]

    email = models.EmailField(unique=True, null=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="merchant")
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=255, null=True, blank=True)
    totp_enabled = models.BooleanField(default=False)
    token_version = models.IntegerField(default=1)
    business_name = models.CharField(max_length=255, null=True, blank=True)
    logo_url = models.URLField(max_length=500, null=True, blank=True)
    default_webhook_url = models.URLField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.email

    def revoke_all_tokens(self):
        """Increment token_version to invalidate all existing JWTs."""
        self.token_version += 1
        self.save(update_fields=["token_version"])


class APIKey(models.Model):
    ENV_CHOICES = [
        ("live", "live"),
    ]

    merchant = models.ForeignKey(User, on_delete=models.CASCADE, related_name="api_keys")
    key_hash = models.CharField(max_length=255)
    prefix = models.CharField(max_length=20)
    webhook_secret = models.CharField(max_length=255)
    environment = models.CharField(max_length=10, choices=ENV_CHOICES)
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "api_keys"

    def __str__(self):
        return f"{self.prefix}..."