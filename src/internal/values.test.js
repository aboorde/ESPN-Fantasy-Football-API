import { roundTo, toSafeInt, trimOrEmpty } from './values.js';

describe('internal/values', () => {
  describe('roundTo', () => {
    test('rounds to the given precision', () => {
      expect(roundTo(54.6789 * 100, 2)).toBe(5467.89);
    });

    // The reason this shifts by exponent instead of multiplying: 1.005 is not exactly
    // representable, so Math.round(1.005 * 100) / 100 gives 1, not 1.01.
    test('rounds a value the multiply-and-divide approach gets wrong', () => {
      expect(roundTo(1.005, 2)).toBe(1.01);
    });

    test('rounds to whole numbers by default', () => {
      expect(roundTo(2.6)).toBe(3);
    });

    test('leaves an already-round number alone', () => {
      expect(roundTo(50, 2)).toBe(50);
    });

    test('returns NaN for a value that is not a number', () => {
      expect(roundTo(undefined, 2)).toBeNaN();
    });
  });

  describe('toSafeInt', () => {
    test.each([
      ['a number', 3.7, 3],
      ['a negative number', -3.7, -3],
      ['a numeric string', '22', 22],
      ['an empty string', '', 0],
      ['undefined', undefined, 0],
      ['null', null, 0],
      ['a non-numeric string', 'nope', 0],
      ['Infinity', Infinity, Number.MAX_SAFE_INTEGER],
      ['-Infinity', -Infinity, -Number.MAX_SAFE_INTEGER]
    ])('%s -> %s', (_label, value, expected) => {
      expect(toSafeInt(value)).toBe(expected);
    });
  });

  describe('trimOrEmpty', () => {
    test('trims a string', () => {
      expect(trimOrEmpty('  Nixon  ')).toBe('Nixon');
    });

    // A league member ESPN sends with no firstName. String#trim would throw here.
    test.each([['undefined', undefined], ['null', null]])('%s becomes an empty string', (_l, v) => {
      expect(trimOrEmpty(v)).toBe('');
    });

    test('stringifies a non-string', () => {
      expect(trimOrEmpty(3)).toBe('3');
    });
  });
});
