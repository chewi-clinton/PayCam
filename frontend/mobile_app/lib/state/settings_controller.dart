import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Persisted app-wide display and privacy preferences. A single
/// controller rather than several, since Settings changes them
/// together and dark-mode/language both require the same "remount
/// everything so static AppColors/Strings getters are re-read" trick
/// — see main.dart's ValueKey on MaterialApp.
class SettingsController extends ChangeNotifier {
  static const _kDarkKey = 'paycam_dark_mode';
  static const _kLocaleKey = 'paycam_locale';
  static const _kPushKey = 'paycam_push_notifications';
  static const _kEmailKey = 'paycam_email_notifications';
  static const _kBiometricKey = 'paycam_biometric_lock';
  static const _kHideBalanceKey = 'paycam_hide_balance_lock';

  bool isDark = false;
  String languageCode = 'en'; // 'en' | 'fr'

  // Local-only preferences (no backend endpoint backs these — same as
  // most consumer apps, they're device settings, not account state).
  bool pushNotifications = true;
  bool emailNotifications = true;
  bool biometricLock = false;
  bool hideBalanceOnLock = false;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    isDark = prefs.getBool(_kDarkKey) ?? false;
    languageCode = prefs.getString(_kLocaleKey) ?? 'en';
    pushNotifications = prefs.getBool(_kPushKey) ?? true;
    emailNotifications = prefs.getBool(_kEmailKey) ?? true;
    biometricLock = prefs.getBool(_kBiometricKey) ?? false;
    hideBalanceOnLock = prefs.getBool(_kHideBalanceKey) ?? false;
    notifyListeners();
  }

  Future<void> setDark(bool value) async {
    isDark = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kDarkKey, value);
  }

  Future<void> setLanguage(String code) async {
    languageCode = code;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kLocaleKey, code);
  }

  Future<void> setPushNotifications(bool value) async {
    pushNotifications = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kPushKey, value);
  }

  Future<void> setEmailNotifications(bool value) async {
    emailNotifications = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kEmailKey, value);
  }

  Future<void> setBiometricLock(bool value) async {
    biometricLock = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kBiometricKey, value);
  }

  Future<void> setHideBalanceOnLock(bool value) async {
    hideBalanceOnLock = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kHideBalanceKey, value);
  }
}
