import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');

  const handleResetPassword = () => {
    console.log('Reset password for:', email);
  };

  return (
    <View style={forgotStyles.container}>
      <Card style={forgotStyles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={forgotStyles.title}>
            Mot de passe oublié
          </Text>
          
          <Text variant="bodyMedium" style={forgotStyles.subtitle}>
            Entrez votre email pour recevoir un lien de réinitialisation
          </Text>
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={forgotStyles.input}
          />
          
          <Button
            mode="contained"
            onPress={handleResetPassword}
            style={forgotStyles.button}
          >
            Envoyer le lien
          </Button>
          
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={forgotStyles.backButton}
          >
            Retour à la connexion
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const forgotStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#2196F3',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
  },
  backButton: {
    marginTop: 8,
  },
});