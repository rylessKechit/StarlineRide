// src/services/api/index.ts

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG } from '../../constants';
import { ApiResponse, ApiError, User, Booking, Payment, Review } from '../../types';
import { getToken, removeToken } from '../storage';
import { showMessage } from 'react-native-flash-message';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor pour ajouter le token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log des requêtes en développement
        if (__DEV__) {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
          if (config.data) {
            console.log('📦 Request Data:', config.data);
          }
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor pour gérer les erreurs
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        if (__DEV__) {
          console.log(`✅ API Response: ${response.config.url}`, response.data);
        }
        return response;
      },
      async (error: AxiosError) => {
        console.error('❌ API Error:', error.response?.data || error.message);
        
        // Gérer l'expiration du token
        if (error.response?.status === 401) {
          await removeToken();
          showMessage({
            message: 'Session expirée',
            description: 'Veuillez vous reconnecter',
            type: 'warning',
          });
          // Ici on pourrait rediriger vers l'écran de login
        }

        // Gérer les erreurs réseau
        if (!error.response) {
          showMessage({
            message: 'Erreur de connexion',
            description: 'Vérifiez votre connexion internet',
            type: 'danger',
          });
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private normalizeError(error: AxiosError): ApiError {
    if (error.response?.data) {
      const data = error.response.data as any;
      return {
        message: data.message || 'Une erreur est survenue',
        status: error.response.status,
        code: data.code,
        details: data.errors || data.details,
      };
    }

    return {
      message: error.message || 'Erreur de connexion',
      status: 0,
    };
  }

  // Méthodes HTTP génériques
  private async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.api.get<ApiResponse<T>>(url, { params });
    return response.data.data as T;
  }

  private async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.post<ApiResponse<T>>(url, data);
    return response.data.data as T;
  }

  private async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.put<ApiResponse<T>>(url, data);
    return response.data.data as T;
  }

  private async delete<T>(url: string): Promise<T> {
    const response = await this.api.delete<ApiResponse<T>>(url);
    return response.data.data as T;
  }

  // ================================
  // AUTHENTIFICATION
  // ================================

  async registerUser(userData: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    password: string;
    dateOfBirth?: string;
  }): Promise<{ user: User; token: string }> {
    return this.post('/auth/register/user', userData);
  }

  async login(credentials: {
    email: string;
    password: string;
    userType?: 'user' | 'driver';
  }): Promise<{ user: User; token: string; userType: string }> {
    return this.post('/auth/login', credentials);
  }

  async getProfile(): Promise<{ profile: User }> {
    return this.get('/auth/profile');
  }

  async updateProfile(profileData: Partial<User>): Promise<{ profile: User }> {
    return this.put('/auth/profile', profileData);
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    await this.put('/auth/change-password', passwordData);
  }

  async verifyToken(): Promise<{ userId: string; userType: string; email: string }> {
    return this.post('/auth/verify-token');
  }

  async refreshToken(): Promise<{ token: string }> {
    return this.post('/auth/refresh-token');
  }

  // ================================
  // RÉSERVATIONS
  // ================================

  async createBooking(bookingData: {
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
  }): Promise<{ booking: Booking; availableDrivers: number }> {
    return this.post('/bookings', bookingData);
  }

  async getMyBookings(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ bookings: Booking[] }> {
    return this.get('/bookings/my-bookings', params);
  }

  async getBooking(bookingId: string): Promise<{ booking: Booking }> {
    return this.get(`/bookings/${bookingId}`);
  }

  async updateBookingStatus(
    bookingId: string,
    statusData: {
      status: string;
      location?: { lat: number; lng: number };
    }
  ): Promise<{ booking: Booking }> {
    return this.put(`/bookings/${bookingId}/status`, statusData);
  }

  async cancelBooking(
    bookingId: string,
    cancelData: { reason?: string }
  ): Promise<{ booking: Booking; cancellationFee?: number }> {
    return this.post(`/bookings/${bookingId}/cancel`, cancelData);
  }

  // ================================
  // PAIEMENTS
  // ================================

  async createPaymentIntent(paymentData: {
    bookingId: string;
    paymentMethod?: string;
  }): Promise<{
    clientSecret: string;
    paymentId: string;
    amount: number;
    breakdown: any;
  }> {
    return this.post('/payments/create-intent', paymentData);
  }

  async confirmPayment(confirmData: {
    paymentId: string;
    paymentIntentId: string;
    tip?: number;
  }): Promise<{ payment: Payment; finalAmount: number }> {
    return this.post('/payments/confirm', confirmData);
  }

  async getPaymentHistory(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<{
    payments: Payment[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    return this.get('/payments/history', params);
  }

  async refundPayment(refundData: {
    paymentId: string;
    reason?: string;
    amount?: number;
  }): Promise<{ refund: any; amount: number; payment: Payment }> {
    return this.post('/payments/refund', refundData);
  }

  async calculatePrice(priceData: {
    bookingId: string;
  }): Promise<{
    bookingId: string;
    priceBreakdown: any;
    membershipTier: string;
  }> {
    return this.post('/payments/calculate-price', priceData);
  }

  async getPaymentStats(params?: {
    period?: string;
  }): Promise<{
    period: string;
    summary: {
      totalPayments: number;
      totalAmount: number;
      totalTips: number;
      averageAmount: number;
    };
    paymentMethods: Array<{
      method: string;
      count: number;
      total: number;
    }>;
  }> {
    return this.get('/payments/stats', params);
  }

  // ================================
  // AVIS ET NOTATIONS
  // ================================

  async createReview(reviewData: {
    bookingId: string;
    overallRating: number;
    punctualityRating: number;
    cleanlinessRating: number;
    professionalismRating: number;
    vehicleRating: number;
    comment?: string;
  }): Promise<{ review: Review }> {
    return this.post('/reviews', reviewData);
  }

  async getMyReviews(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{
    reviews: Review[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    return this.get('/reviews/my-reviews', params);
  }

  async getDriverReviews(
    driverId: string,
    params?: {
      limit?: number;
      offset?: number;
      rating?: number;
      sortBy?: string;
    }
  ): Promise<{
    reviews: Review[];
    stats: {
      totalReviews: number;
      averageRating: number;
      averagePunctuality: number;
      averageCleanliness: number;
      averageProfessionalism: number;
      averageVehicle: number;
    };
    ratingDistribution: Array<{
      rating: number;
      count: number;
    }>;
  }> {
    return this.get(`/reviews/driver/${driverId}`, params);
  }

  async getDriverReviewStats(driverId: string): Promise<{
    driver: {
      name: string;
      currentRating: number;
      totalRides: number;
    };
    globalStats: any;
    ratingDistribution: any[];
    monthlyTrend: any[];
    keywordAnalysis: any;
  }> {
    return this.get(`/reviews/driver/${driverId}/stats`);
  }

  async reportReview(
    reviewId: string,
    reportData: { reason: string }
  ): Promise<void> {
    await this.post(`/reviews/${reviewId}/report`, reportData);
  }

  async toggleReviewVisibility(
    reviewId: string,
    visibilityData: { isPublic: boolean }
  ): Promise<{ review: Review }> {
    return this.put(`/reviews/${reviewId}/visibility`, visibilityData);
  }

  // ================================
  // UTILITAIRES
  // ================================

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health');
  }

  async getAppConfig(): Promise<any> {
    return this.get('/config');
  }

  // Méthode pour uploader des fichiers
  async uploadFile(
    endpoint: string,
    file: {
      uri: string;
      type: string;
      name: string;
    },
    additionalData?: Record<string, any>
  ): Promise<any> {
    const formData = new FormData();
    
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const token = await getToken();
    
    return this.api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
  }
}

// Export singleton
export const apiService = new ApiService();

// Export des méthodes individuelles pour faciliter l'utilisation
export const {
  // Auth
  registerUser,
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyToken,
  refreshToken,
  
  // Bookings
  createBooking,
  getMyBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
  
  // Payments
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  refundPayment,
  calculatePrice,
  getPaymentStats,
  
  // Reviews
  createReview,
  getMyReviews,
  getDriverReviews,
  getDriverReviewStats,
  reportReview,
  toggleReviewVisibility,
  
  // Utils
  healthCheck,
  getAppConfig,
  uploadFile,
} = apiService;