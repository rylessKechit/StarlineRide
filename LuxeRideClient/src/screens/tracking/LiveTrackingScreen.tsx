// src/screens/tracking/LiveTrackingScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import {
  Surface,
  Text,
  Button,
  Card,
  Avatar,
  IconButton,
  Portal,
  Modal,
  Chip,
  FAB,
} from 'react-native-paper';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  LatLng,
} from 'react-native-maps';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { showMessage } from 'react-native-flash-message';

// Types
interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  rating: number;
  profilePicture?: string;
}

interface Vehicle {
  make: string;
  model: string;
  licensePlate: string;
  color: string;
}

interface Booking {
  id: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  driver?: Driver;
  vehicle?: Vehicle;
}

type BookingStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_EN_ROUTE'
  | 'DRIVER_ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

type RootStackParamList = {
  PaymentScreen: {
    bookingId: string;
    tripData: any;
  };
};

interface LiveTrackingScreenProps {
  route: {
    params: {
      bookingId: string;
    };
  };
}

const { width, height } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = height * 0.35;

const COLORS = {
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  primary: '#2196F3',
};

const BOOKING_STATUS = {
  PENDING: { id: 'PENDING', name: 'En attente', color: COLORS.warning, icon: '⏳' },
  CONFIRMED: { id: 'CONFIRMED', name: 'Confirmée', color: COLORS.primary, icon: '✅' },
  DRIVER_ASSIGNED: { id: 'DRIVER_ASSIGNED', name: 'Chauffeur assigné', color: COLORS.primary, icon: '👨‍💼' },
  DRIVER_EN_ROUTE: { id: 'DRIVER_EN_ROUTE', name: 'En route', color: COLORS.primary, icon: '🚗' },
  DRIVER_ARRIVED: { id: 'DRIVER_ARRIVED', name: 'Chauffeur arrivé', color: COLORS.primary, icon: '📍' },
  IN_PROGRESS: { id: 'IN_PROGRESS', name: 'Course en cours', color: COLORS.success, icon: '🛣️' },
  COMPLETED: { id: 'COMPLETED', name: 'Terminée', color: COLORS.success, icon: '🏁' },
  CANCELLED: { id: 'CANCELLED', name: 'Annulée', color: COLORS.error, icon: '❌' },
};

// Composant EmergencyButton
const EmergencyButton: React.FC<{
  onPress: () => void;
  style?: any;
}> = ({ onPress, style }) => (
  <FAB
    icon="alert"
    onPress={onPress}
    style={[{ backgroundColor: COLORS.error }, style]}
    color="white"
  />
);

