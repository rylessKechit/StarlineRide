// src/components/auth/LogoHeader.tsx

import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useTheme } from '../../theme';

interface LogoHeaderProps {
  title: string;
  subtitle: string;
  style?: object;
}

export const LogoHeader: React.FC<LogoHeaderProps> = ({
  title,
  subtitle,
  style
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      {/* Logo */}
      <Surface style={[styles.logoContainer, { backgroundColor: theme.colors.surface }]}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Surface>

      {/* Titre et sous-titre */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]} variant="headlineSmall">
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]} variant="bodyMedium">
          {subtitle}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logo: {
    width: 60,
    height: 60,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20,
  },
});