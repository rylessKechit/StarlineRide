// src/store/slices/authSlice.ts - Version client uniquement
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, LoginRequest, RegisterRequest } from '../../services/api';
import { AuthState, User } from '../../types';

const initialState: AuthState = {
  isInitialized: false,
  isAuthenticated: false,
  user: null,
  token: null,
  userType: 'user', // TOUJOURS 'user'
  loading: false,
  error: null,
};

// Async thunks
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userType = await AsyncStorage.getItem('userType'); // Sera toujours 'user'
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userType === 'user' && userData) {
        const user = JSON.parse(userData);
        return { token, userType: 'user' as const, user };
      }
      return null;
    } catch (error) {
      await AsyncStorage.multiRemove(['authToken', 'userType', 'user']);
      return null;
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      // S'assurer que userType est toujours 'user'
      const loginData = { ...credentials, userType: 'user' as const };
      
      const response = await authAPI.login(loginData);
      const { user, token, userType } = response.data.data;
      
      // Vérification côté client
      if (userType !== 'user') {
        throw new Error('Cette application est réservée aux clients');
      }
      
      // Store in AsyncStorage
      await AsyncStorage.multiSet([
        ['authToken', token],
        ['userType', 'user'],
        ['user', JSON.stringify(user)],
      ]);
      
      return { user, token, userType: 'user' as const };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur de connexion');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      const { user, token, userType } = response.data.data;
      
      // Vérification côté client
      if (userType !== 'user') {
        throw new Error('Cette application est réservée aux clients');
      }
      
      // Store in AsyncStorage
      await AsyncStorage.multiSet([
        ['authToken', token],
        ['userType', 'user'],
        ['user', JSON.stringify(user)],
      ]);
      
      return { user, token, userType: 'user' as const };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur d\'inscription');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await AsyncStorage.multiRemove(['authToken', 'userType', 'user']);
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data.data.profile;
      
      // Update AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur de mise à jour');
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (data: { currentPassword: string; newPassword: string }, { rejectWithValue }) => {
    try {
      await authAPI.changePassword(data);
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur de changement de mot de passe');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize Auth
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.userType = 'user'; // TOUJOURS 'user'
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.loading = false;
        state.isInitialized = true;
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.userType = 'user'; // TOUJOURS 'user'
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.userType = 'user'; // TOUJOURS 'user'
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.userType = 'user'; // RESET à 'user'
        state.error = null;
      })
      
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;