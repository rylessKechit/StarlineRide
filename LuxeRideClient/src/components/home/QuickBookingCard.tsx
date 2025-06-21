import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface QuickBookingCardProps {
  onQuickBook: (category: string) => void;
  style?: any;
}

export const QuickBookingCard: React.FC<QuickBookingCardProps> = ({ onQuickBook, style }) => {
  const quickOptions = [
    { id: 'BERLINE_EXECUTIVE', name: 'Berline', icon: 'car', color: '#2196F3' },
    { id: 'SUV_LUXE', name: 'SUV', icon: 'car-estate', color: '#4CAF50' },
    { id: 'VAN_PREMIUM', name: 'Van', icon: 'van-passenger', color: '#FF9800' },
  ];

  return (
    <Card style={[styles.container, style]}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          Réservation rapide
        </Text>
        
        <View style={styles.optionsContainer}>
          {quickOptions.map((option) => (
            <Chip
              key={option.id}
              mode="outlined"
              icon={() => <Icon name={option.icon} size={16} color={option.color} />}
              onPress={() => onQuickBook(option.id)}
              style={[styles.optionChip, { borderColor: option.color }]}
              textStyle={{ color: option.color }}
            >
              {option.name}
            </Chip>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    elevation: 2,
    marginVertical: 8,
  },
  title: {
    marginBottom: 16,
    fontWeight: '600',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionChip: {
    marginBottom: 8,
  },
});