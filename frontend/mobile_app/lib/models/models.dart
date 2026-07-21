class AppUser {
  final int id;
  final String phoneNumber;
  final String fullName;
  final String network; // MTN | ORANGE
  final bool isActive;

  AppUser({
    required this.id,
    required this.phoneNumber,
    required this.fullName,
    required this.network,
    required this.isActive,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as int,
        phoneNumber: json['phone_number'] as String,
        fullName: json['full_name'] as String,
        network: json['network'] as String,
        isActive: json['is_active'] as bool? ?? true,
      );
}

class Wallet {
  final String network;
  final double balance;

  Wallet({required this.network, required this.balance});

  factory Wallet.fromJson(Map<String, dynamic> json) => Wallet(
        network: json['network'] as String,
        balance: double.parse(json['balance'].toString()),
      );
}

class CryptoWallet {
  final String currency; // BTC | ETH | USDT
  final String testnetAddress;
  final double balance;
  final String network;

  CryptoWallet({
    required this.currency,
    required this.testnetAddress,
    required this.balance,
    required this.network,
  });

  factory CryptoWallet.fromJson(Map<String, dynamic> json) => CryptoWallet(
        currency: json['currency'] as String,
        testnetAddress: json['testnet_address'] as String,
        balance: double.parse(json['balance'].toString()),
        network: json['network'] as String,
      );
}

class PendingPayment {
  final String reference;
  final String merchantName;
  final double amount;
  final String currency;
  final String description;
  final DateTime expiresAt;

  PendingPayment({
    required this.reference,
    required this.merchantName,
    required this.amount,
    required this.currency,
    required this.description,
    required this.expiresAt,
  });

  bool get isExpired => DateTime.now().isAfter(expiresAt);
  bool get isCrypto => currency != 'XAF';

  factory PendingPayment.fromJson(Map<String, dynamic> json) => PendingPayment(
        reference: json['reference'] as String,
        merchantName: json['merchant_name'] as String? ?? 'Merchant',
        amount: double.parse(json['amount'].toString()),
        currency: json['currency'] as String,
        description: json['description'] as String? ?? '',
        expiresAt: DateTime.parse(json['expires_at'] as String),
      );
}

class TransactionRecord {
  final String reference;
  final String merchantName;
  final double amount;
  final String currency;
  final String paymentMethod;
  final String status; // pending | success | failed | expired
  final String description;
  final DateTime createdAt;

  TransactionRecord({
    required this.reference,
    required this.merchantName,
    required this.amount,
    required this.currency,
    required this.paymentMethod,
    required this.status,
    required this.description,
    required this.createdAt,
  });

  bool get isOutgoing => true; // all customer transactions are payments out
  bool get isCrypto => paymentMethod.startsWith('crypto_');

  factory TransactionRecord.fromJson(Map<String, dynamic> json) => TransactionRecord(
        reference: json['reference'] as String,
        merchantName: json['merchant_name'] as String? ?? 'Merchant',
        amount: double.parse(json['amount'].toString()),
        currency: json['currency'] as String,
        paymentMethod: json['payment_method'] as String,
        status: json['status'] as String,
        description: json['description'] as String? ?? '',
        createdAt: DateTime.parse(json['created_at'] as String),
      );
}
