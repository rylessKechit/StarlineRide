// src/components/tracking/EmergencyButton.tsx

import React from 'react';
import { StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';

interface EmergencyButtonProps {
  onPress: () => void;
  style?: any;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({
  onPress,
  style,
}) => {
  const COLORS = {
    error: '#F44336',
  };

  return (
    <FAB
      icon="alert"
      onPress={onPress}
      style={[styles.button, { backgroundColor: COLORS.error }, style]}
      color="white"
      size="medium"
    />
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
  },
});