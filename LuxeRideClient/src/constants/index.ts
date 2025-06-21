// src/constants/index.ts

export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://localhost:6000/api' : 'https://api.luxeride.com/api',
  SOCKET_URL: __DEV__ ? 'http://localhost:6000' : 'https://api.luxeride.com',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

export const COLORS = {
  // Couleurs principales
  primary: '#1E3A8A',        // Bleu luxe
  secondary: '#F59E0B',      // Or premium
  accent: '#10B981',         // Vert success
  
  // Couleurs fonctionnelles
  error: '#EF4444',          // Rouge erreur
  warning: '#F59E0B',        // Orange warning
  info: '#3B82F6',          // Bleu info
  success: '#10B981',        // Vert success
  
  // Couleurs neutres
  background: '#F8FAFC',     // Arrière-plan principal
  surface: '#FFFFFF',        // Cartes et surfaces
  surfaceVariant: '#F1F5F9', // Surface alternative
  border: '#E2E8F0',        // Bordures
  borderLight: '#F1F5F9',   // Bordures légères
  disabled: '#94A3B8',       // Éléments désactivés
  
  // Texte
  textPrimary: '#1E293B',    // Texte principal
  textSecondary: '#64748B',  // Texte secondaire
  textLight: '#94A3B8',      // Texte léger
  textOnPrimary: '#FFFFFF',  // Texte sur couleur primaire
  
  // Overlay et transparence
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdrop: 'rgba(0, 0, 0, 0.3)',
  
  // Couleurs spécifiques à l'app
  gold: '#FFD700',          // Or pour premium
  silver: '#C0C0C0',        // Argent
  premium: '#8B5CF6',       // Violet premium
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const LAYOUT = {
  screenPadding: 20,
  headerHeight: 56,
  tabBarHeight: 80,
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  elevation: {
    sm: 2,
    md: 4,
    lg: 8,
    xl: 16,
  },
  buttonHeight: 48,
  inputHeight: 56,
  cardPadding: 16,
};

export const TYPOGRAPHY = {
  // Headers
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h3: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
  h4: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h5: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  h6: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  
  // Body
  body1: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  body2: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  
  // Special
  subtitle1: { fontSize: 16, fontWeight: '500' as const, lineHeight: 24 },
  subtitle2: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  overline: { fontSize: 10, fontWeight: '400' as const, lineHeight: 16 },
};

export const VEHICLE_CATEGORIES = {
  BERLINE_EXECUTIVE: {
    id: 'BERLINE_EXECUTIVE',
    name: 'Berline Executive',
    description: 'Mercedes Classe E, BMW Série 5',
    basePrice: 8,
    pricePerKm: 2.5,
    capacity: 4,
    features: ['WiFi', 'Climatisation', 'Sièges cuir'],
    icon: '🚗',
    image: 'berline_executive.jpg',
  },
  SUV_LUXE: {
    id: 'SUV_LUXE',
    name: 'SUV Luxe',
    description: 'Range Rover, Porsche Cayenne',
    basePrice: 12,
    pricePerKm: 3.0,
    capacity: 6,
    features: ['WiFi', 'Climatisation', 'Espace premium', 'Sièges chauffants'],
    icon: '🚙',
    image: 'suv_luxe.jpg',
  },
  VAN_PREMIUM: {
    id: 'VAN_PREMIUM',
    name: 'Van Premium',
    description: 'Mercedes Classe V (6-8 places)',
    basePrice: 15,
    pricePerKm: 3.5,
    capacity: 8,
    features: ['WiFi', 'Climatisation', 'Tables pliantes', 'Espace bagages'],
    icon: '🚐',
    image: 'van_premium.jpg',
  },
  SUPERCAR: {
    id: 'SUPERCAR',
    name: 'Supercar',
    description: 'Porsche, Ferrari pour occasions spéciales',
    basePrice: 25,
    pricePerKm: 5.0,
    capacity: 2,
    features: ['Performance', 'Prestige', 'Expérience unique'],
    icon: '🏎️',
    image: 'supercar.jpg',
  },
  ELECTRIC_PREMIUM: {
    id: 'ELECTRIC_PREMIUM',
    name: 'Électrique Premium',
    description: 'Tesla Model S, BMW iX',
    basePrice: 10,
    pricePerKm: 2.8,
    capacity: 4,
    features: ['Écologique', 'Silence', 'Technologie avancée'],
    icon: '⚡',
    image: 'electric_premium.jpg',
  },
} as const;

export const MEMBERSHIP_TIERS = {
  STANDARD: {
    id: 'STANDARD',
    name: 'Standard',
    discount: 0,
    pointsRequired: 0,
    benefits: ['Réservation standard', 'Support client'],
    color: COLORS.textSecondary,
    icon: '⭐',
  },
  GOLD: {
    id: 'GOLD',
    name: 'Gold',
    discount: 0.05,
    pointsRequired: 500,
    benefits: ['5% de réduction', 'Priorité réservation', 'Support privilégié'],
    color: COLORS.gold,
    icon: '🥇',
  },
  PLATINUM: {
    id: 'PLATINUM',
    name: 'Platinum',
    discount: 0.10,
    pointsRequired: 2000,
    benefits: ['10% de réduction', 'Upgrades gratuits', 'Concierge'],
    color: COLORS.silver,
    icon: '💎',
  },
  VIP: {
    id: 'VIP',
    name: 'VIP',
    discount: 0.15,
    pointsRequired: 5000,
    benefits: ['15% de réduction', 'Concierge dédié', 'Accès événements'],
    color: COLORS.premium,
    icon: '👑',
  },
} as const;

export const BOOKING_STATUS = {
  PENDING: { id: 'PENDING', name: 'Recherche en cours', color: COLORS.warning, icon: '🔍' },
  CONFIRMED: { id: 'CONFIRMED', name: 'Confirmée', color: COLORS.info, icon: '✅' },
  DRIVER_ASSIGNED: { id: 'DRIVER_ASSIGNED', name: 'Chauffeur assigné', color: COLORS.primary, icon: '👨‍💼' },
  DRIVER_EN_ROUTE: { id: 'DRIVER_EN_ROUTE', name: 'En route vers vous', color: COLORS.primary, icon: '🚗' },
  DRIVER_ARRIVED: { id: 'DRIVER_ARRIVED', name: 'Chauffeur arrivé', color: COLORS.accent, icon: '📍' },
  IN_PROGRESS: { id: 'IN_PROGRESS', name: 'Course en cours', color: COLORS.success, icon: '🛣️' },
  COMPLETED: { id: 'COMPLETED', name: 'Terminée', color: COLORS.success, icon: '🏁' },
  CANCELLED: { id: 'CANCELLED', name: 'Annulée', color: COLORS.error, icon: '❌' },
  NO_SHOW: { id: 'NO_SHOW', name: 'Client absent', color: COLORS.error, icon: '👻' },
} as const;

export const PAYMENT_METHODS = {
  CARD: { id: 'CARD', name: 'Carte bancaire', icon: '💳' },
  PAYPAL: { id: 'PAYPAL', name: 'PayPal', icon: '🅿️' },
  APPLE_PAY: { id: 'APPLE_PAY', name: 'Apple Pay', icon: '🍎' },
  GOOGLE_PAY: { id: 'GOOGLE_PAY', name: 'Google Pay', icon: '🎯' },
  CORPORATE: { id: 'CORPORATE', name: 'Compte entreprise', icon: '🏢' },
} as const;

export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 1000,
};

