export function flattenObject(object: any): {};
export function flattenObjectSansNumericKeys(object: any): {};
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
export function toDate(value: number): Date | undefined;
