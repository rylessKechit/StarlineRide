// src/components/common/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  ...props
}) => {
  const sizeStyleMap: Record<'small' | 'medium' | 'large', keyof typeof styles> = {
    small: 'buttonSmall',
    medium: 'buttonMedium',
    large: 'buttonLarge',
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = {
      ...styles.button,
      ...styles[sizeStyleMap[size]],
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? '#BDC3C7' : '#007AFF',
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? '#F5F5F5' : '#5856D6',
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? '#BDC3C7' : '#007AFF',
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyleMap: Record<'small' | 'medium' | 'large', keyof typeof styles> = {
      small: 'textSmall',
      medium: 'textMedium',
      large: 'textLarge',
    };
    const baseStyle = {
      ...styles.text,
      ...styles[sizeStyleMap[size]],
    };

    switch (variant) {
      case 'primary':
      case 'secondary':
        return {
          ...baseStyle,
          color: disabled ? '#95A5A6' : '#FFFFFF',
        };
      case 'outline':
      case 'ghost':
        return {
          ...baseStyle,
          color: disabled ? '#BDC3C7' : '#007AFF',
        };
      default:
        return baseStyle;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'ghost' ? '#007AFF' : '#FFFFFF'}
          />
        ) : (
          <>
            {icon && <Text style={[getTextStyle(), { marginRight: 8 }]}>{icon}</Text>}
            <Text style={getTextStyle()}>{title}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonSmall: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  buttonMedium: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 48,
  },
  buttonLarge: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: 56,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textSmall: {
    fontSize: 14,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
});

export default Button;