import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../state/app_state.dart';
import '../../widgets/common.dart';

class LinkedAccountsScreen extends StatelessWidget {
  const LinkedAccountsScreen({super.key, required this.appState});
  final AppState appState;

  @override
  Widget build(BuildContext context) {
    final user = appState.user;
    final wallet = appState.wallet;
    final crypto = appState.cryptoWallets;

    return Scaffold(
      appBar: AppBar(title: const Text('Linked Accounts')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.margin),
          children: [
            SectionCard(
              child: Row(
                children: [
                  Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      color: user?.network == 'ORANGE' ? AppColors.orangeBrand : AppColors.mtnYellow,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.phone_android, color: Colors.black87),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${user?.network ?? "MTN"} Mobile Money',
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                        Text(user != null ? '+${user.phoneNumber}' : '—'),
                      ],
                    ),
                  ),
                  if (wallet != null)
                    Text(formatCurrency(wallet.balance, 'XAF'), style: monoNumeric(weight: FontWeight.w700)),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            for (final w in crypto) ...[
              SectionCard(
                child: Row(
                  children: [
                    Icon(Icons.account_balance_wallet_outlined, color: AppColors.primaryDark),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(w.currency, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                          Text(
                            w.testnetAddress,
                            overflow: TextOverflow.ellipsis,
                            style: monoNumeric(size: 12, color: AppColors.outline),
                          ),
                        ],
                      ),
                    ),
                    Text(formatCurrency(w.balance, w.currency), style: monoNumeric(weight: FontWeight.w700)),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.md),
            ],
            if (crypto.isEmpty && wallet == null)
              const Padding(
                padding: EdgeInsets.only(top: AppSpacing.xl),
                child: Center(child: Text('No linked accounts yet.')),
              ),
          ],
        ),
      ),
    );
  }
}
