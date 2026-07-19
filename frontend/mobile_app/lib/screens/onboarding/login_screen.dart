import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import '../../services/api_client.dart';
import '../../widgets/common.dart';
import 'registration_screen.dart';
import 'otp_verification_screen.dart';
import 'forgot_pin_screen.dart';
import '../main/main_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.appState, this.prefillPhone});
  final AppState appState;
  final String? prefillPhone;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late final TextEditingController _phoneCtrl;
  final _pinCtrl = TextEditingController();
  final _pinFocus = FocusNode();

  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _phoneCtrl = TextEditingController(
      text: widget.prefillPhone ?? widget.appState.phoneNumber ?? '',
    );
  }

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _pinCtrl.dispose();
    _pinFocus.dispose();
    super.dispose();
  }

  String _normalizePhone(String raw) {
    var p = raw.trim().replaceAll(' ', '').replaceAll('-', '');
    if (p.startsWith('+')) p = p.substring(1);
    if (!p.startsWith('237') && p.length == 9) p = '237$p';
    return p;
  }

  Future<void> _submit() async {
    final phone = _normalizePhone(_phoneCtrl.text);
    if (phone.length != 12 || _pinCtrl.text.length != 4) {
      setState(() => _error = 'Enter your phone number and 4-digit PIN.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await widget.appState.api.login(phoneNumber: phone, pin: _pinCtrl.text);
      if (!mounted) return;
      final deliveryMethod = res['delivery_method'] as String? ?? 'email';
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => OtpVerificationScreen(
            appState: widget.appState,
            phoneNumber: phone,
            deliveryMethod: deliveryMethod,
          ),
        ),
      );
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
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.margin),
          child: Column(
            children: [
              Align(
                alignment: Alignment.topRight,
                child: TextButton(
                  onPressed: () {
                    widget.appState.enableDemoMode();
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => MainShell(appState: widget.appState)),
                      (route) => false,
                    );
                  },
                  child: Text(Strings.skip),
                ),
              ),
              Container(
                width: 88,
                height: 88,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: AppShadows.level1,
                ),
                child: Image.asset(
                  'assets/images/logo_transparent.png',
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(Strings.appName, style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 36)),
              const SizedBox(height: AppSpacing.xs),
              Text(Strings.secureWalletAccess, style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: AppSpacing.xl),
              SectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_error != null) ErrorBanner(message: _error!),
                    LabeledField(
                      label: Strings.phoneNumber,
                      child: TextField(
                        controller: _phoneCtrl,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          hintText: '237 670 000 000',
                          prefixIcon: Icon(Icons.phone_outlined),
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    LabeledField(
                      label: Strings.securityPin,
                      child: PinDotsField(
                        controller: _pinCtrl,
                        focusNode: _pinFocus,
                        autofocus: false,
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const ForgotPinScreen()),
                        ),
                        child: Text(Strings.forgotPin),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    ElevatedButton(
                      onPressed: _loading ? null : _submit,
                      child: _loading
                          ? const SizedBox(
                              height: 22, width: 22,
                              child: CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2.5),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(Strings.accessWallet),
                                const SizedBox(width: 8),
                                const Icon(Icons.arrow_forward, size: 18),
                              ],
                            ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Center(
                      child: TextButton(
                        onPressed: () => Navigator.of(context).pushReplacement(
                          MaterialPageRoute(
                            builder: (_) => RegistrationScreen(appState: widget.appState),
                          ),
                        ),
                        child: RichText(
                          text: TextSpan(
                            style: Theme.of(context).textTheme.bodyLarge,
                            children: [
                              TextSpan(text: Strings.newToPaycamPrefix),
                              TextSpan(
                                text: Strings.createAccount,
                                style: TextStyle(
                                  color: AppColors.primaryDark,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock_outline, size: 14, color: AppColors.outline),
                  const SizedBox(width: 6),
                  Text(Strings.endToEndEncrypted,
                      style: Theme.of(context)
                          .textTheme
                          .labelMedium
                          ?.copyWith(color: AppColors.outline)),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
            ],
          ),
        ),
      ),
    );
  }
}
