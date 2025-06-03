import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../components/ui';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useAuth } from '../contexts/AuthContext';

interface LoginScreenProps {
  onSwitchToRegister: () => void;
  onClose: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSwitchToRegister, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { height: windowHeight } = useWindowDimensions();

  // Detect if it's a small screen
  const isSmallScreen = windowHeight < 700;
  const isVerySmallScreen = windowHeight < 600;

  // Dynamic spacing based on screen size
  const dynamicSpacing = {
    logoMargin: isVerySmallScreen ? spacing.lg : isSmallScreen ? spacing.xl : spacing.xxxl,
    formMargin: isVerySmallScreen ? spacing.md : isSmallScreen ? spacing.lg : spacing.xl,
    socialMargin: isVerySmallScreen ? spacing.md : isSmallScreen ? spacing.lg : spacing.xl,
    logoSize: isVerySmallScreen ? 60 : isSmallScreen ? 70 : 80,
    logoIconSize: isVerySmallScreen ? 30 : isSmallScreen ? 35 : 40,
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    
    try {
      await login(email, password);
      onClose();
    } catch (error: any) {
      Alert.alert('Erro de Login', error.message || 'Falha na autenticação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
      
      <LinearGradient
        colors={[colors.brand.background, colors.brand.darkGray]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: isVerySmallScreen ? spacing.lg : spacing.xxxl }
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.brand.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Logo and Title */}
            <View style={[styles.logoContainer, { marginBottom: dynamicSpacing.logoMargin }]}>
              <LinearGradient
                colors={[colors.brand.primary, colors.brand.secondary]}
                style={[
                  styles.logoGradient,
                  {
                    width: dynamicSpacing.logoSize,
                    height: dynamicSpacing.logoSize,
                    borderRadius: dynamicSpacing.logoSize / 2,
                  }
                ]}
              >
                <Ionicons 
                  name="ticket" 
                  size={dynamicSpacing.logoIconSize} 
                  color={colors.brand.background} 
                />
              </LinearGradient>
              <Text style={[
                styles.title,
                isVerySmallScreen && { fontSize: typography.fontSizes.xl }
              ]}>
                Bem-vindo de volta!
              </Text>
              <Text style={[
                styles.subtitle,
                isVerySmallScreen && { fontSize: typography.fontSizes.sm }
              ]}>
                Entre na sua conta para acessar eventos exclusivos
              </Text>
            </View>

            {/* Form */}
            <View style={[styles.form, { marginBottom: dynamicSpacing.formMargin }]}>
              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                leftIcon="mail"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />

              <Input
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                leftIcon="lock-closed"
                secureTextEntry
                style={styles.input}
              />

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={[
                  styles.forgotPasswordText,
                  isVerySmallScreen && { fontSize: typography.fontSizes.xs }
                ]}>
                  Esqueceu sua senha?
                </Text>
              </TouchableOpacity>

              <Button
                title="Entrar"
                onPress={handleLogin}
                loading={isLoading}
                style={StyleSheet.flatten([
                  styles.loginButton,
                  isVerySmallScreen && styles.smallScreenButton,
                ])}
              />
            </View>

            {/* Social Login */}
            <View style={[styles.socialContainer, { marginBottom: dynamicSpacing.socialMargin }]}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={[
                  styles.dividerText,
                  isVerySmallScreen && { fontSize: typography.fontSizes.xs }
                ]}>
                  ou continue com
                </Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <TouchableOpacity style={[
                  styles.socialButton,
                  isVerySmallScreen && { paddingVertical: spacing.sm }
                ]}>
                  <Ionicons name="logo-google" size={20} color={colors.brand.textPrimary} />
                  <Text style={[
                    styles.socialButtonText,
                    isVerySmallScreen && { fontSize: typography.fontSizes.xs }
                  ]}>
                    Google
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[
                  styles.socialButton,
                  isVerySmallScreen && { paddingVertical: spacing.sm }
                ]}>
                  <Ionicons name="logo-apple" size={20} color={colors.brand.textPrimary} />
                  <Text style={[
                    styles.socialButtonText,
                    isVerySmallScreen && { fontSize: typography.fontSizes.xs }
                  ]}>
                    Apple
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={[
                styles.registerText,
                isVerySmallScreen && { fontSize: typography.fontSizes.xs }
              ]}>
                Não tem uma conta?{' '}
              </Text>
              <TouchableOpacity onPress={onSwitchToRegister}>
                <Text style={[
                  styles.registerLink,
                  isVerySmallScreen && { fontSize: typography.fontSizes.xs }
                ]}>
                  Criar conta
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.brand.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSizes.md * 1.4,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: spacing.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  forgotPasswordText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.medium,
  },
  loginButton: {
    marginBottom: spacing.md,
  },
  socialContainer: {
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.opacity.cardBorder,
  },
  dividerText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginHorizontal: spacing.md,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.darkGray,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  socialButtonText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textPrimary,
    fontWeight: typography.fontWeights.medium,
    marginLeft: spacing.sm,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  registerText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  registerLink: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  smallScreenButton: {
    marginBottom: spacing.lg,
  },
});

export default LoginScreen; 