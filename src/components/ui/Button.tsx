import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows, typography } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...shadows.md,
    };

    const sizeStyles = {
      sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
      md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
      lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled || loading ? 0.6 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: typography.fontWeights.semibold,
      textAlign: 'center',
    };

    const sizeStyles = {
      sm: { fontSize: typography.fontSizes.sm },
      md: { fontSize: typography.fontSizes.md },
      lg: { fontSize: typography.fontSizes.lg },
    };

    const variantStyles = {
      primary: { color: colors.brand.background },
      secondary: { color: colors.brand.background },
      outline: { color: colors.brand.primary },
      ghost: { color: colors.brand.primary },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const renderContent = () => (
    <>
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.brand.primary : colors.brand.background}
          style={{ marginRight: spacing.sm }}
        />
      )}
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </>
  );

  if (variant === 'primary' || variant === 'secondary') {
    const gradientColors = variant === 'primary' 
      ? colors.gradients.primary 
      : [colors.brand.secondary, colors.brand.action];

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[getButtonStyle(), style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={gradientColors}
          style={[StyleSheet.absoluteFill, { borderRadius: borderRadius.lg }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        {renderContent()}
      </TouchableOpacity>
    );
  }

  const variantStyles = {
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.brand.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        getButtonStyle(),
        variantStyles[variant as 'outline' | 'ghost'],
        style,
      ]}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}; 