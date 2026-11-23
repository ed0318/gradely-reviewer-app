// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'android/*', 'ios/*', '.expo/*'],
  },
  {
    // A web rule: React Native's <Text> prints ' and " as they are.
    rules: { 'react/no-unescaped-entities': 'off' },
  },
  {
    // As in gradely-app, whose components these are: rules written for the
    // React Compiler, which neither app uses. The latest-value ref and a reset
    // in an effect are ordinary React without it. Warnings, not errors; make
    // them errors again before turning the compiler on.
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
  {
    // The house style: T[] for a plain type, Array<…> for anything longer.
    files: ['**/*.ts', '**/*.tsx'],
    rules: { '@typescript-eslint/array-type': ['warn', { default: 'array-simple' }] },
  },
  {
    // Run by Node at build time, not in the app.
    files: ['app.config.js', 'metro.config.js', 'eslint.config.js'],
    languageOptions: { globals: { process: 'readonly', __dirname: 'readonly' } },
    rules: { 'expo/no-dynamic-env-var': 'off' },
  },
]);
