import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
  padding?: keyof typeof spacing | 'none';
  borderColor?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  gradient = true,
  padding = 'lg',
  borderColor = colors.opacity.cardBorder,
}) => {
  const cardStyle: ViewStyle = {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor,
    overflow: 'hidden',
    ...shadows.md,
  };

  const contentStyle: ViewStyle = {
    padding: padding === 'none' ? 0 : spacing[padding as keyof typeof spacing],
  };

  if (gradient) {
    return (
      <View style={[cardStyle, style]}>
        <LinearGradient
          colors={colors.gradients.card as [string, string]}
          style={[contentStyle]}
        >
          {children}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[cardStyle, { backgroundColor: colors.brand.card }, style]}>
      <View style={contentStyle}>
        {children}
      </View>
    </View>
  );
}; 