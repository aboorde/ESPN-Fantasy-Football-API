import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import jest from 'eslint-plugin-jest';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

// Type names referenced only from jsdoc annotations. Declaring them here replaces the inline
// global comments the source used to carry, which ESLint now reports as unused bindings because
// nothing outside the jsdoc annotations ever reads them.
const JSDOC_DEFINED_TYPES = [
  'DRAFT_TYPE',
  'INJURY_STATUSES',
  'LINEUP_LOCK_TIMES',
  'PLAYER_AVAILABILITY_STATUSES',
  'PlayerMap',
  'PlayerStats',
  'ScoringItems'
];

const JSDOC_RULES = [
  'check-access',
  'check-alignment',
  'check-param-names',
  'check-property-names',
  'check-tag-names',
  'check-types',
  'check-values',
  'empty-tags',
  'implements-on-classes',
  'require-jsdoc',
  'require-param',
  'require-param-description',
  'require-param-name',
  'require-param-type',
  'require-property',
  'require-property-description',
  'require-property-name',
  'require-property-type',
  'require-returns',
  'require-returns-check',
  'require-returns-description',
  'require-returns-type',
  'valid-types'
];

export default defineConfig([
  globalIgnores([
    'web.js',
    'web-dev.js',
    'node.js',
    'node-dev.js',
    '**/*.map',
    'docs/',
    'coverage/'
  ]),

  {
    files: ['src/**/*.js', 'integration-tests/**/*.js'],

    extends: [
      js.configs.recommended,
      stylistic.configs.customize({
        arrowParens: true,
        braceStyle: '1tbs',
        commaDangle: 'never',
        indent: 2,
        jsx: false,
        quotes: 'single',
        semi: true
      })
    ],

    plugins: { jsdoc },

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node }
    },

    rules: {
      ...Object.fromEntries(JSDOC_RULES.map((rule) => [`jsdoc/${rule}`, 'error'])),
      'jsdoc/no-undefined-types': ['error', { definedTypes: JSDOC_DEFINED_TYPES }],

      '@stylistic/max-len': ['error', 100, 2, {
        ignoreComments: false,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreUrls: true
      }],
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
      '@stylistic/operator-linebreak': ['error', 'after'],
      '@stylistic/quote-props': ['error', 'as-needed', {
        keywords: false,
        numbers: false,
        unnecessary: true
      }],

      'no-else-return': ['error', { allowElseIf: true }],
      'no-underscore-dangle': 'off'
    }
  },

  {
    files: ['src/**/*.test.js', 'integration-tests/**/*.js'],
    extends: [jest.configs['flat/recommended']],
    languageOptions: {
      globals: { ...globals.jest }
    }
  }
]);
