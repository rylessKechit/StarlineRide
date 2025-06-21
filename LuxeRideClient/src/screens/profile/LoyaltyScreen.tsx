// src/screens/profile/LoyaltyScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Surface,
  Text,
  Card,
  Button,
  Chip,
  ProgressBar,
  List,
  Divider,
  IconButton,
  Portal,
  Modal,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LinearGradient } from 'react-native-linear-gradient';

// Redux
import { useAppDispatch, useAppSelector } from '../../store';

// Utils
import { useTheme } from '../../theme';
import { showMessage } from 'react-native-flash-message';

const { width } = Dimensions.get('window');

interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  maxPoints?: number;
  color: string;
  gradientColors: string[];
  benefits: string[];
  icon: string;
}

interface LoyaltyTransaction {
  id: string;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'BONUS';
  points: number;
  description: string;
  date: string;
  bookingId?: string;
  expiryDate?: string;
}

interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  type: 'DISCOUNT' | 'FREE_RIDE' | 'UPGRADE' | 'GIFT';
  discountPercentage?: number;
  validUntil?: string;
  icon: string;
  available: boolean;
}

interface UserLoyalty {
  currentPoints: number;
  totalEarnedPoints: number;
  currentTier: string;
  nextTier?: string;
  pointsToNextTier?: number;
  memberSince: string;
  expiringPoints: number;
  expiringDate?: string;
}

const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    color: '#CD7F32',
    gradientColors: ['#CD7F32', '#B8860B'],
    benefits: [
      'Points de fidélité sur chaque course',
      'Support client prioritaire',
      'Historique détaillé des courses',
    ],
    icon: 'medal-outline',
  },
  {
    id: 'silver',
    name: 'Argent',
    minPoints: 1000,
    maxPoints: 2999,
    color: '#C0C0C0',
    gradientColors: ['#C0C0C0', '#A9A9A9'],
    benefits: [
      'Tous les avantages Bronze',
      '5% de réduction sur toutes les courses',
      'Réservation jusqu\'à 7 jours à l\'avance',
      'Annulation gratuite jusqu\'à 2h avant',
    ],
    icon: 'medal',
  },
  {
    id: 'gold',
    name: 'Or',
    minPoints: 3000,
    maxPoints: 7999,
    color: '#FFD700',
    gradientColors: ['#FFD700', '#FFA500'],
    benefits: [
      'Tous les avantages Argent',
      '10% de réduction sur toutes les courses',
      'Surclassement gratuit (selon disponibilité)',
      'Support client dédié 24/7',
      'Points bonus sur les courses de nuit',
    ],
    icon: 'medal',
  },
  {
    id: 'platinum',
    name: 'Platine',
    minPoints: 8000,
    color: '#E5E4E2',
    gradientColors: ['#E5E4E2', '#B8B8B8'],
    benefits: [
      'Tous les avantages Or',
      '15% de réduction sur toutes les courses',
      'Voitures premium garanties',
      'Chauffeurs 5 étoiles uniquement',
      'Concierge personnel',
      'Courses gratuites anniversaire',
    ],
    icon: 'crown',
  },
];

