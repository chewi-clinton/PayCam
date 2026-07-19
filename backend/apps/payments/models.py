from django.db import models
from apps.paycam_auth.models import User, APIKey
from apps.mobile_app.models import MobileAppUser


class Transaction(models.Model):
    STATUS_CHOICES = [
        ("pending", "pending"),
        ("success", "success"),
        ("failed", "failed"),
        ("expired", "expired"),
    ]

    PAYMENT_METHODS = [
        ("mtn_momo", "mtn_momo"),
        ("orange_money", "orange_money"),
        ("card", "card"),
        ("crypto_btc", "crypto_btc"),
        ("crypto_eth", "crypto_eth"),
        ("crypto_usdt", "crypto_usdt"),
    ]

    CURRENCIES = [
        ("XAF", "XAF"),
        ("USD", "USD"),
        ("EUR", "EUR"),
        ("GBP", "GBP"),
        ("NGN", "NGN"),
        ("GHS", "GHS"),
        ("KES", "KES"),
        ("ETH", "ETH"),
        ("BTC", "BTC"),
        ("USDT", "USDT"),
    ]

    reference = models.CharField(max_length=40, unique=True)
    merchant = models.ForeignKey(User, on_delete=models.CASCADE)
    api_key = models.ForeignKey(APIKey, on_delete=models.CASCADE)
    customer_user = models.ForeignKey(
        MobileAppUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    currency = models.CharField(max_length=10, choices=CURRENCIES)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    network = models.CharField(max_length=20, null=True, blank=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    description = models.CharField(max_length=255, null=True, blank=True)
    external_reference = models.CharField(max_length=100, null=True, blank=True)
    idempotency_key = models.CharField(max_length=100, null=True, blank=True)
    crypto_wallet_address = models.CharField(max_length=100, null=True, blank=True)
    crypto_tx_hash = models.CharField(max_length=100, null=True, blank=True)
    crypto_confirm_start_block = models.BigIntegerField(null=True, blank=True)
    webhook_url = models.CharField(max_length=500, null=True, blank=True)
    redirect_url = models.CharField(max_length=500, null=True, blank=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "transactions"

    def __str__(self):
        return self.reference


class ExchangeRate(models.Model):
    from_currency = models.CharField(max_length=10, null=False)
    to_currency = models.CharField(max_length=10, null=False)
    rate = models.DecimalField(max_digits=20, decimal_places=10, null=False)
    fetched_at = models.DateTimeField(auto_now_add=True)
    source = models.CharField(max_length=100, null=False)

    class Meta:
        db_table = "exchange_rates"
        indexes = [
            models.Index(fields=["from_currency", "to_currency", "-fetched_at"]),
        ]

    def __str__(self):
        return f"{self.from_currency}/{self.to_currency}: {self.rate}"