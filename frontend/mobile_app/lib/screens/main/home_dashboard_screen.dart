import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import '../../models/models.dart';
import '../../widgets/common.dart';
import 'payment_requests_screen.dart';
import 'notifications_screen.dart';
import 'transaction_details_screen.dart';
import 'send_money_screen.dart';
import 'receive_money_screen.dart';

class HomeDashboardScreen extends StatefulWidget {
  const HomeDashboardScreen({super.key, required this.appState, required this.onNavigate});
  final AppState appState;
  final ValueChanged<int> onNavigate;

  @override
  State<HomeDashboardScreen> createState() => _HomeDashboardScreenState();
}

class _HomeDashboardScreenState extends State<HomeDashboardScreen> {
  List<PendingPayment> _pending = [];
  List<TransactionRecord> _recent = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      await widget.appState.loadProfile();
      final results = await Future.wait([
        widget.appState.api.pendingPayments(),
        widget.appState.api.transactions(),
      ]);
      _pending = results[0] as List<PendingPayment>;
      _recent = (results[1] as List<TransactionRecord>).take(3).toList();
    } catch (_) {
      // Silent — pull-to-refresh remains available; balance card falls back.
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.appState.user;
    final wallet = widget.appState.wallet;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.margin, AppSpacing.sm, AppSpacing.margin, 120),
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: AppColors.surfaceContainer,
                    child: Icon(Icons.person, color: AppColors.onSurfaceVariant),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      user != null ? 'Hi, ${user.fullName.split(' ').first}' : Strings.appName,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => NotificationsScreen(appState: widget.appState),
                      ),
                    ),
                    icon: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Icon(Icons.notifications_none_rounded, color: AppColors.primaryDark),
                        if (_pending.isNotEmpty)
                          Positioned(
                            right: -1,
                            top: -1,
                            child: Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(color: AppColors.error, shape: BoxShape.circle),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              _BalanceCard(loading: _loading, wallet: wallet, phone: user?.phoneNumber),
              const SizedBox(height: AppSpacing.lg),
              _QuickActions(appState: widget.appState, onNavigate: widget.onNavigate),
              const SizedBox(height: AppSpacing.lg),
              if (_pending.isNotEmpty) ...[
                GestureDetector(
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => PaymentRequestsScreen(appState: widget.appState),
                    ),
                  ).then((_) => _load()),
                  child: SectionCard(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    child: Row(
                      children: [
                        Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(
                            color: AppColors.warningAmberContainer,
                            borderRadius: BorderRadius.circular(AppRadii.full),
                          ),
                          child: const Icon(Icons.hourglass_top_rounded,
                              color: Color(0xFF92600A), size: 20),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Text(
                            Strings.pendingRequestsCount(_pending.length),
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                        Icon(Icons.chevron_right, color: AppColors.outline),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
              ],
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(Strings.recentTransactions, style: Theme.of(context).textTheme.titleLarge),
                  TextButton(
                    onPressed: () => widget.onNavigate(3),
                    child: Text(Strings.seeAll),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),
              if (_recent.isEmpty && !_loading)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
                  child: Text(Strings.noTransactionsYet, style: Theme.of(context).textTheme.bodyMedium),
                )
              else
                SectionCard(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      for (int i = 0; i < _recent.length; i++) ...[
                        _TransactionTile(
                          txn: _recent[i],
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => TransactionDetailsScreen(txn: _recent[i]),
                            ),
                          ),
                        ),
                        if (i != _recent.length - 1) const Divider(height: 1, indent: 68),
                      ],
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  const _BalanceCard({required this.loading, required this.wallet, required this.phone});
  final bool loading;
  final Wallet? wallet;
  final String? phone;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primaryDark, AppColors.primary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppRadii.xl),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(Strings.availableBalance, style: const TextStyle(color: Colors.white70, fontSize: 14)),
          const SizedBox(height: AppSpacing.sm),
          loading && wallet == null
              ? const SizedBox(
                  height: 40, width: 40,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                )
              : Text(
                  formatCurrency(wallet?.balance ?? 0, 'XAF'),
                  style: monoNumeric(size: 34, weight: FontWeight.w800, color: Colors.white),
                ),
          if (phone != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(AppRadii.full),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.smartphone, size: 14, color: Colors.white),
                  const SizedBox(width: 6),
                  Text('+$phone', style: const TextStyle(color: Colors.white, fontSize: 13)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions({required this.appState, required this.onNavigate});
  final AppState appState;
  final ValueChanged<int> onNavigate;

  @override
  Widget build(BuildContext context) {
    final actions = [
      (icon: Icons.arrow_upward_rounded, label: Strings.send, key: 'send'),
      (icon: Icons.arrow_downward_rounded, label: Strings.receive, key: 'receive'),
      (icon: Icons.qr_code_scanner_rounded, label: Strings.scanQr, key: 'scan'),
      (icon: Icons.history_rounded, label: Strings.history, key: 'history'),
    ];
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: actions.map((a) {
        return GestureDetector(
          onTap: () {
            switch (a.key) {
              case 'scan':
                onNavigate(2);
                break;
              case 'history':
                onNavigate(3);
                break;
              case 'receive':
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => ReceiveMoneyScreen(appState: appState)),
                );
                break;
              case 'send':
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => SendMoneyScreen(appState: appState)),
                );
                break;
            }
          },
          child: Column(
            children: [
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainer,
                  borderRadius: BorderRadius.circular(AppRadii.full),
                ),
                child: Icon(a.icon, color: AppColors.primaryDark),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(a.label, style: Theme.of(context).textTheme.bodyMedium),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  const _TransactionTile({required this.txn, required this.onTap});
  final TransactionRecord txn;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 4),
      leading: Container(
        width: 40, height: 40,
        decoration: BoxDecoration(
          color: AppColors.surfaceContainer,
          borderRadius: BorderRadius.circular(AppRadii.full),
        ),
        child: Icon(paymentIcon(txn.paymentMethod), size: 18, color: AppColors.primaryDark),
      ),
      title: Text(txn.merchantName, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(txn.description, maxLines: 1, overflow: TextOverflow.ellipsis),
      trailing: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '-${formatCurrency(txn.amount, txn.currency)}',
            style: monoNumeric(weight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          StatusChip(status: txn.status),
        ],
      ),
    );
  }
}
