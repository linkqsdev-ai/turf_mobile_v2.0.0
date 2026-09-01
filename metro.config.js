// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: './global.css',
  // Keep class -> style compilation on the JS side so it works with the
  // static web export (`app.json` -> web.output: "static").
  inlineRem: 16,
});
