import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../l10n/strings.dart';

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status});
  final String status; // pending | success | failed | expired

  @override
  Widget build(BuildContext context) {
    late Color bg;
    late Color fg;
    late String label;
    switch (status) {
      case 'success':
        bg = AppColors.primary.withValues(alpha: 0.1);
        fg = AppColors.primary;
        label = Strings.filterSuccess;
        break;
      case 'pending':
        bg = AppColors.warningAmberContainer;
        fg = const Color(0xFF92600A);
        label = Strings.filterPending;
        break;
      case 'failed':
        bg = AppColors.errorContainer;
        fg = AppColors.onErrorContainer;
        label = Strings.filterFailed;
        break;
      default:
        bg = AppColors.surfaceContainerHigh;
        fg = AppColors.onSurfaceVariant;
        label = 'Expired';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(AppRadii.full)),
      child: Text(
        label,
        style: Theme.of(context)
            .textTheme
            .labelMedium
            ?.copyWith(color: fg, letterSpacing: 0.3),
      ),
    );
  }
}

class PinDotsField extends StatelessWidget {
  const PinDotsField({
    super.key,
    required this.controller,
    required this.focusNode,
    this.length = 4,
    this.autofocus = false,
    this.obscure = true,
    this.onChanged,
    this.onCompleted,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final int length;
  final bool autofocus;
  final bool obscure;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onCompleted;

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.centerLeft,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(length, (i) {
            return AnimatedBuilder(
              animation: controller,
              builder: (context, _) {
                final filled = controller.text.length > i;
                final active = controller.text.length == i && focusNode.hasFocus;
                return Container(
                  width: 56,
                  height: 64,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.inputFill,
                    borderRadius: BorderRadius.circular(AppRadii.md),
                    border: Border.all(
                      color: active ? AppColors.primary : Colors.transparent,
                      width: 2,
                    ),
                  ),
                  child: filled
                      ? Text(
                          obscure ? '•' : controller.text[i],
                          style: Theme.of(context).textTheme.headlineMedium,
                        )
                      : null,
                );
              },
            );
          }),
        ),
        Opacity(
          opacity: 0,
          child: TextField(
            controller: controller,
            focusNode: focusNode,
            autofocus: autofocus,
            keyboardType: TextInputType.number,
            maxLength: length,
            onChanged: (v) {
              onChanged?.call(v);
              if (v.length == length) onCompleted?.call(v);
            },
            decoration: const InputDecoration(counterText: ''),
          ),
        ),
      ],
    );
  }
}

class LabeledField extends StatelessWidget {
  const LabeledField({
    super.key,
    required this.label,
    required this.child,
  });

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: Theme.of(context).textTheme.labelMedium,
        ),
        const SizedBox(height: AppSpacing.sm),
        child,
      ],
    );
  }
}

class SectionCard extends StatelessWidget {
  const SectionCard({super.key, required this.child, this.padding});
  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(AppRadii.card),
        boxShadow: AppShadows.level1,
      ),
      child: child,
    );
  }
}

class ErrorBanner extends StatelessWidget {
  const ErrorBanner({super.key, required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.errorContainer,
        borderRadius: BorderRadius.circular(AppRadii.md),
      ),
      child: Text(
        message,
        style: TextStyle(color: AppColors.onErrorContainer, fontWeight: FontWeight.w500),
      ),
    );
  }
}

String formatCurrency(double amount, String currency) {
  if (currency == 'XAF') {
    final s = amount.toStringAsFixed(0);
    final buf = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      if (i != 0 && (s.length - i) % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    return 'XAF $buf';
  }
  if (currency == 'BTC') return '${amount.toStringAsFixed(8)} BTC';
  if (currency == 'ETH') return '${amount.toStringAsFixed(6)} ETH';
  if (currency == 'USDT') return '${amount.toStringAsFixed(2)} USDT';
  return '$currency ${amount.toStringAsFixed(2)}';
}

IconData paymentIcon(String method) {
  switch (method) {
    case 'crypto_btc':
    case 'crypto_eth':
    case 'crypto_usdt':
      return Icons.currency_bitcoin;
    case 'card':
      return Icons.credit_card;
    default:
      return Icons.storefront;
  }
}
