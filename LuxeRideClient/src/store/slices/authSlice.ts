// src/store/slices/authSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, LoginFormData, RegisterFormData, ApiError } from '../../types';
import { apiService } from '../../services/api';
import { storageService } from '../../services/storage';
import { socketService } from '../../services/socket';
import { showMessage } from 'react-native-flash-message';

// Interface pour l'état d'authentification
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isInitialized: boolean;
  biometricEnabled: boolean;
  lastLoginDate: string | null;
}

// État initial
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  isInitialized: false,
  biometricEnabled: false,
  lastLoginDate: null,
};

// ================================
// ACTIONS ASYNCHRONES
// ================================

// Initialisation de l'app (vérification session existante)
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const [token, user, biometricEnabled] = await Promise.all([
        storageService.getToken(),
        storageService.getUser(),
        storageService.getBiometricEnabled(),
      ]);

      if (token && user) {
        // Vérifier la validité du token
        try {
          await apiService.verifyToken();
          
          // Connecter le socket
          await socketService.connect();
          
          return {
            user,
            token,
            biometricEnabled,
            isAuthenticated: true,
          };
        } catch (error) {
          // Token invalide, nettoyer le storage
          await storageService.logout();
          throw error;
        }
      }

      return {
        user: null,
        token: null,
        biometricEnabled,
        isAuthenticated: false,
      };
    } catch (error: any) {
      console.error('Auth initialization error:', error);
      return rejectWithValue(error.message || 'Erreur d\'initialisation');
    }
  }
);

// Inscription utilisateur
export const registerUser = createAsyncThunk(
  'auth/register',
  async (formData: RegisterFormData, { rejectWithValue }) => {
    try {
      const response = await apiService.registerUser({
        email: formData.email,
        phone: formData.phone,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth,
      });

      // Sauvegarder les données
      await Promise.all([
        storageService.setToken(response.token),
        storageService.setUser(response.user),
      ]);

      // Connecter le socket
      await socketService.connect();

      showMessage({
        message: 'Inscription réussie !',
        description: `Bienvenue ${response.user.firstName} !`,
        type: 'success',
      });

      return {
        user: response.user,
        token: response.token,
        lastLoginDate: new Date().toISOString(),
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de l\'inscription';
      
      showMessage({
        message: 'Erreur d\'inscription',
        description: errorMessage,
        type: 'danger',
      });

      return rejectWithValue(errorMessage);
    }
  }
);

// Connexion utilisateur
export const loginUser = createAsyncThunk(
  'auth/login',
  async (formData: LoginFormData, { rejectWithValue }) => {
    try {
      const response = await apiService.login({
        email: formData.email,
        password: formData.password,
        userType: 'user',
      });

      // Sauvegarder les données
      await Promise.all([
        storageService.setToken(response.token),
        storageService.setUser(response.user),
      ]);

      // Connecter le socket
      await socketService.connect();

      showMessage({
        message: 'Connexion réussie !',
        description: `Bon retour ${response.user.firstName} !`,
        type: 'success',
      });

      return {
        user: response.user,
        token: response.token,
        lastLoginDate: new Date().toISOString(),
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur de connexion';
      
      showMessage({
        message: 'Erreur de connexion',
        description: errorMessage,
        type: 'danger',
      });

      return rejectWithValue(errorMessage);
    }
  }
);

// Connexion biométrique
export const loginWithBiometric = createAsyncThunk(
  'auth/loginBiometric',
  async (_, { rejectWithValue }) => {
    try {
      // Récupérer les données stockées
      const [token, user] = await Promise.all([
        storageService.getToken(),
        storageService.getUser(),
      ]);

      if (!token || !user) {
        throw new Error('Aucune session biométrique trouvée');
      }

      // Vérifier la validité du token
      await apiService.verifyToken();

      // Connecter le socket
      await socketService.connect();

      showMessage({
        message: 'Connexion biométrique réussie !',
        description: `Bienvenue ${user.firstName} !`,
        type: 'success',
      });

      return {
        user,
        token,
        lastLoginDate: new Date().toISOString(),
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur de connexion biométrique';
      
      showMessage({
        message: 'Erreur biométrique',
        description: errorMessage,
        type: 'danger',
      });

      return rejectWithValue(errorMessage);
    }
  }
);

// Déconnexion
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Déconnecter le socket
      socketService.disconnect();

      // Nettoyer le stockage local
      await storageService.logout();

      showMessage({
        message: 'Déconnexion réussie',
        description: 'À bientôt !',
        type: 'info',
      });

      return null;
    } catch (error: any) {
      console.error('Logout error:', error);
      return rejectWithValue(error.message || 'Erreur de déconnexion');
    }
  }
);

