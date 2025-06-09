import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui';
import { colors, spacing, typography, borderRadius } from '../theme';
import AuthModal from '../components/AuthModal';

const AuthRequiredScreen: React.FC = () => {
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { height: windowHeight } = useWindowDimensions();

  // Detect screen sizes
  const isSmallScreen = windowHeight < 700;
  const isVerySmallScreen = windowHeight < 600;

  const handleLogin = () => {
    setAuthMode('login');
    setAuthModalVisible(true);
  };

  const handleRegister = () => {
    setAuthMode('register');
    setAuthModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
      
      <LinearGradient
        colors={[colors.brand.background, colors.brand.darkGray]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[colors.brand.primary, colors.brand.secondary]}
              style={[
                styles.iconGradient,
                isVerySmallScreen && styles.iconGradientSmall
              ]}
            >
              <Ionicons 
                name="lock-closed" 
                size={isVerySmallScreen ? 32 : 40} 
                color={colors.brand.background} 
              />
            </LinearGradient>
          </View>

          {/* Title and Description */}
          <View style={styles.textContainer}>
            <Text style={[
              styles.title,
              isVerySmallScreen && styles.titleSmall
            ]}>
              Acesso Restrito
            </Text>
            <Text style={[
              styles.description,
              isVerySmallScreen && styles.descriptionSmall
            ]}>
              Para acessar esta funcionalidade, você precisa criar uma conta ou fazer login.
            </Text>
          </View>

          {/* Benefits - Compact Grid */}
          <View style={styles.benefitsContainer}>
            <Text style={[
              styles.benefitsTitle,
              isVerySmallScreen && styles.benefitsTitleSmall
            ]}>
              Com uma conta você pode:
            </Text>
            
            <View style={styles.benefitsGrid}>
              <View style={styles.benefitRow}>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.brand.primary} />
                  <Text style={[
                    styles.benefitText,
                    isVerySmallScreen && styles.benefitTextSmall
                  ]}>
                    Comprar e gerenciar ingressos
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.brand.primary} />
                  <Text style={[
                    styles.benefitText,
                    isVerySmallScreen && styles.benefitTextSmall
                  ]}>
                    Participar da comunidade
                  </Text>
                </View>
              </View>
              
              <View style={styles.benefitRow}>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.brand.primary} />
                  <Text style={[
                    styles.benefitText,
                    isVerySmallScreen && styles.benefitTextSmall
                  ]}>
                    Salvar eventos favoritos
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.brand.primary} />
                  <Text style={[
                    styles.benefitText,
                    isVerySmallScreen && styles.benefitTextSmall
                  ]}>
                    Receber recomendações
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              title="Criar Conta"
              onPress={handleRegister}
              style={StyleSheet.flatten([
                styles.primaryButton,
                isVerySmallScreen && styles.buttonSmall
              ])}
            />
            
            <Button
              title="Já tenho conta"
              onPress={handleLogin}
              variant="outline"
              style={StyleSheet.flatten([
                styles.secondaryButton,
                isVerySmallScreen && styles.buttonSmall
              ])}
            />
          </View>

          {/* Continue as Guest */}
          <TouchableOpacity style={styles.guestButton}>
            <Text style={[
              styles.guestButtonText,
              isVerySmallScreen && styles.guestButtonTextSmall
            ]}>
              Continuar explorando eventos
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.brand.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Auth Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        initialMode={authMode}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.brand.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconGradientSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  titleSmall: {
    fontSize: typography.fontSizes.xl,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSizes.md * 1.3,
    paddingHorizontal: spacing.sm,
  },
  descriptionSmall: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.fontSizes.sm * 1.2,
  },
  benefitsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  benefitsTitle: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    fontWeight: typography.fontWeights.semibold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  benefitsTitleSmall: {
    fontSize: typography.fontSizes.sm,
    marginBottom: spacing.sm,
  },
  benefitsGrid: {
    width: '100%',
  },
  benefitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.48,
    paddingHorizontal: spacing.xs,
  },
  benefitText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
    lineHeight: typography.fontSizes.xs * 1.3,
  },
  benefitTextSmall: {
    fontSize: 10,
    lineHeight: 12,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: spacing.sm,
  },
  primaryButton: {
    marginBottom: spacing.sm,
  },
  secondaryButton: {
    marginBottom: spacing.xs,
  },
  buttonSmall: {
    paddingVertical: spacing.sm,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  guestButtonText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.medium,
    marginRight: spacing.xs,
  },
  guestButtonTextSmall: {
    fontSize: typography.fontSizes.xs,
  },
});

export default AuthRequiredScreen; 