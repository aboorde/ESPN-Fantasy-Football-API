/**
 * Path access and merging, the two lodash behaviors with no direct native equivalent.
 *
 * See `./collections.js` for why this project writes these out rather than depending on lodash.
 */

/**
 * Splits a dotted path into its segments. A path that is already an array passes through.
 *
 * @param   {string|Array<string|number>} path The path.
 * @returns {Array<string|number>} Its segments.
 */
const segmentsOf = (path) => (Array.isArray(path) ? path : String(path).split('.'));

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
const getPath = (object, path, defaultValue) => {
  // Almost every path in a responseMap is a single key with no dot. Splitting those allocates an
  // array per lookup, and the parse path runs this once per attribute per entity -- over a million
  // times for one `getFreeAgents`. lodash short-circuited the same case in `_.get`; the rewrite
  // that replaced it did not, and that omission was most of the parse cost.
  if (typeof path === 'string' && !path.includes('.')) {
    const value = object === undefined || object === null ? undefined : object[path];
    return value === undefined ? defaultValue : value;
  }

  let current = object;

  for (const segment of segmentsOf(path)) {
    if (current === undefined || current === null) {
      return defaultValue;
    }
    current = current[segment];
  }

  return current === undefined ? defaultValue : current;
};

/**
 * Writes a value at a dotted path, creating intermediate objects as needed.
 *
 * @param {object} object The object to write into. Mutated.
 * @param {string|number|Array} path The path to write.
 * @param {*} value The value to write.
 */
const setPath = (object, path, value) => {
  // Same single-key fast path as `getPath`, and it also skips the throwaway array `segments.slice`
  // allocates below.
  if (typeof path === 'string' && !path.includes('.')) {
    object[path] = value;
    return;
  }

  const segments = segmentsOf(path);
  let current = object;

  segments.slice(0, -1).forEach((segment) => {
    if (typeof current[segment] !== 'object' || current[segment] === null) {
      current[segment] = {};
    }
    current = current[segment];
  });

  current[segments[segments.length - 1]] = value;
};

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
const mergeConfig = (base, addition) => ({
  ...base,
  ...addition,
  ...((base?.headers || addition?.headers) ?
      { headers: { ...base?.headers, ...addition?.headers } } :
      {})
});

export { getPath, mergeConfig, setPath };
