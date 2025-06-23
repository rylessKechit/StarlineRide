// src/store/slices/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState, Location } from '../../types';

const initialState: UIState = {
  theme: 'light',
  language: 'fr',
  notifications: true,
  location: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setNotifications: (state, action: PayloadAction<boolean>) => {
      state.notifications = action.payload;
    },
    setLocation: (state, action: PayloadAction<Location | null>) => {
      state.location = action.payload;
    },
  },
});

export const { setTheme, setLanguage, setNotifications, setLocation } = uiSlice.actions;
export default uiSlice.reducer;