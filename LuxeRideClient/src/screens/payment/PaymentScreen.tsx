// src/screens/payment/PaymentScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Surface,
  Text,
  Button,
  Card,
  Divider,
  List,
  RadioButton,
  TextInput,
  Chip,
  Portal,
  Modal,
} from 'react-native-paper';
import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { showMessage } from 'react-native-flash-message';

// Types
type PaymentMethodType = 'CARD' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'PAYPAL';

interface TripData {
  finalPrice: number;
  distance: number;
  duration: number;
  bookingId?: string;
  driverName?: string;
  vehicleInfo?: string;
}

interface PaymentIntent {
  clientSecret: string;
  paymentId: string;
  id: string;
}

type RootStackParamList = {
  ReviewScreen: {
    bookingId: string;
    tripData: TripData & {
      finalAmount: number;
      tipAmount: number;
    };
  };
};

interface PaymentScreenProps {
  route: {
    params: {
      bookingId: string;
      tripData: TripData;
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

// Composant TipSelector
const TipSelector: React.FC<{
  baseAmount: number;
  selectedTip: number;
  onTipSelect: (amount: number) => void;
  style?: any;
}> = ({ baseAmount, selectedTip, onTipSelect, style }) => {
  const tipOptions = [
    { percentage: 10, amount: Math.round(baseAmount * 0.1 * 100) / 100 },
    { percentage: 15, amount: Math.round(baseAmount * 0.15 * 100) / 100 },
    { percentage: 20, amount: Math.round(baseAmount * 0.2 * 100) / 100 },
  ];

  return (
    <View style={[{ marginVertical: 8 }, style]}>
      <Text variant="bodyMedium" style={{ marginBottom: 12, opacity: 0.7 }}>
        Suggestions de pourboire
      </Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip
          mode={selectedTip === 0 ? 'flat' : 'outlined'}
          selected={selectedTip === 0}
          onPress={() => onTipSelect(0)}
          style={{ marginBottom: 8 }}
        >
          Aucun
        </Chip>
        
        {tipOptions.map((option) => (
          <Chip
            key={option.percentage}
            mode={selectedTip === option.amount ? 'flat' : 'outlined'}
            selected={selectedTip === option.amount}
            onPress={() => onTipSelect(option.amount)}
            style={{ marginBottom: 8 }}
          >
            {option.percentage}% ({option.amount}€)
          </Chip>
        ))}
      </View>
    </View>
  );
};

// Composant PaymentSummary
const PaymentSummary: React.FC<{
  tripData: TripData;
  tipAmount: number;
  totalAmount: number;
  style?: any;
}> = ({ tripData, tipAmount, totalAmount, style }) => (
  <Card style={[{ elevation: 2 }, style]}>
    <Card.Content>
      <Text variant="titleMedium" style={{ marginBottom: 16, fontWeight: '600' }}>
        Récapitulatif
      </Text>
      
      <View style={styles.priceRow}>
        <Text variant="bodyMedium">Course</Text>
        <Text variant="bodyMedium">{tripData.finalPrice?.toFixed(2)}€</Text>
      </View>
      
      <View style={styles.priceRow}>
        <Text variant="bodyMedium">Frais de service</Text>
        <Text variant="bodyMedium">2.50€</Text>
      </View>
      
      {tipAmount > 0 && (
        <View style={styles.priceRow}>
          <Text variant="bodyMedium">Pourboire</Text>
          <Text variant="bodyMedium">{tipAmount.toFixed(2)}€</Text>
        </View>
      )}
      
      <Divider style={{ marginVertical: 12 }} />
      
      <View style={styles.totalRow}>
        <Text variant="titleMedium" style={{ fontWeight: '600' }}>
          Total
        </Text>
        <Text variant="titleLarge" style={{ fontWeight: 'bold', color: COLORS.primary }}>
          {totalAmount.toFixed(2)}€
        </Text>
      </View>
      
      <Text variant="bodySmall" style={styles.disclaimer}>
        Montant débité de votre carte
      </Text>
    </Card.Content>
  </Card>
);

// Composant ReceiptCard
const ReceiptCard: React.FC<{
  tripData: TripData & { finalAmount: number; tipAmount: number };
  onClose: () => void;
  onShare: () => void;
}> = ({ tripData, onClose, onShare }) => (
  <Card>
    <Card.Content>
      <Text variant="headlineSmall" style={{ textAlign: 'center', marginBottom: 16 }}>
        Reçu de course
      </Text>
      
      <View style={styles.receiptRow}>
        <Text>Course</Text>
        <Text>{tripData.finalPrice.toFixed(2)}€</Text>
      </View>
      
      <View style={styles.receiptRow}>
        <Text>Pourboire</Text>
        <Text>{tripData.tipAmount.toFixed(2)}€</Text>
      </View>
      
      <Divider style={{ marginVertical: 8 }} />
      
      <View style={styles.receiptRow}>
        <Text variant="titleMedium">Total</Text>
        <Text variant="titleMedium">{tripData.finalAmount.toFixed(2)}€</Text>
      </View>
      
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        <Button mode="outlined" onPress={onShare} style={{ flex: 1 }}>
          Partager
        </Button>
        <Button mode="contained" onPress={onClose} style={{ flex: 1 }}>
          Fermer
        </Button>
      </View>
    </Card.Content>
  </Card>
);

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ route }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { confirmPayment: stripeConfirmPayment } = useConfirmPayment();
  
  const { bookingId, tripData } = route.params;

  // Local state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('CARD');
  const [selectedTip, setSelectedTip] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');
  const [cardComplete, setCardComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock payment intent
  const [paymentIntent] = useState<PaymentIntent>({
    clientSecret: 'pi_mock_client_secret',
    paymentId: 'payment_mock_id',
    id: 'pi_mock_id',
  });

  // Calculs
  const baseAmount = tripData.finalPrice || 0;
  const tipAmount = selectedTip > 0 ? selectedTip : (customTip ? parseFloat(customTip) : 0);
  const totalAmount = baseAmount + tipAmount + 2.5; // +2.5€ frais de service

  // ================================
  // EFFETS
  // ================================

  useEffect(() => {
    if (paymentSuccess) {
      // Délai avant de naviguer vers l'écran d'évaluation
      const timer = setTimeout(() => {
        navigation.navigate('ReviewScreen', {
          bookingId,
          tripData: {
            ...tripData,
            finalAmount: totalAmount,
            tipAmount,
          },
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [paymentSuccess, navigation, bookingId, tripData, totalAmount, tipAmount]);

  // ================================
  // HANDLERS
  // ================================

  type PaymentResult = { error: { message: string } | null };

  const handleGooglePayment = async (): Promise<PaymentResult> => {
    // Simulation de Google Pay
    return { error: null };
  };

  const handleApplePayment = async (): Promise<PaymentResult> => {
    // Simulation d'Apple Pay
    return { error: null };
  };

  const handleCardPayment = async (): Promise<PaymentResult> => {
    if (!cardComplete) {
      throw new Error('Veuillez compléter les informations de carte');
    }

    // Simulation d'un paiement par carte réussi
    return { error: null };
  };

  const handlePayment = async () => {
    if (!paymentIntent?.clientSecret) {
      showMessage({
        message: 'Erreur',
        description: 'Paiement non initialisé',
        type: 'warning',
      });
      return;
    }

    setProcessing(true);

    try {
      let paymentResult: PaymentResult;

      switch (selectedPaymentMethod) {
        case 'CARD':
          paymentResult = await handleCardPayment();
          break;
        case 'APPLE_PAY':
          paymentResult = await handleApplePayment();
          break;
        case 'GOOGLE_PAY':
          paymentResult = await handleGooglePayment();
          break;
        default:
          throw new Error('Méthode de paiement non supportée');
      }

      if (paymentResult?.error) {
        throw new Error(paymentResult.error.message);
      }

      // Simulation de confirmation côté serveur
      await simulateServerConfirmation();

      setPaymentSuccess(true);
      
      showMessage({
        message: 'Paiement réussi !',
        description: 'Merci pour votre course',
        type: 'success',
      });

    } catch (error: any) {
      console.error('Payment error:', error);
      showMessage({
        message: 'Erreur de paiement',
        description: error.message || 'Le paiement a échoué',
        type: 'danger',
      });
    } finally {
      setProcessing(false);
    }

    return { error: null };
  };

  const simulateServerConfirmation = async () => {
    // Simulation d'une confirmation côté serveur
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleTipSelect = (amount: number) => {
    setSelectedTip(amount);
    setCustomTip('');
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    setSelectedTip(0);
  };

  const handleShowReceipt = () => {
    setShowReceipt(true);
  };

  // ================================
  // RENDER METHODS
  // ================================

  const renderPaymentMethods = () => {
    const paymentMethods = [
      { id: 'CARD' as const, name: 'Carte bancaire', description: 'Visa, Mastercard, Amex', icon: 'credit-card' },
      { id: 'APPLE_PAY' as const, name: 'Apple Pay', description: 'Touch ID ou Face ID', icon: 'apple' },
      { id: 'GOOGLE_PAY' as const, name: 'Google Pay', description: 'Paiement rapide et sécurisé', icon: 'google' },
      { id: 'PAYPAL' as const, name: 'PayPal', description: 'Compte PayPal', icon: 'paypal' },
    ];

    return (
      <Card style={styles.paymentMethodsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Méthode de paiement
          </Text>
          
          {paymentMethods.map((method) => (
            <List.Item
              key={method.id}
              title={method.name}
              description={method.description}
              left={(props) => <List.Icon {...props} icon={method.icon} />}
              right={(props) => (
                <RadioButton
                  {...props}
                  value={method.id}
                  status={selectedPaymentMethod === method.id ? 'checked' : 'unchecked'}
                  onPress={() => setSelectedPaymentMethod(method.id)}
                />
              )}
              onPress={() => setSelectedPaymentMethod(method.id)}
              style={styles.paymentMethodItem}
            />
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderCardInput = () => {
    if (selectedPaymentMethod !== 'CARD') return null;

    return (
      <Card style={styles.cardInputCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Informations de carte
          </Text>
          
          <CardField
            postalCodeEnabled={false}
            placeholders={{
              number: '4242 4242 4242 4242',
              cvc: 'CVC',
            }}
            cardStyle={{
              backgroundColor: '#FFFFFF',
              textColor: '#000000',
              fontSize: 16,
              placeholderColor: '#999999',
            }}
            style={styles.cardField}
            onCardChange={(cardDetails) => {
              setCardComplete(cardDetails.complete);
            }}
          />
          
          <View style={styles.securityInfo}>
            <Icon name="shield-check" size={16} color={COLORS.success} />
            <Text variant="bodySmall" style={styles.securityText}>
              Paiement sécurisé par Stripe
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderTipSection = () => (
    <Card style={styles.tipCard}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Pourboire (optionnel)
        </Text>
        
        <TipSelector
          baseAmount={baseAmount}
          selectedTip={selectedTip}
          onTipSelect={handleTipSelect}
          style={styles.tipSelector}
        />
        
        <TextInput
          label="Montant personnalisé"
          value={customTip}
          onChangeText={handleCustomTipChange}
          keyboardType="numeric"
          mode="outlined"
          style={styles.customTipInput}
          right={<TextInput.Affix text="€" />}
        />
      </Card.Content>
    </Card>
  );

  // ================================
  // RENDER
  // ================================

  if (paymentSuccess) {
    return (
      <View style={styles.successContainer}>
        <Icon name="check-circle" size={80} color={COLORS.success} />
        <Text variant="headlineSmall" style={styles.successTitle}>
          Paiement réussi !
        </Text>
        <Text variant="bodyLarge" style={styles.successMessage}>
          Merci pour votre course avec LuxeRide
        </Text>
        
        <Button
          mode="outlined"
          onPress={handleShowReceipt}
          style={styles.receiptButton}
          icon="receipt"
        >
          Voir le reçu
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Résumé du trajet */}
        <Card style={styles.tripSummaryCard}>
          <Card.Content>
            <View style={styles.tripHeader}>
              <Icon name="check-circle" size={24} color={COLORS.success} />
              <Text variant="titleLarge" style={styles.tripTitle}>
                Course terminée
              </Text>
            </View>
            
            <View style={styles.tripInfo}>
              <Text variant="bodyMedium">
                Distance: {(tripData.distance / 1000).toFixed(1)} km
              </Text>
              <Text variant="bodyMedium">
                Durée: {Math.round(tripData.duration / 60)} minutes
              </Text>
            </View>
          </Card.Content>
        </Card>

        {renderPaymentMethods()}
        {renderCardInput()}
        {renderTipSection()}

        {/* Récapitulatif des prix */}
        <PaymentSummary
          tripData={tripData}
          tipAmount={tipAmount}
          totalAmount={totalAmount}
          style={styles.paymentSummary}
        />
      </ScrollView>

      {/* Bouton de paiement */}
      <Surface style={styles.bottomBar}>
        <Button
          mode="contained"
          onPress={handlePayment}
          loading={processing || isLoading}
          disabled={processing || isLoading || (selectedPaymentMethod === 'CARD' && !cardComplete)}
          style={styles.payButton}
          contentStyle={styles.payButtonContent}
        >
          Payer {totalAmount.toFixed(2)}€
        </Button>
      </Surface>

      {/* Modal reçu */}
      <Portal>
        <Modal
          visible={showReceipt}
          onDismiss={() => setShowReceipt(false)}
          contentContainerStyle={styles.receiptModal}
        >
          <ReceiptCard
            tripData={{
              ...tripData,
              finalAmount: totalAmount,
              tipAmount,
            }}
            onClose={() => setShowReceipt(false)}
            onShare={() => {
              // Implémentation du partage
              setShowReceipt(false);
            }}
          />
        </Modal>
      </Portal>

      {(processing || isLoading) && (
        <View style={styles.loadingOverlay}>
          <Text style={{ color: 'white' }}>Traitement du paiement...</Text>
        </View>
      )}
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
  tripSummaryCard: {
    margin: 16,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripTitle: {
    marginLeft: 12,
    fontWeight: '600',
  },
  tripInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentMethodsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  paymentMethodItem: {
    paddingVertical: 8,
  },
  cardInputCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 16,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  securityText: {
    marginLeft: 8,
    color: COLORS.success,
  },
  tipCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  tipSelector: {
    marginBottom: 16,
  },
  customTipInput: {
    marginTop: 8,
  },
  paymentSummary: {
    margin: 16,
    marginTop: 0,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  disclaimer: {
    textAlign: 'center',
    opacity: 0.6,
    fontStyle: 'italic',
  },
  bottomBar: {
    padding: 16,
    elevation: 8,
  },
  payButton: {
    height: 50,
  },
  payButtonContent: {
    height: 50,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'white',
  },
  successTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  successMessage: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 32,
  },
  receiptButton: {
    minWidth: 200,
  },
  receiptModal: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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