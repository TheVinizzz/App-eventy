const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable Hermes
config.transformer.hermesCommand = 'hermes';

// Optimize for better performance and debugging
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Enable source maps for better debugging
config.transformer.enableBabelRCLookup = false;
config.transformer.enableBabelRuntime = false;

// Optimize bundle size
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Better error handling for circular dependencies
config.resolver.hasteImplModulePath = undefined;

module.exports = config; 