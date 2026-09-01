import { flattenObject, flattenObjectSansNumericKeys, toDate } from './utils';

describe('flattenObject', () => {
  describe('when there is a nested object with numerical keys', () => {
    test('flattens the object', () => {
      const data = {
        a: {
          b: {
            1: 2
          }
        }
      };

      const result = flattenObject(data);
      expect(result).toStrictEqual({ 1: 2 });
    });
  });

  describe('when there is a nested object without numerical keys', () => {
    test('flattens the object', () => {
      const data = {
        a: {
          b: {
            c: 2
          }
        }
      };

      const result = flattenObject(data);
      expect(result).toStrictEqual({ c: 2 });
    });
  });

  describe('when there is an array as a value', () => {
    test('simply sets the array and does not flatten any array entries', () => {
      const data = {
        array: [{ a: 1 }]
      };

      const result = flattenObject(data);
      expect(result).toStrictEqual(data);
    });
  });
});

describe('flattenObjectSansNumericKeys', () => {
  describe('when there is a nested object with numerical keys', () => {
    test('flattens the object up to the object with numerical keys', () => {
      const data = {
        a: {
          b: {
            1: 2
          }
        }
      };

      const result = flattenObjectSansNumericKeys(data);
      expect(result).toStrictEqual({
        b: {
          1: 2
        }
      });
    });
  });

  describe('when there is a nested object without numerical keys', () => {
    test('flattens the object', () => {
      const data = {
        a: {
          b: {
            c: 2
          }
        }
      };

      const result = flattenObjectSansNumericKeys(data);
      expect(result).toStrictEqual({ c: 2 });
    });
  });

  describe('when there is an array as a value', () => {
    test('simply sets the array and does not flatten any array entries', () => {
      const data = {
        array: [{ a: 1 }]
      };

      const result = flattenObjectSansNumericKeys(data);
      expect(result).toStrictEqual(data);
    });
  });

  describe('toDate', () => {
    test('converts ESPN epoch milliseconds to a Date', () => {
      expect(toDate(1535476500000)).toEqual(new Date(1535476500000));
    });

    describe('when ESPN omitted the date', () => {
      // `new Date(undefined)` is an Invalid Date, which survives every downstream presence check.
      test('returns undefined rather than an Invalid Date', () => {
        expect(toDate(undefined)).toBeUndefined();
        expect(toDate(0)).toBeUndefined();
      });
    });
  });
});
