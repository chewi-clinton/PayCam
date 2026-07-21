import secrets

try:
    from eth_account import Account
    _HAS_ETH = True
except ImportError:
    _HAS_ETH = False


def generate_eth_address():
    if _HAS_ETH:
        return Account.create().address
    return "0x" + secrets.token_hex(20)


def generate_btc_testnet_address():
    return "tb1q" + secrets.token_hex(19)[:38]


def generate_wallet_for_currency(currency):
    if currency == "BTC":
        return generate_btc_testnet_address(), "bitcoin_testnet"
    return generate_eth_address(), "sepolia"
