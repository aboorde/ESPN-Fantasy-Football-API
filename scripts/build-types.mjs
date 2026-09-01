#!/usr/bin/env node
/**
 * Generates the package's TypeScript declarations from the jsdoc already in src/.
 *
 * The jsdoc stays the single source of truth. Every model documents its attributes on a `*Map`
 * typedef and annotates `static responseMap` with it, so `tsc --declaration` already emits those
 * types -- it just puts them on the *static* side, leaving the instance type as bare `leagueId:
 * any; seasonId: any`. Consumers care about the instance. So after tsc runs, each emitted class
 * gets a declaration merge projecting its responseMap type onto its instances:
 *
 *     type TeamAttributes = typeof Team.responseMap;
 *     interface Team extends TeamAttributes {}
 *
 * Subclass attributes come through the class hierarchy: BoxscorePlayer's map documents only what
 * BoxscorePlayer adds, and `declare class BoxscorePlayer extends Player` supplies the rest.
 *
 * Output is committed alongside the bundles and checked by the drift gate in `npm run ci`, so a
 * declaration that no longer matches src/ fails the build the same way a stale bundle does.
 *
 * KNOWN LIMITATION: the emitted declarations do not typecheck standalone -- `tsc --strict
 * node.d.ts` without `skipLibCheck` reports 9 errors, all TS2417. They are invisible to consumers,
 * because `skipLibCheck` has been the tsc default since 5.0 and every consumer here sets it, and
 * they do not affect instance types, which is all a consumer reads.
 *
 * TS2417 is static-side incompatibility. `@type {XMap}` deliberately describes `responseMap` as the
 * attributes it produces rather than the `{key, manualParse}` objects it holds. That is the whole
 * mechanism this file depends on. A subclass documenting only its own additions is then not
 * assignable to its parent's static. Fixing it means every subclass map restating its parent's,
 * which is the duplication the class hierarchy exists to avoid.
 *
 * There used to be 11 TS2304 errors here too -- unresolved names -- and the note claimed tsc drops
 * a module-scope typedef nothing exported refers to. That diagnosis was wrong. The real cause was
 * formatting: a jsdoc typedef written as
 *
 *     @typedef {
 *       'A' |
 *       'B'
 *     } Name
 *
 * does not parse. tsc loses the name, emits `export type <next declaration> = any`, and the type is
 * gone. Closing the brace on the last type line -- `'B'} Name` -- parses correctly, and cross-file
 * references resolve when written as `import('../constants').Name` rather than as a bare name.
 * Both were fixed, so every ESPN string union now reaches the declarations.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const OUT_DIR = 'types';
const ENTRY = 'node.d.ts';

/**
 * Classes whose instance shape cannot be projected from their responseMap.
 *
 * PlayerStats is the only one. Its map is `{ ...scoringItemToId }`, which maps a readable stat name
 * onto the ESPN stat *id* -- strings. A populated instance holds the parsed stat *values* at those
 * same keys, which are numbers. Projecting the map would type every stat as a string.
 */
const INSTANCE_TYPE_OVERRIDES = {
  PlayerStats: '{ [scoringItem: string]: number }'
};

/**
 * @param   {string} dir The directory to walk.
 * @returns {string[]} Every emitted declaration file beneath it.
 */
function declarationFiles(dir) {
  // Sorted, because this list orders the generated `node.d.ts` and that file is committed and
  // checked by `npm run verify:artifacts`. Directory read order is not guaranteed stable across
  // filesystems, and an unstable one would fail the drift gate on a machine that changed nothing.
  return fs.readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.d.ts'))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort();
}

/**
 * Appends the instance-side declaration merge for every class in a file that declares a
 * responseMap. Files that declare none -- utils, constants, the http client -- are left alone.
 *
 * @param   {string} file The declaration file to process.
 * @returns {string[]} The class names projected, for the run summary.
 */
