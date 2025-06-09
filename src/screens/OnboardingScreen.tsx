import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Animated,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { STORAGE_KEYS } from '../constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  feature: string;
  backgroundImage: any;
  iconName: string;
  gradientColors: [string, string, string];
}

const onboardingSlides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Bem-vindo ao Eventy',
    subtitle: 'A plataforma definitiva para experiências culturais',
    description: 'Conectamos você aos melhores shows, peças teatrais, concertos e eventos culturais. Sua próxima experiência inesquecível está aqui.',
    feature: 'Descobrir Eventos',
    backgroundImage: require('../../assets/backgrounds/step1.jpeg'),
    iconName: 'sparkles',
    gradientColors: ['rgba(0,0,0,0.75)', 'rgba(255,215,0,0.15)', 'rgba(0,0,0,0.85)'],
  },
  {
    id: '2',
    title: 'Ingressos Inteligentes',
    subtitle: 'Tecnologia que garante sua entrada',
    description: 'Sistema de QR codes únicos, pagamento seguro e verificação em tempo real. Nunca mais se preocupe com ingressos falsos ou problemas na entrada.',
    feature: 'Segurança Total',
    backgroundImage: require('../../assets/backgrounds/step2.jpeg'),
    iconName: 'shield-checkmark',
    gradientColors: ['rgba(0,0,0,0.75)', 'rgba(255,215,0,0.15)', 'rgba(0,0,0,0.85)'],
  },
  {
    id: '3',
    title: 'EvenLove',
    subtitle: 'Encontre pessoas que amam cultura como você',
    description: 'Nossa IA conecta pessoas com gostos similares. Faça amizades, encontre companhia para eventos e expanda seu círculo cultural.',
    feature: 'Conexões Reais',
    backgroundImage: require('../../assets/backgrounds/step3.jpeg'),
    iconName: 'people',
    gradientColors: ['rgba(0,0,0,0.75)', 'rgba(255,215,0,0.15)', 'rgba(0,0,0,0.85)'],
  },
  {
    id: '4',
    title: 'Para Organizadores',
    subtitle: 'Ferramentas profissionais de gestão',
    description: 'Dashboard completo com analytics, gestão de vendas, controle de acesso e relatórios em tempo real. Maximize o sucesso dos seus eventos.',
    feature: 'Gestão Completa',
    backgroundImage: require('../../assets/backgrounds/step4.jpeg'),
    iconName: 'analytics',
    gradientColors: ['rgba(0,0,0,0.75)', 'rgba(255,215,0,0.15)', 'rgba(0,0,0,0.85)'],
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();



  const viewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }, []);

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (currentIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      await handleComplete();
    }
  };

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await handleComplete();
  };

  const handleComplete = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      onComplete();
    } catch (error) {
      console.error('Erro ao finalizar onboarding:', error);
      onComplete();
    }
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [
      (index - 1) * screenWidth,
      index * screenWidth,
      (index + 1) * screenWidth,
    ];

    const imageScale = scrollX.interpolate({
      inputRange,
      outputRange: [1.1, 1, 1.1],
      extrapolate: 'clamp',
    });

    const contentOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    const contentTranslateY = scrollX.interpolate({
      inputRange,
      outputRange: [30, 0, 30],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.imageContainer, { transform: [{ scale: imageScale }] }]}>
          <ImageBackground
            source={item.backgroundImage}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            {/* Blur Overlay com gradiente dourado/preto */}
            <LinearGradient
              colors={item.gradientColors}
              style={styles.overlay}
              locations={[0, 0.4, 1]}
            />
            
            {/* Blur adicional para melhor legibilidade */}
            <View style={styles.blurOverlay} />
          </ImageBackground>
        </Animated.View>

        <Animated.View 
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          {/* Feature Badge */}
          <View style={styles.featureBadge}>
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.25)', 'rgba(255, 193, 7, 0.15)']}
              style={styles.badgeGradient}
            >
              <Ionicons name={item.iconName as any} size={16} color="#FFD700" />
              <Text style={styles.featureText}>{item.feature}</Text>
            </LinearGradient>
          </View>

          {/* Main Content */}
          <View style={styles.textContent}>
            <View style={styles.titleContainer}>
              {item.title === 'Bem-vindo ao Eventy' ? (
                <Text style={styles.title}>
                  Bem-vindo ao{' '}
                  <Text style={[styles.title, styles.gradientText]}>Eventy</Text>
                </Text>
              ) : (
                <Text style={styles.title}>{item.title}</Text>
              )}
            </View>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${((index + 1) / onboardingSlides.length) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {index + 1} de {onboardingSlides.length}
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {onboardingSlides.map((_, index) => {
          const inputRange = [
            (index - 1) * screenWidth,
            index * screenWidth,
            (index + 1) * screenWidth,
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [1, 1.5, 1],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const isLastSlide = currentIndex === onboardingSlides.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        keyExtractor={(item) => item.id}
        bounces={false}
        decelerationRate="fast"
        snapToAlignment="center"
        snapToInterval={screenWidth}
        getItemLayout={(data, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />

      {/* Navigation */}
      <View style={[styles.navigationContainer, { paddingBottom: insets.bottom + 4 }]}>
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
          style={styles.navigationGradient}
        >
          <View style={styles.navigation}>
            {/* Skip Button */}
            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={handleSkip}
              activeOpacity={0.8}
            >
              <Text style={styles.skipText}>
                {isLastSlide ? 'Entrar' : 'Pular'}
              </Text>
            </TouchableOpacity>

            {/* Pagination */}
            {renderPagination()}

            {/* Next Button */}
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={handleNext}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#FFD700', '#FFC107', '#FF8F00']}
                style={styles.nextButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons
                  name={isLastSlide ? 'checkmark' : 'arrow-forward'}
                  size={20}
                  color="#000"
                  style={{ fontWeight: 'bold' }}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
    width: screenWidth,
    height: screenHeight,
    position: 'relative',
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  backgroundImage: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  content: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    zIndex: 10,
  },
  featureBadge: {
    alignSelf: 'flex-start',
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  textContent: {
    marginBottom: 32,
  },
  titleContainer: {
    marginBottom: 12,
  },

  gradientText: {
    color: '#FFD700',
    fontWeight: '900',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 50,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 16,
    lineHeight: 24,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 24,
    letterSpacing: 0.1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressSection: {
    gap: 12,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  navigationGradient: {
    paddingTop: 16,
    paddingHorizontal: 32,
    paddingBottom: 12,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 80,
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  nextButton: {
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  nextButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OnboardingScreen; 