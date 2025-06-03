// Performance configuration for the app
export const PERFORMANCE_CONFIG = {
  // API Configuration
  api: {
    timeout: 10000, // 10 seconds
    retryCount: 3,
    retryDelay: 1000, // 1 second
    cacheConfig: {
      featuredEvents: 10 * 60 * 1000, // 10 minutes
      nearbyEvents: 5 * 60 * 1000, // 5 minutes
      eventDetails: 15 * 60 * 1000, // 15 minutes
      userProfile: 30 * 60 * 1000, // 30 minutes
      categories: 60 * 60 * 1000, // 1 hour
      trendingEvents: 3 * 60 * 1000, // 3 minutes (trending muda mais rápido)
    },
  },

  // FlatList Performance
  flatList: {
    removeClippedSubviews: true,
    maxToRenderPerBatch: 5,
    windowSize: 7,
    initialNumToRender: 3,
    updateCellsBatchingPeriod: 100,
    getItemLayout: {
      eventCard: {
        width: 280,
        height: 280,
        spacing: 16,
      },
      nearbyEvent: {
        width: 300,
        height: 120,
        spacing: 16,
      },
    },
  },

  // Image Configuration
  images: {
    defaultQuality: 0.8,
    thumbnailSize: { width: 200, height: 200 },
    fullSize: { width: 800, height: 600 },
    cachePolicy: 'memory-disk',
  },

  // Animation Configuration
  animations: {
    skeleton: {
      duration: 1000,
      useNativeDriver: false,
    },
    transitions: {
      duration: 300,
      useNativeDriver: true,
    },
  },

  // Memory Management
  memory: {
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
    maxCacheItems: 100,
  },
};

// Helper functions for performance optimization
export const getOptimizedFlatListProps = (type: 'eventCard' | 'nearbyEvent') => {
  const config = PERFORMANCE_CONFIG.flatList;
  const itemConfig = config.getItemLayout[type];

  return {
    removeClippedSubviews: config.removeClippedSubviews,
    maxToRenderPerBatch: config.maxToRenderPerBatch,
    windowSize: config.windowSize,
    initialNumToRender: config.initialNumToRender,
    updateCellsBatchingPeriod: config.updateCellsBatchingPeriod,
    getItemLayout: (data: any, index: number) => ({
      length: itemConfig.width + itemConfig.spacing,
      offset: (itemConfig.width + itemConfig.spacing) * index,
      index,
    }),
  };
};

export const getCacheConfig = (type: keyof typeof PERFORMANCE_CONFIG.api.cacheConfig) => {
  return {
    cacheDuration: PERFORMANCE_CONFIG.api.cacheConfig[type],
    retryCount: PERFORMANCE_CONFIG.api.retryCount,
    retryDelay: PERFORMANCE_CONFIG.api.retryDelay,
  };
};
