import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleRegister = () => {
    // Logique d'inscription
    console.log('Register:', formData);
  };

  return (
    <ScrollView style={registerStyles.container}>
      <Card style={registerStyles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={registerStyles.title}>
            Créer un compte
          </Text>
          
          <TextInput
            label="Prénom"
            value={formData.firstName}
            onChangeText={(text) => setFormData({...formData, firstName: text})}
            style={registerStyles.input}
          />
          
          <TextInput
            label="Nom"
            value={formData.lastName}
            onChangeText={(text) => setFormData({...formData, lastName: text})}
            style={registerStyles.input}
          />
          
          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            keyboardType="email-address"
            style={registerStyles.input}
          />
          
          <TextInput
            label="Téléphone"
            value={formData.phone}
            onChangeText={(text) => setFormData({...formData, phone: text})}
            keyboardType="phone-pad"
            style={registerStyles.input}
          />
          
          <TextInput
            label="Mot de passe"
            value={formData.password}
            onChangeText={(text) => setFormData({...formData, password: text})}
            secureTextEntry
            style={registerStyles.input}
          />
          
          <TextInput
            label="Confirmer le mot de passe"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
            secureTextEntry
            style={registerStyles.input}
          />
          
          <Button
            mode="contained"
            onPress={handleRegister}
            style={registerStyles.button}
          >
            Créer le compte
          </Button>
          
          <Button
            mode="text"
            onPress={() => navigation.navigate('Login' as never)}
            style={registerStyles.loginButton}
          >
            Déjà un compte ? Se connecter
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const registerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 20,
    marginTop: 60,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#2196F3',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
    marginBottom: 8,
  },
  loginButton: {
    marginTop: 8,
  },
});