// src/components/booking/VehicleCategorySelector.tsx

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, RadioButton, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type VehicleCategory = 'BERLINE_EXECUTIVE' | 'SUV_LUXE' | 'VAN_PREMIUM';

interface VehicleCategorySelectorProps {
  selectedCategory: VehicleCategory;
  onSelect: (category: VehicleCategory) => void;
  style?: any;
}

interface CategoryOption {
  id: VehicleCategory;
  name: string;
  icon: string;
  passengers: number;
  description: string;
  estimatedPrice: number;
}

export const VehicleCategorySelector: React.FC<VehicleCategorySelectorProps> = ({
  selectedCategory,
  onSelect,
  style,
}) => {
  const categories: CategoryOption[] = [
    {
      id: 'BERLINE_EXECUTIVE',
      name: 'Berline Exécutive',
      icon: 'car',
      passengers: 4,
      description: 'Confort et élégance',
      estimatedPrice: 45,
    },
    {
      id: 'SUV_LUXE',
      name: 'SUV Luxe',
      icon: 'car-estate',
      passengers: 6,
      description: 'Espace et prestige',
      estimatedPrice: 65,
    },
    {
      id: 'VAN_PREMIUM',
      name: 'Van Premium',
      icon: 'van-passenger',
      passengers: 8,
      description: 'Idéal pour les groupes',
      estimatedPrice: 85,
    },
  ];

  return (
    <Card style={[styles.container, style]}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          Type de véhicule
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoriesRow}>
            {categories.map((category) => (
              <Card
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.selectedCard,
                ]}
                onPress={() => onSelect(category.id)}
              >
                <Card.Content style={styles.categoryContent}>
                  <Icon
                    name={category.icon}
                    size={32}
                    color={selectedCategory === category.id ? '#2196F3' : '#666'}
                  />
                  <Text variant="bodyMedium" style={styles.categoryName}>
                    {category.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.categoryDescription}>
                    {category.description}
                  </Text>
                  <Text variant="bodySmall" style={styles.passengers}>
                    {category.passengers} passagers
                  </Text>
                  <Text variant="bodySmall" style={styles.price}>
                    À partir de {category.estimatedPrice}€
                  </Text>
                  
                  <RadioButton
                    value={category.id}
                    status={selectedCategory === category.id ? 'checked' : 'unchecked'}
                    onPress={() => onSelect(category.id)}
                  />
                </Card.Content>
              </Card>
            ))}
          </View>
        </ScrollView>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    marginBottom: 16,
    fontWeight: '600',
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    width: 140,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  categoryContent: {
    alignItems: 'center',
    padding: 12,
  },
  categoryName: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryDescription: {
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.7,
  },
  passengers: {
    marginTop: 4,
    textAlign: 'center',
    color: '#2196F3',
  },
  price: {
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
    color: '#4CAF50',
  },
});