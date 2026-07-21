import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../state/app_state.dart';
import '../../widgets/common.dart';
import 'change_pin_screen.dart';

class SecurityScreen extends StatefulWidget {
  const SecurityScreen({super.key, required this.appState});
  final AppState appState;

  @override
  State<SecurityScreen> createState() => _SecurityScreenState();
}

class _SecurityScreenState extends State<SecurityScreen> {
  @override
  Widget build(BuildContext context) {
    final settings = widget.appState.settings;
    return Scaffold(
      appBar: AppBar(title: const Text('Security')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.margin),
          children: [
            SectionCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  SwitchListTile(
                    value: settings.biometricLock,
                    onChanged: (v) => setState(() => settings.setBiometricLock(v)),
                    secondary: Icon(Icons.fingerprint, color: AppColors.primaryDark),
                    title: const Text('Biometric Lock', style: TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: const Text('Require Face ID / Touch ID to reopen the app'),
                    activeThumbColor: AppColors.primary,
                  ),
                  const Divider(height: 1, indent: 68),
                  SwitchListTile(
                    value: settings.hideBalanceOnLock,
                    onChanged: (v) => setState(() => settings.setHideBalanceOnLock(v)),
                    secondary: Icon(Icons.visibility_off_outlined, color: AppColors.primaryDark),
                    title: const Text('Hide Balance', style: TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: const Text('Mask amounts until you tap to reveal'),
                    activeThumbColor: AppColors.primary,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            SectionCard(
              child: Row(
                children: [
                  Icon(Icons.timer_outlined, color: AppColors.primaryDark),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('Session Timeout', style: TextStyle(fontWeight: FontWeight.w700)),
                        Text('Stays signed in for 30 minutes. Face ID/Touch ID or your PIN unlocks it instantly; once it fully expires, PIN sign-in is all that\'s needed again.'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            ElevatedButton.icon(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => ChangePinScreen(appState: widget.appState)),
              ),
              icon: const Icon(Icons.password_rounded, size: 18),
              label: const Text('Change PIN'),
            ),
          ],
        ),
      ),
    );
  }
}
