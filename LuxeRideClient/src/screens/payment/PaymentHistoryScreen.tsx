// src/screens/payment/PaymentHistoryScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Surface,
  Text,
  Card,
  Button,
  Chip,
  Searchbar,
  List,
  Divider,
  IconButton,
  Menu,
  Portal,
  Modal,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Redux
import { useAppDispatch, useAppSelector } from '../../store';

// Utils
import { useTheme } from '../../theme';
import { showMessage } from 'react-native-flash-message';

interface PaymentTransaction {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: 'CARD' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'PAYPAL' | 'CORPORATE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionDate: string;
  description: string;
  pickupAddress: string;
  dropoffAddress: string;
  tips?: number;
  fees?: number;
  taxes?: number;
  refundAmount?: number;
  refundDate?: string;
  receiptUrl?: string;
}

interface PaymentStats {
  totalSpent: number;
  totalTrips: number;
  averageTrip: number;
  totalTips: number;
  monthlySpending: Array<{
    month: string;
    amount: number;
  }>;
}

const PAYMENT_STATUS = {
  PENDING: { name: 'En attente', color: '#FF9800', icon: 'clock-outline' },
  COMPLETED: { name: 'Terminé', color: '#4CAF50', icon: 'check-circle' },
  FAILED: { name: 'Échoué', color: '#F44336', icon: 'close-circle' },
  REFUNDED: { name: 'Remboursé', color: '#9C27B0', icon: 'undo' },
} as const;

const PAYMENT_METHODS = {
  CARD: { name: 'Carte bancaire', icon: 'credit-card' },
  APPLE_PAY: { name: 'Apple Pay', icon: 'apple' },
  GOOGLE_PAY: { name: 'Google Pay', icon: 'google' },
  PAYPAL: { name: 'PayPal', icon: 'paypal' },
  CORPORATE: { name: 'Compte entreprise', icon: 'office-building' },
} as const;

