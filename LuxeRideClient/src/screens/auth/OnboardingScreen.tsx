import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View style={onboardingStyles.container}>
      <Text variant="headlineMedium" style={onboardingStyles.title}>
        Bienvenue sur LuxeRide
      </Text>
      <Text variant="bodyLarge" style={onboardingStyles.subtitle}>
        Votre service de VTC premium
      </Text>
      
      <View style={onboardingStyles.buttons}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Login' as never)}
          style={onboardingStyles.button}
        >
          Se connecter
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Register' as never)}
          style={onboardingStyles.button}
        >
          Créer un compte
        </Button>
      </View>
    </View>
  );
};

const onboardingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#2196F3',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 48,
    opacity: 0.7,
  },
  buttons: {
    width: '100%',
    gap: 16,
  },
  button: {
    marginVertical: 8,
  },
});