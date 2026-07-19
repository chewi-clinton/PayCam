import '../models/models.dart';
import 'api_client.dart';
import 'paycam_api_base.dart';

/// Thin wrapper mapping PayCam's mobile-app endpoints
/// (backend/apps/mobile_app/urls.py) onto typed calls.
class PayCamApi implements PayCamApiBase {
  PayCamApi(this._client);

  final ApiClient _client;

  @override
  Future<Map<String, dynamic>> register({
    required String phoneNumber,
    required String fullName,
    required String pin,
    required String email,
  }) async {
    final res = await _client.post(
      '/app/register/',
      auth: false,
      body: {
        'phone_number': phoneNumber,
        'full_name': fullName,
        'pin': pin,
        'email': email,
      },
    );
    return res as Map<String, dynamic>;
  }

  /// Returns delivery info; on success backend has sent an OTP.
  @override
  Future<Map<String, dynamic>> login({
    required String phoneNumber,
    required String pin,
  }) async {
    final res = await _client.post(
      '/app/login/',
      auth: false,
      body: {'phone_number': phoneNumber, 'pin': pin},
    );
    return res as Map<String, dynamic>;
  }

  /// Returns {token, user} on success.
  @override
  Future<Map<String, dynamic>> verifyOtp({
    required String phoneNumber,
    required String otp,
  }) async {
    final res = await _client.post(
      '/app/verify-otp/',
      auth: false,
      body: {'phone_number': phoneNumber, 'otp': otp},
    );
    return res as Map<String, dynamic>;
  }

  @override
  Future<List<PendingPayment>> pendingPayments() async {
    final res = await _client.get('/app/payments/pending/');
    final list = (res as Map<String, dynamic>)['pending'] as List;
    return list.map((e) => PendingPayment.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<Map<String, dynamic>> approvePayment(String reference) async {
    final res = await _client.post('/app/payments/$reference/approve/');
    return res as Map<String, dynamic>;
  }

  @override
  Future<Map<String, dynamic>> declinePayment(String reference) async {
    final res = await _client.post('/app/payments/$reference/decline/');
    return res as Map<String, dynamic>;
  }

  @override
  Future<Map<String, dynamic>> paymentLookup(String reference) async {
    final res = await _client.get('/app/payments/lookup/$reference/');
    return res as Map<String, dynamic>;
  }

  @override
  Future<({AppUser user, Wallet wallet, List<CryptoWallet> cryptoWallets})> wallet() async {
    final res = await _client.get('/app/wallet/') as Map<String, dynamic>;
    return (
      user: AppUser.fromJson(res['user'] as Map<String, dynamic>),
      wallet: Wallet.fromJson(res['wallet'] as Map<String, dynamic>),
      cryptoWallets: (res['crypto_wallets'] as List)
          .map((e) => CryptoWallet.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  @override
  Future<List<TransactionRecord>> transactions() async {
    final res = await _client.get('/app/transactions/') as Map<String, dynamic>;
    final list = res['transactions'] as List;
    return list.map((e) => TransactionRecord.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<void> registerFcmToken(String fcmToken) async {
    await _client.post('/app/fcm-token/', body: {'fcm_token': fcmToken});
  }

  @override
  Future<void> changePinRequest(String oldPin) async {
    await _client.post('/app/change-pin/request/', body: {'old_pin': oldPin});
  }

  @override
  Future<void> changePinConfirm({required String otp, required String newPin}) async {
    await _client.post(
      '/app/change-pin/confirm/',
      body: {'otp': otp, 'new_pin': newPin},
    );
  }

  @override
  Future<Map<String, dynamic>> sendMoney({
    required String recipientPhone,
    required double amount,
    String? note,
  }) {
    throw const PeerTransferUnsupported();
  }
}
