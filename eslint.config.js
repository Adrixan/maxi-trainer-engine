// @ts-check
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        ignores: ['vite.config.ts', 'vitest.config.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: ['./tsconfig.json'],
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            // TypeScript specific rules
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/no-misused-promises': 'off',

            // General rules
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'prefer-const': 'error',
            'no-var': 'error',
            eqeqeq: ['error', 'always'],
            'no-undef': 'off', // TypeScript handles this
        },
    },
    {
        files: ['vite.config.ts', 'vitest.config.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
        },
    },
    {
        ignores: [
            'dist',
            'node_modules',
            '**/*.js',
            '**/*.cjs',
            '**/*.mjs',
            'vite.config.d.ts',
            'vite.config.d.ts.map',
            'vitest.config.d.ts',
            'vitest.config.d.ts.map',
            // Example files not part of the project
            '.github/copilot-instructions/**/*',
        ],
    },
];
