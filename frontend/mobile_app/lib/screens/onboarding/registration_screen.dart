import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import '../../services/api_client.dart';
import '../../widgets/common.dart';
import 'login_screen.dart';

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key, required this.appState});
  final AppState appState;

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _pinCtrl = TextEditingController();
  final _confirmPinCtrl = TextEditingController();
  final _pinFocus = FocusNode();
  final _confirmPinFocus = FocusNode();

  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _pinCtrl.dispose();
    _confirmPinCtrl.dispose();
    _pinFocus.dispose();
    _confirmPinFocus.dispose();
    super.dispose();
  }

  String _normalizePhone(String raw) {
    var p = raw.trim().replaceAll(' ', '').replaceAll('-', '');
    if (p.startsWith('+')) p = p.substring(1);
    if (!p.startsWith('237') && p.length == 9) p = '237$p';
    return p;
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_pinCtrl.text != _confirmPinCtrl.text) {
      setState(() => _error = 'PINs do not match.');
      return;
    }
    setState(() => _loading = true);
    try {
      await widget.appState.api.register(
        phoneNumber: _normalizePhone(_phoneCtrl.text),
        fullName: _nameCtrl.text.trim(),
        pin: _pinCtrl.text,
        email: _emailCtrl.text.trim(),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Account created. Please log in.')),
      );
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => LoginScreen(
            appState: widget.appState,
            prefillPhone: _normalizePhone(_phoneCtrl.text),
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
      appBar: AppBar(title: Text(Strings.appName)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.margin),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: AppSpacing.md),
                Text(Strings.createAccountTitle, style: Theme.of(context).textTheme.headlineLarge),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  Strings.createAccountSubtitle,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: AppSpacing.lg),
                if (_error != null) ErrorBanner(message: _error!),
                LabeledField(
                  label: Strings.fullName,
                  child: TextFormField(
                    controller: _nameCtrl,
                    decoration: const InputDecoration(
                      hintText: 'Jane Doe',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Enter your full name' : null,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                LabeledField(
                  label: Strings.phoneNumber,
                  child: TextFormField(
                    controller: _phoneCtrl,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      hintText: '670 000 000',
                      prefixIcon: Icon(Icons.phone_iphone),
                    ),
                    validator: (v) {
                      final n = _normalizePhone(v ?? '');
                      if (!n.startsWith('237') || n.length != 12) {
                        return 'Enter a valid Cameroon number';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                LabeledField(
                  label: Strings.emailAddress,
                  child: TextFormField(
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      hintText: 'jane@example.com',
                      prefixIcon: Icon(Icons.mail_outline),
                    ),
                    validator: (v) =>
                        (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: LabeledField(
                        label: Strings.createPin,
                        child: TextFormField(
                          controller: _pinCtrl,
                          focusNode: _pinFocus,
                          keyboardType: TextInputType.number,
                          obscureText: true,
                          maxLength: 4,
                          decoration: const InputDecoration(
                            counterText: '',
                            prefixIcon: Icon(Icons.lock_outline),
                          ),
                          validator: (v) => (v == null || v.length != 4)
                              ? '4 digits'
                              : null,
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: LabeledField(
                        label: Strings.confirmPin,
                        child: TextFormField(
                          controller: _confirmPinCtrl,
                          focusNode: _confirmPinFocus,
                          keyboardType: TextInputType.number,
                          obscureText: true,
                          maxLength: 4,
                          decoration: const InputDecoration(
                            counterText: '',
                            prefixIcon: Icon(Icons.lock_reset),
                          ),
                          validator: (v) => (v == null || v.length != 4)
                              ? '4 digits'
                              : null,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Icon(Icons.shield_outlined, size: 16, color: AppColors.outline),
                    const SizedBox(width: AppSpacing.xs),
                    Expanded(
                      child: Text(
                        Strings.dataEncryptedNotice,
                        style: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.copyWith(color: AppColors.outline),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xl),
                ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const SizedBox(
                          height: 22, width: 22,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                        )
                      : Text(Strings.createAccount),
                ),
                const SizedBox(height: AppSpacing.md),
                Center(
                  child: TextButton(
                    onPressed: () => Navigator.of(context).pushReplacement(
                      MaterialPageRoute(
                        builder: (_) => LoginScreen(appState: widget.appState),
                      ),
                    ),
                    child: RichText(
                      text: TextSpan(
                        style: Theme.of(context).textTheme.bodyLarge,
                        children: [
                          TextSpan(text: Strings.alreadyHaveAccountPrefix),
                          TextSpan(
                            text: Strings.signIn,
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
                const SizedBox(height: AppSpacing.lg),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