export const SCREEN_NAMES = {
  // Auth Stack
  SPLASH: 'Splash',
  ONBOARDING: 'Onboarding',
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  PHONE_VERIFICATION: 'PhoneVerification',
  
  // Main Tabs
  HOME: 'Home',
  BOOKINGS: 'Bookings',
  PROFILE: 'Profile',
  
  // Booking Stack
  BOOKING: 'Booking',
  VEHICLE_SELECTION: 'VehicleSelection',
  BOOKING_CONFIRMATION: 'BookingConfirmation',
  LIVE_TRACKING: 'LiveTracking',
  
  // Payment Stack
  PAYMENT: 'Payment',
  PAYMENT_METHODS: 'PaymentMethods',
  TIP_SELECTION: 'TipSelection',
  
  // Profile Stack
  EDIT_PROFILE: 'EditProfile',
  SETTINGS: 'Settings',
  LOYALTY: 'Loyalty',
  PAYMENT_HISTORY: 'PaymentHistory',
  
  // Review Stack
  RATING: 'Rating',
  REVIEW_FORM: 'ReviewForm',
} as const;

export const VALIDATION_RULES = {
  email: {
    required: 'Email requis',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Email invalide',
    },
  },
  password: {
    required: 'Mot de passe requis',
    minLength: {
      value: 8,
      message: 'Minimum 8 caractères',
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: 'Doit contenir majuscule, minuscule et chiffre',
    },
  },
  phone: {
    required: 'Téléphone requis',
    pattern: {
      value: /^(\+33|0)[1-9](\d{8})$/,
      message: 'Numéro français invalide',
    },
  },
  name: {
    required: 'Nom requis',
    minLength: {
      value: 2,
      message: 'Minimum 2 caractères',
    },
    maxLength: {
      value: 50,
      message: 'Maximum 50 caractères',
    },
  },
};

export const MAP_CONFIG = {
  defaultRegion: {
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  markerSize: {
    small: 20,
    medium: 30,
    large: 40,
  },
  animationDuration: 1000,
};

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Booking events
  NEW_RIDE_REQUEST: 'new_ride_request',
  RIDE_ACCEPTED: 'ride_accepted',
  RIDE_CANCELLED: 'ride_cancelled',
  BOOKING_STATUS_UPDATE: 'booking_status_update',
  
  // Location events
  DRIVER_LOCATION_UPDATE: 'driver_location_update',
  TRACK_DRIVER: 'track_driver',
  STOP_TRACKING: 'stop_tracking',
  
  // Chat events
  JOIN_RIDE: 'join_ride',
  LEAVE_RIDE: 'leave_ride',
  RIDE_MESSAGE: 'ride_message',
  NEW_MESSAGE: 'new_message',
  
  // Payment events
  PAYMENT_RECEIVED: 'payment_received',
  
  // Review events
  NEW_REVIEW: 'new_review',
  REVIEW_RESPONSE: 'review_response',
} as const;