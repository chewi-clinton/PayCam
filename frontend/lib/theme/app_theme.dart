import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Kinetic Finance design system — see stitch_paycam_fintech_mobile_application/kinetic_finance/DESIGN.md
///
/// Every color is a getter keyed off [_isDark] rather than a `static
/// const`, so every screen that already reads `AppColors.xxx` (there's
/// no per-screen Theme.of(context) plumbing in this app) picks up dark
/// mode automatically once [setDark] flips the flag and the widget
/// tree is remounted (see ThemeController / main.dart's ValueKey).
class AppColors {
  AppColors._();

  static bool _isDark = false;
  static bool get isDark => _isDark;
  static void setDark(bool value) => _isDark = value;

  // Brand green stays identical in both modes — it's the one constant
  // across the whole "Green / Black / White" palette.
  static const primary = Color(0xFF48B836);
  static const primaryContainer = Color(0xFF48B836);

  static Color get primaryDark => _isDark ? const Color(0xFFFFFFFF) : const Color(0xFF000000);
  static Color get onPrimaryContainer => _isDark ? const Color(0xFFFFFFFF) : const Color(0xFF000000);

  static Color get surface => _isDark ? const Color(0xFF0C0E0D) : const Color(0xFFFFFFFF);
  static Color get surfaceContainerLowest => _isDark ? const Color(0xFF17191B) : const Color(0xFFFFFFFF);
  static Color get surfaceContainerLow => _isDark ? const Color(0xFF1C1F1D) : const Color(0xFFF5F7F4);
  static Color get surfaceContainer => _isDark ? const Color(0xFF23271F) : const Color(0xFFEFF3EC);
  static Color get surfaceContainerHigh => _isDark ? const Color(0xFF2C3129) : const Color(0xFFE4EBE0);

  static Color get onSurface => _isDark ? const Color(0xFFF4F6F2) : const Color(0xFF000000);
  static Color get onSurfaceVariant => _isDark ? const Color(0xFFB6BEB2) : const Color(0xFF4A4F49);
  static Color get outline => _isDark ? const Color(0xFF868F80) : const Color(0xFF6F7B68);
  static Color get outlineVariant => _isDark ? const Color(0xFF3A4038) : const Color(0xFFBECAB5);

  static const inkBlack = Color(0xFF000000);

  static Color get error => _isDark ? const Color(0xFFFFB4AB) : const Color(0xFFBA1A1A);
  static Color get errorContainer => _isDark ? const Color(0xFF5B1A16) : const Color(0xFFFFDAD6);
  static Color get onErrorContainer => _isDark ? const Color(0xFFFFDAD6) : const Color(0xFF93000A);

  static Color get warningAmber => const Color(0xFFF59E0B);
  static Color get warningAmberContainer => _isDark ? const Color(0xFF4A3607) : const Color(0xFFFEF3C7);

  static Color get inputFill => _isDark ? const Color(0xFF1C1F1D) : const Color(0xFFF8FAFC);

  static const mtnYellow = Color(0xFFFFCC00);
  static const orangeBrand = Color(0xFFFF6600);

  static const btcOrange = Color(0xFFF7931A);
  static const ethBlue = Color(0xFF627EEA);
  static const usdtGreen = Color(0xFF26A17B);
}

class AppRadii {
  AppRadii._();
  static const sm = 8.0;
  static const md = 12.0;
  static const card = 16.0;
  static const button = 20.0;
  static const xl = 24.0;
  static const sheet = 32.0;
  static const full = 999.0;
}

class AppSpacing {
  AppSpacing._();
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
  static const xxl = 48.0;
  static const margin = 20.0;
}

