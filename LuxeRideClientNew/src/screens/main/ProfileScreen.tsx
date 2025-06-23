// src/screens/main/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout, updateProfile } from '../../store/slices/authSlice';
import { MainStackParamList, MembershipTier } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

type ProfileScreenProps = {
  navigation: StackNavigationProp<MainStackParamList, 'Profile'>;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector(state => state.auth);
  const { bookings } = useAppSelector(state => state.bookings);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  const getMembershipColor = (tier: MembershipTier) => {
    switch (tier) {
      case 'GOLD': return '#FFD700';
      case 'PLATINUM': return '#E5E4E2';
      case 'VIP': return '#8B00FF';
      default: return '#007AFF';
    }
  };

  const getMembershipBenefits = (tier: MembershipTier) => {
    switch (tier) {
      case 'GOLD': return '5% de réduction';
      case 'PLATINUM': return '10% de réduction';
      case 'VIP': return '15% de réduction + service prioritaire';
      default: return 'Aucun avantage';
    }
  };

  const handleSave = async () => {
    try {
      await dispatch(updateProfile(form)).unwrap();
      setIsEditing(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error: any) {
      Alert.alert('Erreur', error || 'Erreur lors de la mise à jour');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: () => dispatch(logout())
        }
      ]
    );
  };

  const completedRides = bookings.filter(b => b.status === 'COMPLETED').length;
  const totalSpent = bookings.reduce((sum, b) => sum + (b.finalPrice || b.estimatedPrice), 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsButton}>
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>

          {/* Membership */}
          <View style={styles.membershipContainer}>
            <View style={[
              styles.membershipBadge,
              { backgroundColor: getMembershipColor(user?.membershipTier || 'STANDARD') }
            ]}>
              <Text style={styles.membershipText}>
                {user?.membershipTier || 'STANDARD'}
              </Text>
            </View>
            <View style={styles.membershipInfo}>
              <Text style={styles.membershipBenefits}>
                {getMembershipBenefits(user?.membershipTier || 'STANDARD')}
              </Text>
              <Text style={styles.loyaltyPoints}>
                {user?.loyaltyPoints || 0} points de fidélité
              </Text>
            </View>
          </View>
        </Card>

        {/* Stats */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Mes statistiques</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{completedRides}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalSpent.toFixed(0)}€</Text>
              <Text style={styles.statLabel}>Dépensé</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.loyaltyPoints || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </Card>

        {/* Personal Information */}
        <Card style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
            <TouchableOpacity 
              onPress={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}>
              <Text style={styles.editButton}>
                {isEditing ? 'Sauvegarder' : 'Modifier'}
              </Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={styles.formContainer}>
              <Input
                label="Prénom"
                value={form.firstName}
                onChangeText={(text) => setForm({...form, firstName: text})}
                placeholder="Votre prénom"
              />
              <Input
                label="Nom"
                value={form.lastName}
                onChangeText={(text) => setForm({...form, lastName: text})}
                placeholder="Votre nom"
              />
              <Input
                label="Téléphone"
                value={form.phone}
                onChangeText={(text) => setForm({...form, phone: text})}
                placeholder="Votre numéro"
                keyboardType="phone-pad"
              />
              <Input
                label="Email"
                value={form.email}
                onChangeText={(text) => setForm({...form, email: text})}
                placeholder="Votre email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Button
                title="Annuler"
                onPress={() => {
                  setIsEditing(false);
                  setForm({
                    firstName: user?.firstName || '',
                    lastName: user?.lastName || '',
                    phone: user?.phone || '',
                    email: user?.email || '',
                  });
                }}
                variant="outline"
                size="medium"
                style={styles.cancelButton}
              />
            </View>
          ) : (
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Prénom</Text>
                <Text style={styles.infoValue}>{user?.firstName}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Nom</Text>
                <Text style={styles.infoValue}>{user?.lastName}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>{user?.phone}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('MyRides')}>
            <Text style={styles.actionIcon}>🚗</Text>
            <Text style={styles.actionText}>Mes courses</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionText}>Paramètres</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('Help')}>
            <Text style={styles.actionIcon}>❓</Text>
            <Text style={styles.actionText}>Aide & Support</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <Button
            title="Se déconnecter"
            onPress={handleLogout}
            variant="outline"
            size="large"
            style={styles.logoutButton}
          />
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
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButtonText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6C757D',
  },
  membershipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membershipBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  membershipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  membershipInfo: {
    flex: 1,
  },
  membershipBenefits: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  loyaltyPoints: {
    fontSize: 12,
    color: '#6C757D',
  },
  statsCard: {
    marginBottom: 16,
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
  infoCard: {
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
  editButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  formContainer: {
    // No additional styles needed, Input component handles spacing
  },
  cancelButton: {
    marginTop: 16,
  },
  infoList: {
    // No additional styles needed
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  infoLabel: {
    fontSize: 16,
    color: '#6C757D',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  actionArrow: {
    fontSize: 20,
    color: '#C7C7CC',
  },
  logoutContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  logoutButton: {
    borderColor: '#FF3B30',
  },
});

export default ProfileScreen;