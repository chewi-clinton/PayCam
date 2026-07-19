/// Lightweight app-wide string table — English + French.
///
/// Mirrors AppColors' pattern deliberately: every entry is a getter
/// keyed off [_isFr], so `Strings.xxx` works unchanged from any
/// screen and picks up the current language the moment
/// [setLanguage] flips the flag and the tree remounts (see
/// SettingsController / main.dart's ValueKey).
///
/// Scope: navigation, headers, buttons, field labels, empty states,
/// and status words — the chrome a user reads on every screen. Long
/// static prose (Terms/Privacy body paragraphs) stays English; it
/// falls through untouched rather than half-translating legal text.
class Strings {
  Strings._();

  static bool _isFr = false;
  static bool get isFrench => _isFr;
  static void setLanguage(String code) => _isFr = code == 'fr';

  // Common
  static String get appName => 'PayCam';
  static String get cancel => _isFr ? 'Annuler' : 'Cancel';
  static String get confirm => _isFr ? 'Confirmer' : 'Confirm';
  static String get save => _isFr ? 'Enregistrer' : 'Save';
  static String get close => _isFr ? 'Fermer' : 'Close';
  static String get retry => _isFr ? 'Réessayer' : 'Retry';
  static String get loading => _isFr ? 'Chargement…' : 'Loading…';
  static String get done => _isFr ? 'Terminé' : 'Done';
  static String get copied => _isFr ? 'Copié.' : 'Copied.';
  static String get comingSoon => _isFr ? 'Bientôt disponible' : 'Coming soon';

  // Bottom nav
  static String get navHome => _isFr ? 'Accueil' : 'Home';
  static String get navWallet => _isFr ? 'Portefeuille' : 'Wallet';
  static String get navScan => _isFr ? 'Scanner' : 'Scan';
  static String get navHistory => _isFr ? 'Historique' : 'History';
  static String get navProfile => _isFr ? 'Profil' : 'Profile';

  // Welcome / onboarding
  static String get welcomeTitle => _isFr ? 'Bienvenue dans le futur' : 'Welcome to the Future';
  static String get welcomeSubtitle => _isFr ? 'Portefeuille de paiement africain sécurisé' : 'Secure African Payment Wallet';
  static String get createAccount => _isFr ? 'Créer un compte' : 'Create Account';
  static String get login => _isFr ? 'Connexion' : 'Login';
  static String get skip => _isFr ? 'Passer' : 'Skip';
  static String get agreePrefix => _isFr ? 'En continuant, vous acceptez nos ' : 'By continuing, you agree to our ';
  static String get terms => _isFr ? 'Conditions' : 'Terms';
  static String get and_ => _isFr ? ' et notre ' : ' & ';
  static String get privacyPolicy => _isFr ? 'Politique de confidentialité' : 'Privacy Policy';

  static String get secureWalletAccess => _isFr ? 'Accès sécurisé à votre portefeuille' : 'Secure access to your wallet';
  static String get phoneNumber => _isFr ? 'Numéro de téléphone' : 'Phone Number';
  static String get securityPin => _isFr ? 'CODE PIN' : 'Security PIN';
  static String get forgotPin => _isFr ? 'PIN oublié ?' : 'Forgot PIN?';
  static String get accessWallet => _isFr ? 'Accéder au portefeuille' : 'Access Wallet';
  static String get newToPaycamPrefix => _isFr ? 'Nouveau sur PayCam ? ' : 'New to PayCam? ';
  static String get endToEndEncrypted => _isFr ? 'Chiffrement de bout en bout' : 'End-to-End Encrypted';

  static String get createAccountTitle => _isFr ? 'Créer un compte' : 'Create Account';
  static String get createAccountSubtitle => _isFr
      ? 'Rejoignez la nouvelle génération de paiements mobiles rapides et sécurisés.'
      : 'Join the next generation of fast, secure mobile payments.';
  static String get fullName => _isFr ? 'Nom complet' : 'Full Name';
  static String get emailAddress => _isFr ? 'Adresse e-mail' : 'Email Address';
  static String get createPin => _isFr ? 'Créer un PIN' : 'Create PIN';
  static String get confirmPin => _isFr ? 'Confirmer le PIN' : 'Confirm PIN';
  static String get dataEncryptedNotice => _isFr
      ? 'Vos données sont chiffrées et stockées en toute sécurité.'
      : 'Your data is encrypted and securely stored.';
  static String get alreadyHaveAccountPrefix => _isFr ? 'Vous avez déjà un compte ? ' : 'Already have an account? ';
  static String get signIn => _isFr ? 'Se connecter' : 'Sign In';

  static String get verificationCodeTitle => _isFr ? 'Code de vérification' : 'Verification Code';
  static String get didntReceiveCode => _isFr ? "Vous n'avez pas reçu le code ?" : "Didn't receive the code?";
  static String get resendCode => _isFr ? 'Renvoyer le code' : 'Resend Code';
  static String get verify => _isFr ? 'Vérifier' : 'Verify';

