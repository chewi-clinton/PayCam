"""
backend/apps/cards/validators.py

Pure validation helpers -- no DB, no Django imports needed beyond what's
unavoidable. Kept separate from views.py so they're trivially unit
testable and reusable (e.g. from a future SDK-side pre-check).
"""
import re


def luhn_check(card_number: str) -> bool:
    """
    Standard Luhn checksum, the same algorithm every real card network
    (Visa, Mastercard, Amex, etc.) uses to validate card number structure.
    Does NOT check whether the card exists -- only that the digit
    sequence is structurally valid. Per spec: invalid Luhn is rejected
    BEFORE checking the test card table.
    """
    digits = [int(d) for d in card_number]
    checksum = 0
    # Process from rightmost digit. Every second digit (starting from
    # the second-to-last) is doubled; if doubling pushes it over 9,
    # subtract 9 (equivalent to summing the two digits of the result).
    for i, digit in enumerate(reversed(digits)):
        if i % 2 == 1:
            digit *= 2
            if digit > 9:
                digit -= 9
        checksum += digit
    return checksum % 10 == 0


def normalize_card_number(raw: str) -> str:
    """Strip spaces/dashes a merchant or test client might include."""
    return re.sub(r"[\s-]", "", raw)


def is_valid_card_number_format(card_number: str) -> bool:
    """
    Structural check before Luhn: digits only, plausible length, and
    not a degenerate sequence like all zeros (which mathematically
    passes Luhn -- checksum 0 is divisible by 10 -- but isn't a real
    card; real processors reject these explicitly rather than relying
    on Luhn alone to catch them).
    """
    if not card_number.isdigit():
        return False
    if not (13 <= len(card_number) <= 19):
        return False
    if len(set(card_number)) == 1:
        return False
    return True


def is_valid_cvv(cvv: str) -> bool:
    """Per spec §3.2: exactly 3 digits for Visa/Mastercard. Any other length rejected."""
    return cvv.isdigit() and len(cvv) == 3


def is_expiry_valid(month: int, year: int, now_year: int, now_month: int) -> bool:
    """
    'Any future' expiry per the spec's test card table -- we still
    validate it's a real month and not already expired, since a card
    expiring last month shouldn't silently succeed just because it's
    a test card.
    """
    if not (1 <= month <= 12):
        return False
    if year < now_year:
        return False
    if year == now_year and month < now_month:
        return False
    return True