// Actualiser le profil
export const refreshProfile = createAsyncThunk(
  'auth/refreshProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getProfile();
      
      // Mettre à jour le stockage local
      await storageService.setUser(response.profile);
      
      return response.profile;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur de récupération du profil');
    }
  }
);

// Mettre à jour le profil
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await apiService.updateProfile(profileData);
      
      // Mettre à jour le stockage local
      await storageService.setUser(response.profile);

      showMessage({
        message: 'Profil mis à jour !',
        description: 'Vos informations ont été sauvegardées',
        type: 'success',
      });
      
      return response.profile;
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur de mise à jour du profil';
      
      showMessage({
        message: 'Erreur de mise à jour',
        description: errorMessage,
        type: 'danger',
      });

      return rejectWithValue(errorMessage);
    }
  }
);

// Changer le mot de passe
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (
    passwordData: { currentPassword: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      await apiService.changePassword(passwordData);

      showMessage({
        message: 'Mot de passe modifié !',
        description: 'Votre mot de passe a été mis à jour avec succès',
        type: 'success',
      });

      return null;
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur de modification du mot de passe';
      
      showMessage({
        message: 'Erreur de modification',
        description: errorMessage,
        type: 'danger',
      });

      return rejectWithValue(errorMessage);
    }
  }
);

// Activer/désactiver la biométrie
export const toggleBiometric = createAsyncThunk(
  'auth/toggleBiometric',
  async (enabled: boolean, { rejectWithValue }) => {
    try {
      await storageService.setBiometricEnabled(enabled);
      
      showMessage({
        message: enabled ? 'Biométrie activée' : 'Biométrie désactivée',
        description: enabled 
          ? 'Vous pouvez maintenant vous connecter avec votre empreinte' 
          : 'La connexion biométrique a été désactivée',
        type: 'info',
      });

      return enabled;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur de configuration biométrique');
    }
  }
);

// ================================
// SLICE
// ================================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Réinitialiser l'erreur
    clearError: (state) => {
      state.error = null;
    },
    
    // Mettre à jour partiellement l'utilisateur (pour les mises à jour temps réel)
    updateUserData: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    // Forcer la déconnexion (pour les cas d'erreur 401)
    forceLogout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = 'Session expirée';
      
      // Nettoyer le stockage (sans attendre)
      storageService.logout().catch(console.error);
      socketService.disconnect();
    },
  },
  extraReducers: (builder) => {
    // Initialisation
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.biometricEnabled = action.payload.biometricEnabled;
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Inscription
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.lastLoginDate = action.payload.lastLoginDate;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Connexion
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.lastLoginDate = action.payload.lastLoginDate;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Connexion biométrique
    builder
      .addCase(loginWithBiometric.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithBiometric.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.lastLoginDate = action.payload.lastLoginDate;
        state.error = null;
      })
      .addCase(loginWithBiometric.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Déconnexion
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        return { ...initialState, isInitialized: true };
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Actualiser profil
    builder
      .addCase(refreshProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(refreshProfile.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Mettre à jour profil
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Changer mot de passe
    builder
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Biométrie
    builder
      .addCase(toggleBiometric.fulfilled, (state, action) => {
        state.biometricEnabled = action.payload;
      });
  },
});

// Export des actions
export const { clearError, updateUserData, forceLogout } = authSlice.actions;

// Export du reducer
export default authSlice.reducer;

// Sélecteurs spécialisés
export const selectAuthState = (state: { auth: AuthState }) => state.auth;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.isInitialized;
export const selectIsBiometricEnabled = (state: { auth: AuthState }) => state.auth.biometricEnabled;
export const selectLastLoginDate = (state: { auth: AuthState }) => state.auth.lastLoginDate;