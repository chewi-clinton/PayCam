import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:paycam/main.dart';

/// Drives the real app through every screen on the actual device/
/// simulator using Flutter's own touch-injection binding — this runs
/// on-device, not a headless host test, so it verifies the app truly
/// renders and navigates correctly on the iPhone 17 Pro Max simulator.
///
/// Several screens run infinite animations (looping Lottie onboarding
/// clips, the payment-requests countdown timer), so `pumpAndSettle`
/// never returns — it waits for zero scheduled frames, which never
/// happens. `pumpUntilFound` polls with bounded fixed-duration pumps
/// instead, which works fine alongside continuous animation.
Future<void> pumpUntilFound(
  WidgetTester tester,
  Finder finder, {
  Duration timeout = const Duration(seconds: 10),
}) async {
  final end = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(end)) {
    if (finder.evaluate().isNotEmpty) return;
    await tester.pump(const Duration(milliseconds: 100));
  }
  expect(finder, findsOneWidget, reason: 'Timed out waiting for widget.');
}

/// Flushes a fixed window of frames — long enough to clear the default
/// ~300ms MaterialPageRoute push/pop transition — before the next hit
/// test, so taps don't land on a route that's still mid-animation.
Future<void> settle(WidgetTester tester) async {
  for (var i = 0; i < 6; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Demo walkthrough: onboarding skip → every main tab → logout', (tester) async {
    await tester.pumpWidget(const PayCamApp());

    // Splash -> Welcome (1.6s scripted delay + fade transition).
    await pumpUntilFound(tester, find.text('Welcome to the Future'));
    await settle(tester);

    // Skip straight into demo mode (no backend required).
    await tester.tap(find.text('Skip'));
    await pumpUntilFound(tester, find.text('Available Balance'));
    await settle(tester);

    // Home dashboard (balance card renders instantly; profile/name
    // fields fill in after the mock API's simulated latency).
    await pumpUntilFound(tester, find.textContaining('Jean'));
    await pumpUntilFound(tester, find.text('Recent Transactions'));

    // Pending-requests banner -> Payment Requests screen
    await pumpUntilFound(tester, find.textContaining('pending payment request'));
    await tester.tap(find.textContaining('pending payment request'));
    await pumpUntilFound(tester, find.text('Payment Requests'));
    await pumpUntilFound(tester, find.text('Acme Supermarket'));
    await settle(tester);

    // Approve the first request (mock latency ~500ms) and confirm it
    // drops off the list once the approve call resolves.
    await tester.tap(find.text('Approve').first);
    final approveEnd = DateTime.now().add(const Duration(seconds: 5));
    while (find.text('Acme Supermarket').evaluate().isNotEmpty &&
        DateTime.now().isBefore(approveEnd)) {
      await tester.pump(const Duration(milliseconds: 100));
    }
    expect(find.text('Acme Supermarket'), findsNothing);

    await tester.pageBack();
    await pumpUntilFound(tester, find.text('Available Balance'));
    await settle(tester);

    // Bottom nav: Wallet tab
    await tester.tap(find.text('Wallet'));
    await settle(tester);
    await pumpUntilFound(tester, find.text('Your Wallets'));
    await pumpUntilFound(tester, find.textContaining('MTN'));
    await pumpUntilFound(tester, find.text('BTC'));
    expect(find.text('ETH'), findsOneWidget);
    // USDT is the third crypto card — below the initial viewport in the
    // (lazily-laid-out) ListView, so scroll it into view before checking.
    await tester.drag(find.byType(ListView).first, const Offset(0, -600));
    await settle(tester);
    expect(find.text('USDT'), findsOneWidget);

    // Bottom nav: History tab
    await tester.tap(find.text('History'));
    await settle(tester);
    await pumpUntilFound(tester, find.text('Transaction History'));
    await pumpUntilFound(tester, find.text('Supermarché Central'));
    await tester.tap(find.text('Supermarché Central'));
    await settle(tester);
    await pumpUntilFound(tester, find.text('Transaction Details'));
    await tester.pageBack();
    await settle(tester);
    await pumpUntilFound(tester, find.text('Transaction History'));

    // Bottom nav: Profile tab
    await tester.tap(find.text('Profile'));
    await settle(tester);
    await pumpUntilFound(tester, find.text('Jean Pierre'));

    // Settings, then logout back to Welcome.
    await tester.tap(find.byIcon(Icons.settings_outlined));
    await settle(tester);
    await pumpUntilFound(tester, find.text('Settings'));
    await tester.tap(find.text('Log Out'));
    await settle(tester);
    await pumpUntilFound(tester, find.text('Welcome to the Future'));
  });
}
