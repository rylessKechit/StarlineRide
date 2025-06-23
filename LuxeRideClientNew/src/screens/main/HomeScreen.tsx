// src/screens/main/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchMyBookings } from '../../store/slices/bookingSlice';
import { MainStackParamList, Booking } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

type HomeScreenProps = {
  navigation: StackNavigationProp<MainStackParamList, 'Home'>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => (state as any).auth);
  const { bookings, loading } = useAppSelector(state => (state as any).bookings);
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await dispatch(fetchMyBookings({ limit: 5 })).unwrap();
    } catch (error) {
      // Error handling can be added here
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getMembershipColor = () => {
    switch (user?.membershipTier) {
      case 'GOLD': return '#FFD700';
      case 'PLATINUM': return '#E5E4E2';
      case 'VIP': return '#8B00FF';
      default: return '#007AFF';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#34C759';
      case 'IN_PROGRESS': return '#007AFF';
      case 'DRIVER_ASSIGNED': return '#FF9500';
      case 'CANCELLED': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'CONFIRMED': return 'Confirmée';
      case 'DRIVER_ASSIGNED': return 'Chauffeur assigné';
      case 'DRIVER_EN_ROUTE': return 'En route';
      case 'DRIVER_ARRIVED': return 'Arrivé';
      case 'IN_PROGRESS': return 'En cours';
      case 'COMPLETED': return 'Terminée';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  };

  const activeBooking = bookings.find((b: any) => 
    ['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(b.status)
  );

  const recentBookings = bookings.filter((b: any) => 
    !['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(b.status)
  ).slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.firstName} !
            </Text>
            <View style={styles.membershipContainer}>
              <View style={[
                styles.membershipBadge,
                { backgroundColor: getMembershipColor() }
              ]}>
                <Text style={styles.membershipText}>
                  {user?.membershipTier || 'STANDARD'}
                </Text>
              </View>
              <Text style={styles.loyaltyPoints}>
                {user?.loyaltyPoints || 0} points
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            title="Réserver une course"
            onPress={() => navigation.navigate('BookRide')}
            size="large"
            icon="🚗"
            style={styles.mainButton}
          />
        </View>

        {/* Active Booking */}
        {activeBooking && (
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Course en cours</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(activeBooking.status) }
              ]}>
                <Text style={styles.statusText}>
                  {getStatusText(activeBooking.status)}
                </Text>
              </View>
            </View>
            
            <View style={styles.bookingDetails}>
              <View style={styles.addressContainer}>
                <Text style={styles.addressLabel}>Départ</Text>
                <Text style={styles.addressText} numberOfLines={1}>
                  {activeBooking.pickupAddress}
                </Text>
              </View>
              
              <View style={styles.arrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
              
              <View style={styles.addressContainer}>
                <Text style={styles.addressLabel}>Arrivée</Text>
                <Text style={styles.addressText} numberOfLines={1}>
                  {activeBooking.dropoffAddress}
                </Text>
              </View>
            </View>

            {activeBooking.driver && (
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>
                  {activeBooking.driver.firstName} {activeBooking.driver.lastName}
                </Text>
                <Text style={styles.driverRating}>
                  ⭐ {activeBooking.driver.rating}/5
                </Text>
              </View>
            )}

            <Button
              title="Voir les détails"
              onPress={() => navigation.navigate('RideDetails', { rideId: activeBooking.id })}
              variant="outline"
              size="medium"
              style={styles.detailsButton}
            />
          </Card>
        )}

        {/* Recent Bookings */}
        {recentBookings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Courses récentes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyRides')}>
                <Text style={styles.sectionLink}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            
            {recentBookings.map((booking: any) => (
              <Card 
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => navigation.navigate('RideDetails', { rideId: booking.id })}>
                
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingDate}>
                    {new Date(booking.scheduledFor).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                  <View style={[
                    styles.statusBadgeSmall,
                    { backgroundColor: getStatusColor(booking.status) }
                  ]}>
                    <Text style={styles.statusTextSmall}>
                      {getStatusText(booking.status)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.bookingRoute}>
                  <Text style={styles.routeText} numberOfLines={1}>
                    {booking.pickupAddress.split(',')[0]} → {booking.dropoffAddress.split(',')[0]}
                  </Text>
                  <Text style={styles.priceText}>
                    {booking.finalPrice || booking.estimatedPrice}€
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Quick Stats */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Mes statistiques</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{bookings.length}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.loyaltyPoints || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {bookings.reduce((sum: number, b: Booking) => sum + (b.finalPrice || b.estimatedPrice), 0).toFixed(0)}€
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </Card>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  membershipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membershipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  membershipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loyaltyPoints: {
    fontSize: 14,
    color: '#6C757D',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quickActions: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  mainButton: {
    marginBottom: 0,
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  sectionLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bookingDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addressContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  arrow: {
    marginHorizontal: 16,
  },
  arrowText: {
    fontSize: 18,
    color: '#8E8E93',
  },
  driverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  driverRating: {
    fontSize: 14,
    color: '#6C757D',
  },
  detailsButton: {
    marginTop: 8,
  },
  bookingCard: {
    marginBottom: 12,
    padding: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingDate: {
    fontSize: 14,
    color: '#6C757D',
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextSmall: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bookingRoute: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeText: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
});

export default HomeScreen;