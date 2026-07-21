import json
import logging
from datetime import timedelta
from django.utils import timezone
from celery import shared_task
import httpx
from .models import WebhookLog
from .utils import sign_webhook_payload
from apps.payments.models import Transaction

logger = logging.getLogger(__name__)
MAX_RETRIES = 3
BACKOFF_MINUTES = [1, 5, 15]


@shared_task(bind=True, max_retries=3)
def fire_webhook(self, transaction_id, event_name):
    try:
        txn = Transaction.objects.select_related("api_key").get(id=transaction_id)
    except Transaction.DoesNotExist:
        logger.error(f"Transaction {transaction_id} not found for webhook")
        return

    if not txn.webhook_url:
        logger.info(f"No webhook_url for transaction {txn.reference}")
        return

    webhook_secret = txn.api_key.webhook_secret
    payload = {
        "event": event_name,
        "data": {
            "reference": txn.reference,
            "status": txn.status,
            "amount": str(txn.amount),
            "currency": txn.currency,
            "payment_method": txn.payment_method,
            "phone_number": txn.phone_number,
            "merchant_id": txn.merchant_id,
            "created_at": txn.created_at.isoformat(),
            "updated_at": txn.updated_at.isoformat(),
        },
    }
    payload_string = json.dumps(payload, separators=(",", ":"))
    signature = sign_webhook_payload(payload_string, webhook_secret)

    attempt_number = 1
    log = WebhookLog.objects.create(
        transaction=txn,
        attempt_number=attempt_number,
        url=txn.webhook_url,
    )

    try:
        response = httpx.post(
            txn.webhook_url,
            content=payload_string,
            headers={
                "Content-Type": "application/json",
                "PayCam-Signature": signature,
            },
            timeout=10.0,
        )
        log.http_status = response.status_code
        log.response_body = response.text[:10000]
        if response.status_code < 300:
            log.delivered_at = timezone.now()
            log.save(update_fields=["http_status", "response_body", "delivered_at"])
            return
        log.save(update_fields=["http_status", "response_body"])
    except Exception as e:
        log.response_body = str(e)[:10000]
        log.save(update_fields=["response_body"])

    if attempt_number < MAX_RETRIES:
        delay_minutes = BACKOFF_MINUTES[attempt_number - 1]
        log.next_retry_at = timezone.now() + timedelta(minutes=delay_minutes)
        log.save(update_fields=["next_retry_at"])
        retry_webhook.apply_async(
            args=[log.id, transaction_id, event_name, attempt_number + 1],
            countdown=int(delay_minutes * 60),
        )


@shared_task(bind=True, max_retries=3)
def retry_webhook(self, log_id, transaction_id, event_name, attempt_number):
    try:
        txn = Transaction.objects.select_related("api_key").get(id=transaction_id)
        log = WebhookLog.objects.get(id=log_id)
    except (Transaction.DoesNotExist, WebhookLog.DoesNotExist):
        logger.error(f"Transaction or log not found for retry")
        return

    webhook_secret = txn.api_key.webhook_secret
    payload = {
        "event": event_name,
        "data": {
            "reference": txn.reference,
            "status": txn.status,
            "amount": str(txn.amount),
            "currency": txn.currency,
            "payment_method": txn.payment_method,
            "phone_number": txn.phone_number,
            "merchant_id": txn.merchant_id,
            "created_at": txn.created_at.isoformat(),
            "updated_at": txn.updated_at.isoformat(),
        },
    }
    payload_string = json.dumps(payload, separators=(",", ":"))
    signature = sign_webhook_payload(payload_string, webhook_secret)

    new_log = WebhookLog.objects.create(
        transaction=txn,
        attempt_number=attempt_number,
        url=txn.webhook_url,
    )

    try:
        response = httpx.post(
            txn.webhook_url,
            content=payload_string,
            headers={
                "Content-Type": "application/json",
                "PayCam-Signature": signature,
            },
            timeout=10.0,
        )
        new_log.http_status = response.status_code
        new_log.response_body = response.text[:10000]
        if response.status_code < 300:
            new_log.delivered_at = timezone.now()
            new_log.save(update_fields=["http_status", "response_body", "delivered_at"])
            return
        new_log.save(update_fields=["http_status", "response_body"])
    except Exception as e:
        new_log.response_body = str(e)[:10000]
        new_log.save(update_fields=["response_body"])

    if attempt_number < MAX_RETRIES:
        delay_minutes = BACKOFF_MINUTES[attempt_number - 1]
        new_log.next_retry_at = timezone.now() + timedelta(minutes=delay_minutes)
        new_log.save(update_fields=["next_retry_at"])
        retry_webhook.apply_async(
            args=[new_log.id, transaction_id, event_name, attempt_number + 1],
            countdown=int(delay_minutes * 60),
        )