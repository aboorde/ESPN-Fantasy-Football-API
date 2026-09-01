import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import jest from 'eslint-plugin-jest';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

// Type names referenced from jsdoc without a local definition. The ESPN string enums used to live
// here too; they are now referenced as `import('../constants').X`, which resolves for real and
// reaches the generated declarations. What is left is genuinely local: types declared in one file
// and named from another's jsdoc.
const JSDOC_DEFINED_TYPES = [
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

const STYLISTIC = stylistic.configs.customize({
  arrowParens: true,
  braceStyle: '1tbs',
  commaDangle: 'never',
  indent: 2,
  jsx: false,
  quotes: 'single',
  semi: true
});

// Shared by source and by the root-level config files, so the two cannot drift apart.
const STYLE_RULES = {
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
  }]
};

export default defineConfig([
  globalIgnores([
    'node.js',
    'node-dev.js',
    // Generated declarations. `node.d.ts` is matched explicitly rather than by `*.d.ts` so a
    // hand-written declaration added later is still linted.
    'node.d.ts',
    'types/',
    '**/*.map',
    'docs/',
    'coverage/'
  ]),

  {
    files: ['src/**/*.js', 'integration-tests/**/*.js'],

    extends: [js.configs.recommended, STYLISTIC],

    plugins: { jsdoc },

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node }
    },

    rules: {
      ...Object.fromEntries(JSDOC_RULES.map((rule) => [`jsdoc/${rule}`, 'error'])),
      'jsdoc/no-undefined-types': ['error', { definedTypes: JSDOC_DEFINED_TYPES }],

      ...STYLE_RULES,

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
  },

  // Root-level tooling config. These carry no jsdoc, so the jsdoc rule set is deliberately not
  // applied; `recommended` is what catches the dead imports these files accumulate unnoticed.
  // Matched by suffix rather than by `*.js` so the committed bundles can never be swept in.
  {
    files: ['*.config.js'],
    extends: [js.configs.recommended, STYLISTIC],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: { ...globals.node }
    },
    rules: { ...STYLE_RULES }
  },

  {
    files: ['*.config.mjs'],
    extends: [js.configs.recommended, STYLISTIC],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node }
    },
    rules: { ...STYLE_RULES }
  }
]);
