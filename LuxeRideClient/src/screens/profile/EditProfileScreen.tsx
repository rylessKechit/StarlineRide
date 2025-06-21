import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';

export const EditProfileScreen: React.FC = () => {
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+33123456789',
  });

  const handleSave = () => {
    console.log('Save profile:', profile);
  };

  return (
    <ScrollView style={editProfileStyles.container}>
      <Card style={editProfileStyles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={editProfileStyles.title}>
            Modifier le profil
          </Text>
          
          <TextInput
            label="Prénom"
            value={profile.firstName}
            onChangeText={(text) => setProfile({...profile, firstName: text})}
            style={editProfileStyles.input}
          />
          
          <TextInput
            label="Nom"
            value={profile.lastName}
            onChangeText={(text) => setProfile({...profile, lastName: text})}
            style={editProfileStyles.input}
          />
          
          <TextInput
            label="Email"
            value={profile.email}
            onChangeText={(text) => setProfile({...profile, email: text})}
            keyboardType="email-address"
            style={editProfileStyles.input}
          />
          
          <TextInput
            label="Téléphone"
            value={profile.phone}
            onChangeText={(text) => setProfile({...profile, phone: text})}
            keyboardType="phone-pad"
            style={editProfileStyles.input}
          />
          
          <Button
            mode="contained"
            onPress={handleSave}
            style={editProfileStyles.saveButton}
          >
            Enregistrer
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const editProfileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginTop: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#2196F3',
  },
  input: {
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 16,
  },
});