// src/screens/booking/VehicleSelectionScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import {
  Surface,
  Text,
  Button,
  Card,
  Chip,
  RadioButton,
  Divider,
  List,
} from 'react-native-paper';
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

type VehicleCategory = 'BERLINE_EXECUTIVE' | 'SUV_LUXE' | 'VAN_PREMIUM';
type PaymentMethodType = 'CARD' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'PAYPAL';

interface VehicleOption {
  id: VehicleCategory;
  name: string;
  description: string;
  image: any;
  features: string[];
  capacity: number;
  estimatedPrice: number;
  estimatedTime: number;
  available: boolean;
  surge?: number;
}

interface BookingData {
  pickupLocation: Location;
  dropoffLocation: Location;
  scheduledFor: Date;
  vehicleCategory: VehicleCategory;
  paymentMethod: PaymentMethodType;
  estimatedPrice: number;
  estimatedTime: number;
}

type RootStackParamList = {
  BookingConfirmation: {
    bookingData: BookingData;
  };
};

interface VehicleSelectionScreenProps {
  route: {
    params: {
      pickup: Location;
      dropoff: Location;
      scheduledFor: Date;
    };
  };
}

const { width } = Dimensions.get('window');

const COLORS = {
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  primary: '#2196F3',
};

// Composant PaymentMethodSelector
const PaymentMethodSelector: React.FC<{
  visible: boolean;
  onDismiss: () => void;
  onSelect: (method: PaymentMethodType) => void;
  selectedMethod: PaymentMethodType;
}> = ({ visible, onDismiss, onSelect }) => {
  if (!visible) return null;
  
  const paymentMethods = [
    { id: 'CARD' as const, name: 'Carte bancaire', icon: 'credit-card' },
    { id: 'APPLE_PAY' as const, name: 'Apple Pay', icon: 'apple' },
    { id: 'GOOGLE_PAY' as const, name: 'Google Pay', icon: 'google' },
    { id: 'PAYPAL' as const, name: 'PayPal', icon: 'paypal' },
  ];
  
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Card>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 16 }}>
              Sélectionner un mode de paiement
            </Text>
            {paymentMethods.map((method) => (
              <List.Item
                key={method.id}
                title={method.name}
                left={(props) => <List.Icon {...props} icon={method.icon} />}
                onPress={() => {
                  onSelect(method.id);
                  onDismiss();
                }}
                style={{ paddingVertical: 8 }}
              />
            ))}
            <Button onPress={onDismiss} style={{ marginTop: 16 }}>
              Fermer
            </Button>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
};

