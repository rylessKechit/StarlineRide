// src/screens/auth/RegisterScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../../store';
import { register, clearError } from '../../store/slices/authSlice';
import { AuthStackParamList, RegisterForm } from '../../types';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

type RegisterScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Register'>;
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => (state as any).auth);

  const [form, setForm] = useState<RegisterForm>({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur d\'inscription', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterForm, string>> = {};

    if (!form.firstName.trim()) {
      newErrors.firstName = 'Prénom requis';
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = 'Nom requis';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'Téléphone requis';
    } else if (!/^(\+33|0)[1-9](\d{8})$/.test(form.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    if (!form.password.trim()) {
      newErrors.password = 'Mot de passe requis';
    } else if (form.password.length < 8) {
      newErrors.password = 'Au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = 'Doit contenir majuscule, minuscule et chiffre';
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!form.acceptTerms) {
      newErrors.acceptTerms = 'Vous devez accepter les conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(register({
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        password: form.password,
      })).unwrap();
    } catch (err) {
      // Error handled by useEffect
    }
  };

  const updateForm = (field: keyof RegisterForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Inscription</Text>
          <Text style={styles.subtitle}>
            Créez votre compte LuxeRide
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.nameContainer}>
            <Input
              label="Prénom"
              placeholder="John"
              value={form.firstName}
              onChangeText={(text) => updateForm('firstName', text)}
              error={errors.firstName}
              style={[styles.nameInput, { marginRight: 8 }]}
            />
            <Input
              label="Nom"
              placeholder="Doe"
              value={form.lastName}
              onChangeText={(text) => updateForm('lastName', text)}
              error={errors.lastName}
              style={[styles.nameInput, { marginLeft: 8 }]}
            />
          </View>

          <Input
            label="Email"
            placeholder="votre@email.com"
            value={form.email}
            onChangeText={(text) => updateForm('email', text)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Téléphone"
            placeholder="+33 6 12 34 56 78"
            value={form.phone}
            onChangeText={(text) => updateForm('phone', text)}
            error={errors.phone}
            keyboardType="phone-pad"
          />

          <Input
            label="Mot de passe"
            placeholder="Minimum 8 caractères"
            value={form.password}
            onChangeText={(text) => updateForm('password', text)}
            error={errors.password}
            secureTextEntry
          />

          <Input
            label="Confirmer le mot de passe"
            placeholder="Retapez votre mot de passe"
            value={form.confirmPassword}
            onChangeText={(text) => updateForm('confirmPassword', text)}
            error={errors.confirmPassword}
            secureTextEntry
          />

          {/* Terms */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => updateForm('acceptTerms', !form.acceptTerms)}>
            <View style={[
              styles.checkbox,
              form.acceptTerms && styles.checkboxChecked
            ]}>
              {form.acceptTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              J'accepte les <Text style={styles.termsLink}>conditions d'utilisation</Text> et la{' '}
              <Text style={styles.termsLink}>politique de confidentialité</Text>
            </Text>
          </TouchableOpacity>
          {errors.acceptTerms && (
            <Text style={styles.errorText}>{errors.acceptTerms}</Text>
          )}

          <Button
            title="Créer mon compte"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            size="large"
            style={styles.registerButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerText}>
              Déjà un compte ? <Text style={styles.footerLink}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 18,
    color: '#007AFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
  },
  form: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  nameInput: {
    flex: 1,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  termsLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 16,
    marginLeft: 32,
  },
  registerButton: {
    marginTop: 24,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#6C757D',
  },
  footerLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default RegisterScreen;