// src/store/slices/bookingSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { bookingsAPI, BookingRequest } from '../../services/api';
import { BookingState, Booking } from '../../types';

const initialState: BookingState = {
  bookings: [],
  currentBooking: null,
  loading: false,
  error: null,
};

// Async thunks
export const createBooking = createAsyncThunk(
  'booking/create',
  async (bookingData: BookingRequest, { rejectWithValue }) => {
    try {
      const response = await bookingsAPI.create(bookingData);
      return response.data.data.booking;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création de la réservation');
    }
  }
);

export const fetchMyBookings = createAsyncThunk(
  'booking/fetchMy',
  async (
    args: { params?: { status?: string; limit?: number; offset?: number } },
    { rejectWithValue }
  ) => {
    try {
      const response = await bookingsAPI.getMyBookings(args.params);
      return response.data.data.bookings;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des réservations');
    }
  }
);

export const fetchBooking = createAsyncThunk(
  'booking/fetchOne',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await bookingsAPI.getBooking(bookingId);
      return response.data.data.booking;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération de la réservation');
    }
  }
);

export const updateBookingStatus = createAsyncThunk(
  'booking/updateStatus',
  async ({ bookingId, status, location }: { 
    bookingId: string; 
    status: string; 
    location?: { lat: number; lng: number } 
  }, { rejectWithValue }) => {
    try {
      const response = await bookingsAPI.updateStatus(bookingId, { status, location });
      return response.data.data.booking;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'booking/cancel',
  async ({ bookingId, reason }: { bookingId: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await bookingsAPI.cancel(bookingId, reason);
      return response.data.data.booking;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentBooking: (state, action: PayloadAction<Booking | null>) => {
      state.currentBooking = action.payload;
    },
    updateBookingInList: (state, action: PayloadAction<Booking>) => {
      const index = state.bookings.findIndex((b: any) => b.id === action.payload.id);
      if (index !== -1) {
        state.bookings[index] = action.payload;
      }
      if (state.currentBooking?.id === action.payload.id) {
        state.currentBooking = action.payload;
      }
    },
    addBooking: (state, action: PayloadAction<Booking>) => {
      state.bookings.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
        state.bookings.unshift(action.payload);
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch My Bookings
      .addCase(fetchMyBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Booking
      .addCase(fetchBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
        // Update in list if exists
        const index = state.bookings.findIndex((b: any) => b.id === action.payload.id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
      })
      .addCase(fetchBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update Booking Status
      .addCase(updateBookingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.bookings.findIndex((b: any) => b.id === action.payload.id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        if (state.currentBooking?.id === action.payload.id) {
          state.currentBooking = action.payload;
        }
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Cancel Booking
      .addCase(cancelBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.bookings.findIndex((b: any) => b.id === action.payload.id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        if (state.currentBooking?.id === action.payload.id) {
          state.currentBooking = action.payload;
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentBooking, updateBookingInList, addBooking } = bookingSlice.actions;
export default bookingSlice.reducer;