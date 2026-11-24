// Análisis estático: identificadores sin definir y variables sin usar, que la comprobación de sintaxis no detecta.
import globals from 'globals';

export default [
  {
    files: ['js/**/*.js', 'sw.js', 'servidor.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, ...globals.serviceworker },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
];
