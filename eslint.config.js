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
