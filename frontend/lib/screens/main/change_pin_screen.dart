import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import '../../services/api_client.dart';
import '../../widgets/common.dart';

/// Two-step PIN change matching backend spec §2.4 (old PIN, then OTP):
/// POST /app/change-pin/request/ (old_pin) -> OTP emailed
/// POST /app/change-pin/confirm/ (otp, new_pin)
class ChangePinScreen extends StatefulWidget {
  const ChangePinScreen({super.key, required this.appState});
  final AppState appState;

  @override
  State<ChangePinScreen> createState() => _ChangePinScreenState();
}

class _ChangePinScreenState extends State<ChangePinScreen> {
  int _step = 0; // 0: old pin, 1: otp + new pin
  final _oldPinCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  final _newPinCtrl = TextEditingController();
  final _confirmPinCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _oldPinCtrl.dispose();
    _otpCtrl.dispose();
    _newPinCtrl.dispose();
    _confirmPinCtrl.dispose();
    super.dispose();
  }

  Future<void> _requestOtp() async {
    if (_oldPinCtrl.text.length != 4) {
      setState(() => _error = 'Enter your current 4-digit PIN.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      if (widget.appState.isDemoMode) {
        await Future.delayed(const Duration(milliseconds: 400));
      } else {
        await widget.appState.api.changePinRequest(_oldPinCtrl.text);
      }
      setState(() => _step = 1);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = Strings.connectionError);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _confirmChange() async {
    if (_otpCtrl.text.length != 6) {
      setState(() => _error = 'Enter the 6-digit code sent to your email.');
      return;
    }
    if (_newPinCtrl.text.length != 4 || _newPinCtrl.text != _confirmPinCtrl.text) {
      setState(() => _error = 'New PIN must match and be 4 digits.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      if (widget.appState.isDemoMode) {
        await Future.delayed(const Duration(milliseconds: 400));
      } else {
        await widget.appState.api.changePinConfirm(otp: _otpCtrl.text, newPin: _newPinCtrl.text);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('PIN changed successfully.')));
      Navigator.of(context).pop();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = Strings.connectionError);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(Strings.changePin)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.margin),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (widget.appState.isDemoMode)
                Container(
                  padding: const EdgeInsets.all(AppSpacing.sm),
                  margin: const EdgeInsets.only(bottom: AppSpacing.md),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainer,
                    borderRadius: BorderRadius.circular(AppRadii.sm),
                  ),
                  child: Text(
                    'Demo mode — no real PIN or email involved. Any 6-digit code works.',
                    style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
                  ),
                ),
              if (_error != null) ErrorBanner(message: _error!),
              if (_step == 0) ...[
                Text('Confirm your current PIN', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: AppSpacing.md),
                LabeledField(
                  label: 'Current PIN',
                  child: TextField(
                    controller: _oldPinCtrl,
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    maxLength: 4,
                    decoration: const InputDecoration(counterText: ''),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                ElevatedButton(
                  onPressed: _loading ? null : _requestOtp,
                  child: _loading
                      ? const SizedBox(
                          height: 20, width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text('Continue'),
                ),
              ] else ...[
                Text('Enter the code we emailed you', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: AppSpacing.md),
                LabeledField(
                  label: 'OTP Code',
                  child: TextField(
                    controller: _otpCtrl,
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    decoration: const InputDecoration(counterText: ''),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                LabeledField(
                  label: 'New PIN',
                  child: TextField(
                    controller: _newPinCtrl,
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    maxLength: 4,
                    decoration: const InputDecoration(counterText: ''),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                LabeledField(
                  label: 'Confirm New PIN',
                  child: TextField(
                    controller: _confirmPinCtrl,
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    maxLength: 4,
                    decoration: const InputDecoration(counterText: ''),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                ElevatedButton(
                  onPressed: _loading ? null : _confirmChange,
                  child: _loading
                      ? const SizedBox(
                          height: 20, width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text('Change PIN'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
