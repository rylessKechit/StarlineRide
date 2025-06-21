import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, List, Switch, Divider } from 'react-native-paper';

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = React.useState({
    notifications: true,
    biometric: false,
    darkMode: false,
  });

  return (
    <View style={settingsStyles.container}>
      <List.Item
        title="Notifications"
        description="Recevoir les notifications push"
        right={() => (
          <Switch
            value={settings.notifications}
            onValueChange={(value) => setSettings({...settings, notifications: value})}
          />
        )}
      />
      <Divider />
      
      <List.Item
        title="Authentification biométrique"
        description="Utiliser l'empreinte digitale ou Face ID"
        right={() => (
          <Switch
            value={settings.biometric}
            onValueChange={(value) => setSettings({...settings, biometric: value})}
          />
        )}
      />
      <Divider />
      
      <List.Item
        title="Mode sombre"
        description="Activer le thème sombre"
        right={() => (
          <Switch
            value={settings.darkMode}
            onValueChange={(value) => setSettings({...settings, darkMode: value})}
          />
        )}
      />
    </View>
  );
};

const settingsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});