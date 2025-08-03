import config from '@ytclipper/eslint-config/react.js';

export default [
  ...config,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {},
    languageOptions: {
      globals: {
        chrome: 'readonly',
        browser: true,
      },
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
