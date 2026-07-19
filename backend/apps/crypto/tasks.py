import logging
import requests
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from apps.payments.models import Transaction
from apps.webhooks.tasks import fire_webhook
from apps.dashboard.utils import push_transaction_update

logger = logging.getLogger(__name__)

_INFURA_ETH_URL = f"https://sepolia.infura.io/v3/{settings.INFURA_API_KEY}"
_BLOCKCHAIR_BTC_STATS_URL = "https://api.blockchair.com/bitcoin/testnet/stats"

CONFIRMATIONS_REQUIRED = {
    "BTC": 3,
    "ETH": 6,
    "USDT": 6,
}


def _get_eth_block_number():
    payload = {"jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 1}
    resp = requests.post(_INFURA_ETH_URL, json=payload, timeout=15)
    resp.raise_for_status()
    return int(resp.json()["result"], 16)


def _get_btc_block_height():
    resp = requests.get(_BLOCKCHAIR_BTC_STATS_URL, timeout=15)
    resp.raise_for_status()
    return resp.json()["data"]["blocks"]


def _get_current_block(currency):
    if currency == "BTC":
        return _get_btc_block_height()
    return _get_eth_block_number()


@shared_task(bind=True, max_retries=60)
def monitor_crypto_payment(self, transaction_id):
    """
    Confirmation timer backed by real chain data. PayCam doesn't custody
    or broadcast real signing keys -- the balance was already deducted
    at approval time, same as MoMo. This task uses the real current
    block height on Sepolia (via Infura) or Bitcoin testnet (via
    Blockchair) as a genuine, verifiable clock for the confirmation
    wait, rather than a fabricated counter.
    """
    try:
        txn = Transaction.objects.get(id=transaction_id)
    except Transaction.DoesNotExist:
        logger.error(f"Transaction {transaction_id} not found")
        return

    if txn.status != "pending":
        logger.info(f"{txn.reference} is {txn.status}, stopping monitor.")
        return

    currency = txn.currency
    required = CONFIRMATIONS_REQUIRED.get(currency, 6)

    try:
        current_block = _get_current_block(currency)
    except Exception as e:
        logger.error(f"Block height fetch failed for {txn.reference}: {e}")
        raise self.retry(countdown=15)

    if txn.crypto_confirm_start_block is None:
        Transaction.objects.filter(id=txn.id).update(crypto_confirm_start_block=current_block)
        logger.info(f"{txn.reference}: monitoring started at block {current_block}")
        raise self.retry(countdown=12)

    confirmations = max(0, current_block - txn.crypto_confirm_start_block)
    logger.info(f"{txn.reference}: {confirmations}/{required} confirmations (block {current_block})")

    if confirmations >= required:
        txn.status = "success"
        txn.updated_at = timezone.now()
        txn.save(update_fields=["status", "updated_at"])
        fire_webhook.delay(txn.id, "payment.success")
        push_transaction_update(txn)
        logger.info(f"{txn.reference} confirmed at block {current_block}")
        return

    raise self.retry(countdown=12)
