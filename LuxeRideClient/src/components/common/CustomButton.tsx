import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  fullWidth?: boolean;
  style?: any;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  style,
}) => {
  const getButtonMode = () => {
    switch (variant) {
      case 'primary':
        return 'contained';
      case 'secondary':
        return 'contained-tonal';
      case 'outline':
        return 'outlined';
      case 'text':
        return 'text';
      default:
        return 'contained';
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [buttonStyles.button];
    
    if (fullWidth) {
      baseStyle.push({ ...buttonStyles.button, ...buttonStyles.fullWidth });
    }
    
    switch (size) {
      case 'small':
        baseStyle.push({ ...buttonStyles.button, ...buttonStyles.small });
        break;
      case 'large':
        baseStyle.push({ ...buttonStyles.button, ...buttonStyles.large });
        break;
      default:
        baseStyle.push({ ...buttonStyles.button, ...buttonStyles.medium });
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };

  const getContentStyle = () => {
    switch (size) {
      case 'small':
        return buttonStyles.smallContent;
      case 'large':
        return buttonStyles.largeContent;
      default:
        return buttonStyles.mediumContent;
    }
  };

  return (
    <Button
      mode={getButtonMode() as any}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      icon={icon}
      style={getButtonStyle()}
      contentStyle={getContentStyle()}
    >
      {title}
    </Button>
  );
};

const buttonStyles = StyleSheet.create({
  button: {
    borderRadius: 8,
  },
  fullWidth: {
    width: '100%',
  },
  small: {
    minWidth: 80,
  },
  medium: {
    minWidth: 120,
  },
  large: {
    minWidth: 160,
  },
  smallContent: {
    height: 36,
    paddingHorizontal: 12,
  },
  mediumContent: {
    height: 44,
    paddingHorizontal: 16,
  },
  largeContent: {
    height: 52,
    paddingHorizontal: 20,
  },
});