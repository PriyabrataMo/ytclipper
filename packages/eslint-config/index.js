import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config([
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      '.turbo/**',
      'coverage/**',
      '*.min.js',
      'public/**',
      '**/*.d.ts',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // Project will be set in individual configs
      },
    },
    rules: {
      // SEMICOLON RULES - HANDLED BY PRETTIER
      // Note: semi, semi-spacing, and semi-style are now deprecated in ESLint and moved to @stylistic
      // We'll let Prettier handle semicolon formatting

      // SPACING AND FORMATTING RULES - HANDLED BY PRETTIER
      // Most spacing rules are now deprecated and moved to @stylistic
      // We'll let Prettier handle most formatting and keep only non-conflicting rules
      'spaced-comment': ['error', 'always'], // Still useful for code quality

      // BRACKET AND BRACE RULES - LOGIC ONLY (FORMATTING HANDLED BY PRETTIER)
      curly: ['error', 'all'], // Force braces for control statements (logic, not formatting)

      // VARIABLE AND FUNCTION RULES
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // CODE QUALITY RULES - STRICT
      // 'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      'object-shorthand': 'error',
      'no-duplicate-imports': 'error',
      'no-useless-rename': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-constructor': 'error',
      'no-useless-return': 'error',

      // FUNCTION RULES - LOGIC ONLY (FORMATTING HANDLED BY PRETTIER)
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'func-style': ['error', 'declaration', { allowArrowFunctions: true }],

      // CONDITIONAL AND LOOP RULES
      'no-else-return': 'error',
      'no-lonely-if': 'error',
      'no-unneeded-ternary': 'error',
      yoda: ['error', 'never'],

      // STRING AND TEMPLATE RULES - LOGIC ONLY (FORMATTING HANDLED BY PRETTIER)
      'prefer-template': 'error',

      // ARRAY AND OBJECT RULES - LOGIC ONLY (FORMATTING HANDLED BY PRETTIER)
      'array-callback-return': 'error',
      'no-array-constructor': 'error',

      // ERROR PREVENTION - KEEP ALL LOGIC RULES
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',
      'no-constant-condition': 'error',
      'no-dupe-args': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'error',
      'no-extra-boolean-cast': 'error',
      // 'no-extra-semi': deprecated - handled by Prettier
      'no-func-assign': 'error',
      'no-inner-declarations': 'error',
      'no-invalid-regexp': 'error',
      'no-obj-calls': 'error',
      'no-sparse-arrays': 'error',
      'no-unexpected-multiline': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',

      // BEST PRACTICES
      'consistent-return': 'error',
      'default-case': 'error',
      'dot-notation': 'error',
      eqeqeq: ['error', 'always'],
      'guard-for-in': 'error',
      'no-caller': 'error',
      'no-case-declarations': 'error',
      'no-empty-pattern': 'error',
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-fallthrough': 'error',
      'no-floating-decimal': 'error',
      'no-global-assign': 'error',
      'no-implied-eval': 'error',
      'no-invalid-this': 'error',
      'no-iterator': 'error',
      'no-labels': 'error',
      'no-lone-blocks': 'error',
      'no-loop-func': 'error',
      'no-multi-spaces': 'error',
      'no-multi-str': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-octal': 'error',
      'no-octal-escape': 'error',
      'no-proto': 'error',
      'no-redeclare': 'error',
      'no-return-assign': 'error',
      'no-script-url': 'error',
      'no-self-assign': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unused-expressions': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-escape': 'error',
      'no-void': 'error',
      'no-with': 'error',
      radix: 'error',
      'wrap-iife': ['error', 'outside'],
    },
  },
  // TypeScript-specific rules that don't require type checking
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // TypeScript-specific rules (non-type-checked)
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/prefer-literal-enum-member': 'error',
    },
  },
]);
