const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Inject polyfills before any other module runs
const originalGetModulesRunBeforeMainModule =
  config.serializer?.getModulesRunBeforeMainModule;

config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => {
    const existing = originalGetModulesRunBeforeMainModule?.() ?? [];
    return [
      path.resolve(__dirname, "polyfills.js"),
      ...existing,
    ];
  },
};

module.exports = config;
