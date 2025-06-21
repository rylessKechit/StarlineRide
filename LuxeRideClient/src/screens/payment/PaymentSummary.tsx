// src/components/payment/PaymentSummary.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';

interface TripData {
  finalPrice: number;
  distance: number;
  duration: number;
  bookingId?: string;
  driverName?: string;
  vehicleInfo?: string;
}

interface PaymentSummaryProps {
  tripData: TripData;
  tipAmount: number;
  totalAmount: number;
  style?: any;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  tripData,
  tipAmount,
  totalAmount,
  style,
}) => {
  const COLORS = {
    primary: '#2196F3',
  };

  return (
    <Card style={[styles.container, style]}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          Récapitulatif
        </Text>
        
        <View style={styles.row}>
          <Text variant="bodyMedium">Course</Text>
          <Text variant="bodyMedium">{tripData.finalPrice?.toFixed(2)}€</Text>
        </View>
        
        <View style={styles.row}>
          <Text variant="bodyMedium">Frais de service</Text>
          <Text variant="bodyMedium">2.50€</Text>
        </View>
        
        {tipAmount > 0 && (
          <View style={styles.row}>
            <Text variant="bodyMedium">Pourboire</Text>
            <Text variant="bodyMedium">{tipAmount.toFixed(2)}€</Text>
          </View>
        )}
        
        <Divider style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text variant="titleMedium" style={styles.totalLabel}>
            Total
          </Text>
          <Text variant="titleLarge" style={[styles.totalAmount, { color: COLORS.primary }]}>
            {totalAmount.toFixed(2)}€
          </Text>
        </View>
        
        <Text variant="bodySmall" style={styles.disclaimer}>
          Montant débité de votre carte
        </Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    elevation: 2,
  },
  title: {
    marginBottom: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  totalAmount: {
    fontWeight: 'bold',
  },
  disclaimer: {
    textAlign: 'center',
    opacity: 0.6,
    fontStyle: 'italic',
  },
});