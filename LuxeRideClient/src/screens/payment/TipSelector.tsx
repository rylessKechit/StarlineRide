// src/components/payment/TipSelector.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip, Text } from 'react-native-paper';

interface TipSelectorProps {
  baseAmount: number;
  selectedTip: number;
  onTipSelect: (amount: number) => void;
  style?: any;
}

interface TipOption {
  percentage: number;
  amount: number;
}

export const TipSelector: React.FC<TipSelectorProps> = ({
  baseAmount,
  selectedTip,
  onTipSelect,
  style,
}) => {
  const tipOptions: TipOption[] = [
    { percentage: 10, amount: Math.round(baseAmount * 0.1 * 100) / 100 },
    { percentage: 15, amount: Math.round(baseAmount * 0.15 * 100) / 100 },
    { percentage: 20, amount: Math.round(baseAmount * 0.2 * 100) / 100 },
  ];

  return (
    <View style={[styles.container, style]}>
      <Text variant="bodyMedium" style={styles.label}>
        Suggestions de pourboire
      </Text>
      
      <View style={styles.chipContainer}>
        <Chip
          mode={selectedTip === 0 ? 'flat' : 'outlined'}
          selected={selectedTip === 0}
          onPress={() => onTipSelect(0)}
          style={styles.chip}
        >
          Aucun
        </Chip>
        
        {tipOptions.map((option) => (
          <Chip
            key={option.percentage}
            mode={selectedTip === option.amount ? 'flat' : 'outlined'}
            selected={selectedTip === option.amount}
            onPress={() => onTipSelect(option.amount)}
            style={styles.chip}
          >
            {option.percentage}% ({option.amount}€)
          </Chip>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    marginBottom: 12,
    opacity: 0.7,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
});