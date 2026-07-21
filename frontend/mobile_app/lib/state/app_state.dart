import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../services/paycam_api.dart';
import '../services/paycam_api_base.dart';
import '../services/mock_paycam_api.dart';
import 'settings_controller.dart';

/// Holds the customer's session JWT and cached profile/wallet data.
///
/// The token is persisted in the platform keychain (via
/// [FlutterSecureStorage]) so a relaunch of the app resumes straight
/// into [MainShell] — guarded by the biometric lock screen when
/// enabled — instead of forcing PIN entry every time, matching how
/// banking apps treat Face ID as the day-to-day unlock and PIN/OTP as
/// the fallback for a fully expired or absent session.
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
  final _secureStorage = const FlutterSecureStorage();

  bool isDemoMode = false;

  String? _token;
  String? _phoneNumber;
  AppUser? user;
  Wallet? wallet;
  List<CryptoWallet> cryptoWallets = [];

  bool get isAuthenticated => _token != null || isDemoMode;
  String? get phoneNumber => _phoneNumber;

  static const _kPhoneKey = 'paycam_phone';
  static const _kTokenKey = 'paycam_token';

  /// Decodes a JWT's payload without verifying the signature (that's
  /// the backend's job) purely to read `exp` client-side, so an
  /// obviously-expired token isn't presented to the API at all.
  static int? _jwtExpiryEpochSeconds(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;
      var payload = parts[1];
      payload += '=' * ((4 - payload.length % 4) % 4);
      final decoded = utf8.decode(base64Url.decode(payload));
      final map = jsonDecode(decoded) as Map<String, dynamic>;
      return map['exp'] as int?;
    } catch (_) {
      return null;
    }
  }

  Future<void> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    _phoneNumber = prefs.getString(_kPhoneKey);

    final storedToken = await _secureStorage.read(key: _kTokenKey);
    if (storedToken == null) return;

    final exp = _jwtExpiryEpochSeconds(storedToken);
    final nowSeconds = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    if (exp == null || exp <= nowSeconds) {
      await _secureStorage.delete(key: _kTokenKey);
      return;
    }

    _token = storedToken;
    _client.token = storedToken;
    try {
      await loadProfile();
    } catch (_) {
      // Token looked valid client-side but the backend rejected it
      // (revoked, clock skew, etc.) — fall back to PIN entry.
      _token = null;
      _client.token = null;
      await _secureStorage.delete(key: _kTokenKey);
    }
  }

  Future<void> setSession({required String token, required String phoneNumber}) async {
    _token = token;
    _phoneNumber = phoneNumber;
    _client.token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kPhoneKey, phoneNumber);
    await _secureStorage.write(key: _kTokenKey, value: token);
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
    _secureStorage.delete(key: _kTokenKey);
    notifyListeners();
  }

  CryptoWallet? cryptoFor(String currency) {
    for (final w in cryptoWallets) {
      if (w.currency == currency) return w;
    }
    return null;
  }
}