function projectInstanceTypes(file) {
  const source = fs.readFileSync(file, 'utf8');
  const projected = [];
  let addition = '';

  // The body is captured here rather than rescanned per class, so the responseMap test below is
  // scoped to the class that owns it by construction.
  for (const [, name, body] of source.matchAll(/declare class (\w+)[^{]*\{([\s\S]*?)\n\}/g)) {
    const override = INSTANCE_TYPE_OVERRIDES[name];

    // Only project an inline object type. `static responseMap: Record<...>` on the base classes is
    // the mechanism's own type, not a model's attributes, and projecting it would put an index
    // signature on every BaseObject -- which would make any typo assignable.
    if (!override && !/static responseMap: \{/.test(body)) continue;

    const shape = override ?? `typeof ${name}.responseMap`;
    addition += `\ntype ${name}Attributes = ${shape};\n`
      + `interface ${name} extends ${name}Attributes {}\n`;
    projected.push(name);
  }

  if (addition) {
    fs.writeFileSync(
      file,
      `${source}\n// Instance attributes, projected from the jsdoc by scripts/build-types.mjs.\n`
        + `${addition}`
    );
  }
  return projected;
}

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.rmSync(ENTRY, { force: true });

// Resolved rather than shelled out to via `npx`. This runs from `prepare`, which means it runs on
// a consumer's machine during `npm install` of this repo as a git dependency; an `npx` that fails
// to resolve locally goes to the network and installs something, which is not a thing an install
// of this package should be able to do.
const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');

execFileSync(process.execPath, [
  tsc,
  '--allowJs', '--declaration', '--emitDeclarationOnly', '--skipLibCheck',
  '--target', 'es2022', '--module', 'esnext', '--moduleResolution', 'bundler',
  '--outDir', OUT_DIR, 'src/index.js'
], { stdio: 'inherit' });

const emitted = declarationFiles(OUT_DIR);
const projected = emitted.flatMap(projectInstanceTypes);

// Module-scope typedefs -- ActivityAction, and anything added later -- are emitted as exported
// types in the file that declares them, but `types/index` only re-exports what src/index.js
// exports, which is classes. Without these lines a consumer can see the shape in a return type but
// cannot name it, so `import type { ActivityAction }` fails.
// Deduplicated, and never shadowing a class. A local alias such as
// `@typedef {import('...').default} PlayerStats` is emitted as an exported type in every file that
// declares one, and `PlayerStats` is also a class on `types/index`. Re-exporting both, or the same
// alias from three files, is a duplicate identifier -- so the first declaration of a name wins and
// anything `types/index` already exports is skipped.
const indexExports = new Set(
  [...fs.readFileSync(path.join(OUT_DIR, 'index.d.ts'), 'utf8').matchAll(/\b(\w+)\b/g)]
    .map((match) => match[1])
);
const seenTypes = new Set();
const namedTypes = emitted.flatMap((file) => {
  const from = `./${file.replace(/\.d\.ts$/, '')}`;
  return [...fs.readFileSync(file, 'utf8').matchAll(/^export type (\w+)/gm)]
    .filter((match) => {
      const name = match[1];
      if (seenTypes.has(name) || indexExports.has(name)) {
        return false;
      }
      seenTypes.add(name);
      return true;
    })
    .map((match) => `export type { ${match[1]} } from '${from}';`);
});

// The bundles are CommonJS, and consumers import them by path -- `espn-fantasy-football-api/node.js`
// -- so TypeScript looks for `node.d.ts` beside `node.js`. It re-exports the generated tree, plus a
// default export, because a CJS module's `module.exports` is what `import pkg from` yields under
// esModuleInterop and that is how consumers reach `Client`.
fs.writeFileSync(ENTRY, `// Generated by scripts/build-types.mjs. Do not edit.
export * from './${OUT_DIR}/index';
${namedTypes.join('\n')}
import * as api from './${OUT_DIR}/index';
declare const _default: typeof api;
export default _default;
`);

console.log(`types: ${emitted.length} declarations, `
  + `${projected.length} instance projections (${projected.join(', ')}), `
  + `${namedTypes.length} named type re-exports`);
