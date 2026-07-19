from rest_framework import serializers
from .models import User, APIKey


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name"]

    def create(self, validated_data):
        # BUGFIX: ModelSerializer's default .create() calls
        # User.objects.create(**validated_data), which assigns the
        # password field directly as plaintext -- it has no idea
        # 'password' needs hashing. We must go through
        # UserManager.create_user(), which calls set_password()
        # internally (see paycam_auth/models.py UserManager).
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "role", "is_active", "totp_enabled", "created_at"]


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    totp_code = serializers.CharField(max_length=6, required=False, allow_blank=True)


class TOTPSetupSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)


class TOTPVerifySerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)


class APIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = APIKey
        fields = ["id", "prefix", "environment", "is_active", "last_used_at", "created_at"]
        read_only_fields = ["id", "prefix", "created_at"]


class APIKeyCreateSerializer(serializers.Serializer):
    totp_code = serializers.CharField(max_length=6)

class EmailVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)