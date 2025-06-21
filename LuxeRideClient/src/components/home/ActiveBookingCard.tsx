import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip, Avatar } from 'react-native-paper';

interface ActiveBooking {
  id: string;
  status: string;
  driverName: string;
  vehicleInfo: string;
  estimatedArrival: string;
  pickupAddress: string;
  dropoffAddress: string;
}

interface ActiveBookingCardProps {
  booking: ActiveBooking;
  onViewDetails: () => void;
  style?: any;
}

export const ActiveBookingCard: React.FC<ActiveBookingCardProps> = ({ 
  booking, 
  onViewDetails, 
  style 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return '#2196F3';
      case 'DRIVER_EN_ROUTE': return '#FF9800';
      case 'IN_PROGRESS': return '#4CAF50';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmée';
      case 'DRIVER_EN_ROUTE': return 'Chauffeur en route';
      case 'IN_PROGRESS': return 'En cours';
      default: return status;
    }
  };

  return (
    <Card style={[activeBookingStyles.container, style]}>
      <Card.Content>
        <View style={activeBookingStyles.header}>
          <Text variant="titleMedium">Course active</Text>
          <Chip 
            mode="flat" 
            style={{ backgroundColor: getStatusColor(booking.status) + '20' }}
            textStyle={{ color: getStatusColor(booking.status) }}
          >
            {getStatusText(booking.status)}
          </Chip>
        </View>

        <View style={activeBookingStyles.driverInfo}>
          <Avatar.Text size={40} label={booking.driverName.charAt(0)} />
          <View style={activeBookingStyles.driverDetails}>
            <Text variant="bodyLarge">{booking.driverName}</Text>
            <Text variant="bodySmall">{booking.vehicleInfo}</Text>
          </View>
        </View>

        <Text variant="bodySmall" style={activeBookingStyles.route}>
          {booking.pickupAddress} → {booking.dropoffAddress}
        </Text>

        <Button 
          mode="contained" 
          onPress={onViewDetails}
          style={activeBookingStyles.button}
        >
          Voir les détails
        </Button>
      </Card.Content>
    </Card>
  );
};

const activeBookingStyles = StyleSheet.create({
  container: {
    elevation: 2,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverDetails: {
    marginLeft: 12,
  },
  route: {
    opacity: 0.7,
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});