export const PaymentHistoryScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  // Redux state (simulé pour l'exemple)
  const { user } = useAppSelector((state) => (state as any).auth);

  // Local state
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'quarter' | 'year'>('all');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // ================================
  // EFFECTS
  // ================================

  useFocusEffect(
    useCallback(() => {
      loadPaymentHistory();
      loadPaymentStats();
    }, [])
  );

  // ================================
  // DATA LOADING
  // ================================

  const loadPaymentHistory = async () => {
    setIsLoading(true);
    try {
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Données simulées
      const mockTransactions: PaymentTransaction[] = [
        {
          id: 'txn_001',
          bookingId: 'booking_001',
          amount: 45.50,
          currency: 'EUR',
          paymentMethod: 'CARD',
          status: 'COMPLETED',
          transactionDate: '2024-01-15T14:30:00Z',
          description: 'Course Berline Exécutive',
          pickupAddress: '1 Rue de Rivoli, Paris',
          dropoffAddress: 'Tour Eiffel, Paris',
          tips: 5.00,
          fees: 2.50,
          taxes: 4.50,
          receiptUrl: 'https://example.com/receipt/txn_001',
        },
        {
          id: 'txn_002',
          bookingId: 'booking_002',
          amount: 65.00,
          currency: 'EUR',
          paymentMethod: 'APPLE_PAY',
          status: 'COMPLETED',
          transactionDate: '2024-01-12T09:15:00Z',
          description: 'Course SUV Luxe',
          pickupAddress: 'Gare du Nord, Paris',
          dropoffAddress: 'Aéroport Charles de Gaulle',
          tips: 8.00,
          fees: 3.50,
          taxes: 6.50,
          receiptUrl: 'https://example.com/receipt/txn_002',
        },
        {
          id: 'txn_003',
          bookingId: 'booking_003',
          amount: 35.00,
          currency: 'EUR',
          paymentMethod: 'CARD',
          status: 'REFUNDED',
          transactionDate: '2024-01-10T16:45:00Z',
          description: 'Course Berline Exécutive (Annulée)',
          pickupAddress: 'Châtelet, Paris',
          dropoffAddress: 'République, Paris',
          refundAmount: 35.00,
          refundDate: '2024-01-11T10:00:00Z',
          receiptUrl: 'https://example.com/receipt/txn_003',
        },
        {
          id: 'txn_004',
          bookingId: 'booking_004',
          amount: 120.00,
          currency: 'EUR',
          paymentMethod: 'CORPORATE',
          status: 'COMPLETED',
          transactionDate: '2024-01-08T18:20:00Z',
          description: 'Course Van Premium',
          pickupAddress: 'La Défense, Paris',
          dropoffAddress: 'Orly Airport',
          tips: 15.00,
          fees: 6.00,
          taxes: 12.00,
          receiptUrl: 'https://example.com/receipt/txn_004',
        },
      ];
      
      setTransactions(mockTransactions);
    } catch (error) {
      showMessage({
        message: 'Erreur lors du chargement de l\'historique',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaymentStats = async () => {
    try {
      // Simulation du calcul des statistiques
      const mockStats: PaymentStats = {
        totalSpent: 265.50,
        totalTrips: 4,
        averageTrip: 66.38,
        totalTips: 28.00,
        monthlySpending: [
          { month: 'Janvier', amount: 265.50 },
          { month: 'Décembre', amount: 180.30 },
          { month: 'Novembre', amount: 240.80 },
        ],
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading payment stats:', error);
    }
  };

  // ================================
  // HANDLERS
  // ================================

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadPaymentHistory(),
        loadPaymentStats(),
      ]);
    } catch (error) {
      showMessage({
        message: 'Erreur lors du rafraîchissement',
        type: 'danger',
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleTransactionPress = (transaction: PaymentTransaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleDownloadReceipt = (transaction: PaymentTransaction) => {
    if (transaction.receiptUrl) {
      // Ici, vous pourriez ouvrir le reçu ou le télécharger
      showMessage({
        message: 'Téléchargement du reçu...',
        type: 'info',
      });
    }
  };

  const handleRequestRefund = (transaction: PaymentTransaction) => {
    Alert.alert(
      'Demander un remboursement',
      'Souhaitez-vous demander un remboursement pour cette transaction ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Demander',
          onPress: () => {
            // Logique de demande de remboursement
            showMessage({
              message: 'Demande de remboursement envoyée',
              type: 'success',
            });
          },
        },
      ]
    );
  };

  // ================================
  // FILTERING
  // ================================

  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      transaction.description.toLowerCase().includes(query) ||
      transaction.pickupAddress.toLowerCase().includes(query) ||
      transaction.dropoffAddress.toLowerCase().includes(query) ||
      transaction.id.toLowerCase().includes(query)
    );
  });

  // ================================
  // RENDER FUNCTIONS
  // ================================

  const renderStatsCard = () => {
    if (!stats) return null;

    return (
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.statsTitle}>
            Statistiques
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={styles.statLabel}>
                Total dépensé
              </Text>
              <Text variant="titleLarge" style={[styles.statValue, { color: theme.colors.primary }]}>
                {stats.totalSpent.toFixed(2)}€
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={styles.statLabel}>
                Courses total
              </Text>
              <Text variant="titleLarge" style={styles.statValue}>
                {stats.totalTrips}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={styles.statLabel}>
                Moyenne par course
              </Text>
              <Text variant="titleLarge" style={styles.statValue}>
                {stats.averageTrip.toFixed(2)}€
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={styles.statLabel}>
                Pourboires total
              </Text>
              <Text variant="titleLarge" style={styles.statValue}>
                {stats.totalTips.toFixed(2)}€
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderTransactionCard = (transaction: PaymentTransaction) => {
    const status = PAYMENT_STATUS[transaction.status];
    const method = PAYMENT_METHODS[transaction.paymentMethod];
    
    return (
      <Card
        key={transaction.id}
        style={styles.transactionCard}
        onPress={() => handleTransactionPress(transaction)}
      >
        <Card.Content>
          <View style={styles.transactionHeader}>
            <View style={styles.transactionInfo}>
              <Text variant="titleMedium" style={styles.transactionDescription}>
                {transaction.description}
              </Text>
              <Text variant="bodySmall" style={styles.transactionDate}>
                {format(new Date(transaction.transactionDate), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </Text>
            </View>
            
            <View style={styles.transactionAmount}>
              <Text variant="titleMedium" style={[
                styles.amount,
                { color: transaction.status === 'REFUNDED' ? theme.colors.error : theme.colors.primary }
              ]}>
                {transaction.status === 'REFUNDED' ? '-' : ''}{transaction.amount.toFixed(2)}€
              </Text>
              <Chip
                mode="flat"
                compact
                style={[styles.statusChip, { backgroundColor: status.color + '20' }]}
                textStyle={{ color: status.color }}
                icon={status.icon}
              >
                {status.name}
              </Chip>
            </View>
          </View>
          
          <View style={styles.transactionDetails}>
            <View style={styles.addressInfo}>
              <Icon name="map-marker" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={styles.address} numberOfLines={1}>
                {transaction.pickupAddress}
              </Text>
            </View>
            <View style={styles.addressInfo}>
              <Icon name="flag-checkered" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={styles.address} numberOfLines={1}>
                {transaction.dropoffAddress}
              </Text>
            </View>
          </View>
          
          <View style={styles.transactionFooter}>
            <View style={styles.paymentMethodInfo}>
              <Icon name={method.icon} size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={styles.paymentMethodText}>
                {method.name}
              </Text>
            </View>
            
            {transaction.tips && transaction.tips > 0 && (
              <Text variant="bodySmall" style={styles.tips}>
                Pourboire: {transaction.tips.toFixed(2)}€
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderTransactionModal = () => {
    if (!selectedTransaction) return null;

    const status = PAYMENT_STATUS[selectedTransaction.status];
    const method = PAYMENT_METHODS[selectedTransaction.paymentMethod];

    return (
      <Portal>
        <Modal
          visible={showTransactionModal}
          onDismiss={() => setShowTransactionModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Card>
            <Card.Content>
              <View style={styles.modalHeader}>
                <Text variant="titleLarge">Détails de la transaction</Text>
                <IconButton
                  icon="close"
                  onPress={() => setShowTransactionModal(false)}
                />
              </View>
              
              <View style={styles.transactionDetailSection}>
                <Text variant="titleMedium">Information générale</Text>
                <List.Item
                  title="ID Transaction"
                  description={selectedTransaction.id}
                  left={(props) => <List.Icon {...props} icon="identifier" />}
                />
                <List.Item
                  title="Montant"
                  description={`${selectedTransaction.amount.toFixed(2)}€`}
                  left={(props) => <List.Icon {...props} icon="currency-eur" />}
                />
                <List.Item
                  title="Statut"
                  description={status.name}
                  left={(props) => <List.Icon {...props} icon={status.icon} />}
                />
                <List.Item
                  title="Mode de paiement"
                  description={method.name}
                  left={(props) => <List.Icon {...props} icon={method.icon} />}
                />
                <List.Item
                  title="Date"
                  description={format(new Date(selectedTransaction.transactionDate), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  left={(props) => <List.Icon {...props} icon="calendar" />}
                />
              </View>

              {selectedTransaction.tips && (
                <View style={styles.transactionDetailSection}>
                  <Text variant="titleMedium">Détail des frais</Text>
                  <List.Item
                    title="Pourboire"
                    description={`${selectedTransaction.tips.toFixed(2)}€`}
                    left={(props) => <List.Icon {...props} icon="hand-heart" />}
                  />
                  {selectedTransaction.fees && (
                    <List.Item
                      title="Frais de service"
                      description={`${selectedTransaction.fees.toFixed(2)}€`}
                      left={(props) => <List.Icon {...props} icon="cash" />}
                    />
                  )}
                  {selectedTransaction.taxes && (
                    <List.Item
                      title="Taxes"
                      description={`${selectedTransaction.taxes.toFixed(2)}€`}
                      left={(props) => <List.Icon {...props} icon="receipt" />}
                    />
                  )}
                </View>
              )}

              {selectedTransaction.status === 'REFUNDED' && selectedTransaction.refundDate && (
                <View style={styles.transactionDetailSection}>
                  <Text variant="titleMedium">Remboursement</Text>
                  <List.Item
                    title="Montant remboursé"
                    description={`${selectedTransaction.refundAmount?.toFixed(2)}€`}
                    left={(props) => <List.Icon {...props} icon="undo" />}
                  />
                  <List.Item
                    title="Date de remboursement"
                    description={format(new Date(selectedTransaction.refundDate), 'dd MMMM yyyy', { locale: fr })}
                    left={(props) => <List.Icon {...props} icon="calendar-check" />}
                  />
                </View>
              )}

              <View style={styles.modalActions}>
                {selectedTransaction.receiptUrl && (
                  <Button
                    mode="outlined"
                    onPress={() => handleDownloadReceipt(selectedTransaction)}
                    style={styles.modalButton}
                    icon="download"
                  >
                    Télécharger le reçu
                  </Button>
                )}
                
                {selectedTransaction.status === 'COMPLETED' && (
                  <Button
                    mode="outlined"
                    onPress={() => handleRequestRefund(selectedTransaction)}
                    style={styles.modalButton}
                    icon="undo"
                  >
                    Demander un remboursement
                  </Button>
                )}
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    );
  };

  // ================================
  // RENDER
  // ================================

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="bodyLarge">Chargement de l'historique...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
      >
        {/* Statistiques */}
        {renderStatsCard()}

        {/* Filtres et recherche */}
        <Surface style={styles.filtersContainer}>
          <Searchbar
            placeholder="Rechercher une transaction..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          
          <View style={styles.filterRow}>
            <Menu
              visible={showPeriodMenu}
              onDismiss={() => setShowPeriodMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowPeriodMenu(true)}
                  icon="chevron-down"
                  style={styles.filterButton}
                >
                  {selectedPeriod === 'all' ? 'Toutes les périodes' :
                   selectedPeriod === 'month' ? 'Ce mois' :
                   selectedPeriod === 'quarter' ? 'Ce trimestre' : 'Cette année'}
                </Button>
              }
            >
              <Menu.Item onPress={() => { setSelectedPeriod('all'); setShowPeriodMenu(false); }} title="Toutes les périodes" />
              <Menu.Item onPress={() => { setSelectedPeriod('month'); setShowPeriodMenu(false); }} title="Ce mois" />
              <Menu.Item onPress={() => { setSelectedPeriod('quarter'); setShowPeriodMenu(false); }} title="Ce trimestre" />
              <Menu.Item onPress={() => { setSelectedPeriod('year'); setShowPeriodMenu(false); }} title="Cette année" />
            </Menu>
          </View>
        </Surface>

        {/* Liste des transactions */}
        <View style={styles.transactionsContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Historique des paiements ({filteredTransactions.length})
          </Text>
          
          {filteredTransactions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Icon name="credit-card-off" size={48} color={theme.colors.onSurfaceVariant} />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  Aucune transaction trouvée
                </Text>
                <Text variant="bodyMedium" style={styles.emptyDescription}>
                  {searchQuery ? 'Aucun résultat pour votre recherche' : 'Vous n\'avez pas encore effectué de paiement'}
                </Text>
              </Card.Content>
            </Card>
          ) : (
            filteredTransactions.map(renderTransactionCard)
          )}
        </View>
      </ScrollView>

      {/* Modal de détails */}
      {renderTransactionModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  statsCard: {
    margin: 16,
    elevation: 2,
  },
  statsTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: 12,
  },
  statLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '600',
  },
  filtersContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  searchbar: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
  },
  transactionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  transactionCard: {
    marginBottom: 12,
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionDescription: {
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    opacity: 0.7,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: '600',
    marginBottom: 4,
  },
  statusChip: {
    height: 24,
  },
  transactionDetails: {
    marginBottom: 12,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  address: {
    marginLeft: 8,
    flex: 1,
    opacity: 0.7,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    marginLeft: 6,
    opacity: 0.7,
  },
  tips: {
    opacity: 0.7,
    fontSize: 12,
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    opacity: 0.7,
  },
  modalContent: {
    margin: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionDetailSection: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
  },
});