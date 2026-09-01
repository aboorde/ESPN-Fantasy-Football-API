import {
  each, entriesOf, filter, find, isEmpty, isPlainObject, map, mapKeys, uniq
} from './collections.js';

// These exist because the code that calls them depends on the absent-input behavior, not just the
// happy path. ESPN omits keys constantly, and several call sites have comments saying they rely on
// this. Each function is therefore tested for `undefined` explicitly.
describe('internal/collections', () => {
  describe('isPlainObject', () => {
    test.each([
      ['an object literal', {}, true],
      ['a null-prototype object', Object.create(null), true],
      ['an array', [], false],
      ['null', null, false],
      ['undefined', undefined, false],
      ['a string', 'nope', false],
      ['a number', 3, false],
      ['a Date', new Date(), false],
      ['a class instance', new (class Thing {})(), false]
    ])('%s -> %s', (_label, value, expected) => {
      expect(isPlainObject(value)).toBe(expected);
    });
  });

  describe('isEmpty', () => {
    test.each([
      ['undefined', undefined, true],
      ['null', null, true],
      ['an empty array', [], true],
      ['an empty object', {}, true],
      ['an empty string', '', true],
      ['a number', 3, true],
      ['a populated array', [1], false],
      ['a populated object', { a: 1 }, false],
      ['a populated string', 'a', false]
    ])('%s -> %s', (_label, value, expected) => {
      expect(isEmpty(value)).toBe(expected);
    });
  });

  describe('entriesOf', () => {
    test('pairs an array with its indices', () => {
      expect(entriesOf(['a', 'b'])).toEqual([[0, 'a'], [1, 'b']]);
    });

    test('returns an object as entries', () => {
      expect(entriesOf({ a: 1 })).toEqual([['a', 1]]);
    });

    test.each([['undefined', undefined], ['null', null]])('%s yields none', (_label, value) => {
      expect(entriesOf(value)).toEqual([]);
    });
  });

  describe('each', () => {
    test('walks an array with values and indices', () => {
      const seen = [];
      each(['a', 'b'], (value, key) => seen.push([value, key]));

      expect(seen).toEqual([['a', 0], ['b', 1]]);
    });

    test('walks an object with values and keys', () => {
      const seen = [];
      each({ a: 1 }, (value, key) => seen.push([value, key]));

      expect(seen).toEqual([[1, 'a']]);
    });

    test('does nothing for an absent collection', () => {
      const iteratee = jest.fn();
      each(undefined, iteratee);

      expect(iteratee).not.toHaveBeenCalled();
    });
  });

  describe('map', () => {
    test('maps an array', () => {
      expect(map([1, 2], (n) => n * 2)).toEqual([2, 4]);
    });

    test('maps an object\'s values', () => {
      expect(map({ a: 1, b: 2 }, (n) => n * 2)).toEqual([2, 4]);
    });

    // Boxscore's rosters are parsed with parseAbsent precisely so that an unplayed week yields []
    // rather than an unset attribute. Array#map on undefined would throw instead.
    test('maps an absent collection to an empty array', () => {
      expect(map(undefined, (n) => n)).toEqual([]);
    });
  });

  describe('filter', () => {
    test('filters by a predicate function', () => {
      expect(filter([1, 2, 3], (n) => n > 1)).toEqual([2, 3]);
    });

    test('filters by matched properties', () => {
      const schedule = [{ matchupPeriodId: 1 }, { matchupPeriodId: 2 }];

      expect(filter(schedule, { matchupPeriodId: 2 })).toEqual([{ matchupPeriodId: 2 }]);
    });

    // Client#getBoxscoreForWeek filters a schedule that ESPN has not generated yet.
    test('filters an absent collection to an empty array', () => {
      expect(filter(undefined, { matchupPeriodId: 1 })).toEqual([]);
    });

    test('does not match an entry that is itself absent', () => {
      expect(filter([undefined, { a: 1 }], { a: 1 })).toEqual([{ a: 1 }]);
    });
  });

  describe('find', () => {
    test('finds by a predicate function', () => {
      expect(find([1, 2], (n) => n === 2)).toBe(2);
    });

    test('finds by matched properties', () => {
      expect(find([{ id: 1 }, { id: 2 }], { id: 2 })).toEqual({ id: 2 });
    });

    test('returns undefined when nothing matches', () => {
      expect(find([{ id: 1 }], { id: 2 })).toBeUndefined();
    });

    // Client#_parseTeamResponse searches `members`, which a league whose managers have all left
    // does not have.
    test('finds nothing in an absent collection rather than throwing', () => {
      expect(find(undefined, { id: 1 })).toBeUndefined();
    });
  });

  describe('mapKeys', () => {
    test('rekeys an object, leaving values alone', () => {
      expect(mapKeys({ 1: 2, 3: 4 }, (value, key) => `k${key}`)).toEqual({ k1: 2, k3: 4 });
    });

    test('rekeys an absent object to an empty one', () => {
      expect(mapKeys(undefined, (value, key) => key)).toEqual({});
    });
  });

  describe('uniq', () => {
    test('drops duplicates, keeping first-seen order', () => {
      expect(uniq([3, 1, 3, 2, 1])).toEqual([3, 1, 2]);
    });

    test('treats an absent array as empty', () => {
      expect(uniq(undefined)).toEqual([]);
    });
  });
});
