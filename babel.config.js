module.exports = function (api) {
  const isAppConfig = api.caller
    ? api.caller((inst) => inst?.name === "babel-preset-expo/app-config") ===
      true
    : false;

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: isAppConfig ? [] : ["react-native-reanimated/plugin"],
  };
};
