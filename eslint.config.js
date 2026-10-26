import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // The base rule mishandles type-only usage and double-reports; use the
      // TS-aware version instead. This must come after the extends block.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        // `const { used, ...rest } = obj` — `used` is fine to go unused.
        ignoreRestSiblings: true,
        // A leading underscore marks a binding as deliberately unused.
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      }],
      // `x ? y() : z()` where a branch has no side effect is usually a typo.
      '@typescript-eslint/no-unused-expressions': 'error',
      // Catches `let` that never gets reassigned.
      'prefer-const': ['error', { destructuring: 'all' }],
    },
  },
])