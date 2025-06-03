module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { 
        jsxImportSource: undefined,
        jsxRuntime: 'automatic'
      }]
    ],
    plugins: [
      // Optimize imports to reduce bundle size and circular dependencies
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@theme': './src/theme',
            '@constants': './src/constants',
            '@hooks': './src/hooks',
            '@navigation': './src/navigation',
            '@types': './src/types',
          },
        },
      ],
      // Enable Hermes optimizations
      'react-native-reanimated/plugin',
    ],
  };
}; 