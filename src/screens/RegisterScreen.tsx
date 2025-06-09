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

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
  onClose: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSwitchToLogin, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { height: windowHeight } = useWindowDimensions();

  // Detect screen sizes
  const isSmallScreen = windowHeight < 700;
  const isVerySmallScreen = windowHeight < 600;

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    
    try {
      await register(name, email, password);
      onClose();
    } catch (error: any) {
      Alert.alert('Erro de Registro', error.message || 'Não foi possível criar a conta. Tente novamente.');
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
                  name="person-add" 
                  size={isVerySmallScreen ? 24 : 30} 
                  color={colors.brand.background} 
                />
              </LinearGradient>
              <Text style={[
                styles.title,
                isVerySmallScreen && styles.titleSmall
              ]}>
                Criar conta
              </Text>
              <Text style={[
                styles.subtitle,
                isVerySmallScreen && styles.subtitleSmall
              ]}>
                Junte-se a milhares de pessoas descobrindo eventos incríveis
              </Text>
            </View>

            {/* Form - Compact */}
            <View style={styles.form}>
              <View style={styles.inputGrid}>
                <Input
                  placeholder="Nome completo"
                  value={name}
                  onChangeText={setName}
                  leftIcon="person"
                  autoCapitalize="words"
                  style={styles.input}
                />

                <Input
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  leftIcon="mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />

                <View style={styles.passwordRow}>
                  <Input
                    placeholder="Senha"
                    value={password}
                    onChangeText={setPassword}
                    leftIcon="lock-closed"
                    secureTextEntry
                    style={StyleSheet.flatten([styles.input, styles.passwordInput])}
                  />

                  <Input
                    placeholder="Confirmar"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    leftIcon="lock-closed"
                    secureTextEntry
                    style={StyleSheet.flatten([styles.input, styles.passwordInput])}
                  />
                </View>
              </View>

              <View style={styles.termsContainer}>
                <Text style={[
                  styles.termsText,
                  isVerySmallScreen && styles.termsTextSmall
                ]}>
                  Ao criar uma conta, você concorda com nossos{' '}
                  <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
                  <Text style={styles.termsLink}>Política de Privacidade</Text>
                </Text>
              </View>

              <Button
                title="Criar conta"
                onPress={handleRegister}
                loading={isLoading}
                style={StyleSheet.flatten([
                  styles.registerButton,
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
                  styles.socialButtonFull,
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
              </View>
            </View>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={[
                styles.loginText,
                isVerySmallScreen && styles.loginTextSmall
              ]}>
                Já tem uma conta?{' '}
              </Text>
              <TouchableOpacity onPress={onSwitchToLogin}>
                <Text style={[
                  styles.loginLink,
                  isVerySmallScreen && styles.loginLinkSmall
                ]}>
                  Entrar
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
  inputGrid: {
    width: '100%',
  },
  input: {
    marginBottom: spacing.sm,
  },
  passwordRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  passwordInput: {
    flex: 1,
  },
  termsContainer: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  termsText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSizes.xs * 1.3,
  },
  termsTextSmall: {
    fontSize: 10,
    lineHeight: 12,
  },
  termsLink: {
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.medium,
  },
  registerButton: {
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
  socialButtonFull: {
    flex: 0,
    width: '100%',
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  loginTextSmall: {
    fontSize: typography.fontSizes.xs,
  },
  loginLink: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  loginLinkSmall: {
    fontSize: typography.fontSizes.xs,
  },
});

export default RegisterScreen; 