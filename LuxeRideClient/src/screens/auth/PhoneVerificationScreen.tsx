import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';

export const PhoneVerificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [code, setCode] = useState('');

  const handleVerifyCode = () => {
    console.log('Verify code:', code);
  };

  return (
    <View style={verificationStyles.container}>
      <Card style={verificationStyles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={verificationStyles.title}>
            Vérification SMS
          </Text>
          
          <Text variant="bodyMedium" style={verificationStyles.subtitle}>
            Entrez le code reçu par SMS
          </Text>
          
          <TextInput
            label="Code de vérification"
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
            maxLength={6}
            style={verificationStyles.input}
          />
          
          <Button
            mode="contained"
            onPress={handleVerifyCode}
            style={verificationStyles.button}
          >
            Vérifier
          </Button>
          
          <Button
            mode="text"
            onPress={() => console.log('Resend code')}
            style={verificationStyles.resendButton}
          >
            Renvoyer le code
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const verificationStyles = StyleSheet.create({
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
    textAlign: 'center',
  },
  button: {
    marginBottom: 8,
  },
  resendButton: {
    marginTop: 8,
  },
});