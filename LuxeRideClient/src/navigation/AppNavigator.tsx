// src/navigation/AppNavigator.tsx

import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Redux
import { useAppDispatch, useAppSelector } from '../store';
import { initializeAuth } from '../store/slices/authSlice';

// Types
import { 
  AuthStackParamList, 
  MainTabParamList,
  BookingStackParamList,
  ProfileStackParamList 
} from '../types';

// Screens
import { SplashScreen } from '../screens/auth/SplashScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { PhoneVerificationScreen } from '../screens/auth/PhoneVerificationScreen';

import { HomeScreen } from '../screens/home/HomeScreen';
import { BookingsScreen } from '../screens/bookings/BookingsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

import { BookingScreen } from '../screens/booking/BookingScreen';
import { VehicleSelectionScreen } from '../screens/booking/VehicleSelectionScreen';
import { BookingConfirmationScreen } from '../screens/booking/BookingConfirmationScreen';
import { LiveTrackingScreen } from '../screens/tracking/LiveTrackingScreen';

import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { PaymentMethodsScreen } from '../screens/payment/PaymentMethodsScreen';
import { PaymentHistoryScreen } from '../screens/payment/PaymentHistoryScreen';
import { LoyaltyScreen } from '../screens/profile/LoyaltyScreen';

// Theme
import { useTheme } from '../theme';
import { COLORS } from '../constants';

// Stacks
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const BookingStack = createStackNavigator<BookingStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// ================================
// AUTH NAVIGATOR
// ================================
const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.background },
      }}
    >
      <AuthStack.Screen name="Splash" component={SplashScreen} />
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
    </AuthStack.Navigator>
  );
};

// ================================
// BOOKING NAVIGATOR
// ================================
const BookingNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <BookingStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <BookingStack.Screen 
        name="Booking" 
        component={BookingScreen}
        options={{ title: 'Nouvelle Course' }}
      />
      <BookingStack.Screen 
        name="VehicleSelection" 
        component={VehicleSelectionScreen}
        options={{ title: 'Choisir un Véhicule' }}
      />
      <BookingStack.Screen 
        name="BookingConfirmation" 
        component={BookingConfirmationScreen}
        options={{ title: 'Confirmation' }}
      />
      <BookingStack.Screen 
        name="LiveTracking" 
        component={LiveTrackingScreen}
        options={{ 
          title: 'Suivi en Direct',
          headerShown: false, // Pour mode plein écran
        }}
      />
    </BookingStack.Navigator>
  );
};

// ================================
// PROFILE NAVIGATOR
// ================================
const ProfileNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <ProfileStack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ title: 'Mon Profil' }}
      />
      <ProfileStack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ title: 'Modifier le Profil' }}
      />
      <ProfileStack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Paramètres' }}
      />
      <ProfileStack.Screen 
        name="PaymentMethods" 
        component={PaymentMethodsScreen}
        options={{ title: 'Moyens de Paiement' }}
      />
      <ProfileStack.Screen 
        name="PaymentHistory" 
        component={PaymentHistoryScreen}
        options={{ title: 'Historique des Paiements' }}
      />
      <ProfileStack.Screen 
        name="Loyalty" 
        component={LoyaltyScreen}
        options={{ title: 'Programme de Fidélité' }}
      />
    </ProfileStack.Navigator>
  );
};

// ================================
// MAIN TAB NAVIGATOR
// ================================
const MainTabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Bookings':
              iconName = focused ? 'car' : 'car-outline';
              break;
            case 'Profile':
              iconName = focused ? 'account' : 'account-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <MainTab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          tabBarLabel: 'Accueil',
          tabBarBadge: undefined, // Peut être utilisé pour les notifications
        }}
      />
      <MainTab.Screen 
        name="Bookings" 
        component={BookingsScreen}
        options={{ 
          tabBarLabel: 'Mes Courses',
        }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileNavigator}
        options={{ 
          tabBarLabel: 'Profil',
        }}
      />
    </MainTab.Navigator>
  );
};

// ================================
// APP NAVIGATOR PRINCIPAL
// ================================
export const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized } = useAppSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    isInitialized: state.auth.isInitialized,
  }));

  useEffect(() => {
    // Initialiser l'authentification au démarrage
    dispatch(initializeAuth());
  }, [dispatch]);

  // Afficher l'écran de splash pendant l'initialisation
  if (!isInitialized) {
    return <SplashScreen />;
  }

  // Navigation conditionnelle selon l'état d'authentification
  return isAuthenticated ? <MainTabNavigator /> : <AuthNavigator />;
};

// ================================
// NAVIGATEURS MODAUX (pour overlay screens)
// ================================
const RootStack = createStackNavigator();

export const RootNavigator: React.FC = () => {
  return (
    <RootStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        presentation: 'modal',
      }}
    >
      <RootStack.Screen name="Main" component={AppNavigator} />
      <RootStack.Screen 
        name="BookingModal" 
        component={BookingNavigator}
        options={{
          presentation: 'modal',
          cardStyle: { backgroundColor: 'transparent' },
        }}
      />
      <RootStack.Screen 
        name="LiveTrackingModal" 
        component={LiveTrackingScreen}
        options={{
          presentation: 'fullScreenModal',
        }}
      />
    </RootStack.Navigator>
  );
};

// ================================
// HOOKS UTILITAIRES POUR LA NAVIGATION
// ================================
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Hook pour la navigation typée
export const useAppNavigation = <T extends Record<string, any>>() => {
  return useNavigation<StackNavigationProp<T>>();
};

// Hook pour les paramètres de route typés
export const useAppRoute = <T extends Record<string, any>>() => {
  return useRoute<any>();
};

// Fonctions de navigation globale
let navigationRef: any = null;

export const setNavigationRef = (ref: any) => {
  navigationRef = ref;
};

export const navigate = (name: string, params?: any) => {
  if (navigationRef) {
    navigationRef.navigate(name, params);
  }
};

export const goBack = () => {
  if (navigationRef) {
    navigationRef.goBack();
  }
};

export const resetToScreen = (name: string, params?: any) => {
  if (navigationRef) {
    navigationRef.reset({
      index: 0,
      routes: [{ name, params }],
    });
  }
};

// Utilitaires pour les modales
export const openBookingModal = (params?: any) => {
  navigate('BookingModal', params);
};

export const openLiveTracking = (bookingId: string) => {
  navigate('LiveTrackingModal', { bookingId });
};

export const closeModal = () => {
  goBack();
};