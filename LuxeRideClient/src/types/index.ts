// src/types/index.ts

interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  dateOfBirth?: string;
  language: string;
  currency: string;
  preferredTemp: number;
  preferredMusic?: string;
  specialRequests?: string;
  loyaltyPoints: number;
  membershipTier: MembershipTier;
  addresses: Address[];
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Driver {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  licenseNumber: string;
  experience: number;
  languages: string[];
  rating: number;
  totalRides: number;
  status: DriverStatus;
  isOnline: boolean;
  currentLat?: number;
  currentLng?: number;
  lastLocationUpdate?: string;
  vehicles: Vehicle[];
  createdAt: string;
}

interface Vehicle {
  id: string;
  driverId: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  category: VehicleCategory;
  features: string[];
  maxPassengers: number;
  hasWifi: boolean;
  hasChargers: boolean;
  hasAC: boolean;
  isActive: boolean;
  lastMaintenance?: string;
  nextMaintenance?: string;
  insurance?: string;
  registration?: string;
  inspection?: string;
}

interface Booking {
  id: string;
  userId: string;
  driverId?: string;
  vehicleId?: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  scheduledFor: string;
  estimatedDuration?: number;
  estimatedDistance?: number;
  estimatedPrice: number;
  finalPrice?: number;
  currency: string;
  status: BookingStatusType;
  startedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  specialRequests?: string;
  passengerCount: number;
  user?: User;
  driver?: Driver;
  vehicle?: Vehicle;
  payment?: Payment;
  review?: Review;
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethodType;
  status: PaymentStatus;
  stripePaymentId?: string;
  stripeChargeId?: string;
  basePrice: number;
  distancePrice: number;
  timePrice: number;
  surcharge: number;
  tip: number;
  discount: number;
  paidAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Review {
  id: string;
  bookingId: string;
  userId: string;
  driverId: string;
  overallRating: number;
  punctualityRating: number;
  cleanlinessRating: number;
  professionalismRating: number;
  vehicleRating: number;
  comment?: string;
  driverResponse?: string;
  isPublic: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'firstName' | 'lastName' | 'membershipTier'>;
  driver?: Pick<Driver, 'firstName' | 'lastName' | 'rating'>;
  booking?: Pick<Booking, 'pickupAddress' | 'dropoffAddress' | 'completedAt'>;
}

interface Address {
  id: string;
  userId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Location {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp?: string;
}

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface PriceEstimate {
  basePrice: number;
  distancePrice: number;
  timePrice: number;
  surcharge: number;
  discount: number;
  total: number;
  breakdown: {
    distance: number;
    duration: number;
    surge: boolean;
    membershipDiscount: number;
  };
}

interface SocketMessage {
  bookingId: string;
  message: string;
  type: 'text' | 'location' | 'system';
  sender: {
    id: string;
    type: 'user' | 'driver';
  };
  timestamp: string;
}

interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  type: NotificationType;
  createdAt: string;
}

// Enums et types littéraux
export type MembershipTier = 'STANDARD' | 'GOLD' | 'PLATINUM' | 'VIP';

export type DriverStatus = 'OFFLINE' | 'AVAILABLE' | 'BUSY' | 'BREAK';

export type VehicleCategory = 
  | 'BERLINE_EXECUTIVE' 
  | 'SUV_LUXE' 
  | 'VAN_PREMIUM' 
  | 'SUPERCAR' 
  | 'ELECTRIC_PREMIUM';

export type BookingStatusType = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_EN_ROUTE'
  | 'DRIVER_ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type PaymentMethodType = 
  | 'CARD'
  | 'PAYPAL'
  | 'APPLE_PAY'
  | 'GOOGLE_PAY'
  | 'CORPORATE';

export type PaymentStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIAL_REFUND';

export type NotificationType = 
  | 'booking_update'
  | 'payment_success'
  | 'driver_arrived'
  | 'trip_completed'
  | 'promotion'
  | 'system';

// Types pour les formulaires
interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterFormData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  dateOfBirth?: string;
  acceptTerms: boolean;
}

