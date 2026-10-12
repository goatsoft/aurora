import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  globalIgnores(['**/dist/', '**/coverage/', '**/node_modules/']),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  // Formatting is enforced by ESLint Stylistic (`pnpm lint:fix` formats); there is no Prettier.
  stylistic.configs.customize({ indent: 2, quotes: 'single', semi: false, braceStyle: '1tbs', arrowParens: true }),
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
      // `() => update()` reads better than `() => { update() }` for callbacks.
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      // Say where code comes from: `@/x` is this package's src/x, `~/x` is the repo root.
      'no-restricted-imports': ['error', {
        patterns: [{ regex: '^\\.\\./', message: 'Use @/ (this package\'s src) or ~/ (the repo root) instead of a parent-relative path.' }],
      }],
      // noUncheckedIndexedAccess makes `!` the honest way to say "this index exists".
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    // Test fakes are full of no-op methods and one-line stubs.
    files: ['**/test/**'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/require-await': 'off',
      '@stylistic/max-statements-per-line': 'off',
    },
  },
)