class AppShadows {
  AppShadows._();
  static List<BoxShadow> get level1 => [
        BoxShadow(
          color: AppColors.isDark ? const Color(0x40000000) : const Color(0x0A000000),
          blurRadius: 20,
          offset: const Offset(0, 4),
        ),
      ];
  static List<BoxShadow> get level2 => [
        BoxShadow(
          color: AppColors.isDark ? const Color(0x66000000) : const Color(0x14000000),
          blurRadius: 32,
          offset: const Offset(0, 8),
        ),
      ];
}

class AppTheme {
  AppTheme._();

  /// Sets [AppColors]' brightness flag and builds a matching ThemeData.
  /// Call this (not a cached `.light`/`.dark` constant) so the two
  /// stay in lockstep — see ThemeController.
  static ThemeData themeFor(bool isDark) {
    AppColors.setDark(isDark);

    final base = ThemeData(
      useMaterial3: true,
      brightness: isDark ? Brightness.dark : Brightness.light,
      scaffoldBackgroundColor: AppColors.surface,
      colorScheme: isDark
          ? const ColorScheme.dark().copyWith(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              surface: AppColors.surface,
              onSurface: AppColors.onSurface,
              error: AppColors.error,
              onError: Colors.black,
              secondary: AppColors.primaryDark,
            )
          : ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              surface: AppColors.surface,
              onSurface: AppColors.onSurface,
              error: AppColors.error,
              onError: Colors.white,
              secondary: AppColors.primaryDark,
            ),
    );

    final textTheme = GoogleFonts.interTextTheme(base.textTheme).copyWith(
      displayLarge: GoogleFonts.inter(
        fontSize: 48, fontWeight: FontWeight.w700, height: 56 / 48,
        letterSpacing: -0.02 * 48, color: AppColors.onSurface,
      ),
      headlineLarge: GoogleFonts.inter(
        fontSize: 28, fontWeight: FontWeight.w600, height: 36 / 28,
        letterSpacing: -0.01 * 28, color: AppColors.onSurface,
      ),
      headlineMedium: GoogleFonts.inter(
        fontSize: 24, fontWeight: FontWeight.w600, height: 32 / 24,
        color: AppColors.onSurface,
      ),
      titleLarge: GoogleFonts.inter(
        fontSize: 20, fontWeight: FontWeight.w500, height: 28 / 20,
        color: AppColors.onSurface,
      ),
      bodyLarge: GoogleFonts.inter(
        fontSize: 16, fontWeight: FontWeight.w400, height: 24 / 16,
        color: AppColors.onSurface,
      ),
      bodyMedium: GoogleFonts.inter(
        fontSize: 14, fontWeight: FontWeight.w400, height: 20 / 14,
        color: AppColors.onSurfaceVariant,
      ),
      labelMedium: GoogleFonts.inter(
        fontSize: 12, fontWeight: FontWeight.w600, height: 16 / 12,
        letterSpacing: 0.05 * 12, color: AppColors.onSurfaceVariant,
      ),
    );

    return base.copyWith(
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: AppColors.onSurface),
        titleTextStyle: GoogleFonts.inter(
          fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.primary,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(56),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadii.button),
          ),
          textStyle: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.onSurface,
          minimumSize: const Size.fromHeight(56),
          side: BorderSide(color: AppColors.outlineVariant, width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadii.button),
          ),
          textStyle: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.inputFill,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: BorderSide(color: AppColors.error, width: 1.5),
        ),
        hintStyle: GoogleFonts.inter(color: AppColors.outline),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surfaceContainerLowest,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.card),
        ),
        margin: EdgeInsets.zero,
      ),
      dividerTheme: DividerThemeData(
        color: AppColors.surfaceContainerHigh,
        thickness: 1,
        space: 1,
      ),
    );
  }
}

/// Mono-numeric style for currency/amount/address display, per design spec.
TextStyle monoNumeric({double size = 16, FontWeight weight = FontWeight.w500, Color? color}) {
  return GoogleFonts.robotoMono(
    fontSize: size,
    fontWeight: weight,
    color: color ?? AppColors.onSurface,
    height: 24 / 16,
  );
}
