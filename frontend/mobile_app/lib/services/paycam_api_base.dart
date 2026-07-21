import '../models/models.dart';

/// Interface shared by the real HTTP-backed [PayCamApi] and
/// [MockPayCamApi], so [AppState] can swap implementations for demo
/// mode without any screen code knowing the difference.
abstract class PayCamApiBase {
  /// Step 1 of registration: submits the form, backend emails an OTP.
  /// No account exists yet — call [verifyRegistrationOtp] to create it.
  Future<Map<String, dynamic>> register({
    required String phoneNumber,
    required String fullName,
    required String pin,
    required String email,
  });

  /// Returns {token, user} directly — PIN alone is sufficient, no OTP.
  Future<Map<String, dynamic>> login({required String phoneNumber, required String pin});

  /// Step 2 of registration: creates the account and returns
  /// {token, user, wallet, crypto_wallets} so the customer is signed
  /// in immediately, no separate login step needed.
  Future<Map<String, dynamic>> verifyRegistrationOtp({required String phoneNumber, required String otp});

  Future<List<PendingPayment>> pendingPayments();

  Future<Map<String, dynamic>> approvePayment(String reference);

  Future<Map<String, dynamic>> declinePayment(String reference);

  Future<Map<String, dynamic>> paymentLookup(String reference);

  Future<({AppUser user, Wallet wallet, List<CryptoWallet> cryptoWallets})> wallet();

  Future<List<TransactionRecord>> transactions();

  Future<void> registerFcmToken(String fcmToken);

  Future<void> changePinRequest(String oldPin);

  Future<void> changePinConfirm({required String otp, required String newPin});

  /// PayCam's V1 API only supports merchant-initiated payments (see
  /// spec §3.1) — there is no peer-to-peer transfer endpoint. The real
  /// [PayCamApi] implementation throws [PeerTransferUnsupported];
  /// [MockPayCamApi] fully implements it against in-memory demo state.
  Future<Map<String, dynamic>> sendMoney({
    required String recipientPhone,
    required double amount,
    String? note,
  });
}

/// Thrown by the real API's [PayCamApiBase.sendMoney] — there is no
/// backend endpoint for peer-to-peer transfers to call.
class PeerTransferUnsupported implements Exception {
  const PeerTransferUnsupported();
}