interface BookingFormData {
  pickupAddress: string;
  pickupLocation: Location;
  dropoffAddress: string;
  dropoffLocation: Location;
  scheduledFor: Date;
  vehicleCategory: VehicleCategory;
  passengerCount: number;
  specialRequests?: string;
  paymentMethod?: PaymentMethodType;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth?: string;
  preferredTemp: number;
  preferredMusic?: string;
  specialRequests?: string;
  language: string;
  currency: string;
}

interface ReviewFormData {
  overallRating: number;
  punctualityRating: number;
  cleanlinessRating: number;
  professionalismRating: number;
  vehicleRating: number;
  comment?: string;
}

// Types pour l'API
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// Types pour Redux Store
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface BookingState {
  currentBooking: Booking | null;
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  searchResults: Booking[];
  filters: BookingFilters;
}

interface LocationState {
  currentLocation: Location | null;
  region: MapRegion;
  addresses: Address[];
  isLocationEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

interface PaymentState {
  methods: PaymentMethod[];
  defaultMethod: PaymentMethod | null;
  isLoading: boolean;
  error: string | null;
  lastTransaction: Payment | null;
}

interface UIState {
  theme: 'light' | 'dark';
  language: string;
  notifications: NotificationPayload[];
  isOnline: boolean;
  socketConnected: boolean;
}

interface RootState {
  auth: AuthState;
  booking: BookingState;
  location: LocationState;
  payment: PaymentState;
  ui: UIState;
}

// Types pour les filtres et recherche
interface BookingFilters {
  status?: BookingStatusType[];
  dateFrom?: string;
  dateTo?: string;
  vehicleCategory?: VehicleCategory;
  priceMin?: number;
  priceMax?: number;
  sortBy?: 'date' | 'price' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface SearchFilters {
  query: string;
  location?: Location;
  radius?: number;
  category?: VehicleCategory;
}

// Types pour les hooks personnalisés
interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface UseApiOptions {
  enabled?: boolean;
  refetchOnFocus?: boolean;
  retry?: number;
  cacheTime?: number;
}

// Types pour les composants
interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  elevation?: number;
  padding?: number;
}

// Types pour la navigation
type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  PhoneVerification: { phone: string };
};

type MainTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Profile: undefined;
};

type BookingStackParamList = {
  Booking: undefined;
  VehicleSelection: { 
    pickup: Location; 
    dropoff: Location; 
    scheduledFor: Date;
  };
  BookingConfirmation: { bookingData: BookingFormData };
  LiveTracking: { bookingId: string };
};

type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
  PaymentMethods: undefined;
  PaymentHistory: undefined;
  Loyalty: undefined;
  AddressBook: undefined;
  NotificationSettings: undefined;
  Privacy: undefined;
  Language: undefined;
};

type PaymentStackParamList = {
  Payment: { bookingId: string };
  PaymentMethods: { selectMode?: boolean };
  TipSelection: { bookingId: string; amount: number };
  PaymentSuccess: { paymentId: string };
};

type ReviewStackParamList = {
  Rating: { bookingId: string };
  ReviewForm: { bookingId: string; initialRating: number };
  ReviewSuccess: undefined;
};

// Types pour les erreurs spécifiques
interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

interface NetworkError {
  message: string;
  status?: number;
  isNetworkError: boolean;
}

interface LocationError {
  code: number;
  message: string;
  type: 'permission' | 'unavailable' | 'timeout';
}

// Types pour les événements analytics
interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
  timestamp: number;
}

interface BookingAnalytics {
  bookingStarted: {
    pickup: string;
    dropoff: string;
    vehicleCategory: VehicleCategory;
  };
  bookingCompleted: {
    bookingId: string;
    duration: number;
    distance: number;
    finalPrice: number;
  };
  paymentCompleted: {
    amount: number;
    method: PaymentMethodType;
    tip: number;
  };
}

// Types pour les permissions
interface PermissionStatus {
  location: 'granted' | 'denied' | 'never_ask_again' | 'undetermined';
  camera: 'granted' | 'denied' | 'never_ask_again' | 'undetermined';
  notifications: 'granted' | 'denied' | 'undetermined';
}

// Types pour les méthodes de paiement étendues
interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  stripePaymentMethodId?: string;
}

interface StripeCardData {
  number: string;
  expiryMonth: number;
  expiryYear: number;
  cvc: string;
  postalCode?: string;
}

