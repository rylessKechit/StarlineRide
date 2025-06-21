// src/store/slices/bookingSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Booking, BookingFormData, BookingStatusType, PriceEstimate } from '../../types';
import { apiService } from '../../services/api';
import { socketService } from '../../services/socket';
import { showMessage } from 'react-native-flash-message';

// Interface pour l'état des réservations
interface BookingState {
  currentBooking: Booking | null;
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  
  // État de création de réservation
  isCreatingBooking: boolean;
  createBookingError: string | null;
  
  // Estimation de prix
  priceEstimate: PriceEstimate | null;
  isPriceLoading: boolean;
  
  // Filtres et pagination
  filters: {
    status?: BookingStatusType;
    dateFrom?: string;
    dateTo?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  
  // État temps réel
  trackingData: {
    driverLocation: { lat: number; lng: number } | null;
    estimatedArrival: Date | null;
    lastUpdate: string | null;
  };
}

// État initial
const initialState: BookingState = {
  currentBooking: null,
  bookings: [],
  isLoading: false,
  error: null,
  isCreatingBooking: false,
  createBookingError: null,
  priceEstimate: null,
  isPriceLoading: false,
  filters: {},
  pagination: {
    page: 0,
    limit: 20,
    total: 0,
    hasMore: true,
  },
  trackingData: {
    driverLocation: null,
    estimatedArrival: null,
    lastUpdate: null,
  },
};

// ================================
// ACTIONS ASYNCHRONES
// ================================

// Créer une réservation
export const createBooking = createAsyncThunk(
  'booking/create',
  async (bookingData: BookingFormData, { rejectWithValue }) => {
    try {
      const response = await apiService.createBooking({
        pickupAddress: bookingData.pickupAddress,
        pickupLat: bookingData.pickupLocation.lat,
        pickupLng: bookingData.pickupLocation.lng,
        dropoffAddress: bookingData.dropoffAddress,
        dropoffLat: bookingData.dropoffLocation.lat,
        dropoffLng: bookingData.dropoffLocation.lng,
        scheduledFor: bookingData.scheduledFor.toISOString(),
        vehicleCategory: bookingData.vehicleCategory,
        passengerCount: bookingData.passengerCount,
        specialRequests: bookingData.specialRequests,
      });

      showMessage({
        message: 'Réservation créée !',
        description: `${response.availableDrivers} chauffeurs disponibles dans votre zone`,
        type: 'success',
        duration: 4000,
      });

      // Démarrer le suivi temps réel
      if (response.booking.id) {
        socketService.joinRideChat(response.booking.id);
      }

      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la création de la réservation';
      
      showMessage({
        message: 'Erreur de réservation',
        description: errorMessage,
        type: 'danger',
      });

      return rejectWithValue(errorMessage);
    }
  }
);

// Récupérer mes réservations
export const fetchMyBookings = createAsyncThunk(
  'booking/fetchMy',
  async (
    params: {
      status?: BookingStatusType;
      limit?: number;
      offset?: number;
      refresh?: boolean;
    } = {},
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { booking: BookingState };
      const { refresh = false } = params;
      
      const queryParams = {
        status: params.status,
        limit: params.limit || state.booking.pagination.limit,
        offset: refresh ? 0 : state.booking.bookings.length,
      };

      const response = await apiService.getMyBookings(queryParams);
      
      return {
        bookings: response.bookings,
        isRefresh: refresh,
        hasMore: response.bookings.length === queryParams.limit,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur de récupération des réservations');
    }
  }
);

// Récupérer une réservation spécifique
export const fetchBooking = createAsyncThunk(
  'booking/fetchOne',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getBooking(bookingId);
      return response.booking;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur de récupération de la réservation');
    }
  }
);

// Mettre à jour le statut d'une réservation
export const updateBookingStatus = createAsyncThunk(
  'booking/updateStatus',
  async (
    {
      bookingId,
      status,
      location,
    }: {
      bookingId: string;
      status: BookingStatusType;
      location?: { lat: number; lng: number };
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.updateBookingStatus(bookingId, {
        status,
        location,
      });

      return response.booking;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur de mise à jour du statut');
    }
  }
);

// Annuler une réservation
export const cancelBooking = createAsyncThunk(
  'booking/cancel',
  async (
    { bookingId, reason }: { bookingId: string; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.cancelBooking(bookingId, { reason });

      showMessage({
        message: 'Réservation annulée',
        description: response.cancellationFee 
          ? `Frais d'annulation: ${response.cancellationFee}€`
          : 'Annulation gratuite',
        type: 'warning',
      });

      // Arrêter le suivi
      socketService.leaveRideChat(bookingId);

      return {
        booking: response.booking,
        cancellationFee: response.cancellationFee,
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur d\'annulation';
      
      showMessage({
        message: 'Erreur d\'annulation',
        description: errorMessage,
        type: 'danger',
      });

      return rejectWithValue(errorMessage);
    }
  }
);

// Calculer le prix d'une course
export const calculatePrice = createAsyncThunk(
  'booking/calculatePrice',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.calculatePrice({ bookingId });
      return response.priceBreakdown;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur de calcul du prix');
    }
  }
);

