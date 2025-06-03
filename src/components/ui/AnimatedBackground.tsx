import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AnimatedBackgroundProps {
  children: React.ReactNode;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ children }) => {
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating particles animation
    const animateParticles = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(particle1, {
              toValue: 1,
              duration: 8000,
              useNativeDriver: true,
            }),
            Animated.timing(particle1, {
              toValue: 0,
              duration: 8000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(particle2, {
              toValue: 1,
              duration: 12000,
              useNativeDriver: true,
            }),
            Animated.timing(particle2, {
              toValue: 0,
              duration: 12000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(particle3, {
              toValue: 1,
              duration: 10000,
              useNativeDriver: true,
            }),
            Animated.timing(particle3, {
              toValue: 0,
              duration: 10000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    // Gradient animation
    const animateGradient = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(gradientAnim, {
            toValue: 1,
            duration: 6000,
            useNativeDriver: false,
          }),
          Animated.timing(gradientAnim, {
            toValue: 0,
            duration: 6000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    animateParticles();
    animateGradient();
  }, []);

  const particle1Style = {
    transform: [
      {
        translateX: particle1.interpolate({
          inputRange: [0, 1],
          outputRange: [0, screenWidth * 0.8],
        }),
      },
      {
        translateY: particle1.interpolate({
          inputRange: [0, 1],
          outputRange: [screenHeight, -100],
        }),
      },
      {
        rotate: particle1.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
    opacity: particle1.interpolate({
      inputRange: [0, 0.2, 0.8, 1],
      outputRange: [0, 0.6, 0.6, 0],
    }),
  };

  const particle2Style = {
    transform: [
      {
        translateX: particle2.interpolate({
          inputRange: [0, 1],
          outputRange: [screenWidth, -100],
        }),
      },
      {
        translateY: particle2.interpolate({
          inputRange: [0, 1],
          outputRange: [screenHeight * 0.8, screenHeight * 0.2],
        }),
      },
      {
        scale: particle2.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.5, 1.2, 0.5],
        }),
      },
    ],
    opacity: particle2.interpolate({
      inputRange: [0, 0.3, 0.7, 1],
      outputRange: [0, 0.4, 0.4, 0],
    }),
  };

  const particle3Style = {
    transform: [
      {
        translateX: particle3.interpolate({
          inputRange: [0, 1],
          outputRange: [screenWidth * 0.2, screenWidth * 0.9],
        }),
      },
      {
        translateY: particle3.interpolate({
          inputRange: [0, 1],
          outputRange: [screenHeight * 0.9, screenHeight * 0.1],
        }),
      },
    ],
    opacity: particle3.interpolate({
      inputRange: [0, 0.4, 0.6, 1],
      outputRange: [0, 0.3, 0.3, 0],
    }),
  };

  return (
    <View style={styles.container}>
      {/* Animated Gradient Background */}
      <Animated.View style={styles.gradientContainer}>
        <LinearGradient
          colors={[
            colors.brand.background,
            '#1a1a1a',
            colors.brand.darkGray,
          ]}
          style={styles.gradient}
          locations={[0, 0.6, 1]}
        />
      </Animated.View>

      {/* Floating Particles */}
      <Animated.View style={[styles.particle, styles.particle1, particle1Style]}>
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.3)', 'rgba(255, 193, 7, 0.1)']}
          style={styles.particleGradient}
        />
      </Animated.View>

      <Animated.View style={[styles.particle, styles.particle2, particle2Style]}>
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 193, 7, 0.05)']}
          style={styles.particleGradient}
        />
      </Animated.View>

      <Animated.View style={[styles.particle, styles.particle3, particle3Style]}>
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 193, 7, 0.03)']}
          style={styles.particleGradient}
        />
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradientContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
  },
  particle1: {
    width: 100,
    height: 100,
    left: -50,
    top: screenHeight,
  },
  particle2: {
    width: 80,
    height: 80,
    right: -40,
    top: screenHeight * 0.8,
  },
  particle3: {
    width: 60,
    height: 60,
    left: screenWidth * 0.2,
    top: screenHeight * 0.9,
  },
  particleGradient: {
    flex: 1,
    borderRadius: 50,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
}); 