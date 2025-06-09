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
  Alert,
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

  // Detect screen sizes
  const isSmallScreen = windowHeight < 700;
  const isVerySmallScreen = windowHeight < 600;

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
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={20} color={colors.brand.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Logo and Title */}
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[colors.brand.primary, colors.brand.secondary]}
                style={[
                  styles.logoGradient,
                  isVerySmallScreen && styles.logoGradientSmall
                ]}
              >
                <Ionicons 
                  name="ticket" 
                  size={isVerySmallScreen ? 24 : 30} 
                  color={colors.brand.background} 
                />
              </LinearGradient>
              <Text style={[
                styles.title,
                isVerySmallScreen && styles.titleSmall
              ]}>
                Bem-vindo de volta!
              </Text>
              <Text style={[
                styles.subtitle,
                isVerySmallScreen && styles.subtitleSmall
              ]}>
                Entre na sua conta para acessar eventos exclusivos
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
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
                  isVerySmallScreen && styles.forgotPasswordTextSmall
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
                  isVerySmallScreen && styles.buttonSmall
                ])}
              />
            </View>

            {/* Social Login - Compact */}
            <View style={styles.socialContainer}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={[
                  styles.dividerText,
                  isVerySmallScreen && styles.dividerTextSmall
                ]}>
                  ou continue com
                </Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <TouchableOpacity style={[
                  styles.socialButton,
                  isVerySmallScreen && styles.socialButtonSmall
                ]}>
                  <Ionicons name="logo-google" size={16} color={colors.brand.textPrimary} />
                  <Text style={[
                    styles.socialButtonText,
                    isVerySmallScreen && styles.socialButtonTextSmall
                  ]}>
                    Google
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[
                  styles.socialButton,
                  isVerySmallScreen && styles.socialButtonSmall
                ]}>
                  <Ionicons name="logo-apple" size={16} color={colors.brand.textPrimary} />
                  <Text style={[
                    styles.socialButtonText,
                    isVerySmallScreen && styles.socialButtonTextSmall
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
                isVerySmallScreen && styles.registerTextSmall
              ]}>
                Não tem uma conta?{' '}
              </Text>
              <TouchableOpacity onPress={onSwitchToRegister}>
                <Text style={[
                  styles.registerLink,
                  isVerySmallScreen && styles.registerLinkSmall
                ]}>
                  Criar conta
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  content: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    alignSelf: 'flex-start',
  },
  closeButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.brand.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoGradientSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  titleSmall: {
    fontSize: typography.fontSizes.lg,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSizes.sm * 1.3,
  },
  subtitleSmall: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.fontSizes.xs * 1.2,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: spacing.md,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  forgotPasswordText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.medium,
  },
  forgotPasswordTextSmall: {
    fontSize: typography.fontSizes.xs,
  },
  loginButton: {
    marginBottom: spacing.xs,
  },
  buttonSmall: {
    paddingVertical: spacing.sm,
  },
  socialContainer: {
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.opacity.cardBorder,
  },
  dividerText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    marginHorizontal: spacing.sm,
  },
  dividerTextSmall: {
    fontSize: 10,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.darkGray,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  socialButtonSmall: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  socialButtonText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textPrimary,
    fontWeight: typography.fontWeights.medium,
    marginLeft: spacing.xs,
  },
  socialButtonTextSmall: {
    fontSize: 10,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  registerTextSmall: {
    fontSize: typography.fontSizes.xs,
  },
  registerLink: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  registerLinkSmall: {
    fontSize: typography.fontSizes.xs,
  },
});

export default LoginScreen; 