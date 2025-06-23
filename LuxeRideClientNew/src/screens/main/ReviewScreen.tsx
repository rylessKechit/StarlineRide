// src/screens/main/ReviewScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchBooking } from '../../store/slices/bookingSlice';
import { MainStackParamList } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { api } from '../../services/api';

type ReviewScreenProps = {
  navigation: StackNavigationProp<MainStackParamList, 'Review'>;
  route: RouteProp<MainStackParamList, 'Review'>;
};

interface ReviewForm {
  overallRating: number;
  punctualityRating: number;
  cleanlinessRating: number;
  professionalismRating: number;
  vehicleRating: number;
  comment: string;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ navigation, route }) => {
  const { bookingId } = route.params;
  const dispatch = useAppDispatch();
  const { currentBooking } = useAppSelector(state => state.bookings);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ReviewForm>({
    overallRating: 0,
    punctualityRating: 0,
    cleanlinessRating: 0,
    professionalismRating: 0,
    vehicleRating: 0,
    comment: '',
  });

  const ratingCategories = [
    {
      key: 'overallRating' as keyof ReviewForm,
      label: 'Note globale',
      icon: '⭐',
      description: 'Votre satisfaction générale',
    },
    {
      key: 'punctualityRating' as keyof ReviewForm,
      label: 'Ponctualité',
      icon: '⏰',
      description: 'Respect des horaires',
    },
    {
      key: 'cleanlinessRating' as keyof ReviewForm,
      label: 'Propreté',
      icon: '✨',
      description: 'Véhicule et chauffeur',
    },
    {
      key: 'professionalismRating' as keyof ReviewForm,
      label: 'Professionnalisme',
      icon: '👔',
      description: 'Attitude et service',
    },
    {
      key: 'vehicleRating' as keyof ReviewForm,
      label: 'Véhicule',
      icon: '🚗',
      description: 'Confort et équipements',
    },
  ];

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      if (!currentBooking || currentBooking.id !== bookingId) {
        await dispatch(fetchBooking(bookingId)).unwrap();
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les détails de la course');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const updateRating = (category: keyof ReviewForm, rating: number) => {
    setForm(prev => ({
      ...prev,
      [category]: rating,
    }));
  };

  const renderStarRating = (category: keyof ReviewForm, currentRating: number) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => updateRating(category, star)}
            style={styles.starButton}>
            <Text style={[
              styles.star,
              star <= currentRating ? styles.starFilled : styles.starEmpty,
            ]}>
              ⭐
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const validateForm = (): boolean => {
    if (form.overallRating === 0) {
      Alert.alert('Évaluation requise', 'Veuillez donner au moins une note globale');
      return false;
    }
    return true;
  };

  const handleSubmitReview = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Submit review via API
      await api.post('/reviews', {
        bookingId,
        overallRating: form.overallRating,
        punctualityRating: form.punctualityRating || form.overallRating,
        cleanlinessRating: form.cleanlinessRating || form.overallRating,
        professionalismRating: form.professionalismRating || form.overallRating,
        vehicleRating: form.vehicleRating || form.overallRating,
        comment: form.comment.trim(),
      });

      Alert.alert(
        'Merci !',
        'Votre évaluation a été envoyée avec succès. Elle nous aide à améliorer notre service.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Erreur lors de l\'envoi de l\'évaluation'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipReview = () => {
    Alert.alert(
      'Ignorer l\'évaluation',
      'Êtes-vous sûr de vouloir ignorer l\'évaluation ? Votre retour nous aide à améliorer notre service.',
      [
        { text: 'Évaluer', style: 'default' },
        {
          text: 'Ignorer',
          style: 'destructive',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Trip Summary */}
        {currentBooking && (
          <Card style={styles.tripCard}>
            <Text style={styles.sectionTitle}>Course terminée</Text>
            <View style={styles.tripSummary}>
              <View style={styles.tripRoute}>
                <Text style={styles.routeText} numberOfLines={1}>
                  📍 {currentBooking.pickupAddress}
                </Text>
                <View style={styles.routeSeparator} />
                <Text style={styles.routeText} numberOfLines={1}>
                  📍 {currentBooking.dropoffAddress}
                </Text>
              </View>
              
              {currentBooking.driver && (
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>
                    🚗 {currentBooking.driver.firstName} {currentBooking.driver.lastName}
                  </Text>
                  <Text style={styles.vehicleInfo}>
                    {currentBooking.vehicle?.brand} {currentBooking.vehicle?.model}
                  </Text>
                  <Text style={styles.priceInfo}>
                    💰 {currentBooking.finalPrice?.toFixed(2) || currentBooking.estimatedPrice.toFixed(2)}€
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Rating Section */}
        <Card style={styles.ratingCard}>
          <Text style={styles.sectionTitle}>Évaluez votre course</Text>
          <Text style={styles.ratingSubtitle}>
            Votre avis nous aide à améliorer notre service
          </Text>
          
          {ratingCategories.map((category) => (
            <View key={category.key} style={styles.ratingSection}>
              <View style={styles.ratingHeader}>
                <View style={styles.ratingLabelContainer}>
                  <Text style={styles.ratingIcon}>{category.icon}</Text>
                  <View>
                    <Text style={styles.ratingLabel}>{category.label}</Text>
                    <Text style={styles.ratingDescription}>{category.description}</Text>
                  </View>
                </View>
                <View style={styles.ratingValue}>
                  <Text style={styles.ratingScore}>
                    {Number(form[category.key]) > 0 ? `${form[category.key]}/5` : ''}
                  </Text>
                </View>
              </View>
              {renderStarRating(category.key, form[category.key] as number)}
            </View>
          ))}
        </Card>

        {/* Comment Section */}
        <Card style={styles.commentCard}>
          <Text style={styles.sectionTitle}>Commentaire (optionnel)</Text>
          <Input
            placeholder="Partagez votre expérience..."
            value={form.comment}
            onChangeText={(text) => setForm(prev => ({ ...prev, comment: text }))}
            multiline
            numberOfLines={4}
            style={styles.commentInput}
          />
        </Card>

        {/* Tips Section */}
        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Le saviez-vous ?</Text>
          <Text style={styles.tipsText}>
            Vos évaluations nous aident à maintenir un service de qualité et à récompenser 
            nos meilleurs chauffeurs. Merci de prendre le temps de nous faire vos retours !
          </Text>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          <Button
            title="Ignorer"
            onPress={handleSkipReview}
            variant="ghost"
            style={styles.skipButton}
          />
          <Button
            title={submitting ? 'Envoi...' : 'Envoyer l\'évaluation'}
            onPress={handleSubmitReview}
            loading={submitting}
            disabled={submitting || form.overallRating === 0}
            style={styles.submitButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tripCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  tripSummary: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  tripRoute: {
    marginBottom: 16,
  },
  routeText: {
    fontSize: 16,
    color: '#3C4043',
    marginVertical: 4,
  },
  routeSeparator: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E5EA',
    marginLeft: 8,
    marginVertical: 4,
  },
  driverInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 16,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  priceInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  ratingCard: {
    marginBottom: 16,
  },
  ratingSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 24,
  },
  ratingSection: {
    marginBottom: 24,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ratingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  ratingDescription: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  ratingValue: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  ratingScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  starButton: {
    marginRight: 8,
    padding: 4,
  },
  star: {
    fontSize: 24,
  },
  starFilled: {
    opacity: 1,
  },
  starEmpty: {
    opacity: 0.3,
  },
  commentCard: {
    marginBottom: 16,
  },
  commentInput: {
    marginBottom: 0,
  },
  tipsCard: {
    marginBottom: 16,
    backgroundColor: '#F0F8FF',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#3C4043',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    flex: 0.3,
    marginRight: 12,
  },
  submitButton: {
    flex: 0.7,
  },
});

export default ReviewScreen;