// Types pour les préférences utilisateur
interface UserPreferences {
  notifications: {
    bookingUpdates: boolean;
    promotions: boolean;
    newsAndUpdates: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
  privacy: {
    shareLocation: boolean;
    dataAnalytics: boolean;
    marketingEmails: boolean;
  };
  app: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    currency: string;
    units: 'metric' | 'imperial';
  };
  booking: {
    defaultVehicleCategory: VehicleCategory;
    autoConfirmFavoriteDrivers: boolean;
    allowSharedRides: boolean;
    defaultTipPercentage: number;
  };
}

// Types pour les statistiques utilisateur
interface UserStats {
  totalRides: number;
  totalSpent: number;
  averageRating: number;
  favoriteVehicleCategory: VehicleCategory;
  co2Saved: number;
  loyaltyPointsEarned: number;
  monthlyStats: {
    month: string;
    rides: number;
    spent: number;
  }[];
}

// Types pour les promotions et réductions
interface Promotion {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'freeRide';
  discountValue: number;
  minimumAmount?: number;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
  usedCount: number;
  applicableVehicles?: VehicleCategory[];
  code?: string;
  isActive: boolean;
}

// Types pour les favoris et récurrences
interface FavoriteDestination {
  id: string;
  name: string;
  address: string;
  location: Location;
  category: 'home' | 'work' | 'airport' | 'restaurant' | 'other';
  usageCount: number;
  lastUsed: string;
}

interface RecurringBooking {
  id: string;
  name: string;
  pickup: Address;
  dropoff: Address;
  schedule: {
    type: 'daily' | 'weekly' | 'monthly';
    days?: number[]; // 0-6 (Sunday-Saturday)
    time: string; // HH:mm format
    timezone: string;
  };
  vehicleCategory: VehicleCategory;
  isActive: boolean;
  nextOccurrence: string;
}

// Types pour le chat et messaging
interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderType: 'user' | 'driver' | 'system';
  content: string;
  type: 'text' | 'location' | 'image' | 'system';
  timestamp: string;
  isRead: boolean;
  metadata?: {
    location?: Location;
    imageUrl?: string;
    systemEventType?: string;
  };
}

interface ChatSession {
  id: string;
  bookingId: string;
  participants: {
    user: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
    driver: Pick<Driver, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  };
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isActive: boolean;
}

// Types pour les configurations de l'app
interface AppConfig {
  features: {
    chatEnabled: boolean;
    voiceCallEnabled: boolean;
    sharedRidesEnabled: boolean;
    loyaltyProgramEnabled: boolean;
    promotionsEnabled: boolean;
    advancedBookingEnabled: boolean;
    recurringBookingsEnabled: boolean;
  };
  limits: {
    maxAdvanceBookingDays: number;
    maxPassengersPerBooking: number;
    minBookingAmount: number;
    maxTipPercentage: number;
  };
  pricing: {
    surgePricingEnabled: boolean;
    dynamicPricingEnabled: boolean;
    minimumFare: number;
    cancellationFeeThreshold: number; // minutes before pickup
  };
  support: {
    phoneNumber: string;
    email: string;
    chatEnabled: boolean;
    emergencyNumber: string;
  };
}

// Export de tous les types pour faciliter l'import
export type {
  // Entités principales
  User,
  Driver,
  Vehicle,
  Booking,
  Payment,
  Review,
  Address,
  Location,
  MapRegion,
  PriceEstimate,
  SocketMessage,
  NotificationPayload,
  
  // Types de formulaires
  LoginFormData,
  RegisterFormData,
  BookingFormData,
  ProfileFormData,
  ReviewFormData,
  
  // Types API
  ApiResponse,
  PaginatedResponse,
  ApiError,
  
  // Types Redux
  AuthState,
  BookingState,
  LocationState,
  PaymentState,
  UIState,
  RootState,
  
  // Types composants
  ListItemProps,
  ButtonProps,
  InputProps,
  CardProps,
  
  // Types navigation
  AuthStackParamList,
  MainTabParamList,
  BookingStackParamList,
  ProfileStackParamList,
  PaymentStackParamList,
  ReviewStackParamList,
  
  // Types étendus
  PaymentMethod,
  UserPreferences,
  UserStats,
  Promotion,
  FavoriteDestination,
  RecurringBooking,
  ChatMessage,
  ChatSession,
  AppConfig,
};