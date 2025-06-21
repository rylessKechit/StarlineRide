// src/screens/auth/LoginScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Surface,
  Text,
  TextInput,
  Button,
  Divider,
  IconButton,
  Checkbox,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TouchID from 'react-native-touch-id';

// Redux
import { useAppDispatch, useAppSelector } from '../../store';
import { loginUser, loginWithBiometric, clearError } from '../../store/slices/authSlice';

// Services
import { storageService } from '../../services/storage';

// Components
import { LogoHeader } from '../../components/auth/LogoHeader';
import { SocialLoginButtons } from '../../components/auth/SocialLoginButtons';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';

// Utils
import { useTheme } from '../../theme';
import { VALIDATION_RULES, COLORS } from '../../constants';
import { LoginFormData } from '../../types';
import { useAppNavigation } from '../../navigation/AppNavigator';

export const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigation = useAppNavigation();

  // Redux state
  const { isLoading, error, biometricEnabled } = useAppSelector((state) => (state as any).auth);

  // Local state
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<LoginFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const watchedEmail = watch('email');

  // ================================
  // EFFETS
  // ================================

  useEffect(() => {
    // Vérifier la disponibilité de la biométrie
    checkBiometricAvailability();
    
    // Charger le dernier email utilisé
    loadLastEmail();
    
    // Nettoyer les erreurs au montage
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    // Nettoyer l'erreur quand l'utilisateur tape
    if (error && (watchedEmail || watch('password'))) {
      dispatch(clearError());
    }
  }, [watchedEmail, watch('password'), error, dispatch]);

  // ================================
  // FONCTIONS UTILITAIRES
  // ================================

  const checkBiometricAvailability = async () => {
    try {
      const biometryType = await TouchID.isSupported();
      setIsBiometricAvailable(true);
      setBiometricType(biometryType);
    } catch (error) {
      setIsBiometricAvailable(false);
    }
  };

  const loadLastEmail = async () => {
    try {
      const user = await storageService.getUser();
      if (user?.email) {
        setValue('email', user.email);
      }
    } catch (error) {
      console.log('No previous user found');
    }
  };

  // ================================
  // HANDLERS
  // ================================

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await dispatch(loginUser(data));
      
      if (loginUser.fulfilled.match(result)) {
        // Sauvegarder l'email si demandé
        if (data.rememberMe) {
          await storageService.setUser({ ...result.payload.user });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      // Vérifier que la biométrie est activée pour cet utilisateur
      const enabled = await storageService.getBiometricEnabled();
      
      if (!enabled) {
        Alert.alert(
          'Biométrie non configurée',
          'Veuillez d\'abord vous connecter avec votre mot de passe pour activer la connexion biométrique.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Authentification biométrique
      const optionalConfigObject = {
        title: 'Authentification requise', // Android
        cancelText: 'Annuler', // Android (pas cancelLabel)
        fallbackLabel: 'Utiliser le mot de passe', // iOS
        passcodeFallback: false, // iOS
        unifiedErrors: false,
      };

      await TouchID.authenticate('Authentification biométrique', optionalConfigObject);

      // Si l'authentification réussit, connecter l'utilisateur
      dispatch(loginWithBiometric());

    } catch (error: any) {
      if (error.name !== 'UserCancel' && error.name !== 'UserFallback') {
        Alert.alert(
          'Erreur biométrique',
          'Impossible de vous authentifier. Veuillez utiliser votre mot de passe.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleForgotPassword = () => {
    if (!watchedEmail) {
      Alert.alert(
        'Email requis',
        'Veuillez saisir votre adresse email d\'abord.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    navigation.navigate('ForgotPassword', { email: watchedEmail });
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    try {
      // Ici on implémenterait la connexion sociale
      Alert.alert(
        'Fonctionnalité à venir',
        `La connexion avec ${provider === 'google' ? 'Google' : 'Apple'} sera bientôt disponible.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Social login error:', error);
    }
  };

  // ================================
  // RENDER
  // ================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec logo */}
        <LogoHeader
          title="Bon retour !"
          subtitle="Connectez-vous à votre compte LuxeRide"
        />

        {/* Formulaire de connexion */}
        <Surface style={[styles.formContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.form}>
            {/* Email */}
            <Controller
              control={control}
              name="email"
              rules={VALIDATION_RULES.email}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Adresse email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  left={<TextInput.Icon icon="email-outline" />}
                  style={styles.input}
                />
              )}
            />
            {errors.email && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.email.message}
              </Text>
            )}

            {/* Mot de passe */}
            <Controller
              control={control}
              name="password"
              rules={VALIDATION_RULES.password}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Mot de passe"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.password}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  left={<TextInput.Icon icon="lock-outline" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  style={styles.input}
                />
              )}
            />
            {errors.password && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.password.message}
              </Text>
            )}

            {/* Options */}
            <View style={styles.optionsContainer}>
              <Controller
                control={control}
                name="rememberMe"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.checkboxContainer}>
                    <Checkbox
                      status={value ? 'checked' : 'unchecked'}
                      onPress={() => onChange(!value)}
                    />
                    <Text style={styles.checkboxLabel}>Se souvenir de moi</Text>
                  </View>
                )}
              />

              <Button
                mode="text"
                onPress={handleForgotPassword}
                textColor={theme.colors.primary}
              >
                Mot de passe oublié ?
              </Button>
            </View>

            {/* Erreur générale */}
            {error && (
              <Surface style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer }]}>
                <Icon name="alert-circle-outline" size={20} color={theme.colors.error} />
                <Text style={[styles.errorMessage, { color: theme.colors.error }]}>
                  {error}
                </Text>
              </Surface>
            )}

            {/* Bouton de connexion */}
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={!isValid || isLoading}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
            >
              Se connecter
            </Button>

            {/* Connexion biométrique */}
            {isBiometricAvailable && biometricEnabled && (
              <Button
                mode="outlined"
                onPress={handleBiometricLogin}
                style={styles.biometricButton}
                icon={biometricType === 'FaceID' ? 'face-recognition' : 'fingerprint'}
              >
                {biometricType === 'FaceID' ? 'Face ID' : 'Empreinte digitale'}
              </Button>
            )}
          </View>
        </Surface>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <Divider style={styles.divider} />
          <Text style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>
            ou
          </Text>
          <Divider style={styles.divider} />
        </View>

        {/* Connexion sociale */}
        <SocialLoginButtons
          onGoogleLogin={() => handleSocialLogin('google')}
          onAppleLogin={() => handleSocialLogin('apple')}
          style={styles.socialButtons}
        />

        {/* Lien d'inscription */}
        <View style={styles.registerContainer}>
          <Text style={[styles.registerText, { color: theme.colors.onSurfaceVariant }]}>
            Pas encore de compte ?{' '}
          </Text>
          <Button
            mode="text"
            onPress={handleRegister}
            textColor={theme.colors.primary}
            compact
          >
            Créer un compte
          </Button>
        </View>
      </ScrollView>

      {/* Loading overlay */}
      {isLoading && (
        <LoadingOverlay message="Connexion en cours..." />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  formContainer: {
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  form: {
    padding: 24,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
    marginTop: -4,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorMessage: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  buttonContent: {
    height: 48,
  },
  biometricButton: {
    marginBottom: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButtons: {
    marginBottom: 24,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
  },
});

export default LoginScreen;