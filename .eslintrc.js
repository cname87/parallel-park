module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2020: true,
    jasmine: true,
    protractor: true,
  },
  extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    /* Rules I'm overriding but would like to meet */
    '@typescript-eslint/no-explicit-any': 'off',

    /* Set personal preferences below */
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'max-len': [
      'error',
      {
        code: 120, // default 80
        tabWidth: 2, // default 4
        ignoreComments: true,
        ignorePattern: 'it[(].*',
      },
    ],
    'prettier/prettier': ['error'],
  },
};
