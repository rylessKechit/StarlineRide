// src/components/auth/SocialLoginButtons.tsx

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme';

interface SocialLoginButtonsProps {
  onGoogleLogin: () => void;
  onAppleLogin?: () => void;
  style?: object;
  disabled?: boolean;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onGoogleLogin,
  onAppleLogin,
  style,
  disabled = false
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      {/* Bouton Google */}
      <Surface style={[styles.buttonSurface, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode="outlined"
          onPress={onGoogleLogin}
          disabled={disabled}
          style={[styles.socialButton, { borderColor: theme.colors.outline }]}
          contentStyle={styles.buttonContent}
          labelStyle={[styles.buttonLabel, { color: theme.colors.onSurface }]}
          icon={({ size }) => (
            <Icon name="google" size={size} color="#4285F4" />
          )}
        >
          Continuer avec Google
        </Button>
      </Surface>

      {/* Bouton Apple (iOS uniquement) */}
      {Platform.OS === 'ios' && onAppleLogin && (
        <Surface style={[styles.buttonSurface, { backgroundColor: theme.colors.surface }]}>
          <Button
            mode="outlined"
            onPress={onAppleLogin}
            disabled={disabled}
            style={[styles.socialButton, { borderColor: theme.colors.outline }]}
            contentStyle={styles.buttonContent}
            labelStyle={[styles.buttonLabel, { color: theme.colors.onSurface }]}
            icon={({ size }) => (
              <Icon name="apple" size={size} color="#000000" />
            )}
          >
            Continuer avec Apple
          </Button>
        </Surface>
      )}

      {/* Bouton Facebook (optionnel) */}
      <Surface style={[styles.buttonSurface, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode="outlined"
          onPress={() => {
            // Placeholder pour Facebook login
          }}
          disabled={true} // Désactivé pour le moment
          style={[styles.socialButton, { borderColor: theme.colors.outline, opacity: 0.5 }]}
          contentStyle={styles.buttonContent}
          labelStyle={[styles.buttonLabel, { color: theme.colors.onSurface }]}
          icon={({ size }) => (
            <Icon name="facebook" size={size} color="#1877F2" />
          )}
        >
          Continuer avec Facebook
        </Button>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  buttonSurface: {
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  socialButton: {
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonContent: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});