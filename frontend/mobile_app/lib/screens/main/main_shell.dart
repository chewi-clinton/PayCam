import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import 'home_dashboard_screen.dart';
import 'wallet_screen.dart';
import 'qr_scanner_screen.dart';
import 'transaction_history_screen.dart';
import 'profile_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key, required this.appState});
  final AppState appState;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  void goTo(int index) => setState(() => _index = index);

  @override
  Widget build(BuildContext context) {
    // The QR tab is built on demand rather than kept alive in the
    // IndexedStack below — mobile_scanner opens the camera (and
    // triggers the OS permission prompt) as soon as it's mounted, so
    // eagerly building it here would fire that prompt on first launch
    // instead of when the user actually taps Scan. Leaving the tab
    // disposes it, which stops the camera.
    final body = _index == 2
        ? QrScannerScreen(appState: widget.appState)
        : IndexedStack(
            index: _index > 2 ? _index - 1 : _index,
            children: [
              HomeDashboardScreen(appState: widget.appState, onNavigate: goTo),
              WalletScreen(appState: widget.appState),
              TransactionHistoryScreen(appState: widget.appState),
              ProfileScreen(appState: widget.appState),
            ],
          );

    return Scaffold(
      body: body,
      bottomNavigationBar: _BottomNav(index: _index, onTap: goTo),
    );
  }
}

class _BottomNav extends StatelessWidget {
  const _BottomNav({required this.index, required this.onTap});
  final int index;
  final ValueChanged<int> onTap;

  static List<({IconData icon, String label})> get _items => [
        (icon: Icons.home_rounded, label: Strings.navHome),
        (icon: Icons.account_balance_wallet_rounded, label: Strings.navWallet),
        (icon: Icons.qr_code_scanner_rounded, label: Strings.navScan),
        (icon: Icons.history_rounded, label: Strings.navHistory),
        (icon: Icons.person_rounded, label: Strings.navProfile),
      ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        boxShadow: AppShadows.level1,
      ),
      child: SafeArea(
        child: SizedBox(
          height: 64,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(_items.length, (i) {
              final selected = i == index;
              final item = _items[i];
              return GestureDetector(
                onTap: () => onTap(i),
                behavior: HitTestBehavior.opaque,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
                      decoration: BoxDecoration(
                        color: selected ? AppColors.primary : Colors.transparent,
                        borderRadius: BorderRadius.circular(AppRadii.full),
                      ),
                      child: Icon(
                        item.icon,
                        color: selected ? Colors.white : AppColors.onSurfaceVariant,
                        size: 24,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.label,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                        color: selected ? AppColors.primaryDark : AppColors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}
