import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme/app_theme.dart';
import '../../l10n/strings.dart';
import '../../state/app_state.dart';
import '../../models/models.dart';
import '../../widgets/common.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key, required this.appState});
  final AppState appState;

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      await widget.appState.loadProfile();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  void _copy(String value, String label) {
    Clipboard.setData(ClipboardData(text: value));
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$label copied.')));
  }

  @override
  Widget build(BuildContext context) {
    final wallet = widget.appState.wallet;
    final crypto = widget.appState.cryptoWallets;
    final user = widget.appState.user;

    return Scaffold(
      appBar: AppBar(title: Text(Strings.appName)),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.margin, vertical: AppSpacing.sm),
            children: [
              Text(Strings.yourWallets, style: Theme.of(context).textTheme.headlineLarge),
              const SizedBox(height: 4),
              Text(Strings.manageWalletsSubtitle, style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: AppSpacing.lg),
              if (_loading && wallet == null)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: AppSpacing.xxl),
                  child: Center(child: CircularProgressIndicator()),
                )
              else ...[
                _MobileMoneySection(
                  wallet: wallet,
                  network: user?.network ?? 'MTN',
                  phone: user?.phoneNumber ?? '',
                  onCopy: _copy,
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(Strings.cryptoWallets, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: AppSpacing.sm),
                for (final w in crypto) ...[
                  _CryptoCard(wallet: w, onCopy: _copy),
                  const SizedBox(height: AppSpacing.md),
                ],
                if (crypto.isEmpty)
                  Text(Strings.noCryptoWallets, style: Theme.of(context).textTheme.bodyMedium),
              ],
              const SizedBox(height: AppSpacing.xxl),
            ],
          ),
        ),
      ),
    );
  }
}

class _MobileMoneySection extends StatelessWidget {
  const _MobileMoneySection({
    required this.wallet,
    required this.network,
    required this.phone,
    required this.onCopy,
  });

  final Wallet? wallet;
  final String network;
  final String phone;
  final void Function(String, String) onCopy;

  @override
  Widget build(BuildContext context) {
    final isMtn = network == 'MTN';
    final brandColor = isMtn ? AppColors.mtnYellow : AppColors.orangeBrand;

    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(color: brandColor, borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.phone_android, color: Colors.black87),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${isMtn ? "MTN" : "Orange"} Mobile Money',
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    Text('+$phone', style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          const Divider(),
          const SizedBox(height: AppSpacing.md),
          Text(Strings.balance, style: Theme.of(context).textTheme.labelMedium),
          const SizedBox(height: 4),
          Text(
            formatCurrency(wallet?.balance ?? 0, 'XAF'),
            style: monoNumeric(size: 24, weight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.md),
          GestureDetector(
            onTap: () => onCopy(phone, 'Phone number'),
            child: Row(
              children: [
                Icon(Icons.qr_code_2, size: 18, color: AppColors.outline),
                const SizedBox(width: 6),
                Expanded(
                  child: Text('paycam:$phone',
                      style: monoNumeric(size: 13, color: AppColors.outline)),
                ),
                Icon(Icons.copy_rounded, size: 18, color: AppColors.outline),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CryptoCard extends StatelessWidget {
  const _CryptoCard({required this.wallet, required this.onCopy});
  final CryptoWallet wallet;
  final void Function(String, String) onCopy;

  Color get _color {
    switch (wallet.currency) {
      case 'BTC':
        return AppColors.btcOrange;
      case 'ETH':
        return AppColors.ethBlue;
      default:
        return AppColors.usdtGreen;
    }
  }

  IconData get _icon {
    switch (wallet.currency) {
      case 'BTC':
        return Icons.currency_bitcoin;
      case 'ETH':
        return Icons.diamond_outlined;
      default:
        return Icons.attach_money;
    }
  }

  String get _label {
    switch (wallet.currency) {
      case 'BTC':
        return 'Bitcoin · testnet';
      case 'ETH':
        return 'Ethereum · Sepolia';
      default:
        return 'Tether USDT · Sepolia';
    }
  }

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(color: _color, shape: BoxShape.circle),
                child: Icon(_icon, color: Colors.white, size: 20),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(wallet.currency, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    Text(_label, style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(Strings.balance, style: Theme.of(context).textTheme.labelMedium),
          const SizedBox(height: 4),
          Text(formatCurrency(wallet.balance, wallet.currency),
              style: monoNumeric(size: 20, weight: FontWeight.w700)),
          const SizedBox(height: AppSpacing.md),
          GestureDetector(
            onTap: () => onCopy(wallet.testnetAddress, '${wallet.currency} address'),
            child: Row(
              children: [
                Text(Strings.receiveAddress, style: Theme.of(context).textTheme.labelMedium),
                const Spacer(),
                Expanded(
                  flex: 3,
                  child: Text(
                    wallet.testnetAddress,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.right,
                    style: monoNumeric(size: 13, color: AppColors.outline),
                  ),
                ),
                const SizedBox(width: 6),
                Icon(Icons.copy_rounded, size: 16, color: AppColors.outline),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
