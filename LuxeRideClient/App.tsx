// App.tsx

import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as PaperProvider } from 'react-native-paper';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Redux Store
import { store, persistor } from './src/store';

// Services
import { socketService } from './src/services/socket';

// Navigation
import { AppNavigator } from './src/navigation/AppNavigator';

// Theme
import { lightTheme, darkTheme } from './src/theme';

// Hooks
import { useAppSelector } from './src/store';

// Composants
import { LoadingScreen } from './src/screens/LoadingScreen';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';

// Ignorer certains avertissements en développement
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
  'Setting a timer for a long period of time',
]);

// Composant App principal avec Redux
const AppContent: React.FC = () => {
  const { theme: themeMode, isAppInitialized } = useAppSelector((state) => ({
    theme: (state as any).ui.theme,
    isAppInitialized: (state as any).auth.isInitialized,
  }));

  // Déterminer le thème à utiliser
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    // Initialisation de l'application
    const initializeApp = async () => {
      try {
        // Ici on peut ajouter d'autres initialisations
        console.log('🚀 LuxeRide Client App initialized');
      } catch (error) {
        console.error('❌ App initialization error:', error);
      }
    };

    initializeApp();

    // Cleanup lors de la fermeture de l'app
    return () => {
      socketService.cleanup();
    };
  }, []);

  // Afficher l'écran de chargement pendant l'initialisation
  if (!isAppInitialized) {
    return <LoadingScreen message="Initialisation de LuxeRide..." />;
  }

  return (
    <PaperProvider theme={theme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer theme={theme}>
          <StatusBar
            barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
            backgroundColor={theme.colors.primary}
            translucent={false}
          />
          
          <AppNavigator />
          
          {/* Messages Flash globaux */}
          <FlashMessage
            position="top"
            style={{
              marginTop: StatusBar.currentHeight || 0,
            }}
          />
        </NavigationContainer>
      </GestureHandlerRootView>
    </PaperProvider>
  );
};

// Composant App principal avec ErrorBoundary
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ReduxProvider store={store}>
        <PersistGate 
          loading={<LoadingScreen message="Chargement des données..." />} 
          persistor={persistor}
        >
          <AppContent />
        </PersistGate>
      </ReduxProvider>
    </ErrorBoundary>
  );
};

export default App;