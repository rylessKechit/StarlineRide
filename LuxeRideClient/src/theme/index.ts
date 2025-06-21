// src/theme/index.ts

import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { useColorScheme } from 'react-native';

// Types pour le thème
interface CustomTheme {
  colors: {
    primary: string;
    onPrimary: string;
    primaryContainer: string;
    onPrimaryContainer: string;
    secondary: string;
    onSecondary: string;
    secondaryContainer: string;
    onSecondaryContainer: string;
    tertiary: string;
    onTertiary: string;
    tertiaryContainer: string;
    onTertiaryContainer: string;
    error: string;
    onError: string;
    errorContainer: string;
    onErrorContainer: string;
    background: string;
    onBackground: string;
    surface: string;
    onSurface: string;
    surfaceVariant: string;
    onSurfaceVariant: string;
    outline: string;
    outlineVariant: string;
    shadow: string;
    scrim: string;
    inverseSurface: string;
    inverseOnSurface: string;
    inversePrimary: string;
    elevation: {
      level0: string;
      level1: string;
      level2: string;
      level3: string;
      level4: string;
      level5: string;
    };
    surfaceDisabled: string;
    onSurfaceDisabled: string;
    backdrop: string;
  };
  dark: boolean;
  fonts?: any;
}

// Couleurs personnalisées LuxeRide
const luxeRideColors = {
  primary: '#2196F3',
  primaryDark: '#1976D2',
  secondary: '#FF6B35',
  secondaryDark: '#E55A2B',
  success: '#4CAF50',
  successDark: '#388E3C',
  warning: '#FF9800',
  warningDark: '#F57C00',
  error: '#F44336',
  errorDark: '#D32F2F',
  info: '#2196F3',
  infoDark: '#1976D2',
  background: '#FFFFFF',
  backgroundDark: '#121212',
  surface: '#FFFFFF',
  surfaceDark: '#1E1E1E',
  text: '#000000',
  textDark: '#FFFFFF',
  textSecondary: '#666666',
  textSecondaryDark: '#AAAAAA',
  border: '#E0E0E0',
  borderDark: '#333333',
  disabled: '#BDBDBD',
  disabledDark: '#424242',
};

