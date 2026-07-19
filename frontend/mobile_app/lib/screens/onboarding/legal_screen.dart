import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

/// In-app Terms & Privacy content. PayCam has no live public site
/// (per the project docs, paycam.cm is illustrative, not deployed),
/// so these render locally instead of linking out to a page that
/// wouldn't resolve.
class LegalScreen extends StatelessWidget {
  const LegalScreen({super.key, required this.kind});

  final LegalKind kind;

  @override
  Widget build(BuildContext context) {
    final isTerms = kind == LegalKind.terms;
    return Scaffold(
      appBar: AppBar(title: Text(isTerms ? 'Terms of Service' : 'Privacy Policy')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.margin),
          children: [
            Text(
              isTerms ? 'Terms of Service' : 'Privacy Policy',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'PayCam — Educational Project · Version 3.0.0',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.lg),
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainer,
                borderRadius: BorderRadius.circular(AppRadii.md),
              ),
              child: const Text(
                'PayCam is a simulated payment gateway built for educational purposes. '
                'It does not process real money and is not licensed by any financial '
                'regulator. All balances, cards, and MoMo transactions are test data.',
                style: TextStyle(fontWeight: FontWeight.w500),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            if (isTerms) ..._termsSections else ..._privacySections,
            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }

  static final _termsSections = const [
    _Section(
      title: '1. Nature of the service',
      body: 'PayCam simulates Mobile Money, card, and crypto payment flows for '
          'students to integrate against. No real MTN/Orange Money integration '
          'exists, and PayCam-owned test cards are used instead of Stripe.',
    ),
    _Section(
      title: '2. Your account',
      body: 'You register with a phone number, PIN, and email. You are responsible '
          'for keeping your PIN confidential. PayCam locks your account for 10 '
          'minutes after 3 incorrect PIN or OTP attempts.',
    ),
    _Section(
      title: '3. Test funds only',
      body: 'Wallet balances are credited via the sandbox faucet and are not real '
          'currency. They cannot be withdrawn, transferred off-platform, or '
          'exchanged for anything of value.',
    ),
    _Section(
      title: '4. Acceptable use',
      body: 'PayCam is provided for learning and integration testing. Do not use '
          'it to represent real financial transactions to third parties.',
    ),
  ];

  static final _privacySections = const [
    _Section(
      title: '1. What we collect',
      body: 'Your full name, phone number, email address, and a hashed PIN. Card '
          'and crypto payment details use PayCam-owned test data only.',
    ),
    _Section(
      title: '2. How OTPs are delivered',
      body: 'One-time passwords are sent to your registered email via Brevo. No '
          'SMS provider is used, and no data is shared with mobile carriers.',
    ),
    _Section(
      title: '3. Data retention',
      body: 'Test account data may be reset periodically as part of maintaining '
          'this educational sandbox. Do not store anything you need permanently.',
    ),
    _Section(
      title: '4. Contact',
      body: 'Questions about this policy can be directed to the project maintainers '
          'listed in the PayCam repository.',
    ),
  ];
}

enum LegalKind { terms, privacy }

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.body});
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          const SizedBox(height: 6),
          Text(body, style: Theme.of(context).textTheme.bodyLarge),
        ],
      ),
    );
  }
}
