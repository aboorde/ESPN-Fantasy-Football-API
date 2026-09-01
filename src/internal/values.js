/**
 * Scalar coercions, matching the lodash behaviors this project relied on.
 *
 * See `./collections.js` for why this project writes these out rather than depending on lodash.
 */

/**
 * Rounds to a number of decimal places.
 *
 * Shifts by exponent rather than multiplying, which is what keeps `roundTo(1.005, 2)` at `1.01`
 * instead of the `1` that `Math.round(1.005 * 100) / 100` produces -- 1.005 is not exactly
 * representable, and multiplying commits to the error before rounding.
 *
 * @param   {number} value The number to round.
 * @param   {number} [precision] Decimal places.
 * @returns {number} The rounded number.
 */
const roundTo = (value, precision = 0) => {
  const shifted = Number(`${value}e${precision}`);
  return Number.isNaN(shifted) ? Number(value) : Number(`${Math.round(shifted)}e${-precision}`);
};

/**
 * Converts to an integer, clamped to the safe integer range, with anything unconvertible becoming
 * `0`. ESPN sends scores and ids as strings, and sends `''` for a game that has not been played.
 *
 * @param   {*} value The value to convert.
 * @returns {number} The integer.
 */
const toSafeInt = (value) => {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return 0;
  }

  return Math.min(Math.max(Math.trunc(number), -Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
};

/**
 * Trims a string, treating an absent one as empty. `String#trim` throws on `undefined`, and a
 * league member ESPN sends with no `firstName` is exactly that case.
 *
 * @param   {string} [value] The string to trim.
 * @returns {string} The trimmed string, or `''`.
 */
const trimOrEmpty = (value) => (value === undefined || value === null ? '' : String(value).trim());

export { roundTo, toSafeInt, trimOrEmpty };
