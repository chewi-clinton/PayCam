"""
backend/apps/cards/test_cards.py

The fixed table of PayCam-owned test cards (spec §3.2). These are the
ONLY card numbers that ever return anything other than
invalid_card_number -- any number that passes Luhn but isn't in this
table is treated as "a real-looking card we don't recognize", which
in PayCam's all-test-cards world means declined (no real processor
backs it, so it can't succeed).
"""
from .validators import normalize_card_number

TEST_CARDS = {
    "4242424242424242": {
        "network": "visa",
        "behavior": "success",
    },
    "5555555555554444": {
        "network": "mastercard",
        "behavior": "success",
    },
    "4000000000000002": {
        "network": "visa",
        "behavior": "declined",
    },
    "4000000000009995": {
        "network": "visa",
        "behavior": "insufficient_funds",
    },
    "4100000000000019": {
        "network": "visa",
        "behavior": "disputed",
    },
}


def lookup_test_card(card_number: str):
    """
    Returns the test card's dict (network, behavior) if recognized,
    else None. Caller is responsible for running Luhn + format checks
    BEFORE calling this -- this function does not re-validate.
    """
    normalized = normalize_card_number(card_number)
    return TEST_CARDS.get(normalized)