export const LiveTrackingScreen: React.FC<LiveTrackingScreenProps> = ({ route }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  const { bookingId } = route.params;

  // Refs
  const mapRef = useRef<MapView>(null);

  // Local state
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [estimatedArrival, setEstimatedArrival] = useState<Date | null>(null);
  const [tripDistance, setTripDistance] = useState<number>(0);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Données simulées de la réservation
  const [currentBooking] = useState<Booking>({
    id: bookingId,
    pickupLocation: { latitude: 48.8566, longitude: 2.3522 },
    dropoffLocation: { latitude: 48.8738, longitude: 2.2950 },
    pickupAddress: '1 Rue de Rivoli, Paris',
    dropoffAddress: 'Tour Eiffel, Paris',
    status: 'DRIVER_EN_ROUTE',
    driver: {
      id: '1',
      firstName: 'Pierre',
      lastName: 'Martin',
      phone: '+33123456789',
      rating: 4.8,
      profilePicture: 'https://via.placeholder.com/50',
    },
    vehicle: {
      make: 'Mercedes',
      model: 'Classe E',
      licensePlate: 'AB-123-CD',
      color: 'Noir',
    },
  });

  // Animation values
  const bottomSheetY = useSharedValue(0);
  const mapHeight = useSharedValue(height - BOTTOM_SHEET_HEIGHT);

  // ================================
  // EFFETS
  // ================================

  useEffect(() => {
    initializeTracking();
    setupMockData();
  }, []);

  useEffect(() => {
    if (driverLocation && currentBooking) {
      centerMapOnTrip();
    }
  }, [driverLocation, currentBooking]);

  // ================================
  // INITIALISATION
  // ================================

  const initializeTracking = () => {
    // Simulation de données initiales
    setUserLocation({ latitude: 48.8566, longitude: 2.3522 });
    setDriverLocation({ latitude: 48.8600, longitude: 2.3400 });
    setEstimatedArrival(new Date(Date.now() + 8 * 60 * 1000)); // 8 minutes
    setTripDistance(2500); // 2.5 km
  };

  const setupMockData = () => {
    // Simulation d'un itinéraire
    const coordinates: LatLng[] = [
      { latitude: 48.8600, longitude: 2.3400 }, // Position du chauffeur
      { latitude: 48.8566, longitude: 2.3522 }, // Pickup
      { latitude: 48.8738, longitude: 2.2950 }, // Dropoff
    ];
    setRouteCoordinates(coordinates);
  };

  const centerMapOnTrip = () => {
    if (!mapRef.current || !driverLocation || !currentBooking) return;

    const coordinates = [
      driverLocation,
      currentBooking.pickupLocation,
      currentBooking.dropoffLocation,
    ].filter(Boolean);

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
      animated: true,
    });
  };

  // ================================
  // FONCTIONS UTILITAIRES
  // ================================

  const getEstimatedArrivalText = (): string => {
    if (!estimatedArrival) return 'Calcul en cours...';
    
    const now = new Date();
    const diffMinutes = Math.round((estimatedArrival.getTime() - now.getTime()) / 60000);
    
    if (diffMinutes <= 0) return 'Arrivé';
    if (diffMinutes === 1) return '1 minute';
    return `${diffMinutes} minutes`;
  };

  // ================================
  // HANDLERS
  // ================================

  const handleCallDriver = () => {
    if (currentBooking?.driver?.phone) {
      Linking.openURL(`tel:${currentBooking.driver.phone}`);
    }
  };

  const handleMessageDriver = () => {
    if (currentBooking?.driver?.phone) {
      const message = "Bonjour, je suis votre client LuxeRide.";
      const url = Platform.OS === 'ios' 
        ? `sms:${currentBooking.driver.phone}&body=${message}`
        : `sms:${currentBooking.driver.phone}?body=${message}`;
      Linking.openURL(url);
    }
  };

  const handleShareLocation = () => {
    if (userLocation) {
      const url = `https://maps.google.com/maps?q=${userLocation.latitude},${userLocation.longitude}`;
      Linking.openURL(url);
    }
  };

  const handleCancelTrip = () => {
    Alert.alert(
      'Annuler la course',
      'Êtes-vous sûr de vouloir annuler cette course ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleEmergency = () => {
    setShowEmergencyModal(true);
  };

  const toggleFullscreen = () => {
    setIsMapFullscreen(!isMapFullscreen);
    
    if (isMapFullscreen) {
      // Revenir au mode normal
      mapHeight.value = withSpring(height - BOTTOM_SHEET_HEIGHT);
      bottomSheetY.value = withSpring(0);
    } else {
      // Mode plein écran
      mapHeight.value = withSpring(height);
      bottomSheetY.value = withSpring(BOTTOM_SHEET_HEIGHT);
    }
  };

  const handleTripCompleted = () => {
    navigation.navigate('PaymentScreen', {
      bookingId,
      tripData: {
        finalPrice: 45.50,
        distance: tripDistance,
        duration: 15 * 60, // 15 minutes en secondes
      },
    });
  };

  // ================================
  // ANIMATIONS
  // ================================

  const mapAnimatedStyle = useAnimatedStyle(() => ({
    height: mapHeight.value,
  }));

  const bottomSheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomSheetY.value }],
  }));

  // ================================
  // RENDER
  // ================================

  if (!currentBooking) {
    return (
      <View style={styles.container}>
        <Text>Chargement du suivi...</Text>
      </View>
    );
  }

  const currentStatus = BOOKING_STATUS[currentBooking.status as BookingStatus] || BOOKING_STATUS.PENDING;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Carte */}
      <Animated.View style={[styles.mapContainer, mapAnimatedStyle]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {/* Marqueur du chauffeur */}
          {driverLocation && (
            <Marker
              coordinate={driverLocation}
              title="Chauffeur"
              description={currentBooking.driver?.firstName}
            >
              <View style={styles.driverMarker}>
                <Icon name="car" size={20} color="white" />
              </View>
            </Marker>
          )}
          
          {/* Marqueur de départ */}
          <Marker
            coordinate={currentBooking.pickupLocation}
            title="Départ"
            pinColor={COLORS.success}
          >
            <Icon name="map-marker" size={30} color={COLORS.success} />
          </Marker>
          
          {/* Marqueur de destination */}
          <Marker
            coordinate={currentBooking.dropoffLocation}
            title="Destination"
            pinColor={COLORS.error}
          >
            <Icon name="flag" size={30} color={COLORS.error} />
          </Marker>
          
          {/* Itinéraire */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={COLORS.primary}
              strokeWidth={4}
            />
          )}
        </MapView>

        {/* Contrôles de la carte */}
        <View style={styles.mapControls}>
          <IconButton
            icon="fullscreen"
            mode="contained"
            size={24}
            onPress={toggleFullscreen}
            style={styles.controlButton}
          />
          <IconButton
            icon="crosshairs-gps"
            mode="contained"
            size={24}
            onPress={centerMapOnTrip}
            style={styles.controlButton}
          />
        </View>

        {/* Bouton d'urgence */}
        <EmergencyButton
          onPress={handleEmergency}
          style={styles.emergencyButton}
        />
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, bottomSheetAnimatedStyle]}>
        <Surface style={styles.bottomSheetSurface}>
          {/* Handle */}
          <View style={styles.bottomSheetHandle} />
          
          {/* Statut de la course */}
          <View style={styles.statusSection}>
            <Chip
              mode="flat"
              style={[styles.statusChip, { backgroundColor: currentStatus.color + '20' }]}
              textStyle={{ color: currentStatus.color }}
            >
              {currentStatus.icon} {currentStatus.name}
            </Chip>
            
            <Text variant="headlineSmall" style={styles.estimatedTime}>
              {getEstimatedArrivalText()}
            </Text>
            
            {tripDistance > 0 && (
              <Text variant="bodyMedium" style={styles.distance}>
                {(tripDistance / 1000).toFixed(1)} km restants
              </Text>
            )}
          </View>

          {/* Informations du chauffeur */}
          {currentBooking.driver && (
            <Card style={styles.driverCard}>
              <Card.Content style={styles.driverContent}>
                <View style={styles.driverInfo}>
                  <Avatar.Image
                    size={50}
                    source={{ uri: currentBooking.driver.profilePicture || 'https://via.placeholder.com/50' }}
                    style={styles.driverAvatar}
                  />
                  
                  <View style={styles.driverDetails}>
                    <Text variant="titleMedium" style={styles.driverName}>
                      {currentBooking.driver.firstName} {currentBooking.driver.lastName}
                    </Text>
                    <View style={styles.driverMeta}>
                      <Icon name="star" size={16} color={COLORS.warning} />
                      <Text variant="bodySmall" style={styles.rating}>
                        {currentBooking.driver.rating}
                      </Text>
                      <Text variant="bodySmall" style={styles.vehicleInfo}>
                        • {currentBooking.vehicle?.make} {currentBooking.vehicle?.model}
                      </Text>
                    </View>
                    <Text variant="bodySmall" style={styles.licensePlate}>
                      {currentBooking.vehicle?.licensePlate}
                    </Text>
                  </View>
                </View>

                <View style={styles.driverActions}>
                  <IconButton
                    icon="phone"
                    mode="contained"
                    size={20}
                    onPress={handleCallDriver}
                    style={[styles.actionButton, { backgroundColor: COLORS.success }]}
                  />
                  <IconButton
                    icon="message"
                    mode="contained"
                    size={20}
                    onPress={handleMessageDriver}
                    style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
                  />
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Détails du trajet */}
          <View style={styles.tripDetails}>
            <View style={styles.addressRow}>
              <Icon name="circle" size={12} color={COLORS.success} />
              <Text variant="bodyMedium" style={styles.address} numberOfLines={1}>
                {currentBooking.pickupAddress}
              </Text>
            </View>
            
            <View style={styles.addressRow}>
              <Icon name="circle" size={12} color={COLORS.error} />
              <Text variant="bodyMedium" style={styles.address} numberOfLines={1}>
                {currentBooking.dropoffAddress}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={handleShareLocation}
              style={styles.shareButton}
              icon="share-variant"
            >
              Partager ma position
            </Button>
            
            {['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED'].includes(currentBooking.status) && (
              <Button
                mode="outlined"
                onPress={handleCancelTrip}
                style={[styles.cancelButton, { borderColor: COLORS.error }]}
                textColor={COLORS.error}
                icon="close"
              >
                Annuler
              </Button>
            )}

            {/* Bouton pour simuler la fin du trajet */}
            {currentBooking.status === 'IN_PROGRESS' && (
              <Button
                mode="contained"
                onPress={handleTripCompleted}
                style={[styles.completeButton, { backgroundColor: COLORS.success }]}
                icon="check"
              >
                Terminer le trajet
              </Button>
            )}
          </View>
        </Surface>
      </Animated.View>

      {/* Modal d'urgence */}
      <Portal>
        <Modal
          visible={showEmergencyModal}
          onDismiss={() => setShowEmergencyModal(false)}
          contentContainerStyle={styles.emergencyModal}
        >
          <Text variant="headlineSmall" style={styles.emergencyTitle}>
            Urgence
          </Text>
          
          <Text variant="bodyMedium" style={styles.emergencyDescription}>
            Choisissez une action d'urgence :
          </Text>
          
          <View style={styles.emergencyActions}>
            <Button
              mode="contained"
              onPress={() => {
                Linking.openURL('tel:112');
                setShowEmergencyModal(false);
              }}
              style={[styles.emergencyActionButton, { backgroundColor: COLORS.error }]}
              icon="phone"
            >
              Appeler les secours (112)
            </Button>
            
            <Button
              mode="contained"
              onPress={() => {
                Linking.openURL('tel:17');
                setShowEmergencyModal(false);
              }}
              style={[styles.emergencyActionButton, { backgroundColor: COLORS.warning }]}
              icon="shield"
            >
              Police (17)
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => {
                setShowEmergencyModal(false);
                showMessage({
                  message: 'Alerte envoyée',
                  description: 'LuxeRide a été notifié',
                  type: 'info',
                });
              }}
              style={styles.emergencyActionButton}
              icon="alert"
            >
              Alerter LuxeRide
            </Button>
          </View>
          
          <Button
            mode="text"
            onPress={() => setShowEmergencyModal(false)}
            style={styles.cancelEmergencyButton}
          >
            Annuler
          </Button>
        </Modal>
      </Portal>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text>Mise à jour...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 50,
    right: 16,
    gap: 8,
  },
  controlButton: {
    backgroundColor: 'white',
    elevation: 4,
  },
  emergencyButton: {
    position: 'absolute',
    top: 50,
    left: 16,
  },
  driverMarker: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 20,
    elevation: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_SHEET_HEIGHT,
  },
  bottomSheetSurface: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  statusSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statusChip: {
    marginBottom: 8,
  },
  estimatedTime: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  distance: {
    opacity: 0.7,
  },
  driverCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  driverContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  rating: {
    marginLeft: 4,
    marginRight: 8,
  },
  vehicleInfo: {
    opacity: 0.7,
  },
  licensePlate: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  driverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
  },
  tripDetails: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  address: {
    marginLeft: 12,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    gap: 8,
  },
  shareButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  completeButton: {
    flex: 1,
  },
  emergencyModal: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  emergencyTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: COLORS.error,
    fontWeight: 'bold',
  },
  emergencyDescription: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  emergencyActions: {
    gap: 12,
    marginBottom: 16,
  },
  emergencyActionButton: {
    height: 50,
  },
  cancelEmergencyButton: {
    marginTop: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});