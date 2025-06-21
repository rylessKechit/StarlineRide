import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Avatar, List, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();

  const menuItems = [
    { title: 'Modifier le profil', icon: 'account-edit', screen: 'EditProfile' },
    { title: 'Moyens de paiement', icon: 'credit-card', screen: 'PaymentMethods' },
    { title: 'Historique des paiements', icon: 'history', screen: 'PaymentHistory' },
    { title: 'Programme de fidélité', icon: 'star', screen: 'Loyalty' },
    { title: 'Paramètres', icon: 'cog', screen: 'Settings' },
  ];

  return (
    <ScrollView style={profileStyles.container}>
      {/* Header du profil */}
      <Card style={profileStyles.profileCard}>
        <Card.Content style={profileStyles.profileContent}>
          <Avatar.Text size={80} label="JD" style={profileStyles.avatar} />
          <View style={profileStyles.profileInfo}>
            <Text variant="headlineSmall">John Doe</Text>
            <Text variant="bodyMedium" style={profileStyles.email}>
              john.doe@example.com
            </Text>
            <Text variant="bodyMedium" style={profileStyles.membershipTier}>
              Membre Gold • 1,250 points
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Menu */}
      <Card style={profileStyles.menuCard}>
        <Card.Content>
          {menuItems.map((item, index) => (
            <View key={item.screen}>
              <List.Item
                title={item.title}
                left={(props) => <List.Icon {...props} icon={item.icon} />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => navigation.navigate(item.screen as never)}
              />
              {index < menuItems.length - 1 && <Divider />}
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    margin: 16,
    marginTop: 60,
    elevation: 2,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#2196F3',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  email: {
    opacity: 0.7,
    marginTop: 4,
  },
  membershipTier: {
    color: '#FF9800',
    fontWeight: '500',
    marginTop: 4,
  },
  menuCard: {
    margin: 16,
    elevation: 2,
  },
});