// Configuration des polices
const fontConfig = {
  web: {
    displayLarge: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '400' as const,
      fontSize: 57,
      letterSpacing: 0,
      lineHeight: 64,
    },
    displayMedium: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '400' as const,
      fontSize: 45,
      letterSpacing: 0,
      lineHeight: 52,
    },
    displaySmall: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '400' as const,
      fontSize: 36,
      letterSpacing: 0,
      lineHeight: 44,
    },
    headlineLarge: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '400' as const,
      fontSize: 32,
      letterSpacing: 0,
      lineHeight: 40,
    },
    headlineMedium: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '400' as const,
      fontSize: 28,
      letterSpacing: 0,
      lineHeight: 36,
    },
    headlineSmall: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '400' as const,
      fontSize: 24,
      letterSpacing: 0,
      lineHeight: 32,
    },
    titleLarge: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '500' as const,
      fontSize: 22,
      letterSpacing: 0,
      lineHeight: 28,
    },
    titleMedium: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '500' as const,
      fontSize: 16,
      letterSpacing: 0.15,
      lineHeight: 24,
    },
    titleSmall: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '500' as const,
      fontSize: 14,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    labelLarge: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '500' as const,
      fontSize: 14,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    labelMedium: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '500' as const,
      fontSize: 12,
      letterSpacing: 0.5,
      lineHeight: 16,
    },
    labelSmall: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '500' as const,
      fontSize: 11,
      letterSpacing: 0.5,
      lineHeight: 16,
    },
    bodyLarge: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '400' as const,
      fontSize: 16,
      letterSpacing: 0.15,
      lineHeight: 24,
    },
    bodyMedium: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '400' as const,
      fontSize: 14,
      letterSpacing: 0.25,
      lineHeight: 20,
    },
    bodySmall: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '400' as const,
      fontSize: 12,
      letterSpacing: 0.4,
      lineHeight: 16,
    },
  },
  ios: {
    displayLarge: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 57,
      letterSpacing: 0,
      lineHeight: 64,
    },
    displayMedium: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 45,
      letterSpacing: 0,
      lineHeight: 52,
    },
    displaySmall: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 36,
      letterSpacing: 0,
      lineHeight: 44,
    },
    headlineLarge: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 32,
      letterSpacing: 0,
      lineHeight: 40,
    },
    headlineMedium: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 28,
      letterSpacing: 0,
      lineHeight: 36,
    },
    headlineSmall: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 24,
      letterSpacing: 0,
      lineHeight: 32,
    },
    titleLarge: {
      fontFamily: 'System',
      fontWeight: '500' as const,
      fontSize: 22,
      letterSpacing: 0,
      lineHeight: 28,
    },
    titleMedium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
      fontSize: 16,
      letterSpacing: 0.15,
      lineHeight: 24,
    },
    titleSmall: {
      fontFamily: 'System',
      fontWeight: '500' as const,
      fontSize: 14,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    labelLarge: {
      fontFamily: 'System',
      fontWeight: '500' as const,
      fontSize: 14,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    labelMedium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
      fontSize: 12,
      letterSpacing: 0.5,
      lineHeight: 16,
    },
    labelSmall: {
      fontFamily: 'System',
      fontWeight: '500' as const,
      fontSize: 11,
      letterSpacing: 0.5,
      lineHeight: 16,
    },
    bodyLarge: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 16,
      letterSpacing: 0.15,
      lineHeight: 24,
    },
    bodyMedium: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 14,
      letterSpacing: 0.25,
      lineHeight: 20,
    },
    bodySmall: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 12,
      letterSpacing: 0.4,
      lineHeight: 16,
    },
  },
  android: {
    displayLarge: {
      fontFamily: 'Roboto',
      fontWeight: 'normal' as const,
      fontSize: 57,
      letterSpacing: 0,
      lineHeight: 64,
    },
    displayMedium: {
      fontFamily: 'Roboto',
      fontWeight: 'normal' as const,
      fontSize: 45,
      letterSpacing: 0,
      lineHeight: 52,
    },
    displaySmall: {
      fontFamily: 'Roboto',
      fontWeight: 'normal' as const,
      fontSize: 36,
      letterSpacing: 0,
      lineHeight: 44,
    },
    headlineLarge: {
      fontFamily: 'Roboto',
      fontWeight: 'normal' as const,
      fontSize: 32,
      letterSpacing: 0,
      lineHeight: 40,
    },
    headlineMedium: {
      fontFamily: 'Roboto',
      fontWeight: 'normal' as const,
      fontSize: 28,
      letterSpacing: 0,
      lineHeight: 36,
    },
    headlineSmall: {
      fontFamily: 'Roboto',
      fontWeight: 'normal' as const,
      fontSize: 24,
      letterSpacing: 0,
      lineHeight: 32,
    },
    titleLarge: {
      fontFamily: 'Roboto-Medium',
      fontWeight: 'normal' as const,
      fontSize: 22,
      letterSpacing: 0,
      lineHeight: 28,
    },
    titleMedium: {
      fontFamily: 'Roboto-Medium',
      fontWeight: 'normal' as const,
      fontSize: 16,
      letterSpacing: 0.15,
      lineHeight: 24,
    },
    titleSmall: {
      fontFamily: 'Roboto-Medium',
      fontWeight: 'normal' as const,
      fontSize: 14,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    labelLarge: {
      fontFamily: 'Roboto-Medium',
      fontWeight: 'normal' as const,
      fontSize: 14,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    labelMedium: {
      fontFamily: 'Roboto-Medium',
      fontWeight: 'normal' as const,
      fontSize: 12,
      letterSpacing: 0.5,
      lineHeight: 16,
    },
    labelSmall: {
      fontFamily: 'Roboto-Medium',
      fontWeight: 'normal' as const,
      fontSize: 11,
      letterSpacing: 0.5,
      lineHeight: 16,
    },
    bodyLarge: {
      fontFamily: 'Roboto',
      fontWeight: 'normal' as const,
      fontSize: 16,
      letterSpacing: 0.15,
      lineHeight: 24,
    },
    bodyMedium: {
      fontFamily: 'Roboto',
      fontWeight: 'normal' as const,
      fontSize: 14,
      letterSpacing: 0.25,
      lineHeight: 20,
    },
    bodySmall: {
      fontFamily: 'Roboto',
      fontWeight: 'normal' as const,
      fontSize: 12,
      letterSpacing: 0.4,
      lineHeight: 16,
    },
  },
};

// Thème clair LuxeRide
export const lightTheme: CustomTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: luxeRideColors.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: '#E3F2FD',
    onPrimaryContainer: '#0D47A1',
    secondary: luxeRideColors.secondary,
    onSecondary: '#FFFFFF',
    secondaryContainer: '#FFE0DB',
    onSecondaryContainer: '#BF360C',
    tertiary: '#6200EE',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#F3E5F5',
    onTertiaryContainer: '#4A148C',
    error: luxeRideColors.error,
    onError: '#FFFFFF',
    errorContainer: '#FFEBEE',
    onErrorContainer: '#B71C1C',
    background: luxeRideColors.background,
    onBackground: luxeRideColors.text,
    surface: luxeRideColors.surface,
    onSurface: luxeRideColors.text,
    surfaceVariant: '#F5F5F5',
    onSurfaceVariant: luxeRideColors.textSecondary,
    outline: luxeRideColors.border,
    outlineVariant: '#E0E0E0',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#2E2E2E',
    inverseOnSurface: '#F5F5F5',
    inversePrimary: '#90CAF9',
    elevation: {
      level0: 'transparent',
      level1: '#F8F8F8',
      level2: '#F3F3F3',
      level3: '#EEEEEE',
      level4: '#ECECEC',
      level5: '#E8E8E8',
    },
    surfaceDisabled: luxeRideColors.disabled,
    onSurfaceDisabled: '#FFFFFF',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  fonts: configureFonts({ config: fontConfig.android }),
  dark: false,
};

