// src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Driver, Vehicle, Booking, UserType } from '../types';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:6000/api' 
  : 'https://your-production-api.com/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear storage and redirect to login
      await AsyncStorage.multiRemove(['authToken', 'user']);
      // You can add navigation to login here if needed
    }
    return Promise.reject(error);
  }
);

export interface LoginRequest {
  email: string;
  password: string;
  userType: UserType;
}

export interface RegisterRequest {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  dateOfBirth?: string;
}

export interface BookingRequest {
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  scheduledFor: string;
  vehicleCategory?: string;
  passengerCount?: number;
  specialRequests?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthResponse {
  user: User;
  token: string;
  userType: string;
}

export interface BookingsResponse {
  bookings: Booking[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Auth API
export const authAPI = {
  login: (data: LoginRequest) => 
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),
  
  register: (data: RegisterRequest) => 
    api.post<ApiResponse<AuthResponse>>('/auth/register/user', data),
  
  getProfile: () => 
    api.get<ApiResponse<{profile: User}>>('/auth/profile'),
  
  updateProfile: (data: Partial<User>) => 
    api.put<ApiResponse<{profile: User}>>('/auth/profile', data),
  
  changePassword: (data: {currentPassword: string; newPassword: string}) => 
    api.put('/auth/change-password', data),
};

// Bookings API
export const bookingsAPI = {
  create: (data: BookingRequest) => 
    api.post<ApiResponse<{booking: Booking; availableDrivers: number}>>('/bookings', data),
  
  getMyBookings: (params?: {status?: string; limit?: number; offset?: number}) => 
    api.get<ApiResponse<BookingsResponse>>('/bookings/my-bookings', {params}),
  
  getBooking: (id: string) => 
    api.get<ApiResponse<{booking: Booking}>>(`/bookings/${id}`),
  
  updateStatus: (id: string, data: {status: string; location?: {lat: number; lng: number}}) => 
    api.put(`/bookings/${id}/status`, data),
  
  cancel: (id: string, reason?: string) => 
    api.post(`/bookings/${id}/cancel`, {reason}),
};

// Payments API
export const paymentsAPI = {
  createIntent: (data: {bookingId: string; paymentMethod?: string}) => 
    api.post('/payments/create-intent', data),
  
  confirm: (data: {paymentId: string; paymentIntentId: string; tip?: number}) => 
    api.post('/payments/confirm', data),
  
  getHistory: (params?: {limit?: number; offset?: number; status?: string}) => 
    api.get('/payments/history', {params}),
  
  calculatePrice: (bookingId: string) => 
    api.post('/payments/calculate-price', {bookingId}),
};

export default api;