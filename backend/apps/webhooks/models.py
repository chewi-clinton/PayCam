from django.db import models
from apps.payments.models import Transaction


class WebhookLog(models.Model):
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE)
    attempt_number = models.IntegerField(null=False)
    url = models.CharField(max_length=500, null=False)
    http_status = models.IntegerField(null=True, blank=True)
    response_body = models.TextField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    next_retry_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "webhook_logs"

    def __str__(self):
        return f"Webhook {self.attempt_number} for {self.transaction.reference}"