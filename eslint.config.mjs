// eslint.config.mjs
import angular from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },

  // JavaScript rules
  {
    files: ['**/*.js'],
    ...js.configs.recommended,
  },

  // TypeScript + Angular rules
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022,
        projectService: true,
        //tsconfigRootDir: new URL('./', import.meta.url),
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      '@angular-eslint': angular,
      prettier: prettierPlugin,
    },
    rules: {
      ...tseslint.configs['recommended'].rules,

      // Angular selector rules
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],

      // Prettier formatting via ESLint
      'prettier/prettier': 'error',
    },
  },

  // Angular HTML template rules
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: angularTemplateParser,
    },
    plugins: {
      '@angular-eslint/template': angularTemplate,
      prettier: prettierPlugin,
    },
    rules: {
      ...angularTemplate.configs['recommended'].rules,
      'prettier/prettier': 'error',
    },
  },

  // Disable formatting rules that conflict with Prettier
  prettier,
];
