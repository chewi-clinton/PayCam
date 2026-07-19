import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../state/app_state.dart';
import '../../widgets/common.dart';

class NotificationPreferencesScreen extends StatefulWidget {
  const NotificationPreferencesScreen({super.key, required this.appState});
  final AppState appState;

  @override
  State<NotificationPreferencesScreen> createState() => _NotificationPreferencesScreenState();
}

class _NotificationPreferencesScreenState extends State<NotificationPreferencesScreen> {
  @override
  Widget build(BuildContext context) {
    final settings = widget.appState.settings;
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.margin),
          children: [
            Text(
              'Choose how PayCam reaches you for payment requests and account activity.',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: AppSpacing.lg),
            SectionCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  SwitchListTile(
                    value: settings.pushNotifications,
                    onChanged: (v) => setState(() => settings.setPushNotifications(v)),
                    secondary: Icon(Icons.notifications_active_outlined, color: AppColors.primaryDark),
                    title: const Text('Push Notifications', style: TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: const Text('Payment requests, approvals, security alerts'),
                    activeThumbColor: AppColors.primary,
                  ),
                  const Divider(height: 1, indent: 68),
                  SwitchListTile(
                    value: settings.emailNotifications,
                    onChanged: (v) => setState(() => settings.setEmailNotifications(v)),
                    secondary: Icon(Icons.mail_outline, color: AppColors.primaryDark),
                    title: const Text('Email Notifications', style: TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: const Text('Receipts and account summaries'),
                    activeThumbColor: AppColors.primary,
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
