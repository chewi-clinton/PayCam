import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import '../../widgets/common.dart';

class SendMoneyScreen extends StatefulWidget {
  const SendMoneyScreen({super.key, required this.appState});
  final AppState appState;

  @override
  State<SendMoneyScreen> createState() => _SendMoneyScreenState();
}

class _SendMoneyScreenState extends State<SendMoneyScreen> {
  final _phoneCtrl = TextEditingController();
  final _amountCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();
  String? _error;
  bool _sending = false;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _amountCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  Future<void> _reviewAndSend() async {
    final amount = double.tryParse(_amountCtrl.text.trim());
    if (_phoneCtrl.text.trim().length < 9) {
      setState(() => _error = 'Enter a valid recipient phone number.');
      return;
    }
    if (amount == null || amount <= 0) {
      setState(() => _error = 'Enter a valid amount.');
      return;
    }
    setState(() => _error = null);

    final pin = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _PinConfirmSheet(
        recipient: _phoneCtrl.text.trim(),
        amount: amount,
      ),
    );
    if (pin == null || !mounted) return;

    setState(() => _sending = true);
    try {
      await widget.appState.api.sendMoney(
        recipientPhone: _phoneCtrl.text.trim(),
        amount: amount,
        note: _noteCtrl.text.trim(),
      );
      await widget.appState.loadProfile();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(Strings.moneySent)));
      Navigator.of(context).pop();
    } catch (_) {
      setState(() => _error = 'Send failed. Insufficient balance or the recipient is unreachable.');
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.appState.isDemoMode) {
      return _UnavailableView(appState: widget.appState);
    }

    return Scaffold(
      appBar: AppBar(title: Text(Strings.sendMoney)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.margin),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_error != null) ErrorBanner(message: _error!),
              LabeledField(
                label: Strings.recipientPhone,
                child: TextField(
                  controller: _phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    hintText: '237 670 000 000',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              LabeledField(
                label: Strings.amount,
                child: TextField(
                  controller: _amountCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    hintText: '5000',
                    prefixText: 'XAF  ',
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              LabeledField(
                label: Strings.note,
                child: TextField(
                  controller: _noteCtrl,
                  decoration: InputDecoration(hintText: Strings.note),
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              ElevatedButton(
                onPressed: _sending ? null : _reviewAndSend,
                child: _sending
                    ? const SizedBox(
                        height: 20, width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : Text(Strings.reviewAndSend),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PinConfirmSheet extends StatefulWidget {
  const _PinConfirmSheet({required this.recipient, required this.amount});
  final String recipient;
  final double amount;

  @override
  State<_PinConfirmSheet> createState() => _PinConfirmSheetState();
}

class _PinConfirmSheetState extends State<_PinConfirmSheet> {
  final _pinCtrl = TextEditingController();
  final _pinFocus = FocusNode();

  @override
  void dispose() {
    _pinCtrl.dispose();
    _pinFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.lg, AppSpacing.md, AppSpacing.lg,
        AppSpacing.xl + MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadii.sheet)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40, height: 4,
            decoration: BoxDecoration(
                color: AppColors.outlineVariant, borderRadius: BorderRadius.circular(AppRadii.full)),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text('Send ${formatCurrency(widget.amount, 'XAF')}',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text('to ${widget.recipient}', style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: AppSpacing.lg),
          Text(Strings.confirmWithPin, style: Theme.of(context).textTheme.labelMedium),
          const SizedBox(height: AppSpacing.sm),
          PinDotsField(
            controller: _pinCtrl,
            focusNode: _pinFocus,
            autofocus: true,
            onCompleted: (pin) => Navigator.of(context).pop(pin),
          ),
          const SizedBox(height: AppSpacing.lg),
        ],
      ),
    );
  }
}

class _UnavailableView extends StatelessWidget {
  const _UnavailableView({required this.appState});
  final AppState appState;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(Strings.sendMoney)),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.margin),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.info_outline, size: 48, color: AppColors.outline),
              const SizedBox(height: AppSpacing.md),
              Text(
                Strings.liveSendUnavailableTitle,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                Strings.liveSendUnavailableBody,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: AppSpacing.lg),
              ElevatedButton(
                onPressed: () {
                  appState.enableDemoMode();
                  Navigator.of(context).pop();
                },
                child: Text(Strings.openDemoMode),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
