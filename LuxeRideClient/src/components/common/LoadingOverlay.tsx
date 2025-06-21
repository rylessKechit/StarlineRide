// src/components/common/LoadingOverlay.tsx

import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { ActivityIndicator, Text, Surface } from 'react-native-paper';
import { useTheme } from '../../theme';

interface LoadingOverlayProps {
  message?: string;
  visible?: boolean;
  transparent?: boolean;
  size?: 'small' | 'large';
  color?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Chargement...',
  visible = true,
  transparent = true,
  size = 'large',
  color
}) => {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Modal
      transparent={transparent}
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]}>
          <ActivityIndicator 
            size={size} 
            color={color || theme.colors.primary}
            style={styles.indicator}
          />
          {message && (
            <Text 
              style={[styles.message, { color: theme.colors.onSurface }]}
              variant="bodyMedium"
            >
              {message}
            </Text>
          )}
        </Surface>
      </View>
    </Modal>
  );
};

// Version simplifiée pour usage dans les composants sans modal
export const LoadingIndicator: React.FC<LoadingOverlayProps> = ({
  message = 'Chargement...',
  size = 'large',
  color
}) => {
  const theme = useTheme();

  return (
    <View style={styles.simpleContainer}>
      <ActivityIndicator 
        size={size} 
        color={color || theme.colors.primary}
        style={styles.indicator}
      />
      {message && (
        <Text 
          style={[styles.message, { color: theme.colors.onSurface }]}
          variant="bodyMedium"
        >
          {message}
        </Text>
      )}
    </View>
  );
};

// Version pour les écrans de chargement complets
export const FullScreenLoading: React.FC<LoadingOverlayProps> = ({
  message = 'Chargement...',
  size = 'large',
  color
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.centerContent}>
        <ActivityIndicator 
          size={size} 
          color={color || theme.colors.primary}
          style={styles.indicator}
        />
        {message && (
          <Text 
            style={[styles.message, { color: theme.colors.onBackground }]}
            variant="bodyLarge"
          >
            {message}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 24,
    borderRadius: 16,
    minWidth: 150,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  simpleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    marginBottom: 16,
  },
  message: {
    textAlign: 'center',
    lineHeight: 20,
  },
});