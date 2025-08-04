const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const globals = require("globals");
const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const prettier = require("eslint-plugin-prettier");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
      ignores: [
        'eslint.config.js',
        'src/environments/environment.prod.ts',
        '.angular',
        '.angular/**',
        '**/.angular/**',
        'node_modules',
        'dist',
        'coverage',
    ],
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            ...globals.jasmine,
            ...globals.protractor,
        },

        parser: tsParser,
        ecmaVersion: 2020,
        sourceType: "module",

        parserOptions: {
            project: "./tsconfig.json",
        },
    },

    extends: compat.extends("plugin:@typescript-eslint/recommended", "prettier"),

    plugins: {
        "@typescript-eslint": typescriptEslint,
        prettier,
    },

    rules: {
        "@typescript-eslint/no-explicit-any": "off",

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
        }],

        "max-len": ["error", {
            code: 120,
            tabWidth: 2,
            ignoreComments: true,
            ignorePattern: "it[(].*",
        }],

        "prettier/prettier": ["error"],
    },
}, globalIgnores([
    "**/.eslintrc.js",
    "src/environments/environment.prod.ts",
    "**/node_modules",
    "**/dist",
    "**/coverage",
])]);
