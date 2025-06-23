// src/screens/auth/LoginScreen.tsx
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
import { login, clearError } from '../../store/slices/authSlice';
import { AuthStackParamList, LoginForm } from '../../types';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

type LoginScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => (state as any).auth);

  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
    userType: 'user', // Toujours 'user' - plus de sélection
  });

  const [errors, setErrors] = useState<Partial<LoginForm>>({});

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur de connexion', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginForm> = {};

    if (!form.email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!form.password.trim()) {
      newErrors.password = 'Mot de passe requis';
    } else if (form.password.length < 6) {
      newErrors.password = 'Mot de passe trop court';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        userType: 'user', // Toujours client
      })).unwrap();
    } catch (err) {
      // Error handled by useEffect
    }
  };

  const updateForm = (field: keyof LoginForm, value: string) => {
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
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>
            Connectez-vous à votre compte LuxeRide
          </Text>
        </View>

        {/* Form - PLUS DE SÉLECTEUR DE TYPE */}
        <View style={styles.form}>
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
            label="Mot de passe"
            placeholder="Votre mot de passe"
            value={form.password}
            onChangeText={(text) => updateForm('password', text)}
            error={errors.password}
            secureTextEntry
          />

          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            size="large"
            style={styles.loginButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerText}>
              Pas encore de compte ? <Text style={styles.footerLink}>Créer un compte</Text>
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
  loginButton: {
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

export default LoginScreen;