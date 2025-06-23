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
                  📍 {currentBooking.pickupAddress}
                </Text>
                <Text style={styles.routeText} numberOfLines={1}>
                  📍 {currentBooking.dropoffAddress}
                </Text>
              </View>
              <View style={styles.tripInfo}>
                <Text style={styles.infoText}>
                  🚗 {currentBooking.vehicle?.brand} {currentBooking.vehicle?.model}
                </Text>
                <Text style={styles.infoText}>
                  👤 {currentBooking.passengerCount} passager{currentBooking.passengerCount > 1 ? 's' : ''}
                </Text>
                <Text style={styles.infoText}>
                  📅 {new Date(currentBooking.scheduledFor).toLocaleDateString('fr-FR')}
                </Text>
              </View>
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
              <Text style={styles.priceLabel}>Distance</Text>
              <Text style={styles.priceValue}>{priceBreakdown.distancePrice.toFixed(2)}€</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Durée</Text>
              <Text style={styles.priceValue}>{priceBreakdown.timePrice.toFixed(2)}€</Text>
            </View>
            {priceBreakdown.surcharge > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Supplément</Text>
                <Text style={styles.priceValue}>{priceBreakdown.surcharge.toFixed(2)}€</Text>
              </View>
            )}
            {priceBreakdown.discount > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, styles.discountText]}>Réduction</Text>
                <Text style={[styles.priceValue, styles.discountText]}>
                  -{priceBreakdown.discount.toFixed(2)}€
                </Text>
              </View>
            )}
            <View style={styles.separator} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total course</Text>
              <Text style={styles.totalValue}>{priceBreakdown.total.toFixed(2)}€</Text>
            </View>
          </Card>
        )}

        {/* Tip Selection */}
        <Card style={styles.tipCard}>
          <Text style={styles.sectionTitle}>Pourboire (optionnel)</Text>
          <View style={styles.tipOptions}>
            {tipOptions.map((tipAmount) => (
              <TouchableOpacity
                key={tipAmount}
                style={[
                  styles.tipOption,
                  tip === tipAmount && styles.tipOptionSelected,
                ]}
                onPress={() => setTip(tipAmount)}>
                <Text style={[
                  styles.tipOptionText,
                  tip === tipAmount && styles.tipOptionTextSelected,
                ]}>
                  {tipAmount === 0 ? 'Aucun' : `${tipAmount}€`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Payment Method */}
        <Card style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Mode de paiement</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentOption,
                selectedPaymentMethod === method.id && styles.paymentOptionSelected,
              ]}
              onPress={() => setSelectedPaymentMethod(method.id)}>
              <View style={styles.paymentOptionContent}>
                <Text style={styles.paymentIcon}>{method.icon}</Text>
                <Text style={styles.paymentName}>{method.name}</Text>
              </View>
              {selectedPaymentMethod === method.id && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </Card>

        {/* Total */}
        {priceBreakdown && (
          <Card style={styles.totalCard}>
            <View style={styles.finalTotal}>
              <Text style={styles.finalTotalLabel}>Total à payer</Text>
              <Text style={styles.finalTotalValue}>{totalAmount.toFixed(2)}€</Text>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.footer}>
        <Button
          title={loading ? 'Traitement...' : `Payer ${totalAmount.toFixed(2)}€`}
          onPress={handlePayment}
          loading={loading}
          disabled={loading || !priceBreakdown}
          size="large"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tripCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  tripRoute: {
    marginBottom: 12,
  },
  routeText: {
    fontSize: 16,
    color: '#3C4043',
    marginBottom: 8,
  },
  tripInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
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
    color: '#3C4043',
  },
  priceValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  discountText: {
    color: '#34C759',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  tipCard: {
    marginBottom: 16,
  },
  tipOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipOption: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  tipOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  tipOptionText: {
    fontSize: 16,
    color: '#3C4043',
    fontWeight: '600',
  },
  tipOptionTextSelected: {
    color: '#FFFFFF',
  },
  paymentCard: {
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  paymentOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentName: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  totalCard: {
    marginBottom: 16,
  },
  finalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  finalTotalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  finalTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
});

export default PaymentScreen;