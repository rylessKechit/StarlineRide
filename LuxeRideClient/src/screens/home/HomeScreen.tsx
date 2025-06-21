// src/screens/home/HomeScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {
  Surface,
  Text,
  FAB,
  Card,
  Avatar,
  Button,
  Chip,
  Portal,
  Modal,
} from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Redux
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchMyBookings } from '../../store/slices/bookingSlice';
import { refreshProfile } from '../../store/slices/authSlice';

// Services
import { socketService } from '../../services/socket';

// Components
import { QuickBookingCard } from '../../components/home/QuickBookingCard';
import { FavoriteDestinations } from '../../components/home/FavoriteDestinations';
import { ActiveBookingCard } from '../../components/home/ActiveBookingCard';
import { WeatherWidget } from '../../components/home/WeatherWidget';
import { PromotionBanner } from '../../components/home/PromotionBanner';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';

// Utils
import { useTheme, commonStyles } from '../../theme';
import { COLORS, MAP_CONFIG, VEHICLE_CATEGORIES } from '../../constants';
import { Location, MapRegion } from '../../types';
import { useAppNavigation } from '../../navigation/AppNavigator';
import { showMessage } from 'react-native-flash-message';

export const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigation = useAppNavigation();

  // Redux state
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { currentBooking, bookings, isLoading } = useAppSelector((state) => state.booking);

  // Local state
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [mapRegion, setMapRegion] = useState<MapRegion>(MAP_CONFIG.defaultRegion);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickBooking, setShowQuickBooking] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<string>('unknown');

  // ================================
  // PERMISSIONS ET GÉOLOCALISATION
  // ================================

  const requestLocationPermission = useCallback(async () => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await request(permission);
      setLocationPermissionStatus(result);

      if (result === RESULTS.GRANTED) {
        getCurrentLocation();
      } else {
        setIsLocationLoading(false);
        showLocationPermissionDialog();
      }
    } catch (error) {
      console.error('Location permission error:', error);
      setIsLocationLoading(false);
    }
  }, []);

  const getCurrentLocation = useCallback(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCurrentLocation(location);
        setMapRegion({
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setIsLocationLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocationLoading(false);
        
        showMessage({
          message: 'Localisation indisponible',
          description: 'Impossible d\'obtenir votre position actuelle',
          type: 'warning',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  }, []);

  const showLocationPermissionDialog = () => {
    Alert.alert(
      'Autorisation de localisation',
      'LuxeRide a besoin d\'accéder à votre position pour vous offrir le meilleur service. Voulez-vous autoriser l\'accès dans les paramètres ?',
      [
        { text: 'Plus tard', style: 'cancel' },
        { 
          text: 'Paramètres', 
          onPress: () => Linking.openSettings(),
        },
      ]
    );
  };

  // ================================
  // EFFETS
  // ================================

  useEffect(() => {
    if (isAuthenticated) {
      // Initialiser les données
      dispatch(refreshProfile());
      dispatch(fetchMyBookings({ refresh: true }));
      
      // Demander les permissions de localisation
      requestLocationPermission();
      
      // Connecter socket si pas déjà fait
      if (!socketService.isConnected()) {
        socketService.connect();
      }
    }
  }, [isAuthenticated, dispatch, requestLocationPermission]);

  useEffect(() => {
    // Écouter les événements socket
    const handleRideAccepted = (data: any) => {
      showMessage({
        message: 'Course acceptée !',
        description: `${data.driver.firstName} arrive dans ${Math.round((new Date(data.estimatedArrival).getTime() - Date.now()) / 60000)} minutes`,
        type: 'success',
        duration: 5000,
      });
    };

    const handleBookingUpdate = (data: any) => {
      // Rafraîchir les données
      dispatch(fetchMyBookings({ refresh: true }));
    };

    socketService.on('ride_accepted', handleRideAccepted);
    socketService.on('booking_status_update', handleBookingUpdate);

    return () => {
      socketService.off('ride_accepted', handleRideAccepted);
      socketService.off('booking_status_update', handleBookingUpdate);
    };
  }, [dispatch]);

  // ================================
  // HANDLERS
  // ================================

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      await Promise.all([
        dispatch(refreshProfile()),
        dispatch(fetchMyBookings({ refresh: true })),
      ]);
      
      if (locationPermissionStatus === RESULTS.GRANTED) {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, locationPermissionStatus, getCurrentLocation]);

  const handleQuickBook = (category: keyof typeof VEHICLE_CATEGORIES) => {
    if (!currentLocation) {
      showMessage({
        message: 'Position requise',
        description: 'Veuillez autoriser la géolocalisation pour réserver',
        type: 'warning',
      });
      return;
    }

    navigation.navigate('BookingModal', {
      screen: 'Booking',
      params: {
        pickupLocation: currentLocation,
        vehicleCategory: category,
      },
    });
  };

  const handleViewActiveBooking = () => {
    if (currentBooking) {
      navigation.navigate('LiveTrackingModal', {
        bookingId: currentBooking.id,
      });
    }
  };

  const handleNewBooking = () => {
    navigation.navigate('BookingModal', {
      screen: 'Booking',
      params: currentLocation ? { pickupLocation: currentLocation } : {},
    });
  };

  // ================================
  // RENDER
  // ================================

  if (!isAuthenticated) {
    return <LoadingOverlay message="Chargement..." />;
  }

  const hasActiveBooking = currentBooking && 
    ['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'IN_PROGRESS']
      .includes(currentBooking.status);

  const recentBookings = bookings
    .filter(b => ['COMPLETED', 'CANCELLED'].includes(b.status))
    .slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Header avec salutation */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Avatar.Text 
              size={40} 
              label={user?.firstName?.charAt(0) || 'U'}
              style={{ backgroundColor: theme.colors.secondary }}
            />
            <View style={styles.userText}>
              <Text style={[styles.greeting, { color: theme.colors.onPrimary }]}>
                Bonjour,
              </Text>
              <Text style={[styles.userName, { color: theme.colors.onPrimary }]}>
                {user?.firstName || 'Client'}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <Button
              mode="text"
              textColor={theme.colors.onPrimary}
              onPress={() => navigation.navigate('Profile', { screen: 'Loyalty' })}
            >
              {user?.loyaltyPoints || 0} pts
            </Button>
          </View>
        </View>
      </Surface>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Course active */}
        {hasActiveBooking && (
          <ActiveBookingCard
            booking={currentBooking}
            onPress={handleViewActiveBooking}
            style={styles.activeBookingCard}
          />
        )}

        {/* Bannière promotionnelle */}
        <PromotionBanner style={styles.promotionBanner} />

        {/* Carte avec position */}
        <Card style={styles.mapCard}>
          <Card.Content style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={mapRegion}
              showsUserLocation={true}
              showsMyLocationButton={false}
              loadingEnabled={isLocationLoading}
            >
              {currentLocation && (
                <Marker
                  coordinate={{
                    latitude: currentLocation.lat,
                    longitude: currentLocation.lng,
                  }}
                  title="Ma position"
                  description="Vous êtes ici"
                />
              )}
            </MapView>
            
            {/* Overlay avec météo */}
            <View style={styles.mapOverlay}>
              <WeatherWidget location={currentLocation} />
            </View>
          </Card.Content>
        </Card>

        {/* Réservation rapide */}
        <QuickBookingCard
          onCategorySelect={handleQuickBook}
          style={styles.quickBookingCard}
        />

        {/* Destinations favorites */}
        <FavoriteDestinations
          onDestinationSelect={(destination) => {
            navigation.navigate('BookingModal', {
              screen: 'Booking',
              params: {
                pickupLocation: currentLocation,
                dropoffLocation: {
                  lat: destination.lat,
                  lng: destination.lng,
                },
                dropoffAddress: destination.address,
              },
            });
          }}
          style={styles.favoritesCard}
        />

        {/* Courses récentes */}
        {recentBookings.length > 0 && (
          <Card style={styles.recentCard}>
            <Card.Title
              title="Courses récentes"
              subtitle={`${recentBookings.length} course(s)`}
              left={(props) => <Icon {...props} name="history" />}
              right={(props) => (
                <Button
                  {...props}
                  mode="text"
                  onPress={() => navigation.navigate('Bookings')}
                >
                  Voir tout
                </Button>
              )}
            />
            <Card.Content>
              {recentBookings.map((booking, index) => (
                <View key={booking.id} style={styles.recentBookingItem}>
                  <Icon 
                    name="map-marker-outline" 
                    size={16} 
                    color={theme.colors.onSurfaceVariant} 
                  />
                  <Text 
                    variant="bodyMedium" 
                    style={styles.recentBookingText}
                    numberOfLines={1}
                  >
                    {booking.dropoffAddress.split(',')[0]}
                  </Text>
                  <Chip 
                    mode="outlined" 
                    compact
                    textStyle={styles.chipText}
                  >
                    {booking.finalPrice || booking.estimatedPrice}€
                  </Chip>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Espace pour le FAB */}
        <View style={styles.fabSpacer} />
      </ScrollView>

      {/* Floating Action Button */}
      <Portal>
        <FAB
          icon="plus"
          label={hasActiveBooking ? "Nouvelle course" : "Réserver"}
          style={[
            styles.fab,
            { backgroundColor: theme.colors.primary }
          ]}
          onPress={handleNewBooking}
          visible={!isLoading}
        />
      </Portal>

      {/* Modal réservation rapide */}
      <Portal>
        <Modal
          visible={showQuickBooking}
          onDismiss={() => setShowQuickBooking(false)}
          contentContainerStyle={[
            styles.quickBookingModal,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Réservation rapide
          </Text>
          <Text variant="bodyMedium" style={styles.modalSubtitle}>
            Choisissez votre véhicule préféré
          </Text>
          
          <View style={styles.vehicleGrid}>
            {Object.entries(VEHICLE_CATEGORIES).map(([key, category]) => (
              <Button
                key={key}
                mode="outlined"
                style={styles.vehicleButton}
                onPress={() => {
                  setShowQuickBooking(false);
                  handleQuickBook(key as keyof typeof VEHICLE_CATEGORIES);
                }}
              >
                {category.icon} {category.name}
              </Button>
            ))}
          </View>
          
          <Button
            mode="text"
            onPress={() => setShowQuickBooking(false)}
            style={styles.modalCloseButton}
          >
            Fermer
          </Button>
        </Modal>
      </Portal>

      {/* Loading overlay */}
      {isLocationLoading && (
        <LoadingOverlay message="Localisation en cours..." />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userText: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 14,
    opacity: 0.8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  activeBookingCard: {
    marginBottom: 16,
  },
  promotionBanner: {
    marginBottom: 16,
  },
  mapCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  mapContainer: {
    height: 200,
    padding: 0,
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  quickBookingCard: {
    marginBottom: 16,
  },
  favoritesCard: {
    marginBottom: 16,
  },
  recentCard: {
    marginBottom: 16,
  },
  recentBookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  recentBookingText: {
    flex: 1,
    marginLeft: 8,
  },
  chipText: {
    fontSize: 12,
  },
  fabSpacer: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80, // Au-dessus de la tab bar
  },
  quickBookingModal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  vehicleGrid: {
    gap: 12,
  },
  vehicleButton: {
    marginVertical: 4,
  },
  modalCloseButton: {
    marginTop: 16,
  },
});

export default HomeScreen;