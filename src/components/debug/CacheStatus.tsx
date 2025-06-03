import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface CacheStatusProps {
  visible?: boolean;
}

const CacheStatus: React.FC<CacheStatusProps> = ({ visible = __DEV__ }) => {
  const [cacheInfo, setCacheInfo] = useState<{
    items: number;
    size: string;
    lastCleanup: string;
  }>({
    items: 0,
    size: '0 KB',
    lastCleanup: 'Never',
  });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCacheInfo();
      const interval = setInterval(loadCacheInfo, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [visible]);

  const loadCacheInfo = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('eventy_cache_'));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          totalSize += new Blob([item]).size;
        }
      }

      setCacheInfo({
        items: cacheKeys.length,
        size: formatBytes(totalSize),
        lastCleanup: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error('Error loading cache info:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearCache = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('eventy_cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
      await loadCacheInfo();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerContent}>
          <Ionicons name="server" size={16} color={colors.brand.primary} />
          <Text style={styles.title}>Cache</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cacheInfo.items}</Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.brand.textSecondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Items:</Text>
            <Text style={styles.value}>{cacheInfo.items}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Size:</Text>
            <Text style={styles.value}>{cacheInfo.size}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Last Update:</Text>
            <Text style={styles.value}>{cacheInfo.lastCleanup}</Text>
          </View>
          
          <TouchableOpacity style={styles.clearButton} onPress={clearCache}>
            <Ionicons name="trash" size={14} color={colors.brand.background} />
            <Text style={styles.clearButtonText}>Clear Cache</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: spacing.md,
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
    minWidth: 200,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
  },
  badge: {
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  content: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
  },
  value: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.brand.textPrimary,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  clearButtonText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.background,
  },
});

export default CacheStatus; 