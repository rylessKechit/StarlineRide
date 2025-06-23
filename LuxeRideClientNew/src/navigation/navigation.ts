export type RootStackParamList = {
  AuthStack: undefined;
  MainStack: undefined;
  Loading: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;          // ← CHANGÉ DE "Home" À "MainTabs"
  BookRide: undefined;
  RideDetails: {rideId: string};
  Payment: {bookingId: string};
  Review: {bookingId: string};
  Settings: undefined;
  Help: undefined;
};

// Types pour les tabs (optionnel, si vous en avez besoin)
export type TabParamList = {
  HomeTab: undefined;           // ← NOUVEAUX NOMS POUR LES TABS
  MyRidesTab: undefined;
  ProfileTab: undefined;
};