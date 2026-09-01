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
 * node.d.ts` without `skipLibCheck` reports around 23 errors. They are invisible to consumers,
 * because `skipLibCheck` has been the tsc default since 5.0 and every consumer here sets it, and
 * they do not affect instance types, which is all a consumer reads. Two causes, both structural:
 *
 *   - TS2417, static-side incompatibility. `@type {XMap}` deliberately describes `responseMap` as
 *     the attributes it produces rather than the `{key, manualParse}` objects it holds. That is
 *     the whole mechanism this file depends on. A subclass documenting only its own additions is
 *     then not assignable to its parent's static. Fixing it means every subclass map restating its
 *     parent's, which is the duplication the class hierarchy exists to avoid.
 *   - TS2304, unresolved names. The jsdoc references `PlayerStats` and the union typedefs in
 *     constants.js (`DRAFT_TYPE`, `INJURY_STATUSES`, ...) by bare name. tsc drops a module-scope
 *     typedef nothing exported refers to, so those never reach `constants.d.ts`. Resolving them
 *     needs the typedefs rehomed or the unions inlined at each use.
 *
 * Both are worth doing if the declarations ever need to stand on their own. Neither is a silent
 * defect: this note is here so the next person knows the count is accounted for.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
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

execFileSync('npx', [
  'tsc',
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
const namedTypes = emitted.flatMap((file) => {
  const from = `./${file.replace(/\.d\.ts$/, '')}`;
  return [...fs.readFileSync(file, 'utf8').matchAll(/^export type (\w+)/gm)]
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
