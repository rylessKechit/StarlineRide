import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
}

interface PromotionBannerProps {
  onPromotionPress: (promotion: Promotion) => void;
  style?: any;
}

export const PromotionBanner: React.FC<PromotionBannerProps> = ({ 
  onPromotionPress, 
  style 
}) => {
  const promotion: Promotion = {
    id: '1',
    title: '20% de réduction',
    description: 'Sur votre prochaine course premium',
    discount: '-20%',
    validUntil: '31/01/2024',
  };

  return (
    <Card style={[promotionStyles.container, style]}>
      <Card.Content>
        <View style={promotionStyles.content}>
          <View style={promotionStyles.textContent}>
            <Text variant="titleMedium" style={promotionStyles.title}>
              {promotion.title}
            </Text>
            <Text variant="bodyMedium" style={promotionStyles.description}>
              {promotion.description}
            </Text>
            <Text variant="bodySmall" style={promotionStyles.validity}>
              Valable jusqu'au {promotion.validUntil}
            </Text>
          </View>
          
          <View style={promotionStyles.discountBadge}>
            <Text variant="headlineSmall" style={promotionStyles.discountText}>
              {promotion.discount}
            </Text>
          </View>
        </View>
        
        <Button 
          mode="contained" 
          onPress={() => onPromotionPress(promotion)}
          style={promotionStyles.button}
          buttonColor="#4CAF50"
        >
          Utiliser
        </Button>
      </Card.Content>
    </Card>
  );
};

const promotionStyles = StyleSheet.create({
  container: {
    elevation: 2,
    marginVertical: 8,
    backgroundColor: '#E8F5E8',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  textContent: {
    flex: 1,
  },
  title: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  description: {
    marginTop: 4,
    opacity: 0.8,
  },
  validity: {
    marginTop: 4,
    opacity: 0.6,
  },
  discountBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  button: {
    marginTop: 8,
  },
});