export const VehicleSelectionScreen: React.FC<VehicleSelectionScreenProps> = ({ route }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  const { pickup, dropoff, scheduledFor } = route.params;

  // Local state
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>('BERLINE_EXECUTIVE');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('CARD');
  const [vehicleOptions, setVehicleOptions] = useState<VehicleOption[]>([]);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animation
  const animatedScale = useSharedValue(1);

  // ================================
  // DONNÉES DES VÉHICULES
  // ================================

  const getVehicleOptions = (): VehicleOption[] => [
    {
      id: 'BERLINE_EXECUTIVE',
      name: 'Berline Exécutive',
      description: 'Confort et élégance pour vos trajets',
      image: { uri: 'https://via.placeholder.com/100x60?text=Berline' },
      features: ['4 passagers', 'Climatisation', 'WiFi', 'Bouteilles d\'eau'],
      capacity: 4,
      estimatedPrice: 45,
      estimatedTime: 12,
      available: true,
    },
    {
      id: 'SUV_LUXE',
      name: 'SUV Luxe',
      description: 'Espace et prestige combinés',
      image: { uri: 'https://via.placeholder.com/100x60?text=SUV' },
      features: ['6 passagers', 'Sièges cuir', 'Bar', 'Écrans individuels'],
      capacity: 6,
      estimatedPrice: 65,
      estimatedTime: 15,
      available: true,
      surge: 1.2,
    },
    {
      id: 'VAN_PREMIUM',
      name: 'Van Premium',
      description: 'Idéal pour les groupes',
      image: { uri: 'https://via.placeholder.com/100x60?text=Van' },
      features: ['8 passagers', 'Espace bagages', 'Tables', 'Prises USB'],
      capacity: 8,
      estimatedPrice: 85,
      estimatedTime: 18,
      available: true,
    },
  ];

  // ================================
  // EFFETS
  // ================================

  useEffect(() => {
    loadVehicleOptions();
  }, []);

  useEffect(() => {
    // Animation quand un véhicule est sélectionné
    animatedScale.value = withSpring(0.95, {}, () => {
      animatedScale.value = withSpring(1);
    });
  }, [selectedCategory, animatedScale]);

  // ================================
  // FONCTIONS
  // ================================

  const loadVehicleOptions = () => {
    const options = getVehicleOptions();
    setVehicleOptions(options);
    
    // Sélectionner automatiquement le premier véhicule disponible
    const firstAvailable = options.find(option => option.available);
    if (firstAvailable) {
      setSelectedCategory(firstAvailable.id);
    }
  };

  const handleVehicleSelect = (category: VehicleCategory) => {
    const vehicle = vehicleOptions.find(v => v.id === category);
    if (vehicle && vehicle.available) {
      setSelectedCategory(category);
    }
  };

  const handleContinue = () => {
    const selectedVehicleData = vehicleOptions.find(v => v.id === selectedCategory);
    
    if (!selectedVehicleData) {
      showMessage({
        message: 'Erreur',
        description: 'Veuillez sélectionner un véhicule',
        type: 'warning',
      });
      return;
    }

    setIsLoading(true);

    // Naviguer vers la confirmation
    navigation.navigate('BookingConfirmation', {
      bookingData: {
        pickupLocation: pickup,
        dropoffLocation: dropoff,
        scheduledFor,
        vehicleCategory: selectedCategory,
        paymentMethod: selectedPaymentMethod,
        estimatedPrice: selectedVehicleData.estimatedPrice,
        estimatedTime: selectedVehicleData.estimatedTime,
      },
    });
  };

  const renderVehicleCard = (vehicle: VehicleOption) => {
    const isSelected = selectedCategory === vehicle.id;
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: isSelected ? animatedScale.value : 1 }],
    }));

    return (
      <Animated.View key={vehicle.id} style={animatedStyle}>
        <Card
          style={[
            styles.vehicleCard,
            isSelected && { borderColor: COLORS.primary, borderWidth: 2 },
            !vehicle.available && styles.disabledCard,
          ]}
          onPress={() => handleVehicleSelect(vehicle.id)}
        >
          <Card.Content style={styles.vehicleContent}>
            <View style={styles.vehicleHeader}>
              <View style={styles.vehicleInfo}>
                <View style={styles.vehicleTitleRow}>
                  <Text variant="titleMedium" style={styles.vehicleName}>
                    {vehicle.name}
                  </Text>
                  {vehicle.surge && (
                    <Chip
                      compact
                      mode="flat"
                      style={[styles.surgeChip, { backgroundColor: COLORS.warning + '20' }]}
                      textStyle={{ color: COLORS.warning }}
                    >
                      {vehicle.surge}x
                    </Chip>
                  )}
                </View>
                <Text variant="bodyMedium" style={styles.vehicleDescription}>
                  {vehicle.description}
                </Text>
              </View>
              
              <RadioButton
                value={vehicle.id}
                status={isSelected ? 'checked' : 'unchecked'}
                onPress={() => handleVehicleSelect(vehicle.id)}
                disabled={!vehicle.available}
              />
            </View>

            <View style={styles.vehicleDetails}>
              <Image source={vehicle.image} style={styles.vehicleImage} />
              
              <View style={styles.vehicleSpecs}>
                <View style={styles.specRow}>
                  <Icon name="account-group" size={16} color="#666" />
                  <Text variant="bodySmall" style={styles.specText}>
                    {vehicle.capacity} passagers
                  </Text>
                </View>
                <View style={styles.specRow}>
                  <Icon name="clock-outline" size={16} color="#666" />
                  <Text variant="bodySmall" style={styles.specText}>
                    {vehicle.estimatedTime} min
                  </Text>
                </View>
                <View style={styles.specRow}>
                  <Icon name="currency-eur" size={16} color="#666" />
                  <Text variant="bodySmall" style={[styles.specText, styles.price]}>
                    {vehicle.estimatedPrice}€
                  </Text>
                </View>
              </View>
            </View>

            {/* Caractéristiques */}
            <View style={styles.featuresContainer}>
              {vehicle.features.map((feature, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  compact
                  style={styles.featureChip}
                  textStyle={styles.featureText}
                >
                  {feature}
                </Chip>
              ))}
            </View>

            {!vehicle.available && (
              <View style={styles.unavailableOverlay}>
                <Text variant="bodyMedium" style={styles.unavailableText}>
                  Temporairement indisponible
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </Animated.View>
    );
  };

  const getPaymentMethodName = (method: PaymentMethodType): string => {
    switch (method) {
      case 'CARD': return 'Carte bancaire';
      case 'APPLE_PAY': return 'Apple Pay';
      case 'GOOGLE_PAY': return 'Google Pay';
      case 'PAYPAL': return 'PayPal';
      default: return 'Carte bancaire';
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethodType): string => {
    switch (method) {
      case 'CARD': return 'credit-card';
      case 'APPLE_PAY': return 'apple';
      case 'GOOGLE_PAY': return 'google';
      case 'PAYPAL': return 'paypal';
      default: return 'credit-card';
    }
  };

  // ================================
  // RENDER
  // ================================

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Résumé du trajet */}
        <Surface style={styles.tripSummary}>
          <View style={styles.summaryHeader}>
            <Icon name="map-marker" size={20} color={COLORS.success} />
            <Text variant="bodyMedium" style={styles.summaryText} numberOfLines={1}>
              Départ: {pickup.address || `${pickup.latitude.toFixed(4)}, ${pickup.longitude.toFixed(4)}`}
            </Text>
          </View>
          <View style={styles.summaryHeader}>
            <Icon name="map-marker" size={20} color={COLORS.error} />
            <Text variant="bodyMedium" style={styles.summaryText} numberOfLines={1}>
              Arrivée: {dropoff.address || `${dropoff.latitude.toFixed(4)}, ${dropoff.longitude.toFixed(4)}`}
            </Text>
          </View>
          <Divider style={styles.summaryDivider} />
          <Text variant="bodySmall" style={styles.summaryTime}>
            {scheduledFor.toLocaleDateString()} à {scheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </Surface>

        {/* Titre */}
        <View style={styles.titleContainer}>
          <Text variant="headlineSmall" style={styles.title}>
            Choisissez votre véhicule
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Sélectionnez le véhicule qui correspond à vos besoins
          </Text>
        </View>

        {/* Liste des véhicules */}
        <View style={styles.vehiclesContainer}>
          {vehicleOptions.map(renderVehicleCard)}
        </View>

        {/* Méthode de paiement */}
        <Card style={styles.paymentCard}>
          <Card.Content>
            <View style={styles.paymentHeader}>
              <Text variant="titleMedium">Méthode de paiement</Text>
              <Button
                mode="text"
                onPress={() => setShowPaymentMethods(true)}
                compact
              >
                Modifier
              </Button>
            </View>
            
            <List.Item
              title={getPaymentMethodName(selectedPaymentMethod)}
              description="•••• 1234"
              left={(props) => (
                <List.Icon {...props} icon={getPaymentMethodIcon(selectedPaymentMethod)} />
              )}
              style={styles.paymentItem}
            />
          </Card.Content>
        </Card>

        {/* Récapitulatif des prix */}
        {selectedCategory && (
          <Card style={styles.priceCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.priceTitle}>
                Récapitulatif
              </Text>
              
              <View style={styles.priceRow}>
                <Text variant="bodyMedium">Course</Text>
                <Text variant="bodyMedium">
                  {vehicleOptions.find(v => v.id === selectedCategory)?.estimatedPrice}€
                </Text>
              </View>
              
              <View style={styles.priceRow}>
                <Text variant="bodyMedium">Frais de service</Text>
                <Text variant="bodyMedium">2.50€</Text>
              </View>
              
              {vehicleOptions.find(v => v.id === selectedCategory)?.surge && (
                <View style={styles.priceRow}>
                  <Text variant="bodyMedium">Supplément demande élevée</Text>
                  <Text variant="bodyMedium" style={{ color: COLORS.warning }}>
                    +{((vehicleOptions.find(v => v.id === selectedCategory)?.surge! - 1) * 100).toFixed(0)}%
                  </Text>
                </View>
              )}
              
              <Divider style={styles.priceDivider} />
              
              <View style={styles.totalRow}>
                <Text variant="titleMedium">Total estimé</Text>
                <Text variant="titleMedium" style={styles.totalPrice}>
                  {((vehicleOptions.find(v => v.id === selectedCategory)?.estimatedPrice || 0) + 2.5).toFixed(2)}€
                </Text>
              </View>
              
              <Text variant="bodySmall" style={styles.priceDisclaimer}>
                Prix final calculé à la fin du trajet
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Bouton de confirmation */}
      <Surface style={styles.bottomBar}>
        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!selectedCategory || isLoading}
          loading={isLoading}
          style={styles.confirmButton}
          contentStyle={styles.confirmButtonContent}
        >
          Confirmer la réservation
        </Button>
      </Surface>

      {/* Modal sélection de paiement */}
      <PaymentMethodSelector
        visible={showPaymentMethods}
        onDismiss={() => setShowPaymentMethods(false)}
        onSelect={setSelectedPaymentMethod}
        selectedMethod={selectedPaymentMethod}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  tripSummary: {
    margin: 16,
    padding: 16,
    elevation: 2,
    borderRadius: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    marginLeft: 12,
    flex: 1,
  },
  summaryDivider: {
    marginVertical: 12,
  },
  summaryTime: {
    textAlign: 'center',
    opacity: 0.7,
  },
  titleContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.7,
  },
  vehiclesContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  vehicleCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  disabledCard: {
    opacity: 0.6,
  },
  vehicleContent: {
    padding: 16,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  vehicleInfo: {
    flex: 1,
    marginRight: 16,
  },
  vehicleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleName: {
    fontWeight: '600',
    marginRight: 8,
  },
  surgeChip: {
    height: 24,
  },
  vehicleDescription: {
    opacity: 0.7,
  },
  vehicleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleImage: {
    width: 80,
    height: 50,
    marginRight: 16,
    resizeMode: 'contain',
  },
  vehicleSpecs: {
    flex: 1,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  specText: {
    marginLeft: 4,
  },
  price: {
    fontWeight: '600',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    height: 28,
  },
  featureText: {
    fontSize: 12,
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  unavailableText: {
    fontWeight: '600',
    color: COLORS.error,
  },
  paymentCard: {
    margin: 16,
    elevation: 2,
    borderRadius: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentItem: {
    paddingLeft: 0,
  },
  priceCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
    borderRadius: 12,
  },
  priceTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceDivider: {
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalPrice: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  priceDisclaimer: {
    opacity: 0.6,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bottomBar: {
    padding: 16,
    elevation: 8,
  },
  confirmButton: {
    height: 50,
  },
  confirmButtonContent: {
    height: 50,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '80%',
    maxWidth: 400,
  },
});