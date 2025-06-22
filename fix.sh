#!/bin/bash

cd LuxeRideClientNew

echo "🔧 CRÉATION DES COMPOSANTS MANQUANTS"
echo "===================================="

# 1. CRÉER LOADINGSCREEN
echo "📱 Création de LoadingScreen..."
mkdir -p src/screens
cat > src/screens/LoadingScreen.tsx << 'EOF'
import React from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';

export const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Chargement...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },
});

export default LoadingScreen;
EOF

echo "✅ LoadingScreen créé"

# 2. CRÉER ERRORBOUNDARY
echo "📱 Création de ErrorBoundary..."
mkdir -p src/components/common
cat > src/components/common/ErrorBoundary.tsx << 'EOF'
import React, {Component, ErrorInfo, ReactNode} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({hasError: false, error: undefined});
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Une erreur s'est produite</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'Une erreur inattendue s'est produite'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
EOF

echo "✅ ErrorBoundary créé"

# 3. VÉRIFIER LA STRUCTURE
echo ""
echo "📂 Structure créée:"
echo "src/screens/LoadingScreen.tsx"
echo "src/components/common/ErrorBoundary.tsx"
