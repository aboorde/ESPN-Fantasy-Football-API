/**
 * Calls `iteratee(value, key)` for each entry. Tolerates an absent collection.
 *
 * @param {Array|object} [collection] The collection to walk.
 * @param {Function} iteratee Called with `(value, key)`.
 */
export function each(collection?: any[] | object, iteratee: Function): void;
/**
 * The entries of an array or object, as `[key, value]` pairs. `undefined` yields none.
 *
 * @param   {Array|object} [collection] The collection to walk.
 * @returns {Array<[string|number, *]>} Its entries.
 */
export function entriesOf(collection?: any[] | object): Array<[string | number, any]>;
/**
 * Filters an array or an object's values. An absent collection filters to `[]`.
 *
 * @param   {Array|object} [collection] The collection to filter.
 * @param   {Function|object} predicate A function, or an object of properties to match.
 * @returns {Array} The matching values.
 */
export function filter(collection?: any[] | object, predicate: Function | object): any[];
/**
 * Finds the first matching value, or `undefined`. An absent collection finds nothing rather than
 * throwing -- a response with no `members` key, or a team whose `primaryOwner` has left the league,
 * would otherwise take the whole call down.
 *
 * @param   {Array|object} [collection] The collection to search.
 * @param   {Function|object} predicate A function, or an object of properties to match.
 * @returns {*} The first match, or `undefined`.
 */
export function find(collection?: any[] | object, predicate: Function | object): any;
/**
 * Whether a collection has nothing in it. `undefined`, `null`, `[]` and `{}` are all empty.
 *
 * @param   {*} value The value to test.
 * @returns {boolean} Whether it holds nothing.
 */
export function isEmpty(value: any): boolean;
/**
 * The handful of lodash behaviors this project actually depended on, written out.
 *
 * lodash was the only runtime dependency, and 210 of the bundle's 226 modules. Most of its uses
 * here were a native method spelled differently. A few were not, and those are the reason this file
 * exists rather than a sweep of inline replacements:
 *
 *   - lodash's collection functions accept `undefined` and return an empty result. ESPN omits keys
 *     constantly -- no `members` for a league whose managers have all left, no `schedule` before
 *     the season is generated, no roster for a week that has not been scored -- and several call
 *     sites lean on that, with comments saying so. `[].map` on `undefined` throws.
 *   - lodash's `merge` is deep. `_buildRequestConfig` uses it to add a `Cookie` header to a config
 *     that may already carry `x-fantasy-filter`; a shallow spread replaces the header object and
 *     drops the filter, breaking private-league requests only.
 *   - lodash's `trim` accepts `undefined`. `String#trim` does not.
 *
 * Each of those is tested here for its absent-input case specifically, so the behavior is a
 * stated contract rather than an accident of the implementation.
 */
/**
 * Whether a value is a plain object -- an object literal or `Object.create(null)`, not an array,
 * a Date, or a class instance.
 *
 * @param   {*} value The value to test.
 * @returns {boolean} Whether it is a plain object.
 */
export function isPlainObject(value: any): boolean;
/**
 * Maps over an array or an object's values. An absent collection maps to `[]`.
 *
 * The empty-array result is load-bearing: `Boxscore`'s rosters are parsed with `parseAbsent`
 * precisely so an unplayed week yields `[]` rather than an unset attribute.
 *
 * @param   {Array|object} [collection] The collection to map.
 * @param   {Function} iteratee Called with `(value, key)`.
 * @returns {Array} The mapped values.
 */
export function map(collection?: any[] | object, iteratee: Function): any[];
/**
 * Rekeys an object, leaving the values alone.
 *
 * @param   {object} [object] The object to rekey.
 * @param   {Function} iteratee Called with `(value, key)`, returning the new key.
 * @returns {object} The rekeyed object.
 */
export function mapKeys(object?: object, iteratee: Function): object;
/**
 * The unique values of an array, in first-seen order.
 *
 * @param   {Array} [array] The array to dedupe.
 * @returns {Array} Its unique values.
 */
export function uniq(array?: any[]): any[];
