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
export function roundTo(value: number, precision?: number): number;
/**
 * Converts to an integer, clamped to the safe integer range, with anything unconvertible becoming
 * `0`. ESPN sends scores and ids as strings, and sends `''` for a game that has not been played.
 *
 * @param   {*} value The value to convert.
 * @returns {number} The integer.
 */
export function toSafeInt(value: any): number;
/**
 * Trims a string, treating an absent one as empty. `String#trim` throws on `undefined`, and a
 * league member ESPN sends with no `firstName` is exactly that case.
 *
 * @param   {string} [value] The string to trim.
 * @returns {string} The trimmed string, or `''`.
 */
export function trimOrEmpty(value?: string): string;
