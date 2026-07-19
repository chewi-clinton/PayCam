import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../onboarding/legal_screen.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('About')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.margin),
          children: [
            Center(
              child: Image.asset('assets/images/logo_transparent.png', width: 72, height: 72),
            ),
            const SizedBox(height: AppSpacing.md),
            const Center(
              child: Text('PayCam', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
            ),
            const SizedBox(height: 4),
            const Center(child: Text('Version 3.0.0 · Educational Project')),
            const SizedBox(height: AppSpacing.xl),
            const Text(
              'PayCam is a fully simulated payment gateway platform built for '
              'educational purposes, replicating the experience of platforms '
              'like Fapshi, CamPay, NotchPay, and Stripe for students across '
              'Africa learning to integrate payment infrastructure.',
            ),
            const SizedBox(height: AppSpacing.lg),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.description_outlined, color: AppColors.primaryDark),
              title: const Text('Terms of Service'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const LegalScreen(kind: LegalKind.terms)),
              ),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.privacy_tip_outlined, color: AppColors.primaryDark),
              title: const Text('Privacy Policy'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const LegalScreen(kind: LegalKind.privacy)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
