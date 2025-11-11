const reanimatedPlugin = require("react-native-reanimated/plugin");

if (!global.__usingReanimatedSafePlugin) {
  // Log once to confirm the wrapper is active when debugging startup issues.
  if (process.env.DEBUG_REANIMATED_PLUGIN === "true") {
    console.log("Using guarded Reanimated plugin wrapper");
  }
  global.__usingReanimatedSafePlugin = true;
}

module.exports = (...args) => {
  const plugin = reanimatedPlugin(...args);

  if (typeof plugin.pre === "function") {
    const originalPre = plugin.pre;
    plugin.pre = function preWithGuard(...preArgs) {
      if (!this || !this.file || !this.file.opts) {
        return;
      }
      return originalPre.apply(this, preArgs);
    };
  }

  return plugin;
};
