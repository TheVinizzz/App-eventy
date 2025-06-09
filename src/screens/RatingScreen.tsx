import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { RootStackParamList } from '../navigation/types';
import { colors, typography, spacing, borderRadius } from '../theme';
import { EventRatingService } from '../services/EventRatingService';
import { useAuth } from '../contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

type RatingScreenRouteProp = RouteProp<RootStackParamList, 'Rating'>;
type RatingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Rating'>;

interface RatingScreenProps {
  route: RatingScreenRouteProp;
  navigation: RatingScreenNavigationProp;
}

interface StarAnimations {
  [key: number]: Animated.Value;
}

const RatingScreen: React.FC<RatingScreenProps> = ({ route, navigation }) => {
  const { eventId, eventTitle } = route.params;
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [starAnimations, setStarAnimations] = useState<StarAnimations>({});

  const eventRatingService = new EventRatingService();

  useEffect(() => {
    // Inicializar animações das estrelas
    const newAnimations: StarAnimations = {};
    for (let i = 1; i <= 5; i++) {
      newAnimations[i] = new Animated.Value(1);
    }
    setStarAnimations(newAnimations);
  }, []);

  const animateStar = (starNumber: number) => {
    if (!starAnimations[starNumber]) return;

    Animated.sequence([
      Animated.timing(starAnimations[starNumber], {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(starAnimations[starNumber], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleStarPress = (starNumber: number) => {
    setRating(starNumber);
    animateStar(starNumber);
    
    // Haptic feedback diferenciado por nota
    if (starNumber <= 2) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (starNumber <= 3) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Avaliação necessária', 'Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    setIsSubmitting(true);

    try {
      await eventRatingService.submitRating(
        eventId,
        rating,
        comment.trim() || undefined
      );

      // Haptic de sucesso
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Obrigado!',
        'Sua avaliação foi enviada com sucesso. Isso nos ajuda a melhorar a experiência para todos!',
        [
          {
            text: 'Continuar',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erro ao enviar avaliação:', error);
      
      Alert.alert(
        'Erro ao enviar',
        error.message || 'Não foi possível enviar sua avaliação. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = () => {
    switch (rating) {
      case 1: return { text: 'Muito ruim', emoji: '😞', color: '#FF6B6B' };
      case 2: return { text: 'Ruim', emoji: '😕', color: '#FF8E8E' };
      case 3: return { text: 'Regular', emoji: '😐', color: '#FFA726' };
      case 4: return { text: 'Bom', emoji: '😊', color: '#4ECDC4' };
      case 5: return { text: 'Excelente!', emoji: '🤩', color: colors.brand.primary };
      default: return { text: 'Toque nas estrelas para avaliar', emoji: '⭐', color: colors.brand.textSecondary };
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
            style={styles.starButton}
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.starWrapper,
                {
                  transform: [
                    {
                      scale: starAnimations[star] || new Animated.Value(1),
                    },
                  ],
                },
              ]}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={42}
                color={star <= rating ? colors.brand.primary : colors.brand.textSecondary}
                style={styles.starIcon}
              />
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonContainer}>
              <Ionicons name="arrow-back" size={24} color={colors.brand.textPrimary} />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Avaliar Evento</Text>
          <View style={styles.headerSpacer} />
        </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Event Info */}
        <View style={styles.eventInfo}>
          <View style={styles.eventIconContainer}>
            <LinearGradient
              colors={[colors.brand.primary, colors.brand.secondary]}
              style={styles.eventIconGradient}
            >
              <Ionicons name="calendar" size={28} color="white" />
            </LinearGradient>
          </View>
          <Text style={styles.eventTitle}>{eventTitle}</Text>
          <Text style={styles.eventSubtitle}>Como foi sua experiência?</Text>
        </View>

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>Sua avaliação</Text>
          
          {renderStars()}
          
          <View style={styles.ratingFeedback}>
            <Text style={styles.ratingEmoji}>{getRatingText().emoji}</Text>
            <Text style={[styles.ratingText, { color: getRatingText().color }]}>
              {getRatingText().text}
            </Text>
          </View>
        </View>

        {/* Comment Section */}
        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>
            Comentário <Text style={styles.optional}>(opcional)</Text>
          </Text>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Conte como foi sua experiência no evento..."
              placeholderTextColor={colors.brand.textSecondary}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
          </View>
          <Text style={styles.characterCount}>{comment.length}/500</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            rating === 0 && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitRating}
          disabled={isSubmitting || rating === 0}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              rating === 0
                ? [colors.brand.darkGray, colors.brand.darkGray]
                : [colors.brand.primary, colors.brand.secondary]
            }
            style={styles.submitButtonGradient}
          >
            {isSubmitting ? (
              <Text style={[styles.submitButtonText, rating > 0 && styles.submitButtonTextActive]}>Enviando...</Text>
            ) : (
              <>
                <Ionicons name="send" size={20} color={rating > 0 ? "black" : "white"} style={styles.submitIcon} />
                <Text style={[styles.submitButtonText, rating > 0 && styles.submitButtonTextActive]}>Enviar Avaliação</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Help Text */}
        <View style={styles.helpSection}>
          <Text style={styles.helpText}>
            💡 Sua avaliação é anônima e ajuda outros usuários a descobrir eventos incríveis!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  backButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.darkGray + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  eventInfo: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  eventIconContainer: {
    marginBottom: spacing.lg,
  },
  eventIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: typography.fontSizes.xl * 1.2,
  },
  eventSubtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
  ratingSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  ratingLabel: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xl,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    width: '100%',
  },
  starButton: {
    padding: spacing.sm,
    flex: 1,
    alignItems: 'center',
    maxWidth: 60,
  },
  starWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.4,
  },
  starIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  starIconActive: {
    textShadowColor: colors.brand.primary + '60',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  ratingFeedback: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  commentSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  commentLabel: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.md,
  },
  optional: {
    fontWeight: typography.fontWeights.normal,
    color: colors.brand.textSecondary,
  },
  textInputContainer: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  textInput: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    minHeight: 120,
  },
  characterCount: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  submitButton: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  submitIcon: {
    marginRight: spacing.sm,
  },
  submitButtonText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: 'white',
  },
  submitButtonTextActive: {
    color: 'black',
  },
  helpSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  helpText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSizes.sm * 1.4,
  },
});

export default RatingScreen; 