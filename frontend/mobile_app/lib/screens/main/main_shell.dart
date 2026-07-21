import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import '../../services/api_client.dart';
import '../../widgets/common.dart';
import 'home_dashboard_screen.dart';
import 'wallet_screen.dart';
import 'qr_scanner_screen.dart';
import 'transaction_history_screen.dart';
import 'profile_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key, required this.appState, this.skipInitialLock = false});
  final AppState appState;

  /// Set by the login/registration screens right after the user
  /// interactively authenticated, so they aren't immediately asked to
  /// unlock again. Cold starts that resume a persisted session (via
  /// [SplashScreen]) leave this false, so *some* unlock — Face ID
  /// when enabled, PIN otherwise — is always required before the
  /// wallet is shown, the same as reopening a banking app.
  final bool skipInitialLock;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> with WidgetsBindingObserver {
  int _index = 0;
  final _localAuth = LocalAuthentication();
  late bool _locked = !widget.skipInitialLock;
  bool _authenticating = false;

  void goTo(int index) => setState(() => _index = index);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    if (_locked) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _tryUnlock());
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      setState(() => _locked = true);
    }
  }

  Future<void> _tryUnlock() async {
    if (_authenticating) return;
    // Biometrics off: don't fire a Face ID prompt at all — the lock
    // screen shows the PIN entry as the sole option.
    if (!widget.appState.settings.biometricLock) return;
    _authenticating = true;
    try {
      final supported = await _localAuth.isDeviceSupported();
      if (!supported) return;
      final ok = await _localAuth.authenticate(
        localizedReason: 'Unlock PayCam',
        options: const AuthenticationOptions(stickyAuth: true),
      );
      if (ok && mounted) setState(() => _locked = false);
    } catch (_) {
      // Leave locked; user can retry Face ID, or fall back to PIN.
    } finally {
      _authenticating = false;
    }
  }

  Future<void> _unlockWithPin() async {
    final pin = await showDialog<String>(
      context: context,
      builder: (_) => _PinUnlockDialog(),
    );
    if (pin == null || pin.length != 4) return;
    final phone = widget.appState.phoneNumber;
    if (phone == null) return;
    try {
      final res = await widget.appState.api.login(phoneNumber: phone, pin: pin);
      final token = res['token'] as String;
      await widget.appState.setSession(token: token, phoneNumber: phone);
      if (mounted) setState(() => _locked = false);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(Strings.connectionError)));
    }
  }

  @override
  Widget build(BuildContext context) {
    // The QR tab is built on demand rather than kept alive in the
    // IndexedStack below — mobile_scanner opens the camera (and
    // triggers the OS permission prompt) as soon as it's mounted, so
    // eagerly building it here would fire that prompt on first launch
    // instead of when the user actually taps Scan. Leaving the tab
    // disposes it, which stops the camera.
    final body = _index == 2
        ? QrScannerScreen(appState: widget.appState)
        : IndexedStack(
            index: _index > 2 ? _index - 1 : _index,
            children: [
              HomeDashboardScreen(appState: widget.appState, onNavigate: goTo),
              WalletScreen(appState: widget.appState),
              TransactionHistoryScreen(appState: widget.appState),
              ProfileScreen(appState: widget.appState),
            ],
          );

    return Stack(
      children: [
        Scaffold(
          body: body,
          bottomNavigationBar: _BottomNav(index: _index, onTap: goTo),
        ),
        if (_locked)
          _LockScreen(
            onUnlock: _tryUnlock,
            onUsePin: _unlockWithPin,
            biometricEnabled: widget.appState.settings.biometricLock,
          ),
      ],
    );
  }
}

class _LockScreen extends StatelessWidget {
  const _LockScreen({
    required this.onUnlock,
    required this.onUsePin,
    required this.biometricEnabled,
  });
  final VoidCallback onUnlock;
  final VoidCallback onUsePin;
  final bool biometricEnabled;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      child: SafeArea(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 88,
                height: 88,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: AppShadows.level1,
                ),
                child: Image.asset('assets/images/logo_transparent.png', fit: BoxFit.contain),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text('PayCam Locked', style: Theme.of(context).textTheme.headlineLarge),
              const SizedBox(height: AppSpacing.sm),
              Text(
                biometricEnabled
                    ? 'Unlock with Face ID / Touch ID to continue'
                    : 'Enter your PIN to continue',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: AppSpacing.xl),
              if (biometricEnabled) ...[
                ElevatedButton.icon(
                  onPressed: onUnlock,
                  icon: const Icon(Icons.fingerprint),
                  label: const Text('Unlock'),
                ),
                const SizedBox(height: AppSpacing.md),
                TextButton(
                  onPressed: onUsePin,
                  child: const Text('Use PIN instead'),
                ),
              ] else
                ElevatedButton.icon(
                  onPressed: onUsePin,
                  icon: const Icon(Icons.password_rounded),
                  label: const Text('Enter PIN'),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PinUnlockDialog extends StatefulWidget {
  @override
  State<_PinUnlockDialog> createState() => _PinUnlockDialogState();
}

class _PinUnlockDialogState extends State<_PinUnlockDialog> {
  final _pinCtrl = TextEditingController();
  final _pinFocus = FocusNode();

  @override
  void dispose() {
    _pinCtrl.dispose();
    _pinFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Enter your PIN'),
      content: SizedBox(
        width: double.minPositive,
        child: PinDotsField(
          controller: _pinCtrl,
          focusNode: _pinFocus,
          length: 4,
          autofocus: true,
          onCompleted: (pin) => Navigator.of(context).pop(pin),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
      ],
    );
  }
}

class _BottomNav extends StatelessWidget {
  const _BottomNav({required this.index, required this.onTap});
  final int index;
  final ValueChanged<int> onTap;

  static List<({IconData icon, String label})> get _items => [
        (icon: Icons.home_rounded, label: Strings.navHome),
        (icon: Icons.account_balance_wallet_rounded, label: Strings.navWallet),
        (icon: Icons.qr_code_scanner_rounded, label: Strings.navScan),
        (icon: Icons.history_rounded, label: Strings.navHistory),
        (icon: Icons.person_rounded, label: Strings.navProfile),
      ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        boxShadow: AppShadows.level1,
      ),
      child: SafeArea(
        child: SizedBox(
          height: 64,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(_items.length, (i) {
              final selected = i == index;
              final item = _items[i];
              return GestureDetector(
                onTap: () => onTap(i),
                behavior: HitTestBehavior.opaque,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
                      decoration: BoxDecoration(
                        color: selected ? AppColors.primary : Colors.transparent,
                        borderRadius: BorderRadius.circular(AppRadii.full),
                      ),
                      child: Icon(
                        item.icon,
                        color: selected ? Colors.white : AppColors.onSurfaceVariant,
                        size: 24,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.label,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                        color: selected ? AppColors.primaryDark : AppColors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}
