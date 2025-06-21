import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface WeatherWidgetProps {
  style?: any;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ style }) => {
  // Données météo simulées
  const weather = {
    temperature: 22,
    condition: 'Ensoleillé',
    icon: 'weather-sunny',
    humidity: 65,
    windSpeed: 12,
  };

  return (
    <Card style={[weatherStyles.container, style]}>
      <Card.Content>
        <View style={weatherStyles.header}>
          <Text variant="titleMedium">Météo</Text>
          <View style={weatherStyles.mainWeather}>
            <Icon name={weather.icon} size={32} color="#FF9800" />
            <Text variant="headlineSmall" style={weatherStyles.temperature}>
              {weather.temperature}°
            </Text>
          </View>
        </View>
        
        <Text variant="bodyMedium" style={weatherStyles.condition}>
          {weather.condition}
        </Text>
        
        <View style={weatherStyles.details}>
          <Text variant="bodySmall">Humidité: {weather.humidity}%</Text>
          <Text variant="bodySmall">Vent: {weather.windSpeed} km/h</Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const weatherStyles = StyleSheet.create({
  container: {
    elevation: 2,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mainWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  temperature: {
    fontWeight: 'bold',
    color: '#FF9800',
  },
  condition: {
    marginBottom: 8,
    opacity: 0.7,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});