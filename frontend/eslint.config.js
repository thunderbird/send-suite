import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
      globals: {
        ...globals.browser, // Existing browser globals
        ...globals.webextensions, // Existing browser globals
        __dirname: 'readonly', // Setting __dirname as a global variable
        __filename: 'readonly', // Commonly used alongside __dirname
        process: 'readonly', // Another common Node.js global
        require: 'readonly', // If using CommonJS modules
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  eslintConfigPrettier,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-extra-boolean-cast': 'off',
    },
  },
];
