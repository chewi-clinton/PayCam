import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../models/models.dart';
import '../../widgets/common.dart';

class TransactionDetailsScreen extends StatelessWidget {
  const TransactionDetailsScreen({super.key, required this.txn});
  final TransactionRecord txn;

  String _receiptText() {
    final dateStr = DateFormat('MMM d, y  •  HH:mm').format(txn.createdAt);
    return 'PayCam Receipt\n'
        '----------------\n'
        'Merchant: ${txn.merchantName}\n'
        'Amount: ${formatCurrency(txn.amount, txn.currency)}\n'
        'Payment Method: ${_methodLabel(txn.paymentMethod)}\n'
        'Status: ${txn.status[0].toUpperCase()}${txn.status.substring(1)}\n'
        'Date: $dateStr\n'
        'Reference: ${txn.reference}';
  }

  Future<void> _reportIssue() async {
    final uri = Uri(
      scheme: 'mailto',
      path: 'support@paycam.cm',
      query: 'subject=${Uri.encodeComponent('Issue with transaction ${txn.reference}')}'
          '&body=${Uri.encodeComponent(_receiptText())}',
    );
    await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    final success = txn.status == 'success';
    final failed = txn.status == 'failed' || txn.status == 'expired';
    final statusLabel = success
        ? Strings.paymentSuccessful
        : failed
            ? (txn.status == 'expired' ? Strings.paymentExpired : Strings.paymentFailed)
            : Strings.paymentPending;
    final statusColor = success
        ? AppColors.primaryDark
        : failed
            ? AppColors.error
            : const Color(0xFF92600A);
    final statusIcon = success
        ? Icons.check_circle
        : failed
            ? Icons.error
            : Icons.hourglass_top_rounded;

    return Scaffold(
      appBar: AppBar(title: Text(Strings.transactionDetails)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.margin, vertical: AppSpacing.lg),
          children: [
            Center(
              child: Container(
                width: 88, height: 88,
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(statusIcon, color: statusColor, size: 44),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(statusLabel, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 4),
            Text(
              DateFormat('MMM d, y  •  HH:mm').format(txn.createdAt),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.lg),
            Center(
              child: Text(
                '-${formatCurrency(txn.amount, txn.currency)}',
                style: monoNumeric(size: 36, weight: FontWeight.w800),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            SectionCard(
              child: Column(
                children: [
                  _row(context, Strings.merchant, txn.merchantName),
                  const Divider(height: AppSpacing.lg),
                  _row(context, Strings.paymentMethod, _methodLabel(txn.paymentMethod)),
                  const Divider(height: AppSpacing.lg),
                  _row(context, Strings.amount, formatCurrency(txn.amount, txn.currency)),
                  const Divider(height: AppSpacing.lg),
                  _row(context, Strings.status, txn.status[0].toUpperCase() + txn.status.substring(1)),
                  const Divider(height: AppSpacing.lg),
                  GestureDetector(
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: txn.reference));
                      ScaffoldMessenger.of(context)
                          .showSnackBar(SnackBar(content: Text(Strings.referenceCopied)));
                    },
                    child: _row(context, Strings.referenceNumber, txn.reference, mono: true),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            ElevatedButton.icon(
              onPressed: () => SharePlus.instance.share(
                ShareParams(text: _receiptText(), subject: 'PayCam Receipt — ${txn.reference}'),
              ),
              icon: const Icon(Icons.download_rounded, size: 18),
              label: Text(Strings.downloadReceipt),
            ),
            const SizedBox(height: AppSpacing.md),
            Center(
              child: TextButton(
                onPressed: _reportIssue,
                child: Text(Strings.reportAnIssue),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _methodLabel(String method) {
    switch (method) {
      case 'mtn_momo':
        return 'MTN Mobile Money';
      case 'orange_money':
        return 'Orange Money';
      case 'card':
        return 'Card';
      case 'crypto_btc':
        return 'Bitcoin';
      case 'crypto_eth':
        return 'Ethereum';
      case 'crypto_usdt':
        return 'Tether USDT';
      default:
        return method;
    }
  }

  Widget _row(BuildContext context, String label, String value, {bool mono = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: mono
                ? monoNumeric(size: 14, weight: FontWeight.w600)
                : const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}
