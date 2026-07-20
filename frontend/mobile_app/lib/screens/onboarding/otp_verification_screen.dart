import 'dart:async';
import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import '../../services/api_client.dart';
import '../../widgets/common.dart';
import '../main/main_shell.dart';

class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({
    super.key,
    required this.appState,
    required this.phoneNumber,
    required this.deliveryMethod,
  });

  final AppState appState;
  final String phoneNumber;
  final String deliveryMethod; // 'email' today; backend also supports telegram wording

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final _otpCtrl = TextEditingController();
  final _otpFocus = FocusNode();
  Timer? _timer;
  int _secondsLeft = 300;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _startTimer();
    WidgetsBinding.instance.addPostFrameCallback((_) => _otpFocus.requestFocus());
  }

  void _startTimer() {
    _timer?.cancel();
    _secondsLeft = 300;
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_secondsLeft <= 0) {
        t.cancel();
      } else {
        setState(() => _secondsLeft--);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpCtrl.dispose();
    _otpFocus.dispose();
    super.dispose();
  }

  String get _mmss {
    final m = (_secondsLeft ~/ 60).toString().padLeft(2, '0');
    final s = (_secondsLeft % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  Future<void> _verify(String code) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await widget.appState.api.verifyRegistrationOtp(
        phoneNumber: widget.phoneNumber,
        otp: code,
      );
      final token = res['token'] as String;
      await widget.appState.setSession(token: token, phoneNumber: widget.phoneNumber);
      await widget.appState.loadProfile();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => MainShell(appState: widget.appState, skipInitialLock: true)),
        (route) => false,
      );
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _otpCtrl.clear();
      });
    } catch (_) {
      setState(() => _error = Strings.connectionError);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final last2 = widget.phoneNumber.length >= 2
        ? widget.phoneNumber.substring(widget.phoneNumber.length - 2)
        : widget.phoneNumber;
    final channel = widget.deliveryMethod == 'telegram' ? 'Telegram' : 'email';

    return Scaffold(
      appBar: AppBar(leading: const BackButton()),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.margin),
          child: Column(
            children: [
              const SizedBox(height: AppSpacing.md),
              SizedBox(height: 120, child: Lottie.asset('assets/lottie/wallet_secure.json', repeat: true)),
              const SizedBox(height: AppSpacing.md),
              Text(Strings.verificationCodeTitle, style: Theme.of(context).textTheme.headlineLarge),
              const SizedBox(height: AppSpacing.sm),
              RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  style: Theme.of(context).textTheme.bodyLarge,
                  children: [
                    TextSpan(
                      text: 'We sent a 6-digit code to your $channel, for the number ending in ',
                    ),
                    TextSpan(
                      text: '**$last2',
                      style: TextStyle(
                        color: AppColors.primaryDark,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const TextSpan(text: '.'),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              if (_error != null) ErrorBanner(message: _error!),
              PinDotsField(
                controller: _otpCtrl,
                focusNode: _otpFocus,
                length: 6,
                obscure: false,
                autofocus: true,
                onCompleted: _loading ? null : _verify,
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(Strings.didntReceiveCode, style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: AppSpacing.xs),
              _secondsLeft > 0
                  ? Text('${Strings.resendCode}  $_mmss',
                      style: TextStyle(color: AppColors.outline, fontWeight: FontWeight.w600))
                  : TextButton(
                      onPressed: () {
                        _startTimer();
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please register again to resend the code.')),
                        );
                      },
                      child: Text(Strings.resendCode),
                    ),
              const SizedBox(height: AppSpacing.xl),
              ElevatedButton(
                onPressed: _loading || _otpCtrl.text.length != 6
                    ? null
                    : () => _verify(_otpCtrl.text),
                child: _loading
                    ? const SizedBox(
                        height: 22, width: 22,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                      )
                    : Text(Strings.verify),
              ),
              const SizedBox(height: AppSpacing.lg),
            ],
          ),
        ),
      ),
    );
  }
}
