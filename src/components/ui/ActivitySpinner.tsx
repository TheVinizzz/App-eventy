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

interface ActivitySpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  showMessage?: boolean;
  color?: string;
}

export const ActivitySpinner: React.FC<ActivitySpinnerProps> = ({
  size = 'medium',
  message = 'Carregando atividades...',
  showMessage = true,
  color = colors.brand.primary,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const dotsValue = useRef(new Animated.Value(0)).current;

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

    // Animação de pulso sutil
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Animação de fade in suave
    const fadeAnimation = Animated.timing(fadeValue, {
      toValue: 1,
      duration: 400,
      easing: Easing.ease,
      useNativeDriver: true,
    });

    // Animação dos pontos orbitais
    const dotsAnimation = Animated.loop(
      Animated.timing(dotsValue, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    spinAnimation.start();
    pulseAnimation.start();
    fadeAnimation.start();
    dotsAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
      fadeAnimation.stop();
      dotsAnimation.stop();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const dotsRotation = dotsValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSizes = () => {
    switch (size) {
      case 'small':
        return {
          container: 32,
          icon: 16,
          orbit: 48,
          dot: 4,
        };
      case 'medium':
        return {
          container: 48,
          icon: 24,
          orbit: 72,
          dot: 6,
        };
      case 'large':
        return {
          container: 64,
          icon: 32,
          orbit: 96,
          dot: 8,
        };
      default:
        return {
          container: 48,
          icon: 24,
          orbit: 72,
          dot: 6,
        };
    }
  };

  const sizes = getSizes();

  return (
    <Animated.View style={[styles.container, { opacity: fadeValue }]}>
      {/* Orbital Dots Container */}
      <View style={[styles.orbitContainer, { width: sizes.orbit, height: sizes.orbit }]}>
        <Animated.View
          style={[
            styles.orbit,
            {
              transform: [{ rotate: dotsRotation }],
            },
          ]}
        >
          {/* Orbital Dots */}
          {[0, 1, 2].map((index) => (
            <OrbitDot
              key={index}
              index={index}
              total={3}
              radius={sizes.orbit / 2}
              size={sizes.dot}
              color={color}
            />
          ))}
        </Animated.View>
      </View>

      {/* Central Spinner */}
      <View style={[styles.spinnerContainer, { width: sizes.container, height: sizes.container }]}>
        <LinearGradient
          colors={[color, `${color}80`, color]}
          style={styles.gradientCircle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
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
              size={sizes.icon}
              color={colors.brand.background}
            />
          </Animated.View>
        </LinearGradient>
      </View>

      {/* Loading Message */}
      {showMessage && message && size !== 'small' && (
        <Animated.View style={[styles.messageContainer, { opacity: fadeValue }]}>
          <Text style={[styles.messageText, { color }]}>
            {message}
          </Text>
          <LoadingDots color={color} />
        </Animated.View>
      )}
    </Animated.View>
  );
};

// Componente para os pontos orbitais
const OrbitDot: React.FC<{
  index: number;
  total: number;
  radius: number;
  size: number;
  color: string;
}> = ({ index, total, radius, size, color }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(index * 200),
        Animated.timing(animValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [index]);

  const angle = (index * (360 / total)) * (Math.PI / 180);
  const x = Math.cos(angle) * radius - size / 2;
  const y = Math.sin(angle) * radius - size / 2;

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1.2],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: x + radius,
          top: y + radius,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
};

// Componente para os pontos animados do texto
const LoadingDots: React.FC<{ color: string }> = ({ color }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createDotAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(600 - delay),
        ])
      );
    };

    const anim1 = createDotAnimation(dot1, 0);
    const anim2 = createDotAnimation(dot2, 200);
    const anim3 = createDotAnimation(dot3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  return (
    <View style={styles.dotsContainer}>
      {[dot1, dot2, dot3].map((animValue, index) => (
        <Animated.View
          key={index}
          style={[
            styles.loadingDot,
            {
              backgroundColor: color,
              opacity: animValue,
              transform: [
                {
                  scale: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  orbitContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbit: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 1000,
    elevation: 4,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gradientCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  messageText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
});

export default ActivitySpinner; 