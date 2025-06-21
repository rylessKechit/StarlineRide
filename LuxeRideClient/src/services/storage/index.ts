// src/services/storage/index.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserPreferences, FavoriteDestination } from '../../types';

// Clés de stockage
const STORAGE_KEYS = {
  TOKEN: '@luxeride:token',
  USER: '@luxeride:user',
  PREFERENCES: '@luxeride:preferences',
  FAVORITES: '@luxeride:favorites',
  RECENT_SEARCHES: '@luxeride:recent_searches',
  ONBOARDING_COMPLETED: '@luxeride:onboarding_completed',
  BIOMETRIC_ENABLED: '@luxeride:biometric_enabled',
  LANGUAGE: '@luxeride:language',
  THEME: '@luxeride:theme',
  LOCATION_PERMISSION: '@luxeride:location_permission',
} as const;

class StorageService {
  // ================================
  // MÉTHODES GÉNÉRIQUES
  // ================================

  private async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, serializedValue);
      
      if (__DEV__) {
        console.log(`💾 Storage SET: ${key}`, value);
      }
    } catch (error) {
      console.error(`❌ Storage SET Error for ${key}:`, error);
      throw error;
    }
  }

  private async getItem<T>(key: string): Promise<T | null> {
    try {
      const serializedValue = await AsyncStorage.getItem(key);
      
      if (serializedValue === null) {
        return null;
      }

      const value = JSON.parse(serializedValue) as T;
      
      if (__DEV__) {
        console.log(`📥 Storage GET: ${key}`, value);
      }
      
      return value;
    } catch (error) {
      console.error(`❌ Storage GET Error for ${key}:`, error);
      return null;
    }
  }

  private async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      
      if (__DEV__) {
        console.log(`🗑️ Storage REMOVE: ${key}`);
      }
    } catch (error) {
      console.error(`❌ Storage REMOVE Error for ${key}:`, error);
      throw error;
    }
  }

  private async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys as string[];
    } catch (error) {
      console.error('❌ Storage GET ALL KEYS Error:', error);
      return [];
    }
  }

  // ================================
  // AUTHENTIFICATION
  // ================================

  async setToken(token: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.TOKEN, token);
  }

  async getToken(): Promise<string | null> {
    return this.getItem<string>(STORAGE_KEYS.TOKEN);
  }

  async removeToken(): Promise<void> {
    return this.removeItem(STORAGE_KEYS.TOKEN);
  }

  async setUser(user: User): Promise<void> {
    return this.setItem(STORAGE_KEYS.USER, user);
  }

  async getUser(): Promise<User | null> {
    return this.getItem<User>(STORAGE_KEYS.USER);
  }

  async removeUser(): Promise<void> {
    return this.removeItem(STORAGE_KEYS.USER);
  }

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    return this.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled);
  }

  async getBiometricEnabled(): Promise<boolean> {
    const enabled = await this.getItem<boolean>(STORAGE_KEYS.BIOMETRIC_ENABLED);
    return enabled ?? false;
  }

  // ================================
  // ONBOARDING ET PREMIÈRE UTILISATION
  // ================================

  async setOnboardingCompleted(completed: boolean): Promise<void> {
    return this.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
  }

  async getOnboardingCompleted(): Promise<boolean> {
    const completed = await this.getItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return completed ?? false;
  }

  async setLocationPermissionRequested(requested: boolean): Promise<void> {
    return this.setItem(STORAGE_KEYS.LOCATION_PERMISSION, requested);
  }

  async getLocationPermissionRequested(): Promise<boolean> {
    const requested = await this.getItem<boolean>(STORAGE_KEYS.LOCATION_PERMISSION);
    return requested ?? false;
  }

  // ================================
  // PRÉFÉRENCES UTILISATEUR
  // ================================

  async setPreferences(preferences: UserPreferences): Promise<void> {
    return this.setItem(STORAGE_KEYS.PREFERENCES, preferences);
  }

  async getPreferences(): Promise<UserPreferences | null> {
    return this.getItem<UserPreferences>(STORAGE_KEYS.PREFERENCES);
  }

  async updatePreferences(partialPreferences: Partial<UserPreferences>): Promise<void> {
    const currentPreferences = await this.getPreferences();
    const updatedPreferences = {
      ...currentPreferences,
      ...partialPreferences,
    } as UserPreferences;
    
    return this.setPreferences(updatedPreferences);
  }

  async setLanguage(language: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.LANGUAGE, language);
  }

  async getLanguage(): Promise<string> {
    const language = await this.getItem<string>(STORAGE_KEYS.LANGUAGE);
    return language ?? 'fr'; // Français par défaut
  }

  async setTheme(theme: 'light' | 'dark' | 'auto'): Promise<void> {
    return this.setItem(STORAGE_KEYS.THEME, theme);
  }

  async getTheme(): Promise<'light' | 'dark' | 'auto'> {
    const theme = await this.getItem<'light' | 'dark' | 'auto'>(STORAGE_KEYS.THEME);
    return theme ?? 'auto';
  }

  // ================================
  // DESTINATIONS ET FAVORIS
  // ================================

  async setFavoriteDestinations(favorites: FavoriteDestination[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.FAVORITES, favorites);
  }

  async getFavoriteDestinations(): Promise<FavoriteDestination[]> {
    const favorites = await this.getItem<FavoriteDestination[]>(STORAGE_KEYS.FAVORITES);
    return favorites ?? [];
  }

  async addFavoriteDestination(favorite: FavoriteDestination): Promise<void> {
    const currentFavorites = await this.getFavoriteDestinations();
    
    // Vérifier si la destination existe déjà
    const existingIndex = currentFavorites.findIndex(f => f.id === favorite.id);
    
    if (existingIndex >= 0) {
      // Mettre à jour l'existant
      currentFavorites[existingIndex] = favorite;
    } else {
      // Ajouter le nouveau
      currentFavorites.push(favorite);
    }
    
    return this.setFavoriteDestinations(currentFavorites);
  }

  async removeFavoriteDestination(favoriteId: string): Promise<void> {
    const currentFavorites = await this.getFavoriteDestinations();
    const updatedFavorites = currentFavorites.filter(f => f.id !== favoriteId);
    return this.setFavoriteDestinations(updatedFavorites);
  }

  async updateFavoriteUsage(favoriteId: string): Promise<void> {
    const currentFavorites = await this.getFavoriteDestinations();
    const updatedFavorites = currentFavorites.map(favorite => {
      if (favorite.id === favoriteId) {
        return {
          ...favorite,
          usageCount: favorite.usageCount + 1,
          lastUsed: new Date().toISOString(),
        };
      }
      return favorite;
    });
    
    return this.setFavoriteDestinations(updatedFavorites);
  }

  // ================================
  // RECHERCHES RÉCENTES
  // ================================

  async setRecentSearches(searches: string[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.RECENT_SEARCHES, searches);
  }

  async getRecentSearches(): Promise<string[]> {
    const searches = await this.getItem<string[]>(STORAGE_KEYS.RECENT_SEARCHES);
    return searches ?? [];
  }

  async addRecentSearch(search: string): Promise<void> {
    const currentSearches = await this.getRecentSearches();
    
    // Supprimer la recherche si elle existe déjà
    const filteredSearches = currentSearches.filter(s => s.toLowerCase() !== search.toLowerCase());
    
    // Ajouter la nouvelle recherche au début
    const updatedSearches = [search, ...filteredSearches];
    
    // Limiter à 10 recherches récentes
    const limitedSearches = updatedSearches.slice(0, 10);
    
    return this.setRecentSearches(limitedSearches);
  }

  async clearRecentSearches(): Promise<void> {
    return this.setRecentSearches([]);
  }

  // ================================
  // CACHE DE DONNÉES
  // ================================

  private getCacheKey(endpoint: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `@luxeride:cache:${endpoint}:${paramString}`;
  }

  async setCachedData<T>(
    endpoint: string, 
    data: T, 
    ttl: number = 300000, // 5 minutes par défaut
    params?: any
  ): Promise<void> {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    
    return this.setItem(cacheKey, cacheData);
  }

  async getCachedData<T>(endpoint: string, params?: any): Promise<T | null> {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cacheData = await this.getItem<{
      data: T;
      timestamp: number;
      ttl: number;
    }>(cacheKey);
    
    if (!cacheData) {
      return null;
    }
    
    // Vérifier si le cache est expiré
    const isExpired = Date.now() - cacheData.timestamp > cacheData.ttl;
    
    if (isExpired) {
      await this.removeItem(cacheKey);
      return null;
    }
    
    return cacheData.data;
  }

  async clearCache(): Promise<void> {
    try {
      const allKeys = await this.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith('@luxeride:cache:'));
      
      await AsyncStorage.multiRemove(cacheKeys);
      
      if (__DEV__) {
        console.log(`🧹 Cache cleared: ${cacheKeys.length} items removed`);
      }
    } catch (error) {
      console.error('❌ Cache clear error:', error);
    }
  }

  // ================================
  // DONNÉES OFFLINE
  // ================================

  async setOfflineBookings(bookings: any[]): Promise<void> {
    return this.setItem('@luxeride:offline:bookings', bookings);
  }

  async getOfflineBookings(): Promise<any[]> {
    const bookings = await this.getItem<any[]>('@luxeride:offline:bookings');
    return bookings ?? [];
  }

  async addOfflineBooking(booking: any): Promise<void> {
    const currentBookings = await this.getOfflineBookings();
    const updatedBookings = [booking, ...currentBookings];
    return this.setOfflineBookings(updatedBookings);
  }

  async removeOfflineBooking(bookingId: string): Promise<void> {
    const currentBookings = await this.getOfflineBookings();
    const updatedBookings = currentBookings.filter(b => b.id !== bookingId);
    return this.setOfflineBookings(updatedBookings);
  }

  // ================================
  // GESTION DES ERREURS ET LOGS
  // ================================

  async setErrorLogs(logs: any[]): Promise<void> {
    return this.setItem('@luxeride:error_logs', logs);
  }

  async getErrorLogs(): Promise<any[]> {
    const logs = await this.getItem<any[]>('@luxeride:error_logs');
    return logs ?? [];
  }

  async addErrorLog(error: any): Promise<void> {
    const currentLogs = await this.getErrorLogs();
    const errorLog = {
      ...error,
      timestamp: new Date().toISOString(),
      id: Date.now().toString(),
    };
    
    const updatedLogs = [errorLog, ...currentLogs];
    // Limiter à 50 logs
    const limitedLogs = updatedLogs.slice(0, 50);
    
    return this.setErrorLogs(limitedLogs);
  }

  async clearErrorLogs(): Promise<void> {
    return this.setErrorLogs([]);
  }

  // ================================
  // CONFIGURATION APP
  // ================================

  async setAppVersion(version: string): Promise<void> {
    return this.setItem('@luxeride:app_version', version);
  }

  async getAppVersion(): Promise<string | null> {
    return this.getItem<string>('@luxeride:app_version');
  }

  async setFirstLaunch(isFirst: boolean): Promise<void> {
    return this.setItem('@luxeride:first_launch', isFirst);
  }

  async getFirstLaunch(): Promise<boolean> {
    const isFirst = await this.getItem<boolean>('@luxeride:first_launch');
    return isFirst ?? true;
  }

  // ================================
  // UTILITAIRES
  // ================================

  async clearAllData(): Promise<void> {
    try {
      const allKeys = await this.getAllKeys();
      const luxeRideKeys = allKeys.filter(key => key.startsWith('@luxeride:'));
      
      await AsyncStorage.multiRemove(luxeRideKeys);
      
      if (__DEV__) {
        console.log(`🧹 All data cleared: ${luxeRideKeys.length} items removed`);
      }
    } catch (error) {
      console.error('❌ Clear all data error:', error);
      throw error;
    }
  }

  async getStorageSize(): Promise<{
    totalKeys: number;
    luxeRideKeys: number;
    estimatedSize: string;
  }> {
    try {
      const allKeys = await this.getAllKeys();
      const luxeRideKeys = allKeys.filter(key => key.startsWith('@luxeride:'));
      
      // Estimation approximative de la taille
      let totalSize = 0;
      for (const key of luxeRideKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length * 2; // UTF-16 encoding
        }
      }
      
      const sizeInKB = (totalSize / 1024).toFixed(2);
      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
      
      const estimatedSize = totalSize > 1024 * 1024 
        ? `${sizeInMB} MB` 
        : `${sizeInKB} KB`;
      
      return {
        totalKeys: allKeys.length,
        luxeRideKeys: luxeRideKeys.length,
        estimatedSize,
      };
    } catch (error) {
      console.error('❌ Get storage size error:', error);
      return {
        totalKeys: 0,
        luxeRideKeys: 0,
        estimatedSize: '0 KB',
      };
    }
  }

  async exportData(): Promise<Record<string, any>> {
    try {
      const allKeys = await this.getAllKeys();
      const luxeRideKeys = allKeys.filter(key => key.startsWith('@luxeride:'));
      
      const exportData: Record<string, any> = {};
      
      for (const key of luxeRideKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            exportData[key] = JSON.parse(value);
          } catch {
            exportData[key] = value;
          }
        }
      }
      
      return {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        data: exportData,
      };
    } catch (error) {
      console.error('❌ Export data error:', error);
      throw error;
    }
  }

  async importData(importData: Record<string, any>): Promise<void> {
    try {
      if (!importData.data || typeof importData.data !== 'object') {
        throw new Error('Invalid import data format');
      }
      
      const entries = Object.entries(importData.data);
      
      for (const [key, value] of entries) {
        if (key.startsWith('@luxeride:')) {
          await this.setItem(key, value);
        }
      }
      
      if (__DEV__) {
        console.log(`📥 Data imported: ${entries.length} items`);
      }
    } catch (error) {
      console.error('❌ Import data error:', error);
      throw error;
    }
  }

  // ================================
  // HELPERS SPÉCIFIQUES
  // ================================

  async isLoggedIn(): Promise<boolean> {
    const token = await this.getToken();
    const user = await this.getUser();
    return !!(token && user);
  }

  async logout(): Promise<void> {
    await Promise.all([
      this.removeToken(),
      this.removeUser(),
      this.clearCache(),
    ]);
    
    if (__DEV__) {
      console.log('👋 User logged out, data cleared');
    }
  }

  async getDefaultPreferences(): Promise<UserPreferences> {
    return {
      notifications: {
        bookingUpdates: true,
        promotions: true,
        newsAndUpdates: false,
        soundEnabled: true,
        vibrationEnabled: true,
      },
      privacy: {
        shareLocation: true,
        dataAnalytics: true,
        marketingEmails: false,
      },
      app: {
        theme: 'auto',
        language: 'fr',
        currency: 'EUR',
        units: 'metric',
      },
      booking: {
        defaultVehicleCategory: 'BERLINE_EXECUTIVE',
        autoConfirmFavoriteDrivers: false,
        allowSharedRides: true,
        defaultTipPercentage: 10,
      },
    };
  }
}

// Export singleton
export const storageService = new StorageService();

// Export des méthodes principales pour faciliter l'utilisation
export const {
  // Auth
  setToken,
  getToken,
  removeToken,
  setUser,
  getUser,
  removeUser,
  setBiometricEnabled,
  getBiometricEnabled,
  
  // Onboarding
  setOnboardingCompleted,
  getOnboardingCompleted,
  setLocationPermissionRequested,
  getLocationPermissionRequested,
  
  // Preferences
  setPreferences,
  getPreferences,
  updatePreferences,
  setLanguage,
  getLanguage,
  setTheme,
  getTheme,
  
  // Favorites
  setFavoriteDestinations,
  getFavoriteDestinations,
  addFavoriteDestination,
  removeFavoriteDestination,
  updateFavoriteUsage,
  
  // Recent searches
  setRecentSearches,
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
  
  // Cache
  setCachedData,
  getCachedData,
  clearCache,
  
  // Offline
  setOfflineBookings,
  getOfflineBookings,
  addOfflineBooking,
  removeOfflineBooking,
  
  // Utils
  clearAllData,
  getStorageSize,
  exportData,
  importData,
  isLoggedIn,
  logout,
  getDefaultPreferences,
} = storageService;