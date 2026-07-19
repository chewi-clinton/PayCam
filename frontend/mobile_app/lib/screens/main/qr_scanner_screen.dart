import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:image_picker/image_picker.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import '../../services/api_client.dart';
import '../../widgets/common.dart';

class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key, required this.appState});
  final AppState appState;

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  final MobileScannerController _controller = MobileScannerController();
  final _picker = ImagePicker();
  bool _handling = false;
  bool _torchOn = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_handling) return;
    final raw = capture.barcodes.firstOrNull?.rawValue;
    if (raw == null) return;
    await _resolveScannedValue(raw);
  }

  Future<void> _pickFromGallery() async {
    final file = await _picker.pickImage(source: ImageSource.gallery);
    if (file == null) return;
    final result = await _controller.analyzeImage(file.path);
    final raw = result?.barcodes.firstOrNull?.rawValue;
    if (raw == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(Strings.noQrCodeFound)));
      }
      return;
    }
    await _resolveScannedValue(raw);
  }

  Future<void> _resolveScannedValue(String raw) async {
    String? reference;
    try {
      final data = jsonDecode(raw) as Map<String, dynamic>;
      reference = data['reference'] as String?;
    } catch (_) {
      reference = raw.trim();
    }
    if (reference == null || reference.isEmpty) return;

    setState(() => _handling = true);
    try {
      final payment = await widget.appState.api.paymentLookup(reference);
      if (!mounted) return;
      await showModalBottomSheet(
        context: context,
        backgroundColor: Colors.transparent,
        isScrollControlled: true,
        builder: (_) => _ScannedPaymentSheet(
          appState: widget.appState,
          payment: payment,
          onDone: () => Navigator.of(context).pop(),
        ),
      );
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(Strings.notPaycamQr)));
      }
    } finally {
      if (mounted) setState(() => _handling = false);
    }
  }

  void _showHelp() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadii.sheet)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                margin: const EdgeInsets.only(bottom: AppSpacing.md),
                decoration: BoxDecoration(
                    color: AppColors.outlineVariant, borderRadius: BorderRadius.circular(AppRadii.full)),
              ),
            ),
            Text(Strings.scanHelpTitle, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: AppSpacing.sm),
            Text(Strings.scanHelpBody, style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: AppSpacing.md),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          MobileScanner(controller: _controller, onDetect: _onDetect),
          Container(color: Colors.black.withValues(alpha: 0.35)),
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _RoundIconButton(
                        icon: Icons.close,
                        onTap: () => Navigator.of(context).maybePop(),
                      ),
                      Text(Strings.appName,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 20)),
                      _RoundIconButton(icon: Icons.help_outline, onTap: _showHelp),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(Strings.alignQrCode, style: const TextStyle(color: Colors.white)),
                const Spacer(),
                Center(
                  child: Container(
                    width: 260,
                    height: 260,
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.primary, width: 3),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: _handling
                        ? Center(
                            child: CircularProgressIndicator(color: AppColors.primary),
                          )
                        : null,
                  ),
                ),
                const Spacer(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _RoundIconButton(icon: Icons.image_outlined, label: Strings.gallery, onTap: _pickFromGallery),
                    const SizedBox(width: AppSpacing.xl),
                    _RoundIconButton(
                      icon: _torchOn ? Icons.flash_on : Icons.flash_off,
                      label: Strings.flash,
                      onTap: () {
                        setState(() => _torchOn = !_torchOn);
                        _controller.toggleTorch();
                      },
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xxl),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  const _RoundIconButton({required this.icon, required this.onTap, this.label});
  final IconData icon;
  final VoidCallback onTap;
  final String? label;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: 52, height: 52,
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.5),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white),
          ),
        ),
        if (label != null) ...[
          const SizedBox(height: 6),
          Text(label!, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ],
    );
  }
}

class _ScannedPaymentSheet extends StatefulWidget {
  const _ScannedPaymentSheet({
    required this.appState,
    required this.payment,
    required this.onDone,
  });

  final AppState appState;
  final Map<String, dynamic> payment;
  final VoidCallback onDone;

  @override
  State<_ScannedPaymentSheet> createState() => _ScannedPaymentSheetState();
}

class _ScannedPaymentSheetState extends State<_ScannedPaymentSheet> {
  bool _busy = false;

  Future<void> _act(bool approve) async {
    setState(() => _busy = true);
    final reference = widget.payment['reference'] as String;
    try {
      if (approve) {
        await widget.appState.api.approvePayment(reference);
      } else {
        await widget.appState.api.declinePayment(reference);
      }
      widget.appState.loadProfile();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(approve ? Strings.paymentApproved : Strings.paymentDeclined)),
        );
        widget.onDone();
      }
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final amount = double.tryParse(widget.payment['amount'].toString()) ?? 0;
    final currency = widget.payment['currency'] as String? ?? 'XAF';
    final merchant = widget.payment['merchant_name'] as String? ?? 'Merchant';

    return Container(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, AppSpacing.xl),
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
              color: AppColors.outlineVariant, borderRadius: BorderRadius.circular(AppRadii.full),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(merchant, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: AppSpacing.sm),
          Text(formatCurrency(amount, currency),
              style: monoNumeric(size: 30, weight: FontWeight.w800)),
          const SizedBox(height: AppSpacing.xl),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _busy ? null : () => _act(false),
                  child: Text(Strings.decline),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: ElevatedButton(
                  onPressed: _busy ? null : () => _act(true),
                  child: _busy
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

extension _FirstOrNull<T> on List<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
