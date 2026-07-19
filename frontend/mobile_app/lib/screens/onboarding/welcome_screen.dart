import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import 'registration_screen.dart';
import 'login_screen.dart';
import 'legal_screen.dart';
import '../main/main_shell.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key, required this.appState});
  final AppState appState;

  void _skipToDemo(BuildContext context) {
    appState.enableDemoMode();
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => MainShell(appState: appState)),
      (route) => false,
    );
  }

  void _openLegal(BuildContext context, LegalKind kind) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => LegalScreen(kind: kind)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.margin),
          child: Column(
            children: [
              const SizedBox(height: AppSpacing.lg),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Image.asset('assets/images/logo_transparent.png', width: 32, height: 32),
                      const SizedBox(width: AppSpacing.sm),
                      Text(Strings.appName, style: Theme.of(context).textTheme.headlineMedium),
                    ],
                  ),
                  TextButton(
                    onPressed: () => _skipToDemo(context),
                    child: Text(Strings.skip),
                  ),
                ],
              ),
              const Spacer(),
              SizedBox(
                height: 260,
                child: Lottie.asset('assets/lottie/crypto_growth.json', repeat: true),
              ),
              const Spacer(),
              Text(
                Strings.welcomeTitle,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                Strings.welcomeSubtitle,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: AppSpacing.xl),
              ElevatedButton(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => RegistrationScreen(appState: appState),
                  ),
                ),
                child: Text(Strings.createAccount),
              ),
              const SizedBox(height: AppSpacing.sm),
              OutlinedButton(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => LoginScreen(appState: appState)),
                ),
                child: Text(Strings.login),
              ),
              const SizedBox(height: AppSpacing.md),
              RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: AppColors.outline),
                  children: [
                    TextSpan(text: Strings.agreePrefix),
                    TextSpan(
                      text: Strings.terms,
                      style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                      recognizer: TapGestureRecognizer()
                        ..onTap = () => _openLegal(context, LegalKind.terms),
                    ),
                    TextSpan(text: Strings.and_),
                    TextSpan(
                      text: Strings.privacyPolicy,
                      style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                      recognizer: TapGestureRecognizer()
                        ..onTap = () => _openLegal(context, LegalKind.privacy),
                    ),
                    const TextSpan(text: '.'),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
            ],
          ),
        ),
      ),
    );
  }
}
