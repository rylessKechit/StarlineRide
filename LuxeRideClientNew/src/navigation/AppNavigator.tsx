// src/navigation/AppNavigator.tsx
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppDispatch, useAppSelector } from '../store';
import { initializeAuth } from '../store/slices/authSlice';
import LoadingScreen from '../screens/LoadingScreen';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';
import BookRideScreen from '../screens/main/BookRideScreen';
import MyRidesScreen from '../screens/main/MyRidesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import RideDetailsScreen from '../screens/main/RideDetailsScreen';
import PaymentScreen from '../screens/main/PaymentScreen';
import ReviewScreen from '../screens/main/ReviewScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

import { RootStackParamList, AuthStackParamList, MainStackParamList } from '../types';

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator();

// Auth Navigator
const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
    }}>
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Tab Navigator - NOMS UNIQUES
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopColor: '#E5E5EA',
        borderTopWidth: 1,
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: '#8E8E93',
    }}>
    <Tab.Screen 
      name="Home"
      component={HomeScreen}
      options={{
        title: 'Accueil',
        tabBarIcon: ({ color, size }) => (
          <Text style={{ fontSize: size, color }}>🏠</Text>
        ),
      }}
    />
    <Tab.Screen 
      name="MyRides"
      component={MyRidesScreen}
      options={{
        title: 'Mes courses',
        tabBarIcon: ({ color, size }) => (
          <Text style={{ fontSize: size, color }}>🚗</Text>
        ),
      }}
    />
    <Tab.Screen 
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Profil',
        tabBarIcon: ({ color, size }) => (
          <Text style={{ fontSize: size, color }}>👤</Text>
        ),
      }}
    />
  </Tab.Navigator>
);

// Main Navigator - NOMS UNIQUES
const MainNavigator = () => (
  <MainStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#007AFF',
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}>
    <MainStack.Screen 
      name="MainTabs"
      component={TabNavigator}
      options={{ headerShown: false }}
    />
    <MainStack.Screen 
      name="BookRide" 
      component={BookRideScreen}
      options={{ title: 'Réserver une course' }}
    />
    <MainStack.Screen 
      name="RideDetails" 
      component={RideDetailsScreen}
      options={{ title: 'Détails de la course' }}
    />
    <MainStack.Screen 
      name="Payment" 
      component={PaymentScreen}
      options={{ title: 'Paiement' }}
    />
    <MainStack.Screen 
      name="Review" 
      component={ReviewScreen}
      options={{ title: 'Laisser un avis' }}
    />
    <MainStack.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{ title: 'Paramètres' }}
    />
  </MainStack.Navigator>
);

export const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isInitialized, isAuthenticated } = useAppSelector(state => (state as any).auth);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="MainStack" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="AuthStack" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};