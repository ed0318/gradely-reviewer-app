const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * RevenueCat's browser SDK stays out of the phone bundle (about 1 MB), as in
 * gradely-app. `react-native-purchases` requires it whatever the platform, but
 * only uses it in browser mode, which a dev client or store build never runs in.
 */
const BROWSER_MODULE_STUB = path.resolve(__dirname, 'src/stubs/revenuecatBrowserModule.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform !== 'web' &&
    moduleName === './browser/nativeModule' &&
    context.originModulePath.includes(`${path.sep}react-native-purchases${path.sep}`)
  ) {
    return { type: 'sourceFile', filePath: BROWSER_MODULE_STUB };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
