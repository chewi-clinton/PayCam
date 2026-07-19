import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import '../../widgets/common.dart';
import '../onboarding/welcome_screen.dart';
import 'settings_screen.dart';
import 'security_screen.dart';
import 'change_pin_screen.dart';
import 'notification_preferences_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key, required this.appState});
  final AppState appState;

  void _logout(BuildContext context) {
    appState.logout();
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => WelcomeScreen(appState: appState)),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = appState.user;

    return Scaffold(
      appBar: AppBar(
        title: Text(Strings.appName),
        actions: [
          IconButton(
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => SettingsScreen(appState: appState)),
            ),
            icon: Icon(Icons.settings_outlined, color: AppColors.primaryDark),
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.margin, vertical: AppSpacing.lg),
          children: [
            Center(
              child: Container(
                width: 100, height: 100,
                decoration: BoxDecoration(color: AppColors.surfaceContainer, shape: BoxShape.circle),
                child: Icon(Icons.person, size: 48, color: AppColors.onSurfaceVariant),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Center(
              child: Text(user?.fullName ?? '—', style: Theme.of(context).textTheme.headlineMedium),
            ),
            const SizedBox(height: 4),
            Center(
              child: Text(
                user != null ? '+${user.phoneNumber}' : '',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            _ProfileTile(
              icon: Icons.shield_outlined,
              title: Strings.security,
              subtitle: Strings.securitySubtitle,
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => SecurityScreen(appState: appState)),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            _ProfileTile(
              icon: Icons.notifications_none_rounded,
              title: Strings.notifications,
              subtitle: Strings.notificationsSubtitle,
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => NotificationPreferencesScreen(appState: appState)),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            _ProfileTile(
              icon: Icons.password_rounded,
              title: Strings.changePin,
              subtitle: Strings.changePinSubtitle,
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => ChangePinScreen(appState: appState)),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            SectionCard(
              padding: EdgeInsets.zero,
              child: InkWell(
                onTap: () => _logout(context),
                borderRadius: BorderRadius.circular(AppRadii.card),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                  child: Center(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.logout, color: AppColors.error, size: 18),
                        const SizedBox(width: 8),
                        Text(Strings.logout,
                            style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileTile extends StatelessWidget {
  const _ProfileTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.trailing,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 4),
      child: ListTile(
        onTap: onTap,
        contentPadding: EdgeInsets.zero,
        leading: Container(
          width: 40, height: 40,
          decoration: BoxDecoration(color: AppColors.surfaceContainer, borderRadius: BorderRadius.circular(AppRadii.full)),
          child: Icon(icon, color: AppColors.primaryDark, size: 20),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(subtitle),
        trailing: trailing ?? Icon(Icons.chevron_right, color: AppColors.outline),
      ),
    );
  }
}
