import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import 'welcome_screen.dart';
import '../main/main_shell.dart';
import 'login_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key, required this.appState});
  final AppState appState;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await widget.appState.restoreSession();
    await Future.delayed(const Duration(milliseconds: 1600));
    if (!mounted) return;

    Widget next;
    if (widget.appState.isAuthenticated) {
      next = MainShell(appState: widget.appState);
    } else if (widget.appState.phoneNumber != null) {
      next = LoginScreen(appState: widget.appState);
    } else {
      next = WelcomeScreen(appState: widget.appState);
    }

    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 500),
        pageBuilder: (_, anim, __) => FadeTransition(opacity: anim, child: next),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primaryDark,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 160,
              height: 160,
              child: Lottie.asset('assets/lottie/wallet_secure.json', repeat: true),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              Strings.appName,
              style: Theme.of(context).textTheme.displayLarge?.copyWith(
                    color: Colors.white,
                    fontSize: 36,
                  ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              Strings.welcomeSubtitle,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: Colors.white70),
            ),
          ],
        ),
      ),
    );
  }
}
