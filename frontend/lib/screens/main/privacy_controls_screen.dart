import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../state/app_state.dart';
import '../../widgets/common.dart';
import '../onboarding/legal_screen.dart';

class PrivacyControlsScreen extends StatefulWidget {
  const PrivacyControlsScreen({super.key, required this.appState});
  final AppState appState;

  @override
  State<PrivacyControlsScreen> createState() => _PrivacyControlsScreenState();
}

class _PrivacyControlsScreenState extends State<PrivacyControlsScreen> {
  @override
  Widget build(BuildContext context) {
    final settings = widget.appState.settings;
    return Scaffold(
      appBar: AppBar(title: const Text('Privacy')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.margin),
          children: [
            SectionCard(
              padding: EdgeInsets.zero,
              child: SwitchListTile(
                value: settings.hideBalanceOnLock,
                onChanged: (v) => setState(() => settings.setHideBalanceOnLock(v)),
                secondary: Icon(Icons.visibility_off_outlined, color: AppColors.primaryDark),
                title: const Text('Hide Balance by Default', style: TextStyle(fontWeight: FontWeight.w600)),
                subtitle: const Text('Mask amounts on Home and Wallet until tapped'),
                activeThumbColor: AppColors.primary,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('What PayCam stores', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  const Text(
                    'Your full name, phone number, email, and a hashed PIN. Card and '
                    'crypto details use PayCam-owned test data only — see the full '
                    'Privacy Policy for details.',
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextButton(
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const LegalScreen(kind: LegalKind.privacy)),
                    ),
                    child: const Text('Read Privacy Policy'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
