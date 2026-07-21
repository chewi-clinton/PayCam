import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

class HelpCenterScreen extends StatelessWidget {
  const HelpCenterScreen({super.key});

  static const _faqs = [
    (
      q: 'Why does approving a payment need a PIN and OTP?',
      a: 'Logging in always requires both — once you\'re inside the app, '
          'approving or declining a specific payment needs neither, since '
          'you\'re already authenticated for that 5-minute session.',
    ),
    (
      q: 'Is this real money?',
      a: 'No. PayCam is a simulated payment gateway for students. Wallet '
          'balances come from the sandbox faucet and cannot be withdrawn or '
          'exchanged for anything of value.',
    ),
    (
      q: 'Why was my account locked?',
      a: '3 incorrect PIN or OTP attempts locks the account for 10 minutes, '
          'matching how PayCam\'s backend enforces this server-side.',
    ),
    (
      q: 'My crypto wallet address looks unfamiliar — is that normal?',
      a: 'Yes. PayCam generates a fresh BTC/ETH/USDT testnet address for you '
          'at registration. Only PayCam-generated addresses are accepted for '
          'crypto payments — external wallets are rejected.',
    ),
    (
      q: 'How do I get test funds?',
      a: 'Ask the merchant integrating PayCam to call the sandbox faucet '
          'endpoint for your phone number — it credits XAF 10,000 once per '
          'day. There\'s no in-app faucet button for customers.',
    ),
  ];

  Future<void> _emailSupport() async {
    final uri = Uri(
      scheme: 'mailto',
      path: 'support@paycam.cm',
      query: 'subject=${Uri.encodeComponent('PayCam support request')}',
    );
    await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Help Center')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.margin),
          children: [
            Text('Frequently Asked Questions', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: AppSpacing.md),
            SectionCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  for (int i = 0; i < _faqs.length; i++) ...[
                    Theme(
                      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                      child: ExpansionTile(
                        title: Text(_faqs[i].q, style: const TextStyle(fontWeight: FontWeight.w600)),
                        childrenPadding:
                            const EdgeInsets.fromLTRB(AppSpacing.md, 0, AppSpacing.md, AppSpacing.md),
                        expandedCrossAxisAlignment: CrossAxisAlignment.start,
                        children: [Text(_faqs[i].a, style: Theme.of(context).textTheme.bodyMedium)],
                      ),
                    ),
                    if (i != _faqs.length - 1) const Divider(height: 1),
                  ],
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            ElevatedButton.icon(
              onPressed: _emailSupport,
              icon: const Icon(Icons.mail_outline, size: 18),
              label: const Text('Email Support'),
            ),
          ],
        ),
      ),
    );
  }
}
