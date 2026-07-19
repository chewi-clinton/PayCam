import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import '../../models/models.dart';
import '../../services/api_client.dart';
import '../../widgets/common.dart';

/// PayCam has no dedicated notifications-feed endpoint, so this screen
/// is derived client-side from pending payment requests (actionable)
/// and recent transaction status changes (informational) — the same
/// data the Home screen already pulls from /app/payments/pending/ and
/// /app/transactions/.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key, required this.appState});
  final AppState appState;

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<PendingPayment> _pending = [];
  List<TransactionRecord> _recent = [];
  bool _loading = true;
  final Set<String> _busy = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        widget.appState.api.pendingPayments(),
        widget.appState.api.transactions(),
      ]);
      _pending = results[0] as List<PendingPayment>;
      _recent = (results[1] as List<TransactionRecord>)
          .where((t) => t.status != 'pending')
          .take(8)
          .toList();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _act(PendingPayment p, bool approve) async {
    setState(() => _busy.add(p.reference));
    try {
      if (approve) {
        await widget.appState.api.approvePayment(p.reference);
      } else {
        await widget.appState.api.declinePayment(p.reference);
      }
      widget.appState.loadProfile();
      await _load();
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy.remove(p.reference));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(Strings.notifications, style: const TextStyle(color: AppColors.primary)),
        leading: const BackButton(),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.done_all)),
        ],
      ),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _load,
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.margin, vertical: AppSpacing.sm),
                  children: [
                    for (final p in _pending)
                      _NotificationCard(
                        icon: Icons.call_received_rounded,
                        iconBg: AppColors.surfaceContainer,
                        iconColor: AppColors.primaryDark,
                        title: Strings.incomingRequest,
                        time: _relativeTime(p.expiresAt.subtract(const Duration(minutes: 15))),
                        body: '${p.merchantName} is requesting ${formatCurrency(p.amount, p.currency)}'
                            '${p.description.isNotEmpty ? ' for ${p.description}' : ''}.',
                        highlighted: true,
                        actions: (
                          approve: _busy.contains(p.reference) ? null : () => _act(p, true),
                          decline: _busy.contains(p.reference) ? null : () => _act(p, false),
                        ),
                      ),
                    for (final t in _recent)
                      _NotificationCard(
                        icon: t.status == 'success' ? Icons.check_circle : Icons.error,
                        iconBg: t.status == 'success'
                            ? AppColors.primary.withValues(alpha: 0.12)
                            : AppColors.errorContainer,
                        iconColor: t.status == 'success' ? AppColors.primaryDark : AppColors.error,
                        title: t.status == 'success' ? Strings.paymentApprovedTitle : Strings.paymentDeclinedTitle,
                        time: _relativeTime(t.createdAt),
                        body: t.status == 'success'
                            ? 'Your payment of ${formatCurrency(t.amount, t.currency)} to ${t.merchantName} was successful.'
                            : 'Your transaction at ${t.merchantName} for ${formatCurrency(t.amount, t.currency)} was ${t.status}.',
                      ),
                    if (_pending.isEmpty && _recent.isEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: AppSpacing.xxl),
                        child: Center(
                          child: Text(Strings.noNotificationsYet, style: Theme.of(context).textTheme.bodyLarge),
                        ),
                      ),
                  ],
                ),
              ),
      ),
    );
  }

  String _relativeTime(DateTime t) {
    final diff = DateTime.now().difference(t);
    if (diff.inMinutes < 1) return Strings.justNow;
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return DateFormat('MMM d').format(t);
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.title,
    required this.time,
    required this.body,
    this.highlighted = false,
    this.actions,
  });

  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String title;
  final String time;
  final String body;
  final bool highlighted;
  final ({VoidCallback? approve, VoidCallback? decline})? actions;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(AppRadii.card),
        border: Border(
          left: BorderSide(
            color: highlighted ? AppColors.primary : Colors.transparent,
            width: 4,
          ),
        ),
        boxShadow: AppShadows.level1,
      ),
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    ),
                    Text(time,
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: highlighted ? AppColors.primaryDark : AppColors.outline)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(body, style: Theme.of(context).textTheme.bodyMedium),
                if (actions != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    children: [
                      ElevatedButton(
                        onPressed: actions!.approve,
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(80, 36),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                        ),
                        child: Text(Strings.pay),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      OutlinedButton(
                        onPressed: actions!.decline,
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(80, 36),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                        ),
                        child: Text(Strings.decline),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
