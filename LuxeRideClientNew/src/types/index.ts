// src/types/index.ts
export type UserType = 'user' | 'driver';

export type MembershipTier = 'STANDARD' | 'GOLD' | 'PLATINUM' | 'VIP';

export type VehicleCategory = 
  | 'BERLINE_EXECUTIVE' 
  | 'SUV_LUXE' 
  | 'VAN_PREMIUM' 
  | 'SUPERCAR' 
  | 'ELECTRIC_PREMIUM';

export type BookingStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'DRIVER_ASSIGNED' 
  | 'DRIVER_EN_ROUTE' 
  | 'DRIVER_ARRIVED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW';

export type PaymentMethod = 
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

export interface Location {
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  dateOfBirth?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  language: string;
  currency: string;
  preferredTemp: number;
  preferredMusic?: string;
  specialRequests?: string;
  loyaltyPoints: number;
  membershipTier: MembershipTier;
  addresses?: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  dateOfBirth: string;
  isActive: boolean;
  isOnline: boolean;
  licenseNumber: string;
  licenseExpiry: string;
  experience: number;
  languages: string[];
  rating: number;
  totalRides: number;
  currentLat?: number;
  currentLng?: number;
  lastLocationUpdate?: string;
  status: 'OFFLINE' | 'AVAILABLE' | 'BUSY' | 'BREAK';
  vehicles?: Vehicle[];
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
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
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
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
  status: BookingStatus;
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

export interface Address {
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

export interface Review {
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
  user?: {
    name: string;
    membershipTier: MembershipTier;
  };
  booking?: {
    pickupAddress: string;
    dropoffAddress: string;
    completedAt: string;
  };
}

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
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
  booking?: {
    id: string;
    pickupAddress: string;
    dropoffAddress: string;
    scheduledFor: string;
    completedAt?: string;
    estimatedDistance?: number;
    finalPrice?: number;
  };
}

// Navigation Types
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
  Home: undefined;
  BookRide: undefined;
  RideDetails: {rideId: string};
  MyRides: undefined;
  Profile: undefined;
  Payment: {bookingId: string};
  Review: {bookingId: string};
  Settings: undefined;
  Help: undefined;
};

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  userType: UserType;
}

export interface RegisterForm {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  dateOfBirth?: Date;
  acceptTerms: boolean;
}

export interface BookRideForm {
  pickupAddress: string;
  pickupLocation: Location;
  dropoffAddress: string;
  dropoffLocation: Location;
  scheduledFor: Date;
  vehicleCategory: VehicleCategory;
  passengerCount: number;
  specialRequests?: string;
}

export interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  language: string;
  currency: string;
}

// Redux State Types
export interface AuthState {
  isInitialized: boolean;
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  userType: UserType | null;
  loading: boolean;
  error: string | null;
}

export interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  loading: boolean;
  error: string | null;
}

export interface UIState {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  location: Location | null;
}

export interface RootState {
  auth: AuthState;
  bookings: BookingState;
  ui: UIState;
}

// Component Props Types
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
}

export interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
}

// API Error Types
export interface ApiError {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Socket Event Types
export interface SocketEvents {
  'driver_location_update': {
    bookingId: string;
    location: Location;
    heading?: number;
    speed?: number;
    timestamp: string;
  };
  
  'booking_status_update': {
    bookingId: string;
    status: BookingStatus;
    timestamp: string;
  };
  
  'ride_accepted': {
    bookingId: string;
    driver: Driver;
    vehicle: Vehicle;
    estimatedArrival: string;
  };
  
  'payment_received': {
    bookingId: string;
    amount: number;
    tip: number;
  };
}