  // Home dashboard
  static String get availableBalance => _isFr ? 'Solde disponible' : 'Available Balance';
  static String get send => _isFr ? 'Envoyer' : 'Send';
  static String get receive => _isFr ? 'Recevoir' : 'Receive';
  static String get scanQr => _isFr ? 'Scanner QR' : 'Scan QR';
  static String get history => _isFr ? 'Historique' : 'History';
  static String get recentTransactions => _isFr ? 'Transactions récentes' : 'Recent Transactions';
  static String get seeAll => _isFr ? 'Tout voir' : 'See All';
  static String get noTransactionsYet => _isFr ? 'Aucune transaction pour le moment.' : 'No transactions yet.';
  static String pendingRequestsCount(int n) => _isFr
      ? '$n demande${n == 1 ? '' : 's'} de paiement en attente'
      : '$n pending payment request${n == 1 ? '' : 's'}';

  // Payment requests
  static String get paymentRequests => _isFr ? 'Demandes de paiement' : 'Payment Requests';
  static String pendingRequestsSubtitle(int n) => _isFr
      ? 'Vous avez $n demande${n == 1 ? '' : 's'} en attente.'
      : 'You have $n pending request${n == 1 ? '' : 's'}.';
  static String get noPendingRequests => _isFr ? 'Aucune demande en attente' : 'No pending requests';
  static String get approve => _isFr ? 'Approuver' : 'Approve';
  static String get decline => _isFr ? 'Refuser' : 'Decline';
  static String get paymentApproved => _isFr ? 'Paiement approuvé.' : 'Payment approved.';
  static String get paymentDeclined => _isFr ? 'Paiement refusé.' : 'Payment declined.';

  // Wallet
  static String get yourWallets => _isFr ? 'Vos portefeuilles' : 'Your Wallets';
  static String get manageWalletsSubtitle => _isFr
      ? 'Gérez votre mobile money et vos actifs crypto.'
      : 'Manage your mobile money and crypto assets.';
  static String get cryptoWallets => _isFr ? 'Portefeuilles crypto' : 'Crypto Wallets';
  static String get balance => _isFr ? 'SOLDE' : 'BALANCE';
  static String get receiveAddress => _isFr ? 'ADRESSE DE RÉCEPTION' : 'RECEIVE ADDRESS';
  static String get noCryptoWallets => _isFr ? 'Aucun portefeuille crypto trouvé.' : 'No crypto wallets found.';

  // Transaction history
  static String get transactionHistory => _isFr ? 'Historique des transactions' : 'Transaction History';
  static String get filterAll => _isFr ? 'Tout' : 'All';
  static String get filterSuccess => _isFr ? 'Réussi' : 'Success';
  static String get filterPending => _isFr ? 'En attente' : 'Pending';
  static String get filterFailed => _isFr ? 'Échoué' : 'Failed';
  static String get noTransactions => _isFr ? 'Aucune transaction.' : 'No transactions.';
  static String get today => _isFr ? "Aujourd'hui" : 'Today';
  static String get yesterday => _isFr ? 'Hier' : 'Yesterday';

  // Transaction details
  static String get transactionDetails => _isFr ? 'Détails de la transaction' : 'Transaction Details';
  static String get paymentSuccessful => _isFr ? 'Paiement réussi' : 'Payment Successful';
  static String get paymentFailed => _isFr ? 'Paiement échoué' : 'Payment Failed';
  static String get paymentExpired => _isFr ? 'Paiement expiré' : 'Payment Expired';
  static String get paymentPending => _isFr ? 'Paiement en attente' : 'Payment Pending';
  static String get merchant => _isFr ? 'Marchand' : 'Merchant';
  static String get paymentMethod => _isFr ? 'Méthode de paiement' : 'Payment Method';
  static String get amount => _isFr ? 'Montant' : 'Amount';
  static String get status => _isFr ? 'Statut' : 'Status';
  static String get referenceNumber => _isFr ? 'Numéro de référence' : 'Reference Number';
  static String get referenceCopied => _isFr ? 'Référence copiée.' : 'Reference copied.';
  static String get downloadReceipt => _isFr ? 'Télécharger le reçu' : 'Download Receipt';
  static String get reportAnIssue => _isFr ? 'Signaler un problème' : 'Report an issue';

  // QR scanner
  static String get alignQrCode => _isFr ? 'Alignez le code QR dans le cadre' : 'Align QR code within frame to scan';
  static String get gallery => _isFr ? 'Galerie' : 'Gallery';
  static String get flash => _isFr ? 'Flash' : 'Flash';
  static String get scanHelpTitle => _isFr ? 'Comment scanner' : 'How to scan';
  static String get scanHelpBody => _isFr
      ? "Pointez la caméra vers le code QR d'un marchand pour charger la demande de paiement. Vous pouvez aussi importer un code QR depuis votre galerie photo."
      : "Point the camera at a merchant's QR code to load the payment request. You can also import a QR code from your photo gallery.";
  static String get noQrCodeFound => _isFr ? 'Aucun code QR trouvé dans cette image.' : 'No QR code found in that image.';
  static String get notPaycamQr => _isFr
      ? "Ce code QR n'est pas une demande de paiement PayCam valide."
      : 'That QR code is not a valid PayCam payment request.';