// Thème sombre LuxeRide
export const darkTheme: CustomTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: luxeRideColors.primary,
    onPrimary: '#000000',
    primaryContainer: '#1565C0',
    onPrimaryContainer: '#E3F2FD',
    secondary: luxeRideColors.secondary,
    onSecondary: '#000000',
    secondaryContainer: '#D84315',
    onSecondaryContainer: '#FFE0DB',
    tertiary: '#BB86FC',
    onTertiary: '#000000',
    tertiaryContainer: '#6200EE',
    onTertiaryContainer: '#F3E5F5',
    error: luxeRideColors.errorDark,
    onError: '#000000',
    errorContainer: '#CF6679',
    onErrorContainer: '#FFEBEE',
    background: luxeRideColors.backgroundDark,
    onBackground: luxeRideColors.textDark,
    surface: luxeRideColors.surfaceDark,
    onSurface: luxeRideColors.textDark,
    surfaceVariant: '#2E2E2E',
    onSurfaceVariant: luxeRideColors.textSecondaryDark,
    outline: luxeRideColors.borderDark,
    outlineVariant: '#424242',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#F5F5F5',
    inverseOnSurface: '#2E2E2E',
    inversePrimary: luxeRideColors.primaryDark,
    elevation: {
      level0: 'transparent',
      level1: '#242424',
      level2: '#2A2A2A',
      level3: '#303030',
      level4: '#353535',
      level5: '#3A3A3A',
    },
    surfaceDisabled: luxeRideColors.disabledDark,
    onSurfaceDisabled: '#AAAAAA',
    backdrop: 'rgba(0, 0, 0, 0.7)',
  },
  fonts: configureFonts({ config: fontConfig.android }),
  dark: true,
};

// Hook pour utiliser le thème
export const useTheme = (): CustomTheme => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};

// Styles communs
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  containerDark: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  spaceBetween: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  card: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: 12,
    padding: 16,
    margin: 8,
  },
  cardDark: {
    backgroundColor: darkTheme.colors.surface,
    borderRadius: 12,
    padding: 16,
    margin: 8,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  input: {
    borderRadius: 8,
    backgroundColor: lightTheme.colors.surface,
  },
  inputDark: {
    borderRadius: 8,
    backgroundColor: darkTheme.colors.surface,
  },
  text: {
    color: lightTheme.colors.onSurface,
  },
  textDark: {
    color: darkTheme.colors.onSurface,
  },
  textSecondary: {
    color: luxeRideColors.textSecondary,
  },
  textSecondaryDark: {
    color: luxeRideColors.textSecondaryDark,
  },
  divider: {
    height: 1,
    backgroundColor: luxeRideColors.border,
    marginVertical: 8,
  },
  dividerDark: {
    height: 1,
    backgroundColor: luxeRideColors.borderDark,
    marginVertical: 8,
  },
};

// Constantes de design
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FONT_WEIGHTS = {
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
};

// Utilitaires de thème
export const getThemeColor = (theme: CustomTheme, colorName: keyof CustomTheme['colors']): string => {
  const colorValue = theme.colors[colorName];
  if (typeof colorValue === 'string') {
    return colorValue;
  }
  // If the color is an object (like 'elevation'), return a default or specific level
  if (typeof colorValue === 'object' && colorValue !== null && 'level1' in colorValue) {
    return colorValue.level1;
  }
  // Fallback to a default color if needed
  return '#000000';
};

export const getContrastColor = (theme: CustomTheme, backgroundColor: string): string => {
  // Logique simple pour déterminer si utiliser du texte clair ou sombre
  const isDark = backgroundColor === theme.colors.primary || 
                 backgroundColor === theme.colors.secondary || 
                 theme.dark;
  return isDark ? '#FFFFFF' : '#000000';
};

// Export du thème par défaut
export default lightTheme;