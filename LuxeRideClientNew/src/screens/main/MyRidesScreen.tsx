// src/screens/main/MyRidesScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchMyBookings } from '../../store/slices/bookingSlice';
import { MainStackParamList, Booking, BookingStatus } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

type MyRidesScreenProps = {
  navigation: StackNavigationProp<MainStackParamList, 'MyRides'>;
};

const MyRidesScreen: React.FC<MyRidesScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { bookings, loading } = useAppSelector(state => state.bookings);
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<BookingStatus | 'ALL'>('ALL');

  const filters = [
    { key: 'ALL' as const, label: 'Toutes', count: bookings.length },
    { key: 'IN_PROGRESS' as const, label: 'En cours', count: bookings.filter(b => ['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(b.status)).length },
    { key: 'COMPLETED' as const, label: 'Terminées', count: bookings.filter(b => b.status === 'COMPLETED').length },
    { key: 'CANCELLED' as const, label: 'Annulées', count: bookings.filter(b => b.status === 'CANCELLED').length },
  ];

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      await dispatch(fetchMyBookings({ params: { limit: 50 } })).unwrap();
    } catch (error) {
      // Error handling
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRides();
    setRefreshing(false);
  };

  const getFilteredBookings = () => {
    if (selectedFilter === 'ALL') return bookings;
    if (selectedFilter === 'IN_PROGRESS') {
      return bookings.filter(b => 
        ['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(b.status)
      );
    }
    return bookings.filter(b => b.status === selectedFilter);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const renderRideItem = ({ item }: { item: Booking }) => (
    <Card 
      style={styles.rideCard}
      onPress={() => navigation.navigate('RideDetails', { rideId: item.id })}>
      
      <View style={styles.rideHeader}>
        <View style={styles.rideInfo}>
          <Text style={styles.rideDate}>{formatDate(item.scheduledFor)}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.ridePrice}>
          {item.finalPrice || item.estimatedPrice}€
        </Text>
      </View>

      <View style={styles.rideRoute}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: '#34C759' }]} />
          <Text style={styles.routeAddress} numberOfLines={1}>
            {item.pickupAddress}
          </Text>
        </View>
        
        <View style={styles.routeLine} />
        
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: '#FF3B30' }]} />
          <Text style={styles.routeAddress} numberOfLines={1}>
            {item.dropoffAddress}
          </Text>
        </View>
      </View>

      {item.driver && (
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>
            {item.driver.firstName} {item.driver.lastName}
          </Text>
          <Text style={styles.driverRating}>
            ⭐ {item.driver.rating}/5
          </Text>
        </View>
      )}

      <View style={styles.rideActions}>
        {item.status === 'COMPLETED' && !item.review && (
          <Button
            title="Laisser un avis"
            onPress={() => navigation.navigate('Review', { bookingId: item.id })}
            variant="outline"
            size="small"
            style={styles.actionButton}
          />
        )}
        {['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED'].includes(item.status) && (
          <Button
            title="Annuler"
            onPress={() => {/* Handle cancel */}}
            variant="ghost"
            size="small"
            style={styles.actionButton}
          />
        )}
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🚗</Text>
      <Text style={styles.emptyTitle}>Aucune course</Text>
      <Text style={styles.emptySubtitle}>
        {selectedFilter === 'ALL' 
          ? 'Vous n\'avez pas encore de courses' 
          : `Aucune course ${filters.find(f => f.key === selectedFilter)?.label.toLowerCase()}`
        }
      </Text>
      <Button
        title="Réserver une course"
        onPress={() => navigation.navigate('BookRide')}
        variant="primary"
        size="medium"
        style={styles.emptyButton}
      />
    </View>
  );

  const filteredBookings = getFilteredBookings();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes courses</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('BookRide')}
          style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter(filter.key)}>
            <Text style={[
              styles.filterText,
              selectedFilter === filter.key && styles.filterTextActive
            ]}>
              {filter.label} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Rides List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderRideItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  rideCard: {
    marginBottom: 16,
    padding: 16,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rideInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideDate: {
    fontSize: 14,
    color: '#6C757D',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ridePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  rideRoute: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  routeAddress: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E5E5EA',
    marginLeft: 3,
    marginBottom: 4,
  },
  driverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginBottom: 12,
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
  rideActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 8,
    minWidth: 80,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyButton: {
    minWidth: 200,
  },
});

export default MyRidesScreen;