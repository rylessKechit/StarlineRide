// src/screens/auth/WelcomeScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types';
import Button from '../../components/common/Button';

type WelcomeScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Welcome'>;
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>🚗</Text>
          </View>
          <Text style={styles.appName}>LuxeRide</Text>
          <Text style={styles.tagline}>Votre chauffeur privé premium</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>⭐</Text>
            <Text style={styles.featureText}>Service haut de gamme</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🕐</Text>
            <Text style={styles.featureText}>Disponible 24h/24</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <Text style={styles.featureText}>Sécurisé et fiable</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="Se connecter"
            onPress={() => navigation.navigate('Login')}
            variant="primary"
            size="large"
            style={styles.button}
          />
          
          <Button
            title="Créer un compte"
            onPress={() => navigation.navigate('Register')}
            variant="outline"
            size="large"
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  logoText: {
    fontSize: 48,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
  featuresContainer: {
    alignItems: 'center',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  actionsContainer: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
});

export default WelcomeScreen;