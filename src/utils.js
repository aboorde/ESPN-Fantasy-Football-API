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

const flattenObject = (object) => {
  const flatObject = {};

  each(object, (value, key) => {
    if (isPlainObject(value)) {
      Object.assign(flatObject, flattenObject(value));
    } else {
      warnOnOverwrite(flatObject, key, value);
      setPath(flatObject, key, value);
    }
  });

  return flatObject;
};

const flattenObjectSansNumericKeys = (object) => {
  const flatObject = {};

  each(object, (value, key) => {
    if (isPlainObject(value) && !Object.keys(value).some((k) => !Number.isNaN(Number(k)))) {
      Object.assign(flatObject, flattenObjectSansNumericKeys(value));
    } else {
      warnOnOverwrite(flatObject, key, value);
      setPath(flatObject, key, value);
    }
  });

  return flatObject;
};

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