// ================================
// SLICE
// ================================

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    // Réinitialiser l'erreur
    clearError: (state) => {
      state.error = null;
      state.createBookingError = null;
    },

    // Réinitialiser l'état de création
    resetCreateBooking: (state) => {
      state.isCreatingBooking = false;
      state.createBookingError = null;
      state.priceEstimate = null;
    },

    // Mettre à jour la réservation actuelle
    setCurrentBooking: (state, action: PayloadAction<Booking | null>) => {
      state.currentBooking = action.payload;
      
      if (action.payload) {
        // Démarrer le suivi si nécessaire
        const activeStatuses: BookingStatusType[] = [
          'DRIVER_ASSIGNED',
          'DRIVER_EN_ROUTE', 
          'DRIVER_ARRIVED',
          'IN_PROGRESS'
        ];
        
        if (activeStatuses.includes(action.payload.status)) {
          socketService.joinRideChat(action.payload.id);
          if (action.payload.driverId) {
            socketService.trackDriver(action.payload.driverId);
          }
        }
      }
    },

    // Mettre à jour les données de suivi
    updateTrackingData: (state, action: PayloadAction<{
      driverLocation?: { lat: number; lng: number };
      estimatedArrival?: Date;
    }>) => {
      if (action.payload.driverLocation) {
        state.trackingData.driverLocation = action.payload.driverLocation;
        state.trackingData.lastUpdate = new Date().toISOString();
      }
      
      if (action.payload.estimatedArrival) {
        state.trackingData.estimatedArrival = action.payload.estimatedArrival;
      }
    },

    // Mettre à jour les filtres
    updateFilters: (state, action: PayloadAction<Partial<BookingState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Réinitialiser les filtres
    resetFilters: (state) => {
      state.filters = {};
    },

    // Mettre à jour une réservation dans la liste
    updateBookingInList: (state, action: PayloadAction<Booking>) => {
      const index = state.bookings.findIndex(b => b.id === action.payload.id);
      if (index >= 0) {
        state.bookings[index] = action.payload;
      }
      
      // Mettre à jour la réservation actuelle si c'est la même
      if (state.currentBooking?.id === action.payload.id) {
        state.currentBooking = action.payload;
      }
    },

    // Événements Socket.io
    handleRideAccepted: (state, action: PayloadAction<{
      bookingId: string;
      driver: any;
      vehicle: any;
      estimatedArrival: Date;
    }>) => {
      const { bookingId, driver, vehicle, estimatedArrival } = action.payload;
      
      if (state.currentBooking?.id === bookingId) {
        state.currentBooking.status = 'DRIVER_ASSIGNED';
        state.currentBooking.driver = driver;
        state.currentBooking.vehicle = vehicle;
        state.trackingData.estimatedArrival = estimatedArrival;
      }
      
      // Mettre à jour dans la liste aussi
      const bookingIndex = state.bookings.findIndex(b => b.id === bookingId);
      if (bookingIndex >= 0) {
        state.bookings[bookingIndex].status = 'DRIVER_ASSIGNED';
        state.bookings[bookingIndex].driver = driver;
        state.bookings[bookingIndex].vehicle = vehicle;
      }
    },

    handleBookingStatusUpdate: (state, action: PayloadAction<{
      bookingId: string;
      status: BookingStatusType;
      location?: { lat: number; lng: number };
    }>) => {
      const { bookingId, status, location } = action.payload;
      
      if (state.currentBooking?.id === bookingId) {
        state.currentBooking.status = status;
        
        // Mettre à jour les timestamps selon le statut
        const now = new Date().toISOString();
        switch (status) {
          case 'DRIVER_ARRIVED':
            state.currentBooking.arrivedAt = now;
            break;
          case 'IN_PROGRESS':
            state.currentBooking.startedAt = now;
            break;
          case 'COMPLETED':
            state.currentBooking.completedAt = now;
            break;
          case 'CANCELLED':
            state.currentBooking.cancelledAt = now;
            break;
        }
      }
      
      // Mettre à jour la position si fournie
      if (location) {
        state.trackingData.driverLocation = location;
        state.trackingData.lastUpdate = new Date().toISOString();
      }
      
      // Mettre à jour dans la liste
      const bookingIndex = state.bookings.findIndex(b => b.id === bookingId);
      if (bookingIndex >= 0) {
        state.bookings[bookingIndex].status = status;
      }
    },

    handleDriverLocationUpdate: (state, action: PayloadAction<{
      bookingId: string;
      location: { lat: number; lng: number };
    }>) => {
      if (state.currentBooking?.id === action.payload.bookingId) {
        state.trackingData.driverLocation = action.payload.location;
        state.trackingData.lastUpdate = new Date().toISOString();
      }
    },

    // Réinitialiser le suivi
    resetTracking: (state) => {
      state.trackingData = {
        driverLocation: null,
        estimatedArrival: null,
        lastUpdate: null,
      };
    },

    // Nettoyer les données terminées
    cleanupCompletedBookings: (state) => {
      // Garder seulement les réservations récentes et actives
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 jours
      
      state.bookings = state.bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        const isRecent = bookingDate > cutoffDate;
        const isActive = !['COMPLETED', 'CANCELLED'].includes(booking.status);
        
        return isRecent || isActive;
      });
    },
  },
  extraReducers: (builder) => {
    // Créer réservation
    builder
      .addCase(createBooking.pending, (state) => {
        state.isCreatingBooking = true;
        state.createBookingError = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isCreatingBooking = false;
        state.currentBooking = action.payload.booking;
        state.createBookingError = null;
        
        // Ajouter à la liste des réservations
        state.bookings.unshift(action.payload.booking);
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isCreatingBooking = false;
        state.createBookingError = action.payload as string;
      });

    // Récupérer mes réservations
    builder
      .addCase(fetchMyBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        
        if (action.payload.isRefresh) {
          // Remplacer toutes les réservations
          state.bookings = action.payload.bookings;
          state.pagination.page = 0;
        } else {
          // Ajouter les nouvelles réservations
          state.bookings.push(...action.payload.bookings);
          state.pagination.page += 1;
        }
        
        state.pagination.hasMore = action.payload.hasMore;
        state.error = null;
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Récupérer une réservation
    builder
      .addCase(fetchBooking.fulfilled, (state, action) => {
        // Mettre à jour la réservation dans la liste
        const index = state.bookings.findIndex(b => b.id === action.payload.id);
        if (index >= 0) {
          state.bookings[index] = action.payload;
        } else {
          state.bookings.unshift(action.payload);
        }
        
        // Mettre à jour la réservation actuelle si c'est la même
        if (state.currentBooking?.id === action.payload.id) {
          state.currentBooking = action.payload;
        }
      });

    // Mettre à jour statut
    builder
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        const booking = action.payload;
        
        // Mettre à jour dans la liste
        const index = state.bookings.findIndex(b => b.id === booking.id);
        if (index >= 0) {
          state.bookings[index] = booking;
        }
        
        // Mettre à jour la réservation actuelle
        if (state.currentBooking?.id === booking.id) {
          state.currentBooking = booking;
        }
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Annuler réservation
    builder
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const booking = action.payload.booking;
        
        // Mettre à jour dans la liste
        const index = state.bookings.findIndex(b => b.id === booking.id);
        if (index >= 0) {
          state.bookings[index] = booking;
        }
        
        // Réinitialiser la réservation actuelle si c'est la même
        if (state.currentBooking?.id === booking.id) {
          state.currentBooking = null;
          state.trackingData = initialState.trackingData;
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Calculer prix
    builder
      .addCase(calculatePrice.pending, (state) => {
        state.isPriceLoading = true;
      })
      .addCase(calculatePrice.fulfilled, (state, action) => {
        state.isPriceLoading = false;
        state.priceEstimate = action.payload;
      })
      .addCase(calculatePrice.rejected, (state, action) => {
        state.isPriceLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export des actions
export const {
  clearError,
  resetCreateBooking,
  setCurrentBooking,
  updateTrackingData,
  updateFilters,
  resetFilters,
  updateBookingInList,
  handleRideAccepted,
  handleBookingStatusUpdate,
  handleDriverLocationUpdate,
  resetTracking,
  cleanupCompletedBookings,
} = bookingSlice.actions;

// Export du reducer
export default bookingSlice.reducer;

// Sélecteurs spécialisés
export const selectBookingState = (state: { booking: BookingState }) => state.booking;
export const selectCurrentBooking = (state: { booking: BookingState }) => state.booking.currentBooking;
export const selectBookings = (state: { booking: BookingState }) => state.booking.bookings;
export const selectIsCreatingBooking = (state: { booking: BookingState }) => state.booking.isCreatingBooking;
export const selectPriceEstimate = (state: { booking: BookingState }) => state.booking.priceEstimate;
export const selectTrackingData = (state: { booking: BookingState }) => state.booking.trackingData;
export const selectBookingFilters = (state: { booking: BookingState }) => state.booking.filters;
export const selectBookingPagination = (state: { booking: BookingState }) => state.booking.pagination;

// Sélecteurs composés
export const selectActiveBooking = (state: { booking: BookingState }) => {
  const { currentBooking } = state.booking;
  if (!currentBooking) return null;
  
  const activeStatuses: BookingStatusType[] = [
    'PENDING',
    'CONFIRMED',
    'DRIVER_ASSIGNED',
    'DRIVER_EN_ROUTE',
    'DRIVER_ARRIVED',
    'IN_PROGRESS'
  ];
  
  return activeStatuses.includes(currentBooking.status) ? currentBooking : null;
};

export const selectRecentBookings = (state: { booking: BookingState }) => {
  return state.booking.bookings
    .filter(booking => ['COMPLETED', 'CANCELLED'].includes(booking.status))
    .slice(0, 5);
};

export const selectUpcomingBookings = (state: { booking: BookingState }) => {
  const now = new Date();
  return state.booking.bookings
    .filter(booking => {
      const scheduledFor = new Date(booking.scheduledFor);
      return scheduledFor > now && !['COMPLETED', 'CANCELLED'].includes(booking.status);
    })
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
};