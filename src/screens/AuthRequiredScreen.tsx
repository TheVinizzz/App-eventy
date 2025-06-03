import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui';
import { colors, spacing, typography, borderRadius } from '../theme';
import AuthModal from '../components/AuthModal';

const { height: screenHeight } = Dimensions.get('window');

const AuthRequiredScreen: React.FC = () => {
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { height: windowHeight } = useWindowDimensions();

  // Detect if it's a small screen (like iPhone SE, small Android phones)
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

  // Dynamic spacing based on screen size
  const dynamicSpacing = {
    iconMargin: isVerySmallScreen ? spacing.lg : isSmallScreen ? spacing.xl : spacing.xxxl,
    textMargin: isVerySmallScreen ? spacing.lg : isSmallScreen ? spacing.xl : spacing.xxxl,
    buttonMargin: isVerySmallScreen ? spacing.md : isSmallScreen ? spacing.lg : spacing.xl,
    iconSize: isVerySmallScreen ? 80 : isSmallScreen ? 100 : 120,
    iconInnerSize: isVerySmallScreen ? 40 : isSmallScreen ? 50 : 60,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
      
      <LinearGradient
        colors={[colors.brand.background, colors.brand.darkGray]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { minHeight: windowHeight - 100 } // Ensure content takes full height minus safe areas
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.content}>
            {/* Icon */}
            <View style={[styles.iconContainer, { marginBottom: dynamicSpacing.iconMargin }]}>
              <LinearGradient
                colors={[colors.brand.primary, colors.brand.secondary]}
                style={[
                  styles.iconGradient,
                  {
                    width: dynamicSpacing.iconSize,
                    height: dynamicSpacing.iconSize,
                    borderRadius: dynamicSpacing.iconSize / 2,
                  }
                ]}
              >
                <Ionicons 
                  name="lock-closed" 
                  size={dynamicSpacing.iconInnerSize} 
                  color={colors.brand.background} 
                />
              </LinearGradient>
            </View>

            {/* Title and Description */}
            <View style={[styles.textContainer, { marginBottom: dynamicSpacing.textMargin }]}>
              <Text style={[
                styles.title,
                isVerySmallScreen && { fontSize: typography.fontSizes.xl }
              ]}>
                Acesso Restrito
              </Text>
              <Text style={[
                styles.description,
                isVerySmallScreen && { fontSize: typography.fontSizes.sm }
              ]}>
                Para acessar esta funcionalidade, você precisa criar uma conta ou fazer login.
              </Text>
              <Text style={[
                styles.benefits,
                isVerySmallScreen && { fontSize: typography.fontSizes.sm }
              ]}>
                Com uma conta você pode:
              </Text>
              
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.brand.primary} />
                  <Text style={[
                    styles.benefitText,
                    isVerySmallScreen && { fontSize: typography.fontSizes.xs }
                  ]}>
                    Comprar e gerenciar ingressos
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.brand.primary} />
                  <Text style={[
                    styles.benefitText,
                    isVerySmallScreen && { fontSize: typography.fontSizes.xs }
                  ]}>
                    Participar da comunidade
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.brand.primary} />
                  <Text style={[
                    styles.benefitText,
                    isVerySmallScreen && { fontSize: typography.fontSizes.xs }
                  ]}>
                    Salvar eventos favoritos
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.brand.primary} />
                  <Text style={[
                    styles.benefitText,
                    isVerySmallScreen && { fontSize: typography.fontSizes.xs }
                  ]}>
                    Receber recomendações personalizadas
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={[styles.buttonContainer, { marginBottom: dynamicSpacing.buttonMargin }]}>
              <Button
                title="Criar Conta"
                onPress={handleRegister}
                style={StyleSheet.flatten([
                  styles.primaryButton,
                  isVerySmallScreen && styles.smallScreenButton,
                ])}
              />
              
              <Button
                title="Já tenho conta"
                onPress={handleLogin}
                variant="outline"
                style={StyleSheet.flatten([
                  styles.secondaryButton,
                  isVerySmallScreen && styles.smallScreenButton,
                ])}
              />
            </View>

            {/* Continue as Guest */}
            <TouchableOpacity style={styles.guestButton}>
              <Text style={[
                styles.guestButtonText,
                isVerySmallScreen && { fontSize: typography.fontSizes.xs }
              ]}>
                Continuar explorando eventos
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.brand.primary} />
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconGradient: {
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
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSizes.md * 1.4,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  benefits: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    fontWeight: typography.fontWeights.semibold,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  benefitsList: {
    alignSelf: 'stretch',
    paddingHorizontal: spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  benefitText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: typography.fontSizes.sm * 1.3,
  },
  buttonContainer: {
    alignSelf: 'stretch',
    paddingHorizontal: spacing.md,
  },
  primaryButton: {
    marginBottom: spacing.md,
  },
  secondaryButton: {
    marginBottom: spacing.lg,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  guestButtonText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.medium,
    marginRight: spacing.xs,
  },
  smallScreenButton: {
    paddingVertical: spacing.sm,
  },
});

export default AuthRequiredScreen; 