  // Notifications
  static String get notifications => _isFr ? 'Notifications' : 'Notifications';
  static String get noNotificationsYet => _isFr ? 'Aucune notification pour le moment.' : 'No notifications yet.';
  static String get incomingRequest => _isFr ? 'Demande entrante' : 'Incoming Request';
  static String get paymentApprovedTitle => _isFr ? 'Paiement approuvé' : 'Payment Approved';
  static String get paymentDeclinedTitle => _isFr ? 'Paiement refusé' : 'Payment Declined';
  static String get justNow => _isFr ? "À l'instant" : 'Just now';
  static String get pay => _isFr ? 'Payer' : 'Pay';

  // Profile
  static String get security => _isFr ? 'Sécurité' : 'Security';
  static String get securitySubtitle => _isFr ? 'PIN et paramètres de session' : 'PIN & session settings';
  static String get notificationsSubtitle => _isFr ? 'Alertes et préférences push' : 'Alerts & push preferences';
  static String get changePin => _isFr ? 'Changer le PIN' : 'Change PIN';
  static String get changePinSubtitle => _isFr ? "Code d'accès à l'application" : 'App access code';
  static String get logout => _isFr ? 'Déconnexion' : 'Logout';

  // Settings
  static String get settings => _isFr ? 'Paramètres' : 'Settings';
  static String get settingsSubtitle => _isFr
      ? 'Gérez vos préférences et la sécurité de votre compte.'
      : 'Manage your preferences and account security.';
  static String get preferences => _isFr ? 'PRÉFÉRENCES' : 'PREFERENCES';
  static String get darkMode => _isFr ? 'Mode sombre' : 'Dark Mode';
  static String get language => _isFr ? 'Langue' : 'Language';
  static String get securitySection => _isFr ? 'SÉCURITÉ' : 'SECURITY';
  static String get privacy => _isFr ? 'Confidentialité' : 'Privacy';
  static String get linkedAccounts => _isFr ? 'Comptes liés' : 'Linked Accounts';
  static String get support => _isFr ? 'ASSISTANCE' : 'SUPPORT';
  static String get helpCenter => _isFr ? "Centre d'aide" : 'Help Center';
  static String get about => _isFr ? 'À propos' : 'About';
  static String get logOut => _isFr ? 'Se déconnecter' : 'Log Out';
  static String get english => _isFr ? 'Anglais' : 'English';
  static String get french => _isFr ? 'Français' : 'French';
  static String get chooseLanguage => _isFr ? 'Choisir la langue' : 'Choose Language';

  // Send / Receive
  static String get sendMoney => _isFr ? 'Envoyer de l\'argent' : 'Send Money';
  static String get recipientPhone => _isFr ? 'Numéro du destinataire' : "Recipient's Phone Number";
  static String get note => _isFr ? 'Note (facultatif)' : 'Note (optional)';
  static String get reviewAndSend => _isFr ? 'Vérifier et envoyer' : 'Review & Send';
  static String get confirmWithPin => _isFr ? 'Confirmer avec le PIN' : 'Confirm with PIN';
  static String get moneySent => _isFr ? 'Argent envoyé avec succès.' : 'Money sent successfully.';
  static String get liveSendUnavailableTitle => _isFr
      ? "L'envoi entre particuliers n'est pas encore disponible"
      : 'Peer-to-peer send isn\'t available yet';
  static String get liveSendUnavailableBody => _isFr
      ? "L'API PayCam V1 ne prend en charge que les paiements initiés par les marchands. Activez le mode démo dans les Paramètres pour explorer ce flux."
      : "PayCam's V1 API only supports merchant-initiated payments to your wallet, not direct transfers to other customers. Enable Demo Mode in Settings to preview this flow with sample data.";
  static String get openDemoMode => _isFr ? 'Activer le mode démo' : 'Enable Demo Mode';

  static String get receiveMoney => _isFr ? 'Recevoir de l\'argent' : 'Receive Money';
  static String get shareToReceive => _isFr
      ? 'Partagez ce code ou votre numéro pour recevoir un paiement.'
      : 'Share this code or your number to receive a payment.';
  static String get yourPaycamNumber => _isFr ? 'Votre numéro PayCam' : 'Your PayCam Number';
  static String get shareCode => _isFr ? 'Partager le code' : 'Share Code';
  static String get copyNumber => _isFr ? 'Copier le numéro' : 'Copy Number';

  // Errors / connectivity
  static String get connectionError => _isFr
      ? "Impossible de contacter PayCam. Vérifiez votre connexion."
      : 'Could not reach PayCam. Check your connection.';
}
