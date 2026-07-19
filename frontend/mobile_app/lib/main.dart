import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'theme/app_theme.dart';
import 'l10n/strings.dart';
import 'state/app_state.dart';
import 'screens/onboarding/splash_screen.dart';

void main() {
  runApp(const PayCamApp());
}

class PayCamApp extends StatefulWidget {
  const PayCamApp({super.key});

  @override
  State<PayCamApp> createState() => _PayCamAppState();
}

class _PayCamAppState extends State<PayCamApp> {
  final _appState = AppState();

  @override
  void initState() {
    super.initState();
    _appState.settings.addListener(_onSettingsChanged);
    _appState.settings.load();
  }

  void _onSettingsChanged() {
    // AppColors and Strings are brightness/language-aware getters, not
    // context-plumbed values, so an already-built screen (e.g. Settings,
    // several routes deep) won't repaint just because MaterialApp gets
    // a new `theme:` — nothing marks its Element dirty. reassembleApplication
    // is Flutter's own hot-reload mechanism for exactly this: it walks
    // the whole element tree and calls markNeedsBuild() everywhere,
    // WITHOUT disposing State or the Navigator's route stack. A ValueKey
    // on MaterialApp would force the same repaint but by tearing down
    // and rebuilding the entire Navigator — which drops the user back
    // to the splash screen on every toggle. This doesn't.
    setState(() {});
    SchedulerBinding.instance.addPostFrameCallback((_) {
      WidgetsBinding.instance.reassembleApplication();
    });
  }

  @override
  void dispose() {
    _appState.settings.removeListener(_onSettingsChanged);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final settings = _appState.settings;
    AppColors.setDark(settings.isDark);
    Strings.setLanguage(settings.languageCode);

    return MaterialApp(
      title: 'PayCam',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.themeFor(settings.isDark),
      home: SplashScreen(appState: _appState),
    );
  }
}
