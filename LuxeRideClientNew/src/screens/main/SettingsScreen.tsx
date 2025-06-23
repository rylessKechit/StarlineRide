// src/screens/main/SettingsScreen.tsx
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
  Switch,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout, updateProfile, changePassword } from '../../store/slices/authSlice';
import { MainStackParamList } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

type SettingsScreenProps = {
  navigation: StackNavigationProp<MainStackParamList, 'Settings'>;
};

interface SettingsForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  language: string;
  currency: string;
  notifications: boolean;
  locationTracking: boolean;
  marketingEmails: boolean;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector(state => state.auth);

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'about'>('profile');
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileForm, setProfileForm] = useState<SettingsForm>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    language: user?.language || 'fr',
    currency: user?.currency || 'EUR',
    notifications: true,
    locationTracking: true,
    marketingEmails: false,
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SettingsForm | keyof PasswordForm, string>>>({});

  const tabs = [
    { key: 'profile' as const, label: 'Profil', icon: '👤' },
    { key: 'preferences' as const, label: 'Préférences', icon: '⚙️' },
    { key: 'security' as const, label: 'Sécurité', icon: '🔒' },
    { key: 'about' as const, label: 'À propos', icon: 'ℹ️' },
  ];

  const languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
  ];

  const currencies = [
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'USD', name: 'Dollar ($)' },
    { code: 'GBP', name: 'Livre (£)' },
    { code: 'CHF', name: 'Franc suisse (CHF)' },
  ];

  const updateProfileForm = (field: keyof SettingsForm, value: string | boolean) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const updatePasswordForm = (field: keyof PasswordForm, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateProfileForm = (): boolean => {
    const newErrors: Partial<Record<keyof SettingsForm, string>> = {};

    if (!profileForm.firstName.trim()) {
      newErrors.firstName = 'Prénom requis';
    }

    if (!profileForm.lastName.trim()) {
      newErrors.lastName = 'Nom requis';
    }

    if (!profileForm.email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!profileForm.phone.trim()) {
      newErrors.phone = 'Téléphone requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Partial<Record<keyof PasswordForm, string>> = {};

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Mot de passe actuel requis';
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'Nouveau mot de passe requis';
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = 'Minimum 8 caractères';
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileForm()) return;

    try {
      setSaving(true);
      await dispatch(updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
        email: profileForm.email,
        language: profileForm.language,
        currency: profileForm.currency,
      })).unwrap();

      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error: any) {
      Alert.alert('Erreur', error || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    try {
      setChangingPassword(true);
      await dispatch(changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })).unwrap();

      Alert.alert('Succès', 'Mot de passe modifié avec succès');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      Alert.alert('Erreur', error || 'Erreur lors du changement de mot de passe');
    } finally {
      setChangingPassword(false);
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
          onPress: () => dispatch(logout()),
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront supprimées définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Information', 'Fonctionnalité à venir. Contactez le support pour supprimer votre compte.');
          },
        },
      ]
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <View>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Informations personnelles</Text>
              
              <View style={styles.nameContainer}>
                <Input
                  label="Prénom"
                  value={profileForm.firstName}
                  onChangeText={(text) => updateProfileForm('firstName', text)}
                  error={errors.firstName}
                  style={styles.halfInput}
                />
                <Input
                  label="Nom"
                  value={profileForm.lastName}
                  onChangeText={(text) => updateProfileForm('lastName', text)}
                  error={errors.lastName}
                  style={styles.halfInput}
                />
              </View>

              <Input
                label="Email"
                value={profileForm.email}
                onChangeText={(text) => updateProfileForm('email', text)}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label="Téléphone"
                value={profileForm.phone}
                onChangeText={(text) => updateProfileForm('phone', text)}
                error={errors.phone}
                keyboardType="phone-pad"
              />

              <Button
                title={saving ? 'Sauvegarde...' : 'Sauvegarder'}
                onPress={handleSaveProfile}
                loading={saving}
                disabled={saving}
                style={styles.saveButton}
              />
            </Card>
          </View>
        );

      case 'preferences':
        return (
          <View>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Langue et région</Text>
              
              <Text style={styles.inputLabel}>Langue</Text>
              <View style={styles.optionsList}>
                {languages.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.optionItem,
                      profileForm.language === lang.code && styles.optionItemSelected,
                    ]}
                    onPress={() => updateProfileForm('language', lang.code)}>
                    <Text style={[
                      styles.optionText,
                      profileForm.language === lang.code && styles.optionTextSelected,
                    ]}>
                      {lang.name}
                    </Text>
                    {profileForm.language === lang.code && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Devise</Text>
              <View style={styles.optionsList}>
                {currencies.map((currency) => (
                  <TouchableOpacity
                    key={currency.code}
                    style={[
                      styles.optionItem,
                      profileForm.currency === currency.code && styles.optionItemSelected,
                    ]}
                    onPress={() => updateProfileForm('currency', currency.code)}>
                    <Text style={[
                      styles.optionText,
                      profileForm.currency === currency.code && styles.optionTextSelected,
                    ]}>
                      {currency.name}
                    </Text>
                    {profileForm.currency === currency.code && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Notifications</Text>
              
              <View style={styles.switchContainer}>
                <View style={styles.switchLabel}>
                  <Text style={styles.switchTitle}>Notifications push</Text>
                  <Text style={styles.switchDescription}>
                    Recevoir des notifications sur votre téléphone
                  </Text>
                </View>
                <Switch
                  value={profileForm.notifications}
                  onValueChange={(value) => updateProfileForm('notifications', value)}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.switchContainer}>
                <View style={styles.switchLabel}>
                  <Text style={styles.switchTitle}>Suivi de localisation</Text>
                  <Text style={styles.switchDescription}>
                    Améliorer la précision des services de géolocalisation
                  </Text>
                </View>
                <Switch
                  value={profileForm.locationTracking}
                  onValueChange={(value) => updateProfileForm('locationTracking', value)}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.switchContainer}>
                <View style={styles.switchLabel}>
                  <Text style={styles.switchTitle}>Emails marketing</Text>
                  <Text style={styles.switchDescription}>
                    Recevoir des offres et actualités par email
                  </Text>
                </View>
                <Switch
                  value={profileForm.marketingEmails}
                  onValueChange={(value) => updateProfileForm('marketingEmails', value)}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </Card>
          </View>
        );

      case 'security':
        return (
          <View>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Changer le mot de passe</Text>
              
              <Input
                label="Mot de passe actuel"
                value={passwordForm.currentPassword}
                onChangeText={(text) => updatePasswordForm('currentPassword', text)}
                error={errors.currentPassword}
                secureTextEntry
              />

              <Input
                label="Nouveau mot de passe"
                value={passwordForm.newPassword}
                onChangeText={(text) => updatePasswordForm('newPassword', text)}
                error={errors.newPassword}
                secureTextEntry
              />

              <Input
                label="Confirmer le nouveau mot de passe"
                value={passwordForm.confirmPassword}
                onChangeText={(text) => updatePasswordForm('confirmPassword', text)}
                error={errors.confirmPassword}
                secureTextEntry
              />

              <Button
                title={changingPassword ? 'Modification...' : 'Changer le mot de passe'}
                onPress={handleChangePassword}
                loading={changingPassword}
                disabled={changingPassword}
                style={styles.saveButton}
              />
            </Card>

            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Sécurité du compte</Text>
              
              <View style={styles.securityInfo}>
                <Text style={styles.securityText}>
                  ✅ Votre compte est sécurisé avec un mot de passe fort
                </Text>
                <Text style={styles.securityText}>
                  📱 Authentification à deux facteurs disponible prochainement
                </Text>
                <Text style={styles.securityText}>
                  🔒 Toutes vos données sont chiffrées
                </Text>
              </View>
            </Card>
          </View>
        );

      case 'about':
        return (
          <View>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>LuxeRide</Text>
              <View style={styles.aboutInfo}>
                <Text style={styles.aboutText}>Version 1.0.0</Text>
                <Text style={styles.aboutText}>© 2025 LuxeRide</Text>
                <Text style={styles.aboutDescription}>
                  Service de transport premium avec chauffeur privé.
                  Confort, élégance et ponctualité garantis.
                </Text>
              </View>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Support & Aide</Text>
              <TouchableOpacity style={styles.linkItem}>
                <Text style={styles.linkText}>📞 Contacter le support</Text>
                <Text style={styles.linkArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkItem}>
                <Text style={styles.linkText}>❓ FAQ</Text>
                <Text style={styles.linkArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkItem}>
                <Text style={styles.linkText}>📋 Conditions d'utilisation</Text>
                <Text style={styles.linkArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkItem}>
                <Text style={styles.linkText}>🔒 Politique de confidentialité</Text>
                <Text style={styles.linkArrow}>›</Text>
              </TouchableOpacity>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Actions du compte</Text>
              
              <Button
                title="Déconnexion"
                onPress={handleLogout}
                variant="outline"
                style={styles.actionButton}
              />
              
              <Button
                title="Supprimer le compte"
                onPress={handleDeleteAccount}
                variant="outline"
                style={{ ...styles.actionButton, ...styles.deleteButton }}
              />
            </Card>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.key)}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[
                styles.tabLabel,
                activeTab === tab.key && styles.tabLabelActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tabScrollContainer: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    alignItems: 'center',
    borderRadius: 20,
    minWidth: 80,
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  saveButton: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
    marginTop: 8,
  },
  optionsList: {
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  optionItemSelected: {
    backgroundColor: '#F0F8FF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  optionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  switchDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 2,
  },
  securityInfo: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  securityText: {
    fontSize: 14,
    color: '#3C4043',
    marginBottom: 8,
    lineHeight: 20,
  },
  aboutInfo: {
    alignItems: 'center',
    padding: 16,
  },
  aboutText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 4,
    fontWeight: '600',
  },
  aboutDescription: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  linkText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  linkArrow: {
    fontSize: 18,
    color: '#C7C7CC',
  },
  actionButton: {
    marginTop: 12,
  },
  deleteButton: {
    borderColor: '#FF3B30',
  },
});

export default SettingsScreen;