// src/screens/tracking/LiveTrackingModalWrapper.tsx

import React from 'react';
import { LiveTrackingScreen } from './LiveTrackingScreen';
import { useLiveTrackingRoute } from '../../navigation/AppNavigator';

// Wrapper pour gérer les props de navigation dans le contexte modal
export const LiveTrackingModalWrapper: React.FC = () => {
  const route = useLiveTrackingRoute();
  
  // Passer les paramètres de route au composant LiveTrackingScreen
  return (
    <LiveTrackingScreen 
      route={{
        params: {
          bookingId: route.params.bookingId
        }
      }}
    />
  );
};