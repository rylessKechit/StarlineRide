// src/screens/main/BookRideScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../../store';
import { createBooking } from '../../store/slices/bookingSlice';
import { MainStackParamList, BookRideForm, VehicleCategory } from '../../types';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

type BookRideScreenProps = {
  navigation: StackNavigationProp<MainStackParamList, 'BookRide'>;
};

const BookRideScreen: React.FC<BookRideScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector(state => (state as any).bookings);

  const [form, setForm] = useState<BookRideForm>({
    pickupAddress: '',
    pickupLocation: { latitude: 0, longitude: 0 },
    dropoffAddress: '',
    dropoffLocation: { latitude: 0, longitude: 0 },
    scheduledFor: new Date(),
    vehicleCategory: 'BERLINE_EXECUTIVE',
    passengerCount: 1,
    specialRequests: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BookRideForm, string>>>({});
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  const vehicleCategories = [
    {
      id: 'BERLINE_EXECUTIVE' as VehicleCategory,
      name: 'Berline Executive',
      description: 'Confort et élégance',
      icon: '🚗',
      basePrice: 2.5,
    },
    {
      id: 'SUV_LUXE' as VehicleCategory,
      name: 'SUV Luxe',
      description: 'Espace et prestige',
      icon: '🚙',
      basePrice: 3.0,
    },
    {
      id: 'VAN_PREMIUM' as VehicleCategory,
      name: 'Van Premium',
      description: 'Idéal pour les groupes',
      icon: '🚐',
      basePrice: 3.5,
    },
    {
      id: 'ELECTRIC_PREMIUM' as VehicleCategory,
      name: 'Électrique Premium',
      description: 'Écologique et silencieux',
      icon: '⚡',
      basePrice: 2.8,
    },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BookRideForm, string>> = {};

    if (!form.pickupAddress.trim()) {
      newErrors.pickupAddress = 'Adresse de départ requise';
    }

    if (!form.dropoffAddress.trim()) {
      newErrors.dropoffAddress = 'Adresse d\'arrivée requise';
    }

    if (form.passengerCount < 1 || form.passengerCount > 8) {
      newErrors.passengerCount = 'Nombre de passagers invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateEstimatedPrice = () => {
    // Simulation du calcul de prix
    const basePrice = vehicleCategories.find(v => v.id === form.vehicleCategory)?.basePrice || 2.5;
    const distance = Math.random() * 20 + 5; // Distance simulée entre 5 et 25 km
    const price = Math.round((basePrice * distance + 8) * 100) / 100;
    setEstimatedPrice(price);
  };

  const handleBookRide = async () => {
    if (!validateForm()) return;

    if (!estimatedPrice) {
      Alert.alert('Erreur', 'Veuillez calculer le prix avant de réserver');
      return;
    }

    try {
      // Simulation des coordonnées pour la démo
      const bookingData = {
        pickupAddress: form.pickupAddress,
        pickupLat: 48.8566 + (Math.random() - 0.5) * 0.1,
        pickupLng: 2.3522 + (Math.random() - 0.5) * 0.1,
        dropoffAddress: form.dropoffAddress,
        dropoffLat: 48.8566 + (Math.random() - 0.5) * 0.1,
        dropoffLng: 2.3522 + (Math.random() - 0.5) * 0.1,
        scheduledFor: form.scheduledFor.toISOString(),
        vehicleCategory: form.vehicleCategory,
        passengerCount: form.passengerCount,
        specialRequests: form.specialRequests || undefined,
      };

      const result = await dispatch(createBooking(bookingData)).unwrap();
      
      Alert.alert(
        'Réservation créée',
        'Votre course a été réservée avec succès !',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('RideDetails', { rideId: result.id });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error || 'Erreur lors de la réservation');
    }
  };

  const updateForm = (field: keyof BookRideForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">

        {/* Addresses */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Trajets</Text>
          
          <Input
            label="Départ"
            placeholder="Où vous trouvez-vous ?"
            value={form.pickupAddress}
            onChangeText={(text) => updateForm('pickupAddress', text)}
            error={errors.pickupAddress}
          />

          <Input
            label="Arrivée"
            placeholder="Où souhaitez-vous aller ?"
            value={form.dropoffAddress}
            onChangeText={(text) => updateForm('dropoffAddress', text)}
            error={errors.dropoffAddress}
          />
        </Card>

        {/* Date and Time */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Quand ?</Text>
          
          <TouchableOpacity
            style={styles.dateTimeContainer}
            onPress={() => {
              // Pour la démo, on incrémente de 30 minutes
              const newDate = new Date(form.scheduledFor.getTime() + 30 * 60000);
              updateForm('scheduledFor', newDate);
            }}>
            <Text style={styles.dateTimeLabel}>Date et heure</Text>
            <Text style={styles.dateTimeText}>
              {formatDateTime(form.scheduledFor)}
            </Text>
            <Text style={styles.dateTimeHelper}>
              Toucher pour modifier (+30min)
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Vehicle Category */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Choisir un véhicule</Text>
          
          {vehicleCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.vehicleOption,
                form.vehicleCategory === category.id && styles.vehicleOptionSelected,
              ]}
              onPress={() => updateForm('vehicleCategory', category.id)}>
              
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleIcon}>{category.icon}</Text>
                <View style={styles.vehicleDetails}>
                  <Text style={styles.vehicleName}>{category.name}</Text>
                  <Text style={styles.vehicleDescription}>{category.description}</Text>
                </View>
              </View>
              
              <View style={styles.vehiclePrice}>
                <Text style={styles.vehiclePriceText}>
                  {category.basePrice}€/km
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Passengers and Special Requests */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Détails</Text>
          
          <View style={styles.passengerContainer}>
            <Text style={styles.passengerLabel}>Nombre de passagers</Text>
            <View style={styles.passengerControls}>
              <TouchableOpacity
                style={styles.passengerButton}
                onPress={() => updateForm('passengerCount', Math.max(1, form.passengerCount - 1))}>
                <Text style={styles.passengerButtonText}>-</Text>
              </TouchableOpacity>
              
              <Text style={styles.passengerCount}>{form.passengerCount}</Text>
              
              <TouchableOpacity
                style={styles.passengerButton}
                onPress={() => updateForm('passengerCount', Math.min(8, form.passengerCount + 1))}>
                <Text style={styles.passengerButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Input
            label="Demandes spéciales (optionnel)"
            placeholder="Température, musique, arrêts..."
            value={form.specialRequests ?? ''}
            onChangeText={(text) => updateForm('specialRequests', text)}
            multiline
            numberOfLines={3}
          />
        </Card>

        {/* Price Estimation */}
        <Card style={styles.section}>
          <View style={styles.priceHeader}>
            <Text style={styles.sectionTitle}>Prix estimé</Text>
            <Button
              title="Calculer"
              onPress={calculateEstimatedPrice}
              variant="outline"
              size="small"
            />
          </View>
          
          {estimatedPrice && (
            <View style={styles.priceContainer}>
              <Text style={styles.priceAmount}>{estimatedPrice}€</Text>
              <Text style={styles.priceNote}>
                Prix final calculé en fin de course
              </Text>
            </View>
          )}
        </Card>

        {/* Book Button */}
        <View style={styles.bookContainer}>
          <Button
            title="Réserver cette course"
            onPress={handleBookRide}
            loading={loading}
            disabled={loading || !estimatedPrice}
            size="large"
            icon="🚗"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  dateTimeContainer: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dateTimeLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  dateTimeHelper: {
    fontSize: 12,
    color: '#8E8E93',
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  vehicleOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  vehicleDescription: {
    fontSize: 14,
    color: '#6C757D',
  },
  vehiclePrice: {
    alignItems: 'flex-end',
  },
  vehiclePriceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  passengerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  passengerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  passengerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  passengerCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  priceNote: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
  bookContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});

export default BookRideScreen;