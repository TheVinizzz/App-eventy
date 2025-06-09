import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Vibration,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface CustomAlertProps {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 3500,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 7,
        }),
      ]).start();

      // Pulse animation for error/warning
      if (type === 'error' || type === 'warning') {
        const pulseAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        );
        pulseAnimation.start();

        // Auto-close timer
        if (autoClose) {
          setTimeout(() => {
            pulseAnimation.stop();
            handleClose();
          }, autoCloseDelay);
        }
      } else if (autoClose) {
        // Auto-close for success/info
        setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
      }

      // Vibration feedback
      switch (type) {
        case 'success':
          Vibration.vibrate([100, 50, 100]);
          break;
        case 'error':
          Vibration.vibrate([300, 100, 300, 100, 300]);
          break;
        case 'warning':
          Vibration.vibrate([200, 100, 200]);
          break;
        case 'info':
          Vibration.vibrate(50);
          break;
      }
    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, type]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const getAlertConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          color: '#00D4AA',
          backgroundColor: 'rgba(0, 212, 170, 0.1)',
          borderColor: 'rgba(0, 212, 170, 0.3)',
          gradientColors: ['rgba(0, 212, 170, 0.15)', 'rgba(0, 212, 170, 0.05)'],
        };
      case 'error':
        return {
          icon: 'close-circle',
          color: '#FF6B6B',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          borderColor: 'rgba(255, 107, 107, 0.3)',
          gradientColors: ['rgba(255, 107, 107, 0.15)', 'rgba(255, 107, 107, 0.05)'],
        };
      case 'warning':
        return {
          icon: 'warning',
          color: '#FFA726',
          backgroundColor: 'rgba(255, 167, 38, 0.1)',
          borderColor: 'rgba(255, 167, 38, 0.3)',
          gradientColors: ['rgba(255, 167, 38, 0.15)', 'rgba(255, 167, 38, 0.05)'],
        };
      case 'info':
        return {
          icon: 'information-circle',
          color: '#42A5F5',
          backgroundColor: 'rgba(66, 165, 245, 0.1)',
          borderColor: 'rgba(66, 165, 245, 0.3)',
          gradientColors: ['rgba(66, 165, 245, 0.15)', 'rgba(66, 165, 245, 0.05)'],
        };
      default:
        return {
          icon: 'information-circle',
          color: '#8B93A1',
          backgroundColor: 'rgba(139, 147, 161, 0.1)',
          borderColor: 'rgba(139, 147, 161, 0.3)',
          gradientColors: ['rgba(139, 147, 161, 0.15)', 'rgba(139, 147, 161, 0.05)'],
        };
    }
  };

  const config = getAlertConfig();

  return (
    <Modal visible={visible} transparent animationType="none">
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.7)" />
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <BlurView intensity={60} style={StyleSheet.absoluteFillObject} />
        
        <Animated.View
          style={[
            styles.alertContainer,
            {
              backgroundColor: config.backgroundColor,
              borderColor: config.borderColor,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={config.gradientColors as [string, string]}
            style={styles.alertGradient}
          />

          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
            <Ionicons
              name={config.icon as any}
              size={32}
              color={config.color}
            />
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: config.color }]}>
              {title}
            </Text>
            <Text style={styles.message}>
              {message}
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={20} color={colors.brand.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
  },
  alertContainer: {
    width: screenWidth * 0.9,
    backgroundColor: colors.brand.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  alertGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 14,
    color: colors.brand.textSecondary,
    lineHeight: 18,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomAlert; 