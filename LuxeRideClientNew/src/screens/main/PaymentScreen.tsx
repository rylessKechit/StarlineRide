// src/screens/main/PaymentScreen.tsx
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchBooking } from '../../store/slices/bookingSlice';
import { paymentsAPI } from '../../services/api';
import { MainStackParamList, PaymentMethod } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

type PaymentScreenProps = {
  navigation: StackNavigationProp<MainStackParamList, 'Payment'>;
  route: RouteProp<MainStackParamList, 'Payment'>;
};

interface PriceBreakdown {
  basePrice: number;
  distancePrice: number;
  timePrice: number;
  surcharge: number;
  discount: number;
  total: number;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation, route }) => {
  const { bookingId } = route.params;
  const dispatch = useAppDispatch();
  const { currentBooking } = useAppSelector(state => state.bookings);

  const [loading, setLoading] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CARD');
  const [tip, setTip] = useState(0);

  const paymentMethods = [
    { id: 'CARD' as PaymentMethod, name: 'Carte bancaire', icon: '💳' },
    { id: 'APPLE_PAY' as PaymentMethod, name: 'Apple Pay', icon: '🍎' },
    { id: 'GOOGLE_PAY' as PaymentMethod, name: 'Google Pay', icon: '📱' },
    { id: 'PAYPAL' as PaymentMethod, name: 'PayPal', icon: '💰' },
  ];

  const tipOptions = [0, 2, 5, 10];

  useEffect(() => {
    loadBookingAndPrice();
  }, [bookingId]);

  const loadBookingAndPrice = async () => {
    try {
      setLoading(true);
      
      // Load booking details if not already loaded
      if (!currentBooking || currentBooking.id !== bookingId) {
        await dispatch(fetchBooking(bookingId)).unwrap();
      }

      // Calculate price breakdown
      const response = await paymentsAPI.calculatePrice(bookingId);
      setPriceBreakdown(response.data.data.priceBreakdown);
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors du chargement');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!priceBreakdown) return;

    try {
      setLoading(true);

      // Create payment intent
      const intentResponse = await paymentsAPI.createIntent({
        bookingId,
        paymentMethod: selectedPaymentMethod,
      });

      const { clientSecret, paymentId } = intentResponse.data.data;

      // For demo purposes, simulate successful payment
      // In a real app, you would integrate with Stripe SDK here
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Confirm payment
      await paymentsAPI.confirm({
        paymentId,
        paymentIntentId: clientSecret.split('_secret_')[0],
        tip,
      });

      Alert.alert(
        'Paiement réussi !',
        `Votre paiement de ${(priceBreakdown.total + tip).toFixed(2)}€ a été traité avec succès.`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Review', { bookingId });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erreur de paiement', error.response?.data?.message || 'Le paiement a échoué');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !priceBreakdown) {
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

  const totalAmount = (priceBreakdown?.total || 0) + tip;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Trip Summary */}
        <Card style={styles.tripCard}>
          <Text style={styles.sectionTitle}>Résumé de la course</Text>
          {currentBooking && (
            <>
              <View style={styles.tripRoute}>
                <Text style={styles.routeText} numberOfLines={1}>
                  {currentBooking.pickupAddress.split(',')[0]}
                </Text>
                <Text style={styles.routeArrow}>→</Text>
                <Text style={styles.routeText} numberOfLines={1}>
                  {currentBooking.dropoffAddress.split(',')[0]}
                </Text>
              </View>
              <Text style={styles.tripDate}>
                {new Date(currentBooking.scheduledFor).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </>
          )}
        </Card>

        {/* Price Breakdown */}
        {priceBreakdown && (
          <Card style={styles.priceCard}>
            <Text style={styles.sectionTitle}>Détail du prix</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Prix de base</Text>
              <Text style={styles.priceValue}>{priceBreakdown.basePrice.toFixed(2)}€</Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Distance ({currentBooking?.estimatedDistance}km)</Text>
              <Text style={styles.priceValue}>{priceBreakdown.distancePrice.toFixed(2)}€</Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Temps de trajet</Text>
              <Text style={styles.priceValue}>{priceBreakdown.timePrice.toFixed(2)}€</Text>
            </View>
            
            {priceBreakdown.surcharge > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Majoration</Text>
                <Text style={styles.priceValue}>+{priceBreakdown.surcharge.toFixed(2)}€</Text>
              </View>
            )}
            
            {priceBreakdown.discount > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabelDiscount}>Réduction membre</Text>
                <Text style={styles.priceValueDiscount}>-{priceBreakdown.discount.toFixed(2)}€</Text>
              </View>
            )}
            
            <View style={styles.priceDivider} />
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabelTotal}>Sous-total</Text>
              <Text style={styles.priceValueTotal}>{priceBreakdown.total.toFixed(2)}€</Text>
            </View>
          </Card>
        )}

        {/* Tip Selection */}
        <Card style={styles.tipCard}>
          <Text style={styles.sectionTitle}>Pourboire (optionnel)</Text>
          <Text style={styles.tipSubtitle}></Text>