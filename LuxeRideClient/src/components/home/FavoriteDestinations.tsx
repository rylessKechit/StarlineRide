import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, List } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface FavoriteDestination {
  id: string;
  name: string;
  address: string;
  icon: string;
}

interface FavoriteDestinationsProps {
  onDestinationSelect: (destination: FavoriteDestination) => void;
  style?: any;
}

export const FavoriteDestinations: React.FC<FavoriteDestinationsProps> = ({ 
  onDestinationSelect, 
  style 
}) => {
  const favorites: FavoriteDestination[] = [
    { id: '1', name: 'Domicile', address: '123 Rue de la Paix, Paris', icon: 'home' },
    { id: '2', name: 'Bureau', address: '456 Avenue des Champs-Élysées', icon: 'office-building' },
    { id: '3', name: 'Aéroport CDG', address: 'Aéroport Charles de Gaulle', icon: 'airplane' },
  ];

  return (
    <Card style={[favoriteStyles.container, style]}>
      <Card.Content>
        <Text variant="titleMedium" style={favoriteStyles.title}>
          Destinations favorites
        </Text>
        
        {favorites.map((destination) => (
          <List.Item
            key={destination.id}
            title={destination.name}
            description={destination.address}
            left={(props) => <List.Icon {...props} icon={destination.icon} />}
            onPress={() => onDestinationSelect(destination)}
            style={favoriteStyles.item}
          />
        ))}
      </Card.Content>
    </Card>
  );
};

const favoriteStyles = StyleSheet.create({
  container: {
    elevation: 2,
    marginVertical: 8,
  },
  title: {
    marginBottom: 8,
    fontWeight: '600',
  },
  item: {
    paddingVertical: 4,
  },
});