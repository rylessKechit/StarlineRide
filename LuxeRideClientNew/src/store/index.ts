import { configureStore } from '@reduxjs/toolkit';
import { useSelector, TypedUseSelectorHook } from 'react-redux';

// État initial simple
const initialState = {
  user: null,
  isLoading: false,
  theme: 'light',
  auth: {
    isInitialized: true, // Toujours initialisé pour éviter le blocage
    isAuthenticated: false,
    user: null,
  },
  ui: {
    theme: 'light',
  },
};

// Reducer simple
const rootReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        auth: {
          ...state.auth,
          user: action.payload,
          isAuthenticated: !!action.payload,
        },
      };
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
        ui: {
          ...state.ui,
          theme: action.payload,
        },
      };
    default:
      return state;
  }
};

// Store simple sans persist
export const store = configureStore({
  reducer: rootReducer,
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hook typé
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Actions
export const setLoading = (loading: boolean) => ({
  type: 'SET_LOADING',
  payload: loading,
});

export const setUser = (user: any) => ({
  type: 'SET_USER',
  payload: user,
});

export const setTheme = (theme: string) => ({
  type: 'SET_THEME',
  payload: theme,
});
