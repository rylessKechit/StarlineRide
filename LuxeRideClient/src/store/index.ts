// src/store/index.ts

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import des slices
import authSlice from './slices/authSlice';
import bookingSlice from './slices/bookingSlice';
import locationSlice from './slices/locationSlice';
import paymentSlice from './slices/paymentSlice';
import uiSlice from './slices/uiSlice';

// Configuration de persistance
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'ui'], // Seuls auth et ui sont persistés
  blacklist: ['booking', 'location', 'payment'], // Données temps réel non persistées
};

// Configuration de persistance pour auth (plus sélective)
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'token', 'isAuthenticated'], // Exclure isLoading et error
};

// Configuration de persistance pour UI
const uiPersistConfig = {
  key: 'ui',
  storage: AsyncStorage,
  whitelist: ['theme', 'language'], // Persister seulement les préférences
};

// Root reducer
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authSlice),
  booking: bookingSlice,
  location: locationSlice,
  payment: paymentSlice,
  ui: persistReducer(uiPersistConfig, uiSlice),
});

// Reducer persisté
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Middleware personnalisé pour les logs en développement
const loggerMiddleware = (store: any) => (next: any) => (action: any) => {
  if (__DEV__) {
    console.group(`🔄 Redux Action: ${action.type}`);
    console.log('Previous State:', store.getState());
    console.log('Action:', action);
    const result = next(action);
    console.log('Next State:', store.getState());
    console.groupEnd();
    return result;
  }
  return next(action);
};

// Configuration du store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
        ],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['items.dates'],
      },
    }).concat(__DEV__ ? [loggerMiddleware] : []),
  devTools: __DEV__,
});

// Persistor pour la persistance
export const persistor = persistStore(store);

// Types pour TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks typés pour l'utilisation dans les composants
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Actions pour nettoyer le store
export const clearStore = () => {
  persistor.purge();
  return store.dispatch({ type: 'CLEAR_STORE' });
};

// Selectors utiles
export const selectIsAuthenticated = (state: RootState) => (state as any).auth.isAuthenticated;
export const selectCurrentUser = (state: RootState) => (state as any).auth.user;
export const selectAuthToken = (state: RootState) => (state as any).auth.token;
export const selectCurrentBooking = (state: RootState) => (state as any).booking.currentBooking;
export const selectCurrentLocation = (state: RootState) => (state as any).location.currentLocation;
export const selectTheme = (state: RootState) => (state as any).ui.theme;
export const selectLanguage = (state: RootState) => (state as any).ui.language;