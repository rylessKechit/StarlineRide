import React from 'react';
import { StatusBar as RNStatusBar, Platform } from 'react-native';
import { useTheme } from '../../theme';

interface CustomStatusBarProps {
  backgroundColor?: string;
  barStyle?: 'light-content' | 'dark-content';
  translucent?: boolean;
}

export const CustomStatusBar: React.FC<CustomStatusBarProps> = ({
  backgroundColor,
  barStyle,
  translucent = false,
}) => {
  const theme = useTheme();

  const defaultBackgroundColor = backgroundColor || theme.colors.primary;
  const defaultBarStyle = barStyle || (theme.dark ? 'light-content' : 'dark-content');

  if (Platform.OS === 'ios') {
    return (
      <RNStatusBar
        barStyle={defaultBarStyle}
        backgroundColor="transparent"
        translucent={true}
      />
    );
  }

  return (
    <RNStatusBar
      barStyle={defaultBarStyle}
      backgroundColor={defaultBackgroundColor}
      translucent={translucent}
    />
  );
};