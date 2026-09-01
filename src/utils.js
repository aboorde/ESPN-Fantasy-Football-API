import { each, isPlainObject } from './internal/collections.js';
import { setPath } from './internal/objects.js';

/**
 * Warns when flattening is about to overwrite a key with a different value.
 *
 * Development only. Two ESPN sub-objects colliding on a key is a data-shape surprise worth
 * knowing about, but not worth a runtime cost in a consumer's production build.
 *
 * @param {object} flatObject The object being built.
 * @param {string} key The key about to be written.
 * @param {*} value The value about to be written.
 */
// istanbul ignore next
const warnOnOverwrite = (flatObject, key, value) => {
  if (process.env.NODE_ENV === 'development' && flatObject[key] && value !== flatObject[key]) {
    console.warn(`espn-fantasy-football-api: Assigning non-empty key ${key}. Set value: ${flatObject[key]}, new value: ${value}!`);
  }
};

/**
 * Flattens nested objects onto a single level.
 *
 * @param   {object} [object] The object to flatten.
 * @param   {Function} shouldRecurse Given a value, whether to flatten into it rather than assign
 *                                   it as-is.
 * @returns {object} The flattened object.
 */
const flatten = (object, shouldRecurse) => {
  const flatObject = {};

  each(object, (value, key) => {
    if (shouldRecurse(value)) {
      Object.assign(flatObject, flatten(value, shouldRecurse));
    } else {
      warnOnOverwrite(flatObject, key, value);
      setPath(flatObject, key, value);
    }
  });

  return flatObject;
};

/**
 * Flattens every nested plain object onto one level.
 *
 * @param   {object} [object] The object to flatten.
 * @returns {object} The flattened object.
 */
const flattenObject = (object) => flatten(object, isPlainObject);

/**
 * Flattens nested plain objects, but keeps any object ESPN keys by number intact.
 *
 * A numerically-keyed object is a collection -- a stats block keyed by `statId`, a
 * `pointsOverrides` keyed by position -- not a record with named fields. Flattening one would
 * scatter its entries into the parent and let two of them collide on the same id.
 *
 * @param   {object} [object] The object to flatten.
 * @returns {object} The flattened object.
 */
const flattenObjectSansNumericKeys = (object) => flatten(object, (value) => (
  isPlainObject(value) && Object.keys(value).every((key) => Number.isNaN(Number(key)))
));

/**
 * Converts an ESPN timestamp to a Date, leaving an absent one absent.
 *
 * ESPN sends epoch milliseconds and omits the key entirely when there is no date. `new Date()` on
 * that omission yields an Invalid Date rather than nothing, which then survives every downstream
 * check that only tests for presence.
 *
 * @param   {number} value The epoch milliseconds to convert.
 * @returns {Date|undefined} The date, or `undefined` when ESPN sent nothing.
 */
const toDate = (value) => (value ? new Date(value) : undefined);

export {
  flattenObject,
  flattenObjectSansNumericKeys,
  toDate
};
