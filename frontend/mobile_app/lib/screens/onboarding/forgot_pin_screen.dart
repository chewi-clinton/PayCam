import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../theme/app_theme.dart';

/// PayCam's backend only supports changing your PIN when you already
/// know the current one (old PIN + OTP — see ChangePinScreen). There's
/// no self-service "reset without the old PIN" endpoint, so this
/// screen is honest about that rather than faking a reset flow.
class ForgotPinScreen extends StatelessWidget {
  const ForgotPinScreen({super.key});

  Future<void> _emailSupport() async {
    final uri = Uri(
      scheme: 'mailto',
      path: 'support@paycam.cm',
      query: 'subject=${Uri.encodeComponent('PIN recovery request')}',
    );
    await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.margin),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.lock_reset, size: 48, color: AppColors.outline),
              const SizedBox(height: AppSpacing.md),
              Text(
                'PIN Recovery',
                style: Theme.of(context).textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'For your security, PayCam can only change your PIN when you already '
                'know the current one (Profile → Change PIN). There is no self-service '
                'reset without it — contact support to verify your identity and regain access.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: AppSpacing.lg),
              ElevatedButton.icon(
                onPressed: _emailSupport,
                icon: const Icon(Icons.mail_outline, size: 18),
                label: const Text('Contact Support'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
