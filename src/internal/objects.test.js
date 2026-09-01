import { getPath, mergeConfig, setPath } from './objects.js';

describe('internal/objects', () => {
  describe('getPath', () => {
    const data = { record: { overall: { wins: 7, streakType: null } } };

    test('reads a dotted path', () => {
      expect(getPath(data, 'record.overall.wins')).toBe(7);
    });

    test('reads a single key', () => {
      expect(getPath({ id: 3 }, 'id')).toBe(3);
    });

    test('reads a numeric key', () => {
      expect(getPath({ 16: 'D/ST' }, 16)).toBe('D/ST');
    });

    test('reads an array path', () => {
      expect(getPath(data, ['record', 'overall', 'wins'])).toBe(7);
    });

    test('returns undefined when an intermediate segment is missing', () => {
      expect(getPath(data, 'record.division.wins')).toBeUndefined();
    });

    test('returns undefined rather than throwing on an absent object', () => {
      expect(getPath(undefined, 'record.overall.wins')).toBeUndefined();
    });

    test('stops at a null intermediate rather than throwing', () => {
      expect(getPath({ record: null }, 'record.overall.wins')).toBeUndefined();
    });

    test('returns the default when only the final segment is missing', () => {
      expect(getPath({ record: { overall: {} } }, 'record.overall.wins', 5)).toBe(5);
    });

    test('returns the default when the path is missing', () => {
      expect(getPath(data, 'status.finalScoringPeriod', 17)).toBe(17);
    });

    // ESPN sends nulls, and a null is an answer. Only an absent value falls back.
    test('does not substitute the default for a stored null', () => {
      expect(getPath(data, 'record.overall.streakType', 'WIN')).toBeNull();
    });

    test('does not substitute the default for a stored zero', () => {
      expect(getPath({ wins: 0 }, 'wins', 5)).toBe(0);
    });
  });

  describe('setPath', () => {
    test('writes a single key', () => {
      const target = {};
      setPath(target, 'wins', 7);

      expect(target).toEqual({ wins: 7 });
    });

    test('writes a dotted path, creating intermediates', () => {
      const target = {};
      setPath(target, 'record.overall.wins', 7);

      expect(target).toEqual({ record: { overall: { wins: 7 } } });
    });

    test('replaces a non-object standing where an intermediate is needed', () => {
      const target = { record: 3 };
      setPath(target, 'record.wins', 7);

      expect(target).toEqual({ record: { wins: 7 } });
    });

    test('replaces a null standing where an intermediate is needed', () => {
      const target = { record: null };
      setPath(target, 'record.wins', 7);

      expect(target).toEqual({ record: { wins: 7 } });
    });

    test('writes into an existing intermediate rather than replacing it', () => {
      const target = { record: { overall: { wins: 7 } } };
      setPath(target, 'record.overall.losses', 3);

      expect(target).toEqual({ record: { overall: { wins: 7, losses: 3 } } });
    });

    test('overwrites an existing value', () => {
      const target = { wins: 1 };
      setPath(target, 'wins', 7);

      expect(target.wins).toBe(7);
    });
  });

  describe('mergeConfig', () => {
    // The reason this is a deep merge at all. Client#_buildRequestConfig adds a Cookie to a config
    // that already carries x-fantasy-filter; a shallow spread would drop the filter, and only on
    // private-league requests, since that is the only time a Cookie is added.
    test('combines headers rather than replacing them', () => {
      const merged = mergeConfig(
        { headers: { 'x-fantasy-filter': '{}' }, baseURL: 'https://example.test/' },
        { headers: { Cookie: 'espn_s2=a;' }, credentials: 'include' }
      );

      expect(merged).toEqual({
        headers: { 'x-fantasy-filter': '{}', Cookie: 'espn_s2=a;' },
        baseURL: 'https://example.test/',
        credentials: 'include'
      });
    });

    test('lets the addition win on a shared header', () => {
      const merged = mergeConfig({ headers: { Accept: 'a' } }, { headers: { Accept: 'b' } });

      expect(merged.headers.Accept).toBe('b');
    });

    test('mutates neither input', () => {
      const base = { headers: { a: '1' } };
      const addition = { headers: { b: '2' } };

      mergeConfig(base, addition);

      expect(base).toEqual({ headers: { a: '1' } });
      expect(addition).toEqual({ headers: { b: '2' } });
    });

    test('omits headers entirely when neither side has any', () => {
      expect(mergeConfig({ baseURL: 'x' }, { credentials: 'include' }))
        .toEqual({ baseURL: 'x', credentials: 'include' });
    });

    test('handles an absent base', () => {
      expect(mergeConfig(undefined, { headers: { Cookie: 'a' } }))
        .toEqual({ headers: { Cookie: 'a' } });
    });
  });
});