export const LoyaltyScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  // Redux state (simulé pour l'exemple)
  const { user } = useAppSelector((state) => (state as any).auth);

  // Local state
  const [userLoyalty, setUserLoyalty] = useState<UserLoyalty | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);

  // ================================
  // EFFECTS
  // ================================

  useFocusEffect(
    useCallback(() => {
      loadLoyaltyData();
    }, [])
  );

  // ================================
  // DATA LOADING
  // ================================

  const loadLoyaltyData = async () => {
    setIsLoading(true);
    try {
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Données utilisateur simulées
      const mockUserLoyalty: UserLoyalty = {
        currentPoints: 1250,
        totalEarnedPoints: 2800,
        currentTier: 'silver',
        nextTier: 'gold',
        pointsToNextTier: 1750,
        memberSince: '2023-06-15T00:00:00Z',
        expiringPoints: 150,
        expiringDate: '2024-03-15T00:00:00Z',
      };

      // Transactions simulées
      const mockTransactions: LoyaltyTransaction[] = [
        {
          id: 'lt_001',
          type: 'EARNED',
          points: 45,
          description: 'Course Berline Exécutive - Aéroport',
          date: '2024-01-15T14:30:00Z',
          bookingId: 'booking_001',
        },
        {
          id: 'lt_002',
          type: 'BONUS',
          points: 100,
          description: 'Bonus nouveau membre Argent',
          date: '2024-01-10T00:00:00Z',
        },
        {
          id: 'lt_003',
          type: 'REDEEMED',
          points: -200,
          description: 'Réduction 5% utilisée',
          date: '2024-01-08T18:20:00Z',
          bookingId: 'booking_003',
        },
        {
          id: 'lt_004',
          type: 'EARNED',
          points: 65,
          description: 'Course SUV Luxe - Centre ville',
          date: '2024-01-05T09:15:00Z',
          bookingId: 'booking_004',
        },
        {
          id: 'lt_005',
          type: 'EXPIRED',
          points: -50,
          description: 'Points expirés',
          date: '2024-01-01T00:00:00Z',
        },
      ];

      // Récompenses simulées
      const mockRewards: LoyaltyReward[] = [
        {
          id: 'reward_001',
          title: 'Réduction 5%',
          description: 'Obtenez 5% de réduction sur votre prochaine course',
          pointsCost: 200,
          type: 'DISCOUNT',
          discountPercentage: 5,
          validUntil: '2024-03-31T23:59:59Z',
          icon: 'percent',
          available: true,
        },
        {
          id: 'reward_002',
          title: 'Course gratuite',
          description: 'Une course gratuite jusqu\'à 25€ de valeur',
          pointsCost: 500,
          type: 'FREE_RIDE',
          validUntil: '2024-04-30T23:59:59Z',
          icon: 'car-key',
          available: true,
        },
        {
          id: 'reward_003',
          title: 'Surclassement Premium',
          description: 'Surclassement gratuit vers un véhicule Premium',
          pointsCost: 300,
          type: 'UPGRADE',
          validUntil: '2024-03-31T23:59:59Z',
          icon: 'star-circle',
          available: true,
        },
        {
          id: 'reward_004',
          title: 'Réduction 10%',
          description: 'Obtenez 10% de réduction sur votre prochaine course',
          pointsCost: 400,
          type: 'DISCOUNT',
          discountPercentage: 10,
          validUntil: '2024-03-31T23:59:59Z',
          icon: 'percent',
          available: false, // Pas assez de points
        },
        {
          id: 'reward_005',
          title: 'Coffret cadeau',
          description: 'Coffret cadeau partenaire d\'une valeur de 50€',
          pointsCost: 800,
          type: 'GIFT',
          validUntil: '2024-06-30T23:59:59Z',
          icon: 'gift',
          available: false,
        },
      ];

      setUserLoyalty(mockUserLoyalty);
      setTransactions(mockTransactions);
      setRewards(mockRewards);
    } catch (error) {
      showMessage({
        message: 'Erreur lors du chargement des données',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ================================
  // HANDLERS
  // ================================

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadLoyaltyData();
    } catch (error) {
      showMessage({
        message: 'Erreur lors du rafraîchissement',
        type: 'danger',
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleRewardPress = (reward: LoyaltyReward) => {
    setSelectedReward(reward);
    setShowRewardModal(true);
  };

  const handleRedeemReward = async (reward: LoyaltyReward) => {
    if (!userLoyalty || userLoyalty.currentPoints < reward.pointsCost) {
      showMessage({
        message: 'Points insuffisants',
        type: 'warning',
      });
      return;
    }

    try {
      // Simulation de l'échange
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mettre à jour les points
      setUserLoyalty(prev => prev ? {
        ...prev,
        currentPoints: prev.currentPoints - reward.pointsCost,
      } : null);

      // Ajouter la transaction
      const newTransaction: LoyaltyTransaction = {
        id: `lt_${Date.now()}`,
        type: 'REDEEMED',
        points: -reward.pointsCost,
        description: `Échange: ${reward.title}`,
        date: new Date().toISOString(),
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setShowRewardModal(false);

      showMessage({
        message: 'Récompense échangée avec succès !',
        type: 'success',
      });
    } catch (error) {
      showMessage({
        message: 'Erreur lors de l\'échange',
        type: 'danger',
      });
    }
  };

  // ================================
  // HELPER FUNCTIONS
  // ================================

  const getCurrentTier = (): LoyaltyTier => {
    if (!userLoyalty) return LOYALTY_TIERS[0];
    return LOYALTY_TIERS.find(tier => tier.id === userLoyalty.currentTier) || LOYALTY_TIERS[0];
  };

  const getNextTier = (): LoyaltyTier | null => {
    if (!userLoyalty?.nextTier) return null;
    return LOYALTY_TIERS.find(tier => tier.id === userLoyalty.nextTier) || null;
  };

  const getProgressToNextTier = (): number => {
    if (!userLoyalty?.pointsToNextTier) return 1;
    const currentTier = getCurrentTier();
    const nextTier = getNextTier();
    
    if (!nextTier) return 1;
    
    const totalNeeded = nextTier.minPoints - currentTier.minPoints;
    const earned = userLoyalty.currentPoints - currentTier.minPoints;
    
    return Math.min(earned / totalNeeded, 1);
  };

  // ================================
  // RENDER FUNCTIONS
  // ================================

  const renderTierCard = () => {
    if (!userLoyalty) return null;

    const currentTier = getCurrentTier();
    const nextTier = getNextTier();
    const progress = getProgressToNextTier();

    return (
      <Card style={styles.tierCard}>
        <LinearGradient
          colors={currentTier.gradientColors}
          style={styles.tierGradient}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
        >
          <View style={styles.tierContent}>
            <View style={styles.tierHeader}>
              <Icon name={currentTier.icon} size={32} color="white" />
              <View style={styles.tierInfo}>
                <Text variant="headlineSmall" style={styles.tierName}>
                  {currentTier.name}
                </Text>
                <Text variant="bodyMedium" style={styles.tierPoints}>
                  {userLoyalty.currentPoints} points
                </Text>
              </View>
            </View>

            {nextTier && (
              <View style={styles.progressSection}>
                <View style={styles.progressInfo}>
                  <Text variant="bodySmall" style={styles.progressText}>
                    {userLoyalty.pointsToNextTier} points pour atteindre {nextTier.name}
                  </Text>
                </View>
                <ProgressBar
                  progress={progress}
                  color="white"
                  style={styles.progressBar}
                />
              </View>
            )}

            <Text variant="bodySmall" style={styles.memberSince}>
              Membre depuis {format(new Date(userLoyalty.memberSince), 'MMMM yyyy', { locale: fr })}
            </Text>
          </View>
        </LinearGradient>
      </Card>
    );
  };

  const renderBenefitsCard = () => {
    const currentTier = getCurrentTier();

    return (
      <Card style={styles.benefitsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Vos avantages {currentTier.name}
          </Text>
          
          {currentTier.benefits.map((benefit, index) => (
            <List.Item
              key={index}
              title={benefit}
              left={(props) => <List.Icon {...props} icon="check-circle" color={theme.colors.primary} />}
              titleNumberOfLines={2}
            />
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderPointsAlert = () => {
    if (!userLoyalty?.expiringPoints || !userLoyalty.expiringDate) return null;

    return (
      <Card style={[styles.alertCard, { backgroundColor: theme.colors.errorContainer }]}>
        <Card.Content>
          <View style={styles.alertContent}>
            <Icon name="alert-circle" size={24} color={theme.colors.error} />
            <View style={styles.alertText}>
              <Text variant="titleSmall" style={{ color: theme.colors.error }}>
                Points expirant bientôt
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer }}>
                {userLoyalty.expiringPoints} points expirent le {format(new Date(userLoyalty.expiringDate), 'dd MMMM yyyy', { locale: fr })}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderRewardsSection = () => {
    const availableRewards = rewards.filter(r => r.available);
    const unavailableRewards = rewards.filter(r => !r.available);

    return (
      <View style={styles.rewardsSection}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Récompenses disponibles
        </Text>
        
        {availableRewards.map(renderRewardCard)}
        
        {unavailableRewards.length > 0 && (
          <>
            <Text variant="titleSmall" style={[styles.sectionTitle, { marginTop: 20, opacity: 0.7 }]}>
              Bientôt disponibles
            </Text>
            {unavailableRewards.map(renderRewardCard)}
          </>
        )}
      </View>
    );
  };

  const renderRewardCard = (reward: LoyaltyReward) => (
    <Card
      key={reward.id}
      style={[
        styles.rewardCard,
        !reward.available && styles.disabledRewardCard
      ]}
      onPress={() => handleRewardPress(reward)}
    >
      <Card.Content>
        <View style={styles.rewardHeader}>
          <View style={styles.rewardInfo}>
            <Icon 
              name={reward.icon} 
              size={24} 
              color={reward.available ? theme.colors.primary : theme.colors.outline} 
            />
            <View style={styles.rewardDetails}>
              <Text 
                variant="titleSmall" 
                style={[
                  styles.rewardTitle,
                  !reward.available && { color: theme.colors.outline }
                ]}
              >
                {reward.title}
              </Text>
              <Text 
                variant="bodySmall" 
                style={[
                  styles.rewardDescription,
                  !reward.available && { color: theme.colors.outline }
                ]}
              >
                {reward.description}
              </Text>
            </View>
          </View>
          
          <View style={styles.rewardCost}>
            <Text 
              variant="titleMedium" 
              style={[
                styles.costText,
                { color: reward.available ? theme.colors.primary : theme.colors.outline }
              ]}
            >
              {reward.pointsCost}
            </Text>
            <Text 
              variant="bodySmall" 
              style={[
                styles.pointsLabel,
                !reward.available && { color: theme.colors.outline }
              ]}
            >
              points
            </Text>
          </View>
        </View>
        
        {reward.validUntil && (
          <Text variant="bodySmall" style={styles.validUntil}>
            Valide jusqu'au {format(new Date(reward.validUntil), 'dd MMMM yyyy', { locale: fr })}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderTransactionsSection = () => (
    <View style={styles.transactionsSection}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Historique des points
      </Text>
      
      {transactions.slice(0, 5).map(renderTransactionItem)}
      
      {transactions.length > 5 && (
        <Button
          mode="text"
          onPress={() => {/* Navigation vers historique complet */}}
          style={styles.seeMoreButton}
        >
          Voir tout l'historique
        </Button>
      )}
    </View>
  );

  const renderTransactionItem = (transaction: LoyaltyTransaction) => {
    const getTransactionIcon = () => {
      switch (transaction.type) {
        case 'EARNED': return 'plus-circle';
        case 'REDEEMED': return 'minus-circle';
        case 'EXPIRED': return 'clock-alert';
        case 'BONUS': return 'gift';
        default: return 'circle';
      }
    };

    const getTransactionColor = () => {
      switch (transaction.type) {
        case 'EARNED':
        case 'BONUS':
          return theme.colors.primary;
        case 'REDEEMED':
        case 'EXPIRED':
          return theme.colors.error;
        default:
          return theme.colors.onSurface;
      }
    };

    return (
      <List.Item
        key={transaction.id}
        title={transaction.description}
        description={format(new Date(transaction.date), 'dd MMMM yyyy', { locale: fr })}
        left={(props) => (
          <List.Icon 
            {...props} 
            icon={getTransactionIcon()} 
            color={getTransactionColor()} 
          />
        )}
        right={() => (
          <Text 
            variant="titleSmall" 
            style={{ 
              color: getTransactionColor(),
              fontWeight: '600' 
            }}
          >
            {transaction.points > 0 ? '+' : ''}{transaction.points}
          </Text>
        )}
      />
    );
  };

  const renderRewardModal = () => {
    if (!selectedReward) return null;

    return (
      <Portal>
        <Modal
          visible={showRewardModal}
          onDismiss={() => setShowRewardModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Card>
            <Card.Content>
              <View style={styles.modalHeader}>
                <Text variant="titleLarge">{selectedReward.title}</Text>
                <IconButton
                  icon="close"
                  onPress={() => setShowRewardModal(false)}
                />
              </View>
              
              <View style={styles.modalBody}>
                <Icon 
                  name={selectedReward.icon} 
                  size={48} 
                  color={theme.colors.primary}
                  style={styles.modalIcon}
                />
                
                <Text variant="bodyLarge" style={styles.modalDescription}>
                  {selectedReward.description}
                </Text>
                
                <View style={styles.modalCost}>
                  <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                    {selectedReward.pointsCost} points
                  </Text>
                  {userLoyalty && (
                    <Text variant="bodyMedium" style={styles.remainingPoints}>
                      Il vous restera {userLoyalty.currentPoints - selectedReward.pointsCost} points
                    </Text>
                  )}
                </View>
                
                {selectedReward.validUntil && (
                  <Text variant="bodySmall" style={styles.modalValidUntil}>
                    Valide jusqu'au {format(new Date(selectedReward.validUntil), 'dd MMMM yyyy', { locale: fr })}
                  </Text>
                )}
              </View>
              
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowRewardModal(false)}
                  style={styles.modalButton}
                >
                  Annuler
                </Button>
                <Button
                  mode="contained"
                  onPress={() => handleRedeemReward(selectedReward)}
                  disabled={
                    !selectedReward.available ||
                    !!userLoyalty && userLoyalty.currentPoints < selectedReward.pointsCost
                  }
                  style={styles.modalButton}
                >
                  Échanger
                </Button>
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
        <Text variant="bodyLarge">Chargement du programme de fidélité...</Text>
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
        {/* Carte du niveau */}
        {renderTierCard()}

        {/* Alerte points expirants */}
        {renderPointsAlert()}

        {/* Avantages */}
        {renderBenefitsCard()}

        {/* Récompenses */}
        {renderRewardsSection()}

        {/* Historique des transactions */}
        {renderTransactionsSection()}
      </ScrollView>

      {/* Modal de récompense */}
      {renderRewardModal()}
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
  tierCard: {
    margin: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  tierGradient: {
    padding: 20,
  },
  tierContent: {
    flex: 1,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierInfo: {
    marginLeft: 16,
    flex: 1,
  },
  tierName: {
    color: 'white',
    fontWeight: '600',
    marginBottom: 4,
  },
  tierPoints: {
    color: 'white',
    opacity: 0.9,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressInfo: {
    marginBottom: 8,
  },
  progressText: {
    color: 'white',
    opacity: 0.9,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  memberSince: {
    color: 'white',
    opacity: 0.8,
  },
  alertCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 1,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    marginLeft: 12,
    flex: 1,
  },
  benefitsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 1,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  rewardsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  rewardCard: {
    marginBottom: 12,
    elevation: 1,
  },
  disabledRewardCard: {
    opacity: 0.6,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  rewardDetails: {
    marginLeft: 12,
    flex: 1,
  },
  rewardTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  rewardDescription: {
    opacity: 0.7,
  },
  rewardCost: {
    alignItems: 'center',
  },
  costText: {
    fontWeight: '600',
  },
  pointsLabel: {
    opacity: 0.7,
    fontSize: 12,
  },
  validUntil: {
    marginTop: 8,
    opacity: 0.7,
    fontSize: 12,
  },
  transactionsSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  seeMoreButton: {
    marginTop: 8,
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
  modalBody: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalDescription: {
    textAlign: 'center',
    marginBottom: 20,
  },
  modalCost: {
    alignItems: 'center',
    marginBottom: 16,
  },
  remainingPoints: {
    opacity: 0.7,
    marginTop: 4,
  },
  modalValidUntil: {
    opacity: 0.7,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
  },
});