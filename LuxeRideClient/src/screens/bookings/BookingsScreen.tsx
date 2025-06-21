import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';

interface Booking {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  scheduledFor: string;
  price: number;
}

export const BookingsScreen: React.FC = () => {
  const mockBookings: Booking[] = [
    {
      id: '1',
      pickupAddress: '1 Rue de Rivoli, Paris',
      dropoffAddress: 'Tour Eiffel, Paris',
      status: 'COMPLETED',
      scheduledFor: '2024-01-15T14:30:00',
      price: 45.50,
    },
    {
      id: '2',
      pickupAddress: 'Gare du Nord, Paris',
      dropoffAddress: 'Aéroport CDG',
      status: 'CANCELLED',
      scheduledFor: '2024-01-10T08:00:00',
      price: 65.00,
    },
  ];

  const renderBooking = ({ item }: { item: Booking }) => (
    <Card style={styles.bookingCard}>
      <Card.Content>
        <View style={styles.bookingHeader}>
          <Text variant="titleMedium">{item.pickupAddress}</Text>
          <Chip mode="flat" compact>
            {item.status === 'COMPLETED' ? 'Terminée' : 'Annulée'}
          </Chip>
        </View>
        <Text variant="bodyMedium" style={styles.destination}>
          → {item.dropoffAddress}
        </Text>
        <View style={styles.bookingFooter}>
          <Text variant="bodySmall">
            {new Date(item.scheduledFor).toLocaleDateString()}
          </Text>
          <Text variant="titleMedium" style={styles.price}>
            {item.price}€
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Mes Courses
      </Text>
      
      <FlatList
        data={mockBookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    marginBottom: 16,
    marginTop: 20,
  },
  list: {
    gap: 12,
  },
  bookingCard: {
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  destination: {
    marginBottom: 12,
    opacity: 0.7,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
});