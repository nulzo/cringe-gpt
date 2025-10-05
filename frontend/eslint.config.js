import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'

export default tseslint.config([
    {
        ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts'],
    },
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommended,
        ],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.browser,
        },
        plugins: {
            'react': react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            'jsx-a11y': jsxA11y,
        },
        settings: {
            react: {
                version: '19.1.0',
            },
        },
        rules: {
            // React Refresh rules
            'react-refresh/only-export-components': [
                'warn',
                {allowConstantExport: true},
            ],

            // React Hook rules
            ...reactHooks.configs.recommended.rules,

            // React rules
            'react/prop-types': 'off', // We use TypeScript for prop validation
            'react/react-in-jsx-scope': 'off', // Not needed in React 17+
            'react/jsx-uses-react': 'off', // Not needed in React 17+
            'react/jsx-uses-vars': 'error',

            // JSX A11y rules (basic ones)
            'jsx-a11y/alt-text': 'warn',
            'jsx-a11y/anchor-has-content': 'warn',
            'jsx-a11y/aria-role': 'warn',
            'jsx-a11y/img-redundant-alt': 'warn',
            'jsx-a11y/no-redundant-roles': 'warn',

            // TypeScript rules
            '@typescript-eslint/no-unused-vars': [
                'error',
                {argsIgnorePattern: '^_', varsIgnorePattern: '^_'},
            ],
            '@typescript-eslint/no-explicit-any': 'warn',

            // General rules
            'no-console': 'warn',
            'no-debugger': 'error',
            'prefer-const': 'error',
            'no-var': 'error',
        },
    },
    {
        files: ['**/*.{js,cjs,mjs}'],
        extends: [js.configs.recommended],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.node,
        },
    },
])
