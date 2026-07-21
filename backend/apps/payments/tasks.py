import logging
from django.utils import timezone
from celery import shared_task
from firebase_admin import messaging
from .models import Transaction
from .firebase_app import get_firebase_app
from apps.webhooks.tasks import fire_webhook
from apps.dashboard.utils import push_transaction_update

logger = logging.getLogger(__name__)


@shared_task
def send_fcm_push(transaction_id):
    try:
        txn = Transaction.objects.select_related("customer_user", "merchant").get(id=transaction_id)
    except Transaction.DoesNotExist:
        logger.error(f"Transaction {transaction_id} not found for FCM push")
        return False

    customer = txn.customer_user
    if customer is None:
        logger.info(f"No customer_user on transaction {txn.reference} — skipping push")
        return False

    if not customer.fcm_token:
        logger.info(
            f"No fcm_token for customer {customer.phone_number} — "
            f"relying on pending-payments polling for {txn.reference}"
        )
        return False

    app = get_firebase_app()
    if app is None:
        logger.warning(
            f"Firebase not initialized — skipping push for {txn.reference}. "
            f"Customer will still see this via polling."
        )
        return False

    message = messaging.Message(
        notification=messaging.Notification(
            title="New payment request",
            body=f"{txn.merchant.first_name or 'A merchant'} requests {txn.amount} {txn.currency}",
        ),
        data={
            "type": "payment_request",
            "reference": txn.reference,
            "amount": str(txn.amount),
            "currency": txn.currency,
            "expires_at": txn.expires_at.isoformat(),
        },
        token=customer.fcm_token,
    )

    try:
        message_id = messaging.send(message, app=app)
        logger.info(f"FCM push sent for {txn.reference}: {message_id}")
        return True
    except messaging.UnregisteredError:
        logger.info(
            f"FCM token for {customer.phone_number} is unregistered — clearing it."
        )
        customer.fcm_token = None
        customer.fcm_token_updated_at = None
        customer.save(update_fields=["fcm_token", "fcm_token_updated_at"])
        return False
    except Exception as e:
        # Covers SenderIdMismatchError, QuotaExceededError, ThirdPartyAuthError,
        # and any other transient/non-fatal FCM failure. We deliberately do
        # NOT raise here: the customer still gets this transaction via the
        # polling fallback (GET /app/payments/pending), so a push failure
        # should never block or fail the payment-initiate request.
        logger.error(f"FCM push failed for {txn.reference}: {e}")
        return False


@shared_task
def expire_pending_payments():
    now = timezone.now()
    expired_txns = Transaction.objects.filter(status="pending", expires_at__lt=now)
    count = 0
    for txn in expired_txns:
        txn.status = "expired"
        txn.save(update_fields=["status"])
        fire_webhook.delay(txn.id, "payment.expired")
        push_transaction_update(txn)
        count += 1
    logger.info(f"Expired {count} pending payments")
    return count


# === Added for V2: card payments multi-currency support ===
import httpx as _httpx

SUPPORTED_FX_CURRENCIES = ["USD", "EUR", "GBP", "NGN", "GHS", "KES"]
_EXCHANGE_RATE_API_URL = "https://open.er-api.com/v6/latest/{base}"


@shared_task
def update_exchange_rates():
    """
    Fetches the latest XAF rate for each supported currency from the
    free, keyless ExchangeRate-API open endpoint (updates once every
    24 hours). Stores a new ExchangeRate row per currency per run --
    history is kept for audit purposes; lookups always take the latest
    via the (from_currency, to_currency, -fetched_at) index.
    """
    from .models import ExchangeRate

    stored = 0
    for currency in SUPPORTED_FX_CURRENCIES:
        try:
            response = _httpx.get(
                _EXCHANGE_RATE_API_URL.format(base=currency),
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            logger.error(f"Failed to fetch exchange rate for {currency}: {e}")
            continue

        if data.get("result") != "success":
            logger.error(f"Exchange rate API returned non-success for {currency}: {data}")
            continue

        rate = data.get("rates", {}).get("XAF")
        if rate is None:
            logger.error(f"XAF rate missing from response for base={currency}")
            continue

        ExchangeRate.objects.create(
            from_currency=currency,
            to_currency="XAF",
            rate=rate,
            source="open.er-api.com",
        )
        stored += 1
        logger.info(f"Stored exchange rate: 1 {currency} = {rate} XAF")

    logger.info(f"update_exchange_rates: stored {stored}/{len(SUPPORTED_FX_CURRENCIES)} rates")
    return stored
