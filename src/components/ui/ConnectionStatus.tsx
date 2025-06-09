import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface ConnectionStatusProps {
  isOffline?: boolean;
  isUsingCache?: boolean;
  message?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isOffline = false,
  isUsingCache = false,
  message,
}) => {
  if (!isOffline && !isUsingCache) return null;

  const getStatusConfig = () => {
    if (isOffline) {
      return {
        icon: 'cloud-offline-outline' as const,
        color: colors.brand.error,
        backgroundColor: colors.brand.card,
        text: message || 'Sem conexão - Dados podem estar desatualizados',
      };
    }
    
    if (isUsingCache) {
      return {
        icon: 'refresh-outline' as const,
        color: colors.brand.warning,
        backgroundColor: colors.brand.card,
        text: message || 'Dados do cache - Puxe para atualizar',
      };
    }

    return {
      icon: 'information-circle-outline' as const,
      color: colors.brand.textSecondary,
      backgroundColor: colors.brand.card,
      text: message || '',
    };
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      <Ionicons name={config.icon} size={16} color={config.color} />
      <Text style={[styles.text, { color: config.color }]}>
        {config.text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  text: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    flex: 1,
  },
}); 