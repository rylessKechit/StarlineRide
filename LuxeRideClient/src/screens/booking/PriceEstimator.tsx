// src/components/booking/PriceEstimator.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface PriceEstimate {
  basePrice: number;
  distancePrice: number;
  timePrice: number;
  total: number;
  surge?: number;
}

interface PriceEstimatorProps {
  estimate: PriceEstimate | null;
  duration?: number | null;
  style?: any;
}

export const PriceEstimator: React.FC<PriceEstimatorProps> = ({
  estimate,
  duration,
  style,
}) => {
  if (!estimate) return null;

  const COLORS = {
    primary: '#2196F3',
    warning: '#FF9800',
    success: '#4CAF50',
  };

  return (
    <Card style={[styles.container, style]}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            Estimation du prix
          </Text>
          {estimate.surge && estimate.surge > 1 && (
            <Chip
              mode="flat"
              style={[styles.surgeChip, { backgroundColor: COLORS.warning + '20' }]}
              textStyle={{ color: COLORS.warning, fontSize: 12 }}
            >
              Demande élevée +{((estimate.surge - 1) * 100).toFixed(0)}%
            </Chip>
          )}
        </View>

        <View style={styles.priceBreakdown}>
          <View style={styles.priceRow}>
            <Text variant="bodyMedium">Prix de base</Text>
            <Text variant="bodyMedium">{estimate.basePrice.toFixed(2)}€</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text variant="bodyMedium">Distance</Text>
            <Text variant="bodyMedium">{estimate.distancePrice.toFixed(2)}€</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text variant="bodyMedium">Temps</Text>
            <Text variant="bodyMedium">{estimate.timePrice.toFixed(2)}€</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.totalRow}>
          <Text variant="titleMedium" style={styles.totalLabel}>
            Total estimé
          </Text>
          <Text variant="titleLarge" style={[styles.totalPrice, { color: COLORS.primary }]}>
            {estimate.total.toFixed(2)}€
          </Text>
        </View>

        {duration && (
          <View style={styles.duration}>
            <Icon name="clock-outline" size={16} color="#666" />
            <Text variant="bodySmall" style={styles.durationText}>
              Temps estimé: {Math.round(duration)} minutes
            </Text>
          </View>
        )}

        <Text variant="bodySmall" style={styles.disclaimer}>
          Prix final calculé à la fin du trajet
        </Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '600',
  },
  surgeChip: {
    height: 24,
  },
  priceBreakdown: {
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  divider: {
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontWeight: '600',
  },
  totalPrice: {
    fontWeight: 'bold',
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  durationText: {
    marginLeft: 4,
    color: '#666',
  },
  disclaimer: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.6,
  },
});