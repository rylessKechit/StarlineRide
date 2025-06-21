import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';

export const BookingConfirmationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const handleConfirmBooking = () => {
    // Logique de confirmation
    navigation.navigate('LiveTracking' as never, { bookingId: 'booking_123' });
  };

  return (
    <View style={confirmationStyles.container}>
      <Card style={confirmationStyles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={confirmationStyles.title}>
            Confirmer votre réservation
          </Text>
          
          <View style={confirmationStyles.section}>
            <Text variant="titleMedium">Trajet</Text>
            <Text variant="bodyMedium">1 Rue de Rivoli, Paris</Text>
            <Text variant="bodyMedium">→ Tour Eiffel, Paris</Text>
          </View>
          
          <Divider style={confirmationStyles.divider} />
          
          <View style={confirmationStyles.section}>
            <Text variant="titleMedium">Véhicule</Text>
            <Text variant="bodyMedium">Berline Exécutive</Text>
          </View>
          
          <Divider style={confirmationStyles.divider} />
          
          <View style={confirmationStyles.section}>
            <Text variant="titleMedium">Prix estimé</Text>
            <Text variant="titleLarge" style={confirmationStyles.price}>
              45,50€
            </Text>
          </View>
          
          <Button
            mode="contained"
            onPress={handleConfirmBooking}
            style={confirmationStyles.confirmButton}
          >
            Confirmer la réservation
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const confirmationStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginTop: 60,
    elevation: 2,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#2196F3',
  },
  section: {
    marginVertical: 12,
  },
  divider: {
    marginVertical: 8,
  },
  price: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  confirmButton: {
    marginTop: 24,
  },
});