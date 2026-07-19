import random
import string
from django.utils import timezone
from .models import Transaction


def generate_transaction_reference():
    while True:
        date_part = timezone.now().strftime("%Y%m%d")
        suffix = "".join(random.choices(string.ascii_letters + string.digits, k=12))
        reference = f"TXN_{date_part}_{suffix}"
        if not Transaction.objects.filter(reference=reference).exists():
            return reference