module.exports = {
  root: true,
  extends: ['@antfu'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    // 'curly': ['error', 'all'],
    // 'max-statements-per-line': ['error', { max: 2 }],
    'no-console': 'warn',
    // '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // 'unused-imports/no-unused-vars': 'off',
    // '@typescript-eslint/restrict-template-expressions': 'off',
    // '@typescript-eslint/consistent-type-imports': 'error',
    // '@typescript-eslint/no-import-type-side-effects': 'error',
    // 'antfu/top-level-function': 'off',
    // 'import/order': [
    //   'error',
    //   {
    //     'groups': [
    //       'builtin',
    //       'external',
    //       'internal',
    //       'parent',
    //       'sibling',
    //       'index',
    //       'object',
    //     ],
    //     'warnOnUnassignedImports': false,
    //     'newlines-between': 'always',
    //     'alphabetize': {
    //       order: 'asc',
    //       caseInsensitive: true,
    //     },
    //   },
    // ],
    // 'brace-style': ['error', '1tbs', { allowSingleLine: true }],
    // '@typescript-eslint/brace-style': ['error', '1tbs', { allowSingleLine: true }],
  },
}
