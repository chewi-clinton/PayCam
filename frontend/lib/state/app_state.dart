import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../services/paycam_api.dart';
import '../services/paycam_api_base.dart';
import '../services/mock_paycam_api.dart';
import 'settings_controller.dart';

/// Holds the customer's session JWT (5-minute lifetime per spec §2.4 —
/// every re-entry requires PIN + OTP again, so this app does not
/// attempt silent refresh) and cached profile/wallet data.
///
/// [api] can be swapped to [MockPayCamApi] via [enableDemoMode] so the
/// whole UI is reviewable while the backend integration is being
/// finished — no screen code needs to know which one is active.
class AppState extends ChangeNotifier {
  AppState() {
    _client = ApiClient();
    api = PayCamApi(_client);
  }

  late final ApiClient _client;
  late PayCamApiBase api;

  final settings = SettingsController();

  bool isDemoMode = false;

  String? _token;
  String? _phoneNumber;
  AppUser? user;
  Wallet? wallet;
  List<CryptoWallet> cryptoWallets = [];

  bool get isAuthenticated => _token != null || isDemoMode;
  String? get phoneNumber => _phoneNumber;

  static const _kPhoneKey = 'paycam_phone';

  Future<void> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    _phoneNumber = prefs.getString(_kPhoneKey);
    // The session JWT is short-lived by design; we don't persist it
    // across app launches, only the phone number for a faster login.
  }

  Future<void> setSession({required String token, required String phoneNumber}) async {
    _token = token;
    _phoneNumber = phoneNumber;
    _client.token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kPhoneKey, phoneNumber);
    notifyListeners();
  }

  /// Bypasses login entirely and points [api] at in-memory mock data
  /// seeded to match the Stitch mockups, so every screen (Home,
  /// Wallet, Requests, History…) is fully explorable offline.
  void enableDemoMode() {
    isDemoMode = true;
    api = MockPayCamApi();
    notifyListeners();
  }

  Future<void> loadProfile() async {
    final result = await api.wallet();
    user = result.user;
    wallet = result.wallet;
    cryptoWallets = result.cryptoWallets;
    notifyListeners();
  }

  void logout() {
    _token = null;
    isDemoMode = false;
    api = PayCamApi(_client);
    _client.token = null;
    user = null;
    wallet = null;
    cryptoWallets = [];
    notifyListeners();
  }

  CryptoWallet? cryptoFor(String currency) {
    for (final w in cryptoWallets) {
      if (w.currency == currency) return w;
    }
    return null;
  }
}
