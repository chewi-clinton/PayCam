"""
backend/apps/dashboard/utils.py

Call push_transaction_update(txn) anywhere a transaction's status
changes that a merchant's dashboard should know about in real time:
approve, decline, expiry, and (later) card/crypto status changes.

This intentionally mirrors fire_webhook's call sites rather than
replacing them -- webhooks notify the merchant's server, this notifies
the merchant's open browser tab. Both should fire on the same events.
"""
import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .consumers import merchant_group_name

logger = logging.getLogger(__name__)


def push_transaction_update(txn):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        logger.warning("No channel layer configured -- skipping dashboard push")
        return

    group_name = merchant_group_name(txn.merchant_id)
    payload = {
        "reference": txn.reference,
        "status": txn.status,
        "amount": str(txn.amount),
        "currency": txn.currency,
        "payment_method": txn.payment_method,
        "updated_at": txn.updated_at.isoformat(),
    }

    try:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {"type": "transaction.update", "payload": payload},
        )
    except Exception as e:
        logger.error(f"Failed to push dashboard update for {txn.reference}: {e}")
