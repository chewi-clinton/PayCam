import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import '../../models/models.dart';
import '../../widgets/common.dart';
import 'transaction_details_screen.dart';

class TransactionHistoryScreen extends StatefulWidget {
  const TransactionHistoryScreen({super.key, required this.appState});
  final AppState appState;

  @override
  State<TransactionHistoryScreen> createState() => _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen> {
  List<TransactionRecord> _all = [];
  bool _loading = true;
  String _filter = 'all'; // all | success | pending | failed — decoupled from display label

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _all = await widget.appState.api.transactions();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  List<TransactionRecord> get _filtered {
    switch (_filter) {
      case 'success':
        return _all.where((t) => t.status == 'success').toList();
      case 'pending':
        return _all.where((t) => t.status == 'pending').toList();
      case 'failed':
        return _all.where((t) => t.status == 'failed' || t.status == 'expired').toList();
      default:
        return _all;
    }
  }

  Map<String, List<TransactionRecord>> get _grouped {
    final map = <String, List<TransactionRecord>>{};
    final now = DateTime.now();
    for (final t in _filtered) {
      final d = t.createdAt;
      String key;
      if (d.year == now.year && d.month == now.month && d.day == now.day) {
        key = Strings.today;
      } else if (d.year == now.year &&
          d.month == now.month &&
          d.day == now.day - 1) {
        key = Strings.yesterday;
      } else {
        key = DateFormat('MMMM d, y').format(d);
      }
      map.putIfAbsent(key, () => []).add(t);
    }
    return map;
  }

  @override
  Widget build(BuildContext context) {
    final grouped = _grouped;
    final filters = [
      ('all', Strings.filterAll),
      ('success', Strings.filterSuccess),
      ('pending', Strings.filterPending),
      ('failed', Strings.filterFailed),
    ];

    return Scaffold(
      appBar: AppBar(title: Text(Strings.appName)),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.margin, vertical: AppSpacing.sm),
            children: [
              Text(Strings.transactionHistory, style: Theme.of(context).textTheme.headlineLarge),
              const SizedBox(height: AppSpacing.md),
              SizedBox(
                height: 40,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: filters.length,
                  separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.sm),
                  itemBuilder: (context, i) {
                    final (key, label) = filters[i];
                    final selected = key == _filter;
                    return GestureDetector(
                      onTap: () => setState(() => _filter = key),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 18),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: selected ? AppColors.primaryDark : AppColors.surfaceContainer,
                          borderRadius: BorderRadius.circular(AppRadii.full),
                        ),
                        child: Text(
                          label,
                          style: TextStyle(
                            color: selected ? Colors.white : AppColors.onSurfaceVariant,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              if (_loading && _all.isEmpty)
                const Padding(
                  padding: EdgeInsets.only(top: AppSpacing.xxl),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (grouped.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.xxl),
                  child: Center(
                    child: Text(Strings.noTransactions, style: Theme.of(context).textTheme.bodyLarge),
                  ),
                )
              else
                for (final entry in grouped.entries) ...[
                  Text(entry.key, style: Theme.of(context).textTheme.labelMedium),
                  const SizedBox(height: AppSpacing.sm),
                  for (final t in entry.value) ...[
                    _HistoryTile(
                      txn: t,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => TransactionDetailsScreen(txn: t)),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                  ],
                  const SizedBox(height: AppSpacing.sm),
                ],
            ],
          ),
        ),
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  const _HistoryTile({required this.txn, required this.onTap});
  final TransactionRecord txn;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isFailure = txn.status == 'failed' || txn.status == 'expired';
    return SectionCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: InkWell(
        onTap: onTap,
        child: Row(
          children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: isFailure
                    ? AppColors.errorContainer
                    : AppColors.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(AppRadii.full),
              ),
              child: Icon(
                isFailure ? Icons.priority_high_rounded : paymentIcon(txn.paymentMethod),
                color: isFailure ? AppColors.onErrorContainer : AppColors.primaryDark,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(txn.merchantName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  Text(
                    '${txn.description} • ${DateFormat.Hm().format(txn.createdAt)}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('-${formatCurrency(txn.amount, txn.currency)}',
                    style: monoNumeric(weight: FontWeight.w700)),
                const SizedBox(height: 4),
                StatusChip(status: txn.status),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
