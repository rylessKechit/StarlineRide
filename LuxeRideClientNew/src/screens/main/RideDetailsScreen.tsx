// src/screens/main/RideDetailsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchBooking, cancelBooking, updateBookingStatus } from '../../store/slices/bookingSlice';
import { MainStackParamList, BookingStatus } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

type RideDetailsScreenProps = {
  navigation: StackNavigationProp<MainStackParamList, 'RideDetails'>;
  route: RouteProp<MainStackParamList, 'RideDetails'>;
};

const RideDetailsScreen: React.FC<RideDetailsScreenProps> = ({ navigation, route }) => {
  const { rideId } = route.params;
  const dispatch = useAppDispatch();
  const { currentBooking, loading } = useAppSelector(state => state.bookings);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRideDetails();
  }, [rideId]);

  const loadRideDetails = async () => {
    try {
      await dispatch(fetchBooking(rideId)).unwrap();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les détails de la course');
      navigation.goBack();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRideDetails();
    setRefreshing(false);
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Annuler la course',
      'Êtes-vous sûr de vouloir annuler cette course ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(cancelBooking({ 
                bookingId: rideId, 
                reason: 'Annulé par le client' 
              })).unwrap();
              Alert.alert('Course annulée', 'Votre course a été annulée avec succès');
            } catch (error: any) {
              Alert.alert('Erreur', error || 'Erreur lors de l\'annulation');
            }
          }
        }
      ]
    );
  };

  const handleCallDriver = () => {
    if (currentBooking?.driver?.phone) {
      Linking.openURL(`tel:${currentBooking.driver.phone}`);
    }
  };

  const handlePayment = () => {
    navigation.navigate('Payment', { bookingId: rideId });
  };

  const handleReview = () => {
    navigation.navigate('Review', { bookingId: rideId });
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'COMPLETED': return '#34C759';
      case 'IN_PROGRESS': return '#007AFF';
      case 'DRIVER_ASSIGNED': return '#FF9500';
      case 'DRIVER_EN_ROUTE': return '#FF9500';
      case 'DRIVER_ARRIVED': return '#FF9500';
      case 'CANCELLED': return '#FF3B30';
      case 'PENDING': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING': return 'En attente d\'un chauffeur';
      case 'CONFIRMED': return 'Course confirmée';
      case 'DRIVER_ASSIGNED': return 'Chauffeur assigné';
      case 'DRIVER_EN_ROUTE': return 'Chauffeur en route';
      case 'DRIVER_ARRIVED': return 'Chauffeur arrivé';
      case 'IN_PROGRESS': return 'Course en cours';
      case 'COMPLETED': return 'Course terminée';
      case 'CANCELLED': return 'Course annulée';
      default: return status;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canCancel = currentBooking && ['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED'].includes(currentBooking.status);
  const showDriverInfo = currentBooking?.driver && ['DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(currentBooking.status);
  const canPay = currentBooking?.status === 'COMPLETED' && !currentBooking.payment;
  const canReview = currentBooking?.status === 'COMPLETED' && !currentBooking.review;

  if (loading && !currentBooking) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentBooking) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Course non trouvée</Text>
          <Button
            title="Retour"
            onPress={() => navigation.goBack()}
            variant="primary"
            size="medium"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={undefined}
        showsVerticalScrollIndicator={false}>

        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(currentBooking.status) }
            ]}>
              <Text style={styles.statusText}>
                {getStatusText(currentBooking.status)}
              </Text>
            </View>
            <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
              <Text style={styles.refreshButton}>
                {refreshing ? '🔄' : '↻'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.rideId}>Course #{currentBooking.id.slice(-8)}</Text>
          <Text style={styles.rideDate}>
            {formatDateTime(currentBooking.scheduledFor)}
          </Text>
        </Card>

        {/* Route Card */}
        <Card style={styles.routeCard}>
          <Text style={styles.sectionTitle}>Itinéraire</Text>
          
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: '#34C759' }]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Départ</Text>
                <Text style={styles.routeAddress}>{currentBooking.pickupAddress}</Text>
              </View>
            </View>
            
            <View style={styles.routeLine} />
            
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: '#FF3B30' }]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Arrivée</Text>
                <Text style={styles.routeAddress}>{currentBooking.dropoffAddress}</Text>
              </View>
            </View>
          </View>

          <View style={styles.routeDetails}>
            {currentBooking.estimatedDistance && (
              <View style={styles.routeDetailItem}>
                <Text style={styles.routeDetailLabel}>Distance</Text>
                <Text style={styles.routeDetailValue}>
                  {currentBooking.estimatedDistance} km
                </Text>
              </View>
            )}
            {currentBooking.estimatedDuration && (
              <View style={styles.routeDetailItem}>
                <Text style={styles.routeDetailLabel}>Durée estimée</Text>
                <Text style={styles.routeDetailValue}>
                  {currentBooking.estimatedDuration} min
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Driver Card */}
        {showDriverInfo && currentBooking.driver && (
          <Card style={styles.driverCard}>
            <Text style={styles.sectionTitle}>Votre chauffeur</Text>
            
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverAvatarText}>
                  {currentBooking.driver.firstName.charAt(0)}
                  {currentBooking.driver.lastName.charAt(0)}
                </Text>
              </View>
              
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>
                  {currentBooking.driver.firstName} {currentBooking.driver.lastName}
                </Text>
                <Text style={styles.driverRating}>
                  ⭐ {currentBooking.driver.rating}/5 • {currentBooking.driver.totalRides} courses
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.callButton}
                onPress={handleCallDriver}>
                <Text style={styles.callButtonText}>📞</Text>
              </TouchableOpacity>
            </View>

            {currentBooking.vehicle && (
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleTitle}>Véhicule</Text>
                <Text style={styles.vehicleDetails}>
                  {currentBooking.vehicle.brand} {currentBooking.vehicle.model} • {currentBooking.vehicle.color}
                </Text>
                <Text style={styles.vehiclePlate}>
                  {currentBooking.vehicle.licensePlate}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Price Card */}
        <Card style={styles.priceCard}>
          <Text style={styles.sectionTitle}>Tarification</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Prix estimé</Text>
            <Text style={styles.priceValue}>{currentBooking.estimatedPrice}€</Text>
          </View>
          
          {currentBooking.finalPrice && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabelFinal}>Prix final</Text>
              <Text style={styles.priceValueFinal}>{currentBooking.finalPrice}€</Text>
            </View>
          )}
          
          <Text style={styles.priceNote}>
            Passagers: {currentBooking.passengerCount}
          </Text>
        </Card>

        {/* Special Requests */}
        {currentBooking.specialRequests && (
          <Card style={styles.requestsCard}>
            <Text style={styles.sectionTitle}>Demandes spéciales</Text>
            <Text style={styles.requestsText}>{currentBooking.specialRequests}</Text>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {canCancel && (
            <Button
              title="Annuler la course"
              onPress={handleCancelRide}
              variant="outline"
              size="large"
              style={{ ...styles.actionButton, borderColor: '#FF3B30' }}
            />
          )}
          
          {canPay && (
            <Button
              title="Procéder au paiement"
              onPress={handlePayment}
              variant="primary"
              size="large"
              style={styles.actionButton}
            />
          )}
          
          {canReview && (
            <Button
              title="Laisser un avis"
              onPress={handleReview}
              variant="secondary"
              size="large"
              style={styles.actionButton}
            />
          )}
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginBottom: 24,
    textAlign: 'center',
  },
  statusCard: {
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  refreshButton: {
    fontSize: 20,
    color: '#007AFF',
  },
  rideId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  rideDate: {
    fontSize: 16,
    color: '#6C757D',
  },
  routeCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  routeContainer: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E5EA',
    marginLeft: 5,
    marginBottom: 8,
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  routeDetailItem: {
    alignItems: 'center',
  },
  routeDetailLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  routeDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  driverCard: {
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  driverAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  driverRating: {
    fontSize: 14,
    color: '#6C757D',
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonText: {
    fontSize: 20,
  },
  vehicleInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  priceCard: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#6C757D',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  priceLabelFinal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  priceValueFinal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  priceNote: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
  },
  requestsCard: {
    marginBottom: 16,
  },
  requestsText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
  },
  actionsContainer: {
    marginBottom: 32,
  },
  actionButton: {
    marginBottom: 12,
  },
});

export default RideDetailsScreen;