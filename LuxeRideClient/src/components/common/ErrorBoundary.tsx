import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={errorStyles.container}>
          <Card style={errorStyles.card}>
            <Card.Content style={errorStyles.content}>
              <Icon name="alert-circle" size={64} color="#F44336" />
              <Text variant="headlineSmall" style={errorStyles.title}>
                Une erreur s'est produite
              </Text>
              <Text variant="bodyMedium" style={errorStyles.message}>
                L'application a rencontré un problème inattendu.
              </Text>
              {__DEV__ && this.state.error && (
                <Text variant="bodySmall" style={errorStyles.errorDetails}>
                  {this.state.error.message}
                </Text>
              )}
              <Button
                mode="contained"
                onPress={this.handleRetry}
                style={errorStyles.retryButton}
              >
                Réessayer
              </Button>
            </Card.Content>
          </Card>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  content: {
    alignItems: 'center',
    padding: 24,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    color: '#F44336',
  },
  message: {
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  errorDetails: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#F44336',
    fontFamily: 'monospace',
  },
  retryButton: {
    minWidth: 120,
  },
});