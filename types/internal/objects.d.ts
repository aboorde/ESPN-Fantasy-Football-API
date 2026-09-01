/**
 * Reads a value at a dotted path, returning `defaultValue` when any segment is missing.
 *
 * Only `undefined` falls back to the default, matching lodash. A stored `null` is a value, and
 * ESPN sends plenty of them.
 *
 * @param   {object} [object] The object to read from.
 * @param   {string|number|Array} path The path to read.
 * @param   {*} [defaultValue] Returned when the path resolves to `undefined`.
 * @returns {*} The value at the path, or `defaultValue`.
 */
export function getPath(object?: object, path: string | number | any[], defaultValue?: any): any;
/**
 * Merges request configs, combining their `headers` rather than replacing them.
 *
 * This is the one merge in the project that has to be deep, and the reason is narrow enough to
 * name: `Client#_buildRequestConfig` adds a `Cookie` header to a config that may already carry
 * `x-fantasy-filter`. A shallow spread replaces the whole headers object, silently dropping the
 * filter -- and only on private-league requests, since that is the only time a Cookie is added.
 *
 * Neither input is mutated.
 *
 * @param   {object} [base] The caller's config.
 * @param   {object} [addition] The config to layer over it.
 * @returns {object} A new config.
 */
export function mergeConfig(base?: object, addition?: object): object;
/**
 * Writes a value at a dotted path, creating intermediate objects as needed.
 *
 * @param {object} object The object to write into. Mutated.
 * @param {string|number|Array} path The path to write.
 * @param {*} value The value to write.
 */
export function setPath(object: object, path: string | number | any[], value: any): void;
