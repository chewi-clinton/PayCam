from rest_framework import serializers


class CardPaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    currency = serializers.ChoiceField(
        choices=["XAF", "USD", "EUR", "GBP", "NGN", "GHS", "KES"]
    )
    card_number = serializers.CharField(max_length=25)  # allows spaces/dashes pre-normalize
    expiry_month = serializers.IntegerField(min_value=1, max_value=12)
    expiry_year = serializers.IntegerField(min_value=2000, max_value=2100)
    cvv = serializers.CharField(max_length=4)  # validated strictly in the view (3 digits only)
    description = serializers.CharField(max_length=255, required=False)
    external_reference = serializers.CharField(max_length=100, required=False)
    webhook_url = serializers.URLField(required=False)
    redirect_url = serializers.URLField(required=False)
    idempotency_key = serializers.CharField(max_length=100, required=False)
