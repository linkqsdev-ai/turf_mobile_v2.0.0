// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // The experimental React Compiler lint rules (enabled via app.json's
    // `reactCompiler` experiment) don't model Reanimated shared values, RN
    // `Animated.Value` refs, or the mount-flag pattern used for exit
    // animations. The codebase is not compiler-clean yet, so these are
    // surfaced as warnings rather than failing the build.
    rules: {
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
