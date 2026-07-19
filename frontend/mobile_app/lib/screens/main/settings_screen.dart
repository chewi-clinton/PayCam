import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import '../../widgets/common.dart';
import '../onboarding/welcome_screen.dart';
import 'security_screen.dart';
import 'privacy_controls_screen.dart';
import 'linked_accounts_screen.dart';
import 'help_center_screen.dart';
import 'about_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key, required this.appState});
  final AppState appState;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  void _logout() {
    widget.appState.logout();
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => WelcomeScreen(appState: widget.appState)),
      (route) => false,
    );
  }

  Future<void> _pickLanguage() async {
    final settings = widget.appState.settings;
    final code = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadii.sheet)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(bottom: AppSpacing.md),
              decoration: BoxDecoration(
                  color: AppColors.outlineVariant, borderRadius: BorderRadius.circular(AppRadii.full)),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(Strings.chooseLanguage, style: Theme.of(context).textTheme.titleLarge),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            RadioListTile<String>(
              value: 'en',
              groupValue: settings.languageCode,
              onChanged: (v) => Navigator.of(context).pop(v),
              title: Text(Strings.english),
              activeColor: AppColors.primary,
            ),
            RadioListTile<String>(
              value: 'fr',
              groupValue: settings.languageCode,
              onChanged: (v) => Navigator.of(context).pop(v),
              title: Text(Strings.french),
              activeColor: AppColors.primary,
            ),
          ],
        ),
      ),
    );
    if (code != null) await settings.setLanguage(code);
  }

  @override
  Widget build(BuildContext context) {
    final settings = widget.appState.settings;
    return Scaffold(
      appBar: AppBar(title: Text(Strings.appName)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.margin, vertical: AppSpacing.md),
          children: [
            Text(Strings.settings, style: Theme.of(context).textTheme.headlineLarge),
            const SizedBox(height: 4),
            Text(Strings.settingsSubtitle, style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: AppSpacing.lg),
            _SectionLabel(Strings.preferences),
            SectionCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  SwitchListTile(
                    value: settings.isDark,
                    onChanged: (v) => settings.setDark(v),
                    secondary: const _RowIcon(Icons.dark_mode_outlined),
                    title: Text(Strings.darkMode, style: const TextStyle(fontWeight: FontWeight.w600)),
                    activeThumbColor: AppColors.primary,
                  ),
                  const Divider(height: 1, indent: 68),
                  _SimpleTile(
                    icon: Icons.language,
                    title: Strings.language,
                    trailing: Strings.isFrench ? Strings.french : Strings.english,
                    onTap: _pickLanguage,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            _SectionLabel(Strings.securitySection),
            SectionCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _SimpleTile(
                    icon: Icons.shield_outlined,
                    title: Strings.security,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => SecurityScreen(appState: widget.appState)),
                    ),
                  ),
                  const Divider(height: 1, indent: 68),
                  _SimpleTile(
                    icon: Icons.visibility_off_outlined,
                    title: Strings.privacy,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => PrivacyControlsScreen(appState: widget.appState)),
                    ),
                  ),
                  const Divider(height: 1, indent: 68),
                  _SimpleTile(
                    icon: Icons.link,
                    title: Strings.linkedAccounts,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => LinkedAccountsScreen(appState: widget.appState)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            _SectionLabel(Strings.support),
            SectionCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _SimpleTile(
                    icon: Icons.help_outline,
                    title: Strings.helpCenter,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const HelpCenterScreen()),
                    ),
                  ),
                  const Divider(height: 1, indent: 68),
                  _SimpleTile(
                    icon: Icons.info_outline,
                    title: Strings.about,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const AboutScreen()),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _logout,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.errorContainer,
                  foregroundColor: AppColors.onErrorContainer,
                ),
                child: Text(Strings.logOut),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm, left: 4),
      child: Text(text, style: Theme.of(context).textTheme.labelMedium),
    );
  }
}

class _RowIcon extends StatelessWidget {
  const _RowIcon(this.icon);
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40, height: 40,
      decoration: BoxDecoration(color: AppColors.surfaceContainer, borderRadius: BorderRadius.circular(AppRadii.full)),
      child: Icon(icon, size: 20, color: AppColors.onSurfaceVariant),
    );
  }
}

class _SimpleTile extends StatelessWidget {
  const _SimpleTile({required this.icon, required this.title, this.trailing, this.onTap});
  final IconData icon;
  final String title;
  final String? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: _RowIcon(icon),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      trailing: trailing != null
          ? Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(trailing!, style: TextStyle(color: AppColors.outline)),
                const SizedBox(width: 4),
                Icon(Icons.chevron_right, color: AppColors.outline),
              ],
            )
          : Icon(Icons.chevron_right, color: AppColors.outline),
    );
  }
}
