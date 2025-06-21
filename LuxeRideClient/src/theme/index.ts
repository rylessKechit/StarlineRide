// src/theme/index.ts

import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { configureFonts, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { COLORS, TYPOGRAPHY, SPACING, LAYOUT } from '../constants';

// Configuration des polices
const fontConfig = {
  web: {
    regular: {
      fontFamily: 'System',
      fontWeight: 'normal' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100' as const,
    },
  },
  ios: {
    regular: {
      fontFamily: 'System',
      fontWeight: 'normal' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100' as const,
    },
  },
  android: {
    regular: {
      fontFamily: 'sans-serif',
      fontWeight: 'normal' as const,
    },
    medium: {
      fontFamily: 'sans-serif-medium',
      fontWeight: 'normal' as const,
    },
    light: {
      fontFamily: 'sans-serif-light',
      fontWeight: 'normal' as const,
    },
    thin: {
      fontFamily: 'sans-serif-thin',
      fontWeight: 'normal' as const,
    },
  },
};

// Thème clair pour React Native Paper
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    primaryContainer: COLORS.primary + '20',
    secondary: COLORS.secondary,
    secondaryContainer: COLORS.secondary + '20',
    tertiary: COLORS.accent,
    tertiaryContainer: COLORS.accent + '20',
    surface: COLORS.surface,
    surfaceVariant: COLORS.surfaceVariant,
    background: COLORS.background,
    error: COLORS.error,
    errorContainer: COLORS.error + '20',
    onPrimary: COLORS.textOnPrimary,
    onSecondary: COLORS.textPrimary,
    onTertiary: COLORS.textOnPrimary,
    onSurface: COLORS.textPrimary,
    onSurfaceVariant: COLORS.textSecondary,
    onBackground: COLORS.textPrimary,
    onError: COLORS.textOnPrimary,
    outline: COLORS.border,
    outlineVariant: COLORS.borderLight,
    shadow: COLORS.textPrimary,
    scrim: COLORS.overlay,
    inverseSurface: COLORS.textPrimary,
    inverseOnSurface: COLORS.surface,
    inversePrimary: COLORS.primary,
    elevation: {
      level0: 'transparent',
      level1: COLORS.surface,
      level2: '#f7f7f7',
      level3: '#f0f0f0',
      level4: '#eeeeee',
      level5: '#e8e8e8',
    },
    // Couleurs personnalisées LuxeRide
    success: COLORS.success,
    warning: COLORS.warning,
    info: COLORS.info,
    gold: COLORS.gold,
    silver: COLORS.silver,
    premium: COLORS.premium,
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: LAYOUT.borderRadius.md,
};

// Thème sombre pour React Native Paper
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#6B9FFF', // Bleu plus clair pour le mode sombre
    primaryContainer: '#1E3A8A',
    secondary: '#FFB366', // Or plus clair
    secondaryContainer: '#F59E0B',
    tertiary: '#4AE374', // Vert plus clair
    tertiaryContainer: '#10B981',
    surface: '#1E1E1E',
    surfaceVariant: '#2A2A2A',
    background: '#121212',
    error: '#FF6B6B',
    errorContainer: '#8B0000',
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    onTertiary: '#000000',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#B0B0B0',
    onBackground: '#FFFFFF',
    onError: '#FFFFFF',
    outline: '#404040',
    outlineVariant: '#2A2A2A',
    shadow: '#000000',
    scrim: 'rgba(0, 0, 0, 0.7)',
    inverseSurface: '#FFFFFF',
    inverseOnSurface: '#121212',
    inversePrimary: COLORS.primary,
    elevation: {
      level0: 'transparent',
      level1: '#1E1E1E',
      level2: '#232323',
      level3: '#282828',
      level4: '#2C2C2C',
      level5: '#313131',
    },
    // Couleurs personnalisées pour le mode sombre
    success: '#4AE374',
    warning: '#FFB366',
    info: '#6B9FFF',
    gold: '#FFD700',
    silver: '#E5E5E5',
    premium: '#B794F6',
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: LAYOUT.borderRadius.md,
};

// Thème pour React Navigation (clair)
export const lightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.textPrimary,
    border: COLORS.border,
    notification: COLORS.error,
  },
};

// Thème pour React Navigation (sombre)
export const darkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#6B9FFF',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#404040',
    notification: '#FF6B6B',
  },
};

// Types pour TypeScript
export type Theme = typeof lightTheme;
export type NavigationTheme = typeof lightNavigationTheme;

// Utilitaires pour créer des styles avec le thème
export const createThemedStyles = <T>(
  styleCreator: (theme: Theme) => T
) => {
  return (theme: Theme) => styleCreator(theme);
};

// Hook pour utiliser le thème dans les composants
import { useTheme as usePaperTheme } from 'react-native-paper';
export const useTheme = () => usePaperTheme<Theme>();

// Styles communs réutilisables
export const commonStyles = {
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  centerContent: {
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
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    ...{
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
  },
  inputContainer: {
    marginVertical: SPACING.sm,
  },
  buttonContainer: {
    marginVertical: SPACING.md,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    height: LAYOUT.headerHeight,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textOnPrimary,
  },
  screenPadding: {
    paddingHorizontal: LAYOUT.screenPadding,
  },
  bottomPadding: {
    paddingBottom: LAYOUT.tabBarHeight,
  },
};

// Animations et transitions
export const animations = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  slideInUp: {
    from: { transform: [{ translateY: 100 }] },
    to: { transform: [{ translateY: 0 }] },
  },
  slideInDown: {
    from: { transform: [{ translateY: -100 }] },
    to: { transform: [{ translateY: 0 }] },
  },
  scaleIn: {
    from: { transform: [{ scale: 0.8 }] },
    to: { transform: [{ scale: 1 }] },
  },
};

// Breakpoints pour responsive design
export const breakpoints = {
  small: 360,
  medium: 768,
  large: 1024,
  extraLarge: 1440,
};

// Utilitaire pour vérifier la taille d'écran
import { Dimensions } from 'react-native';

export const getScreenSize = () => {
  const { width } = Dimensions.get('window');
  
  if (width < breakpoints.small) return 'xs';
  if (width < breakpoints.medium) return 'sm';
  if (width < breakpoints.large) return 'md';
  if (width < breakpoints.extraLarge) return 'lg';
  return 'xl';
};

// Hook pour la taille d'écran
import { useState, useEffect } from 'react';

export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState(getScreenSize());

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setScreenSize(getScreenSize());
    });

    return () => subscription?.remove();
  }, []);

  return screenSize;
};

// Utilitaire pour créer des styles responsifs
export const responsive = {
  fontSize: (base: number) => {
    const size = getScreenSize();
    const multipliers = { xs: 0.8, sm: 0.9, md: 1, lg: 1.1, xl: 1.2 };
    return base * (multipliers[size] || 1);
  },
  
  spacing: (base: number) => {
    const size = getScreenSize();
    const multipliers = { xs: 0.8, sm: 0.9, md: 1, lg: 1.1, xl: 1.2 };
    return base * (multipliers[size] || 1);
  },
  
  borderRadius: (base: number) => {
    const size = getScreenSize();
    const multipliers = { xs: 0.8, sm: 0.9, md: 1, lg: 1, xl: 1 };
    return base * (multipliers[size] || 1);
  },
};