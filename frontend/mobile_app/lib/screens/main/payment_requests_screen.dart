import 'dart:async';
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import '../../models/models.dart';
import '../../services/api_client.dart';
import '../../widgets/common.dart';

class PaymentRequestsScreen extends StatefulWidget {
  const PaymentRequestsScreen({super.key, required this.appState});
  final AppState appState;

  @override
  State<PaymentRequestsScreen> createState() => _PaymentRequestsScreenState();
}

class _PaymentRequestsScreenState extends State<PaymentRequestsScreen> {
  List<PendingPayment> _requests = [];
  bool _loading = true;
  final Set<String> _busy = {};
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _load();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) => setState(() {}));
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _requests = await widget.appState.api.pendingPayments();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _act(PendingPayment p, bool approve) async {
    setState(() => _busy.add(p.reference));
    try {
      if (approve) {
        await widget.appState.api.approvePayment(p.reference);
        if (mounted) {
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text(Strings.paymentApproved)));
        }
      } else {
        await widget.appState.api.declinePayment(p.reference);
        if (mounted) {
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text(Strings.paymentDeclined)));
        }
      }
      setState(() => _requests.removeWhere((r) => r.reference == p.reference));
      widget.appState.loadProfile();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _busy.remove(p.reference));
    }
  }

  String _countdown(DateTime expiresAt) {
    final diff = expiresAt.difference(DateTime.now());
    if (diff.isNegative) return 'Expired';
    final m = diff.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = diff.inSeconds.remainder(60).toString().padLeft(2, '0');
    return diff.inMinutes < 1 ? '$m:$s min left' : 'Expires in $m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(Strings.appName)),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.margin, vertical: AppSpacing.sm),
            children: [
              Text(Strings.paymentRequests, style: Theme.of(context).textTheme.headlineLarge),
              const SizedBox(height: 4),
              Text(
                _loading ? Strings.loading : Strings.pendingRequestsSubtitle(_requests.length),
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: AppSpacing.lg),
              if (!_loading && _requests.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.xxl),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.inbox_outlined, size: 48, color: AppColors.outline),
                        const SizedBox(height: AppSpacing.sm),
                        Text(Strings.noPendingRequests, style: Theme.of(context).textTheme.bodyLarge),
                      ],
                    ),
                  ),
                ),
              for (final p in _requests) ...[
                _RequestCard(
                  request: p,
                  countdown: _countdown(p.expiresAt),
                  urgent: p.expiresAt.difference(DateTime.now()).inMinutes < 5,
                  busy: _busy.contains(p.reference),
                  expired: p.isExpired,
                  onApprove: () => _act(p, true),
                  onDecline: () => _act(p, false),
                ),
                const SizedBox(height: AppSpacing.md),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  const _RequestCard({
    required this.request,
    required this.countdown,
    required this.urgent,
    required this.busy,
    required this.expired,
    required this.onApprove,
    required this.onDecline,
  });

  final PendingPayment request;
  final String countdown;
  final bool urgent;
  final bool busy;
  final bool expired;
  final VoidCallback onApprove;
  final VoidCallback onDecline;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(AppRadii.card),
        border: urgent ? Border.all(color: AppColors.error.withValues(alpha: 0.4)) : null,
        boxShadow: AppShadows.level1,
      ),
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainer,
                  borderRadius: BorderRadius.circular(AppRadii.full),
                ),
                child: Icon(
                  request.isCrypto ? Icons.currency_bitcoin : Icons.storefront,
                  color: AppColors.primaryDark,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(request.merchantName,
                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                    if (request.description.isNotEmpty)
                      Text(request.description, style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    formatCurrency(request.amount, request.currency),
                    style: monoNumeric(size: 17, weight: FontWeight.w700),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    countdown,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: urgent ? AppColors.error : AppColors.outline,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: busy || expired ? null : onDecline,
                  style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                  child: Text(Strings.decline),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: ElevatedButton(
                  onPressed: busy || expired ? null : onApprove,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    minimumSize: const Size.fromHeight(48),
                  ),
                  child: busy
                      ? const SizedBox(
                          height: 18, width: 18,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Text(Strings.approve),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
