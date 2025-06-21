// src/screens/booking/BookingScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Surface,
  Text,
  TextInput,
  Button,
  Card,
  Chip,
  IconButton,
  Portal,
  Modal,
  List,
} from 'react-native-paper';
import MapView, { 
  Marker, 
  Polyline, 
  PROVIDER_GOOGLE,
  Region,
  LatLng,
} from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { showMessage } from 'react-native-flash-message';

// Types
interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface BookingFormData {
  pickupAddress: string;
  pickupLocation: Location | null;
  dropoffAddress: string;
  dropoffLocation: Location | null;
  scheduledFor: Date;
  vehicleCategory: 'BERLINE_EXECUTIVE' | 'SUV_LUXE' | 'VAN_PREMIUM';
  passengerCount: number;
  specialRequests: string;
}

interface FavoriteAddress {
  id: string;
  name: string;
  address: string;
  location: Location;
}

interface PriceEstimate {
  basePrice: number;
  distancePrice: number;
  timePrice: number;
  total: number;
}

type RootStackParamList = {
  VehicleSelection: {
    pickup: Location;
    dropoff: Location;
    scheduledFor: Date;
  };
};

interface BookingScreenProps {
  route?: {
    params?: {
      pickupLocation?: Location;
      vehicleCategory?: 'BERLINE_EXECUTIVE' | 'SUV_LUXE' | 'VAN_PREMIUM';
    };
  };
}

const { width, height } = Dimensions.get('window');

const MAP_CONFIG = {
  defaultRegion: {
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
};

const COLORS = {
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  primary: '#2196F3',
};

// Composant AddressInput
const AddressInput: React.FC<{
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onLocationSelect?: (location: Location, address: string) => void;
  style?: any;
}> = ({ placeholder, value, onChangeText, style }) => (
  <TextInput
    label={placeholder}
    value={value}
    onChangeText={onChangeText}
    mode="outlined"
    style={style}
  />
);

// Composant VehicleCategorySelector
const VehicleCategorySelector: React.FC<{
  selectedCategory: 'BERLINE_EXECUTIVE' | 'SUV_LUXE' | 'VAN_PREMIUM';
  onSelect: (category: 'BERLINE_EXECUTIVE' | 'SUV_LUXE' | 'VAN_PREMIUM') => void;
  style?: any;
}> = ({ selectedCategory, onSelect, style }) => (
  <Card style={style}>
    <Card.Content>
      <Text variant="titleMedium" style={{ marginBottom: 16 }}>Type de véhicule</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { id: 'BERLINE_EXECUTIVE' as const, name: 'Berline' },
          { id: 'SUV_LUXE' as const, name: 'SUV' },
          { id: 'VAN_PREMIUM' as const, name: 'Van' }
        ].map((category) => (
          <Chip
            key={category.id}
            selected={selectedCategory === category.id}
            onPress={() => onSelect(category.id)}
            style={{ marginRight: 8 }}
          >
            {category.name}
          </Chip>
        ))}
      </ScrollView>
    </Card.Content>
  </Card>
);

// Composant PriceEstimator
const PriceEstimator: React.FC<{
  estimate: PriceEstimate | null;
  duration?: number | null;
  style?: any;
}> = ({ estimate, style }) => {
  if (!estimate) return null;
  
  return (
    <Card style={style}>
      <Card.Content>
        <Text variant="titleMedium" style={{ marginBottom: 8 }}>Prix estimé</Text>
        <Text variant="titleLarge" style={{ color: COLORS.primary }}>
          {estimate.total.toFixed(2)}€
        </Text>
        <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 4 }}>
          Prix final calculé à la fin du trajet
        </Text>
      </Card.Content>
    </Card>
  );
};

