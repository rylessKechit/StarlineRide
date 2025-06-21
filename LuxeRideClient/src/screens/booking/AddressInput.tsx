import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { TextInput, List, Portal, Modal, Surface, Button } from 'react-native-paper';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface AddressInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onLocationSelect?: (location: Location, address: string) => void;
  style?: any;
}

interface AddressSuggestion {
  id: string;
  address: string;
  location: Location;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  placeholder,
  value,
  onChangeText,
  onLocationSelect,
  style,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    onChangeText(suggestion.address);
    if (onLocationSelect) {
      onLocationSelect(suggestion.location, suggestion.address);
    }
    setShowSuggestions(false);
  };

  const handleTextChange = (text: string) => {
    onChangeText(text);
    
    // Simulation de suggestions d'adresses
    if (text.length > 2) {
      const mockSuggestions: AddressSuggestion[] = [
        {
          id: '1',
          address: `${text} - 1 Rue de Rivoli, Paris`,
          location: { latitude: 48.8566, longitude: 2.3522 }
        },
        {
          id: '2',
          address: `${text} - Tour Eiffel, Paris`,
          location: { latitude: 48.8584, longitude: 2.2945 }
        },
        {
          id: '3',
          address: `${text} - Louvre, Paris`,
          location: { latitude: 48.8606, longitude: 2.3376 }
        }
      ];
      setSuggestions(mockSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        label={placeholder}
        value={value}
        onChangeText={handleTextChange}
        onFocus={() => setShowSuggestions(true)}
        mode="outlined"
        style={styles.input}
      />
      
      <Portal>
        <Modal
          visible={showSuggestions && suggestions.length > 0}
          onDismiss={() => setShowSuggestions(false)}
          contentContainerStyle={styles.modal}
        >
          <Surface style={styles.suggestionsList}>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <List.Item
                  title={item.address}
                  onPress={() => handleAddressSelect(item)}
                  style={styles.suggestionItem}
                />
              )}
            />
            <Button onPress={() => setShowSuggestions(false)}>
              Fermer
            </Button>
          </Surface>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    flex: 1,
  },
  modal: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    maxHeight: '80%',
  },
  suggestionsList: {
    backgroundColor: 'white',
    borderRadius: 8,
  },
  suggestionItem: {
    paddingVertical: 8,
  },
});