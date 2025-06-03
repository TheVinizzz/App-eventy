import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

interface LoadingScreenProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Carregando eventos...',
  size = 'large',
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animação de rotação contínua
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Animação de pulso
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Animação de fade in
    const fadeAnimation = Animated.timing(fadeValue, {
      toValue: 1,
      duration: 500,
      easing: Easing.ease,
      useNativeDriver: true,
    });

    spinAnimation.start();
    pulseAnimation.start();
    fadeAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
      fadeAnimation.stop();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSize = () => {
    switch (size) {
      case 'small':
        return 40;
      case 'medium':
        return 60;
      case 'large':
        return 80;
      default:
        return 80;
    }
  };

  const iconSize = getSize();
  const containerStyle = size === 'large' ? styles.fullScreenContainer : styles.inlineContainer;

  return (
    <Animated.View style={[containerStyle, { opacity: fadeValue }]}>
      <View style={styles.loadingContent}>
        {/* Círculo de fundo com gradiente */}
        <View style={[styles.circleContainer, { width: iconSize + 40, height: iconSize + 40 }]}>
          <LinearGradient
            colors={[colors.brand.primary, colors.brand.secondary]}
            style={styles.gradientCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Ícone rotativo */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [
                    { rotate: spin },
                    { scale: pulseValue },
                  ],
                },
              ]}
            >
              <Ionicons
                name="flash"
                size={iconSize * 0.6}
                color={colors.brand.background}
              />
            </Animated.View>
          </LinearGradient>
        </View>

        {/* Pontos animados ao redor */}
        <View style={[styles.dotsContainer, { width: iconSize + 80, height: iconSize + 80 }]}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <AnimatedDot key={index} index={index} size={iconSize} />
          ))}
        </View>

        {/* Texto de loading */}
        {size === 'large' && (
          <Text style={styles.loadingText}>{message}</Text>
        )}
      </View>
    </Animated.View>
  );
};

// Componente para os pontos animados
const AnimatedDot: React.FC<{ index: number; size: number }> = ({ index, size }) => {
  const dotValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dotAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(index * 200),
        Animated.timing(dotValue, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotValue, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    dotAnimation.start();

    return () => dotAnimation.stop();
  }, [index]);

  const angle = (index * 60) * (Math.PI / 180);
  const radius = (size + 80) / 2;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  const dotOpacity = dotValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const dotScale = dotValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          transform: [
            { translateX: x },
            { translateY: y },
            { scale: dotScale },
          ],
          opacity: dotOpacity,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.brand.background,
  },
  inlineContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 1000,
    elevation: 8,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
  },
  loadingText: {
    marginTop: spacing.xl,
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
    textAlign: 'center',
  },
}); 