const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Excluir la carpeta backend del bundle
config.resolver.blockList = [
  /backend\/.*/,
];

// Excluir backend de watchFolders
config.watchFolders = config.watchFolders || [];

module.exports = config;
