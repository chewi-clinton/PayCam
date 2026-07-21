"""
backend/apps/payments/currency.py

Reads the latest cached exchange rate (fetched daily by
update_exchange_rates, apps/payments/tasks.py) and converts an amount
to XAF for internal bookkeeping. PayCam settles everything in XAF
regardless of what currency the customer paid in (matching how wallets
and the faucet are XAF-only).
"""
import logging
from decimal import Decimal, ROUND_HALF_UP
from .models import ExchangeRate

logger = logging.getLogger(__name__)


class ExchangeRateUnavailable(Exception):
    """Raised when no usable rate exists for a currency pair."""
    pass


def get_latest_rate(from_currency: str, to_currency: str) -> Decimal:
    """
    Returns the most recently fetched rate for from_currency -> to_currency.
    Relies on the (from_currency, to_currency, -fetched_at) index already
    defined on ExchangeRate for a fast lookup.
    """
    if from_currency == to_currency:
        return Decimal("1")

    row = (
        ExchangeRate.objects.filter(from_currency=from_currency, to_currency=to_currency)
        .order_by("-fetched_at")
        .first()
    )
    if row is None:
        raise ExchangeRateUnavailable(
            f"No exchange rate available for {from_currency} -> {to_currency}. "
            f"Has update_exchange_rates run yet?"
        )
    return row.rate


def convert_to_xaf(amount: Decimal, from_currency: str) -> Decimal:
    """
    Converts amount (in from_currency) to XAF, rounded to 2 decimal
    places (XAF is a whole-unit currency in practice, but we keep 2dp
    to match the Transaction.amount field's existing precision rather
    than introducing a special case).
    """
    if from_currency == "XAF":
        return amount
    rate = get_latest_rate(from_currency, "XAF")
    converted = (amount * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return converted
