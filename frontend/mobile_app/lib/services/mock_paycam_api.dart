import '../models/models.dart';
import 'paycam_api_base.dart';

/// Stands in for the real backend while the frontend is built and
/// reviewed on its own — no network calls, everything resolves from
/// in-memory state seeded to match the Stitch mockups. Approve/decline
/// actually mutate local balances so the demo feels alive.
class MockPayCamApi implements PayCamApiBase {
  final _latency = const Duration(milliseconds: 500);

  late AppUser _user = AppUser(
    id: 1,
    phoneNumber: '237670000000',
    fullName: 'Jean Pierre',
    network: 'MTN',
    isActive: true,
  );

  double _balance = 145200;

  final List<CryptoWallet> _cryptoWallets = [
    CryptoWallet(
      currency: 'BTC',
      testnetAddress: 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      balance: 0.1450,
      network: 'bitcoin_testnet',
    ),
    CryptoWallet(
      currency: 'ETH',
      testnetAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976',
      balance: 1.2500,
      network: 'sepolia',
    ),
    CryptoWallet(
      currency: 'USDT',
      testnetAddress: 'TXc7p3qY8j8YQmFyN1eK9sVvW2xH4tJ6bC',
      balance: 400.00,
      network: 'sepolia',
    ),
  ];

  late final List<PendingPayment> _pending = [
    PendingPayment(
      reference: 'TXN_DEMO_ACME01',
      merchantName: 'Acme Supermarket',
      amount: 14250,
      currency: 'XAF',
      description: 'Weekly Groceries',
      expiresAt: DateTime.now().add(const Duration(minutes: 15)),
    ),
    PendingPayment(
      reference: 'TXN_DEMO_POWER01',
      merchantName: 'City Power Co.',
      amount: 8520,
      currency: 'XAF',
      description: 'Utility Bill - March',
      expiresAt: DateTime.now().add(const Duration(days: 2)),
    ),
    PendingPayment(
      reference: 'TXN_DEMO_SARAH01',
      merchantName: 'Sarah Jenkins',
      amount: 4500,
      currency: 'XAF',
      description: 'Dinner Split',
      expiresAt: DateTime.now().add(const Duration(days: 5)),
    ),
  ];

  late final List<TransactionRecord> _history = [
    TransactionRecord(
      reference: 'TXN_DEMO_H001',
      merchantName: 'Supermarché Central',
      amount: 15000,
      currency: 'XAF',
      paymentMethod: 'mtn_momo',
      status: 'success',
      description: 'Groceries',
      createdAt: DateTime.now().subtract(const Duration(hours: 3)),
    ),
    TransactionRecord(
      reference: 'TXN_DEMO_H002',
      merchantName: 'TechStore CM',
      amount: 0.002,
      currency: 'ETH',
      paymentMethod: 'crypto_eth',
      status: 'success',
      description: 'Hosting renewal',
      createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 5)),
    ),
    TransactionRecord(
      reference: 'TXN_DEMO_H003',
      merchantName: 'Uber Rides',
      amount: 1820,
      currency: 'XAF',
      paymentMethod: 'mtn_momo',
      status: 'failed',
      description: 'Transport',
      createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 8)),
    ),
    TransactionRecord(
      reference: 'TXN_DEMO_H004',
      merchantName: 'MTN Internet Bundle',
      amount: 2000,
      currency: 'XAF',
      paymentMethod: 'mtn_momo',
      status: 'success',
      description: 'Data bundle',
      createdAt: DateTime.now().subtract(const Duration(days: 3)),
    ),
  ];

  @override
  Future<Map<String, dynamic>> register({
    required String phoneNumber,
    required String fullName,
    required String pin,
    required String email,
  }) async {
    await Future.delayed(_latency);
    _user = AppUser(id: 1, phoneNumber: phoneNumber, fullName: fullName, network: 'MTN', isActive: true);
    return {'message': 'Account created.'};
  }

  @override
  Future<Map<String, dynamic>> login({required String phoneNumber, required String pin}) async {
    await Future.delayed(_latency);
    return {'message': 'OTP sent.', 'delivery_method': 'email', 'expires_in_seconds': 300};
  }

  @override
  Future<Map<String, dynamic>> verifyOtp({required String phoneNumber, required String otp}) async {
    await Future.delayed(_latency);
    return {'token': 'demo-token', 'token_type': 'Bearer', 'expires_in_minutes': 5};
  }

  @override
  Future<List<PendingPayment>> pendingPayments() async {
    await Future.delayed(_latency);
    return _pending.where((p) => !p.isExpired).toList();
  }

  @override
  Future<Map<String, dynamic>> approvePayment(String reference) async {
    await Future.delayed(_latency);
    final p = _pending.firstWhere((e) => e.reference == reference);
    _pending.removeWhere((e) => e.reference == reference);
    _balance -= p.amount;
    _history.insert(
      0,
      TransactionRecord(
        reference: p.reference,
        merchantName: p.merchantName,
        amount: p.amount,
        currency: p.currency,
        paymentMethod: 'mtn_momo',
        status: 'success',
        description: p.description,
        createdAt: DateTime.now(),
      ),
    );
    return {'reference': reference, 'status': 'success'};
  }

  @override
  Future<Map<String, dynamic>> declinePayment(String reference) async {
    await Future.delayed(_latency);
    _pending.removeWhere((e) => e.reference == reference);
    return {'reference': reference, 'status': 'failed'};
  }

  @override
  Future<Map<String, dynamic>> paymentLookup(String reference) async {
    await Future.delayed(_latency);
    final p = _pending.where((e) => e.reference == reference).firstOrNull;
    if (p == null) {
      return {
        'reference': reference,
        'amount': '5000.00',
        'currency': 'XAF',
        'merchant_name': 'Demo Merchant',
        'status': 'pending',
      };
    }
    return {
      'reference': p.reference,
      'amount': p.amount.toString(),
      'currency': p.currency,
      'merchant_name': p.merchantName,
      'status': 'pending',
    };
  }

  @override
  Future<({AppUser user, Wallet wallet, List<CryptoWallet> cryptoWallets})> wallet() async {
    await Future.delayed(_latency);
    return (
      user: _user,
      wallet: Wallet(network: _user.network, balance: _balance),
      cryptoWallets: _cryptoWallets,
    );
  }

  @override
  Future<List<TransactionRecord>> transactions() async {
    await Future.delayed(_latency);
    return List.unmodifiable(_history);
  }

  @override
  Future<void> registerFcmToken(String fcmToken) async {}

  @override
  Future<void> changePinRequest(String oldPin) async {
    await Future.delayed(_latency);
  }

  @override
  Future<void> changePinConfirm({required String otp, required String newPin}) async {
    await Future.delayed(_latency);
  }

  @override
  Future<Map<String, dynamic>> sendMoney({
    required String recipientPhone,
    required double amount,
    String? note,
  }) async {
    await Future.delayed(_latency);
    if (amount > _balance) {
      throw StateError('insufficient_funds');
    }
    _balance -= amount;
    final reference = 'TXN_DEMO_SEND${_history.length + 1}';
    _history.insert(
      0,
      TransactionRecord(
        reference: reference,
        merchantName: recipientPhone,
        amount: amount,
        currency: 'XAF',
        paymentMethod: 'mtn_momo',
        status: 'success',
        description: note?.isNotEmpty == true ? note! : 'Sent to $recipientPhone',
        createdAt: DateTime.now(),
      ),
    );
    return {'reference': reference, 'status': 'success'};
  }
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