export const BookingScreen: React.FC<BookingScreenProps> = ({ route }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  // Refs
  const mapRef = useRef<MapView>(null);

  // Form state
  const { control, handleSubmit, watch, setValue } = useForm<BookingFormData>({
    defaultValues: {
      pickupAddress: '',
      pickupLocation: route?.params?.pickupLocation || null,
      dropoffAddress: '',
      dropoffLocation: null,
      scheduledFor: new Date(),
      vehicleCategory: route?.params?.vehicleCategory || 'BERLINE_EXECUTIVE',
      passengerCount: 1,
      specialRequests: '',
    },
  });

  // Local state
  const [mapRegion, setMapRegion] = useState<Region>(MAP_CONFIG.defaultRegion);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isNowBooking, setIsNowBooking] = useState(true);
  const [favoriteAddresses, setFavoriteAddresses] = useState<FavoriteAddress[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const watchedPickup = watch('pickupLocation');
  const watchedDropoff = watch('dropoffLocation');
  const watchedVehicle = watch('vehicleCategory');
  const watchedScheduled = watch('scheduledFor');

  // ================================
  // EFFETS
  // ================================

  useEffect(() => {
    loadFavoriteAddresses();
    
    if (route?.params?.pickupLocation) {
      centerMapOnLocation(route.params.pickupLocation);
    }
  }, [route?.params?.pickupLocation]);

  useEffect(() => {
    if (watchedPickup && watchedDropoff) {
      calculateRoute();
      calculateEstimatedPrice();
    }
  }, [watchedPickup, watchedDropoff, watchedVehicle]);

  // ================================
  // FONCTIONS UTILITAIRES
  // ================================

  const loadFavoriteAddresses = () => {
    const favorites: FavoriteAddress[] = [
      {
        id: '1',
        name: 'Domicile',
        address: '123 Rue de la Paix, Paris',
        location: { latitude: 48.8566, longitude: 2.3522 }
      },
      {
        id: '2',
        name: 'Bureau',
        address: '456 Avenue des Champs-Élysées, Paris',
        location: { latitude: 48.8738, longitude: 2.2950 }
      }
    ];
    setFavoriteAddresses(favorites);
  };

  const centerMapOnLocation = (location: Location) => {
    const region: Region = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setMapRegion(region);
    if (mapRef.current) {
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  const calculateRoute = () => {
    if (!watchedPickup || !watchedDropoff) return;

    // Simulation d'un itinéraire simple (ligne droite)
    const coordinates: LatLng[] = [
      { latitude: watchedPickup.latitude, longitude: watchedPickup.longitude },
      { latitude: watchedDropoff.latitude, longitude: watchedDropoff.longitude }
    ];
    setRouteCoordinates(coordinates);
    
    // Ajuster la vue de la carte
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const calculateEstimatedPrice = () => {
    if (!watchedPickup || !watchedDropoff) return;

    // Simulation du calcul de prix
    const basePrice = watchedVehicle === 'BERLINE_EXECUTIVE' ? 15 : 
                     watchedVehicle === 'SUV_LUXE' ? 25 : 35;
    const distancePrice = 12.5; // 5km * 2.5€/km
    const timePrice = 12; // 10min * 1.2€/min
    const total = basePrice + distancePrice + timePrice;
    
    setPriceEstimate({
      basePrice,
      distancePrice,
      timePrice,
      total,
    });
  };

  // ================================
  // HANDLERS
  // ================================

  const handlePickupSelect = (location: Location, address: string) => {
    setValue('pickupLocation', location);
    setValue('pickupAddress', address);
    centerMapOnLocation(location);
  };

  const handleDropoffSelect = (location: Location, address: string) => {
    setValue('dropoffLocation', location);
    setValue('dropoffAddress', address);
  };

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    const location: Location = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    };
    
    if (!watchedPickup) {
      handlePickupSelect(location, 'Position sélectionnée');
    } else if (!watchedDropoff) {
      handleDropoffSelect(location, 'Destination sélectionnée');
    }
  };

  const handleFavoriteSelect = (favorite: FavoriteAddress) => {
    if (!watchedPickup) {
      handlePickupSelect(favorite.location, favorite.address);
    } else {
      handleDropoffSelect(favorite.location, favorite.address);
    }
    setShowFavorites(false);
  };

  const handleSwapAddresses = () => {
    const pickup = watchedPickup;
    const dropoff = watchedDropoff;
    const pickupAddress = watch('pickupAddress');
    const dropoffAddress = watch('dropoffAddress');
    
    setValue('pickupLocation', dropoff);
    setValue('pickupAddress', dropoffAddress);
    setValue('dropoffLocation', pickup);
    setValue('dropoffAddress', pickupAddress);
  };

  const handleDateTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
    
    if (selectedDate) {
      setValue('scheduledFor', selectedDate);
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    try {
      if (!data.pickupLocation || !data.dropoffLocation) {
        showMessage({
          message: 'Adresses requises',
          description: 'Veuillez sélectionner les adresses de départ et d\'arrivée',
          type: 'warning',
        });
        return;
      }

      setIsLoading(true);

      // Naviguer vers la sélection de véhicule
      navigation.navigate('VehicleSelection', {
        pickup: data.pickupLocation,
        dropoff: data.dropoffLocation,
        scheduledFor: data.scheduledFor,
      });
      
    } catch (error) {
      console.error('Booking submission error:', error);
      showMessage({
        message: 'Erreur',
        description: 'Une erreur s\'est produite lors de la réservation',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ================================
  // RENDER
  // ================================

  return (
    <View style={styles.container}>
      {/* Carte */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton
        >
          {/* Marqueur de départ */}
          {watchedPickup && (
            <Marker
              coordinate={{
                latitude: watchedPickup.latitude,
                longitude: watchedPickup.longitude
              }}
              title="Départ"
              pinColor={COLORS.success}
            />
          )}
          
          {/* Marqueur de destination */}
          {watchedDropoff && (
            <Marker
              coordinate={{
                latitude: watchedDropoff.latitude,
                longitude: watchedDropoff.longitude
              }}
              title="Destination"
              pinColor={COLORS.error}
            />
          )}
          
          {/* Itinéraire */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={COLORS.primary}
              strokeWidth={3}
            />
          )}
        </MapView>

        {/* Bouton favoris */}
        <IconButton
          icon="heart"
          mode="contained"
          size={20}
          style={styles.favoritesButton}
          onPress={() => setShowFavorites(true)}
        />
      </View>

      {/* Panneau inférieur */}
      <Surface style={styles.bottomPanel}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Adresses */}
          <View style={styles.addressSection}>
            <View style={styles.addressInputContainer}>
              <Icon name="circle" size={12} color={COLORS.success} style={styles.addressIcon} />
              <Controller
                control={control}
                name="pickupAddress"
                render={({ field: { onChange, value } }) => (
                  <AddressInput
                    placeholder="Adresse de départ"
                    value={value}
                    onChangeText={onChange}
                    onLocationSelect={handlePickupSelect}
                    style={styles.addressInput}
                  />
                )}
              />
            </View>

            <IconButton
              icon="swap-vertical"
              size={20}
              onPress={handleSwapAddresses}
              style={styles.swapButton}
            />

            <View style={styles.addressInputContainer}>
              <Icon name="circle" size={12} color={COLORS.error} style={styles.addressIcon} />
              <Controller
                control={control}
                name="dropoffAddress"
                render={({ field: { onChange, value } }) => (
                  <AddressInput
                    placeholder="Destination"
                    value={value}
                    onChangeText={onChange}
                    onLocationSelect={handleDropoffSelect}
                    style={styles.addressInput}
                  />
                )}
              />
            </View>
          </View>

          {/* Date et heure */}
          <Card style={styles.scheduleCard}>
            <Card.Content>
              <View style={styles.scheduleHeader}>
                <Text variant="titleMedium">Quand ?</Text>
                <View style={styles.scheduleToggle}>
                  <Chip
                    selected={isNowBooking}
                    onPress={() => setIsNowBooking(true)}
                    style={styles.scheduleChip}
                  >
                    Maintenant
                  </Chip>
                  <Chip
                    selected={!isNowBooking}
                    onPress={() => setIsNowBooking(false)}
                    style={styles.scheduleChip}
                  >
                    Programmer
                  </Chip>
                </View>
              </View>

              {!isNowBooking && (
                <View style={styles.dateTimeContainer}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowDatePicker(true)}
                    style={styles.dateTimeButton}
                  >
                    {watchedScheduled.toLocaleDateString()}
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => setShowTimePicker(true)}
                    style={styles.dateTimeButton}
                  >
                    {watchedScheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Sélection de véhicule */}
          <Controller
            control={control}
            name="vehicleCategory"
            render={({ field: { onChange, value } }) => (
              <VehicleCategorySelector
                selectedCategory={value}
                onSelect={onChange}
                style={styles.vehicleSelector}
              />
            )}
          />

          {/* Estimation de prix */}
          <PriceEstimator
            estimate={priceEstimate}
            style={styles.priceEstimate}
          />

          {/* Passagers et demandes spéciales */}
          <Card style={styles.detailsCard}>
            <Card.Content>
              <View style={styles.passengerSection}>
                <Text variant="titleMedium">Passagers</Text>
                <View style={styles.passengerCounter}>
                  <IconButton
                    icon="minus"
                    onPress={() => {
                      const current = watch('passengerCount');
                      if (current > 1) setValue('passengerCount', current - 1);
                    }}
                  />
                  <Text variant="titleLarge">{watch('passengerCount')}</Text>
                  <IconButton
                    icon="plus"
                    onPress={() => {
                      const current = watch('passengerCount');
                      if (current < 8) setValue('passengerCount', current + 1);
                    }}
                  />
                </View>
              </View>

              <Controller
                control={control}
                name="specialRequests"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    label="Demandes spéciales (optionnel)"
                    value={value}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={3}
                    style={styles.specialRequests}
                  />
                )}
              />
            </Card.Content>
          </Card>

          {/* Bouton de confirmation */}
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={!watchedPickup || !watchedDropoff}
            style={styles.confirmButton}
          >
            Continuer
          </Button>
        </ScrollView>
      </Surface>

      {/* Modal des favoris */}
      <Portal>
        <Modal
          visible={showFavorites}
          onDismiss={() => setShowFavorites(false)}
          contentContainerStyle={styles.favoritesModal}
        >
          <Text variant="headlineSmall" style={styles.favoritesTitle}>
            Adresses favorites
          </Text>
          <ScrollView>
            {favoriteAddresses.map((favorite) => (
              <List.Item
                key={favorite.id}
                title={favorite.name}
                description={favorite.address}
                left={(props) => <List.Icon {...props} icon="heart" />}
                onPress={() => handleFavoriteSelect(favorite)}
              />
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={watchedScheduled}
          mode="date"
          display="default"
          onChange={handleDateTimeChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={watchedScheduled}
          mode="time"
          display="default"
          onChange={handleDateTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    height: height * 0.4,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  favoritesButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
  },
  bottomPanel: {
    flex: 1,
    elevation: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  addressSection: {
    padding: 16,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  addressIcon: {
    marginRight: 12,
  },
  addressInput: {
    flex: 1,
  },
  swapButton: {
    alignSelf: 'center',
    margin: 0,
  },
  scheduleCard: {
    margin: 16,
    marginTop: 0,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduleToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  scheduleChip: {
    minWidth: 80,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
  },
  vehicleSelector: {
    marginHorizontal: 16,
  },
  priceEstimate: {
    margin: 16,
  },
  detailsCard: {
    margin: 16,
  },
  passengerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  passengerCounter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specialRequests: {
    marginTop: 8,
  },
  confirmButton: {
    margin: 16,
    marginTop: 8,
  },
  favoritesModal: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: height * 0.6,
  },
  favoritesTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
});