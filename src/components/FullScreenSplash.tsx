import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Image,
  StatusBar,
} from 'react-native';
import { colors } from '../theme';

const { width, height } = Dimensions.get('window');

interface FullScreenSplashProps {
  onFinish?: () => void;
}

export default function FullScreenSplash({ onFinish }: FullScreenSplashProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    console.log('🚀 FullScreenSplash iniciada');

    // Timeout para finalizar splash
    const timer = setTimeout(() => {
      // Fade out suave
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        console.log('✨ FullScreenSplash concluída');
        onFinish?.();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar hidden />
      <Image 
        source={require('../../assets/splash-icon.png')}
        style={styles.fullScreenImage}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
    zIndex: 9999,
    backgroundColor: colors.brand.background,
  },
  fullScreenImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    resizeMode: 'cover',
  },
}); 