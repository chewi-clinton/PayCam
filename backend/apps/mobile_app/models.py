from django.db import models


class MobileAppUser(models.Model):
    NETWORK_CHOICES = [
        ("MTN", "MTN"),
        ("ORANGE", "ORANGE"),
    ]

    phone_number = models.CharField(max_length=20, unique=True, null=False)
    full_name = models.CharField(max_length=150)
    pin_hash = models.CharField(max_length=255)
    network = models.CharField(max_length=20, choices=NETWORK_CHOICES, null=False)
    telegram_chat_id = models.CharField(max_length=50, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    fcm_token = models.CharField(max_length=500, null=True, blank=True)
    fcm_token_updated_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "mobile_app_users"

    def __str__(self):
        return self.phone_number

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False


class Wallet(models.Model):
    user = models.OneToOneField(
        MobileAppUser,
        on_delete=models.CASCADE,
        related_name="wallet",
    )
    network = models.CharField(max_length=20, null=False)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "wallets"

    def __str__(self):
        return f"{self.user.phone_number} - {self.balance} XAF"


class CryptoWallet(models.Model):
    CURRENCY_CHOICES = [
        ("BTC", "BTC"),
        ("ETH", "ETH"),
        ("USDT", "USDT"),
    ]

    NETWORK_CHOICES = [
        ("bitcoin_testnet", "bitcoin_testnet"),
        ("sepolia", "sepolia"),
    ]

    user = models.ForeignKey(
        MobileAppUser,
        on_delete=models.CASCADE,
        related_name="crypto_wallets",
    )
    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, null=False)
    testnet_address = models.CharField(max_length=100, unique=True, null=False)
    balance = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    network = models.CharField(max_length=20, choices=NETWORK_CHOICES, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "crypto_wallets"

    def __str__(self):
        return f"{self.currency}: {self.testnet_address}"