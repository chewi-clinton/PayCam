import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import '../../widgets/common.dart';

class ReceiveMoneyScreen extends StatelessWidget {
  const ReceiveMoneyScreen({super.key, required this.appState});
  final AppState appState;

  @override
  Widget build(BuildContext context) {
    final user = appState.user;
    final phone = user?.phoneNumber ?? '';
    final qrPayload = jsonEncode({'type': 'paycam_receive', 'phone_number': phone});

    return Scaffold(
      appBar: AppBar(title: Text(Strings.receiveMoney)),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.margin),
          child: Column(
            children: [
              const SizedBox(height: AppSpacing.md),
              Text(
                Strings.shareToReceive,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: AppSpacing.xl),
              SectionCard(
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.outlineVariant),
                        borderRadius: BorderRadius.circular(AppRadii.md),
                      ),
                      child: QrImageView(
                        data: qrPayload,
                        version: QrVersions.auto,
                        size: 220,
                        backgroundColor: Colors.white,
                        eyeStyle: QrEyeStyle(eyeShape: QrEyeShape.square, color: AppColors.primaryDark),
                        dataModuleStyle: QrDataModuleStyle(
                            dataModuleShape: QrDataModuleShape.square, color: AppColors.primaryDark),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    Text(Strings.yourPaycamNumber, style: Theme.of(context).textTheme.labelMedium),
                    const SizedBox(height: 4),
                    Text(phone.isEmpty ? '—' : '+$phone', style: monoNumeric(size: 20, weight: FontWeight.w700)),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: phone.isEmpty
                          ? null
                          : () {
                              Clipboard.setData(ClipboardData(text: phone));
                              ScaffoldMessenger.of(context)
                                  .showSnackBar(SnackBar(content: Text(Strings.copied)));
                            },
                      icon: const Icon(Icons.copy_rounded, size: 18),
                      label: Text(Strings.copyNumber),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: phone.isEmpty
                          ? null
                          : () => SharePlus.instance.share(
                                ShareParams(
                                  text: 'Pay me on PayCam: +$phone',
                                  subject: 'My PayCam number',
                                ),
                              ),
                      icon: const Icon(Icons.share_outlined, size: 18),
                      label: Text(Strings.shareCode),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
