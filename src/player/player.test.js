import { getPath } from '../internal/objects.js';

import Player from './player.js';

describe('Player', () => {
  describe('constructor', () => {
    describe('when options are not passed', () => {
      const testPropIsUndefined = (prop) => {
        test(`${prop} is undefined`, () => {
          const newInstance = new Player();
          expect(getPath(newInstance, prop)).toBeUndefined();
        });
      };

      testPropIsUndefined('seasonId');
      testPropIsUndefined('scoringPeriodId');
    });

    describe('when options are passed', () => {
      const testPropIsSetFromOptions = (prop) => {
        test(`${prop} is set from options`, () => {
          const value = 25;
          const newInstance = new Player({ [prop]: value });
          expect(getPath(newInstance, prop)).toBe(value);
        });
      };

      testPropIsSetFromOptions('seasonId');
      testPropIsSetFromOptions('scoringPeriodId');
    });
  });

  describe('responseMap', () => {
    const buildPlayer = (data, options) => Player.buildFromServer(data, options);

    describe('jerseyNumber', () => {
      describe('manualParse', () => {
        describe('when a value is passed', () => {
          test('converts response to a number', () => {
            const data = { jersey: '23' };
            const player = buildPlayer(data);

            expect(player.jerseyNumber).toBe(23);
          });
        });

        describe('when the key is absent', () => {
          test('returns undefined', () => {
            const data = {};
            const player = buildPlayer(data);

            expect(player.jerseyNumber).toBeUndefined();
          });
        });

        describe('when ESPN sends an empty jersey', () => {
          // A player with no squad number. The key is present, so the base class's absent-key
          // guard does not fire here -- this is why the parser keeps its own falsy check, and
          // `toNumber('')` would otherwise report jersey number 0.
          test('returns undefined rather than 0', () => {
            const player = buildPlayer({ jersey: '' });

            expect(player.jerseyNumber).toBeUndefined();
          });
        });
      });
    });

    describe('proTeam', () => {
      describe('manualParse', () => {
        test('maps team id to human readable string', () => {
          const player = buildPlayer({ proTeamId: 22 });
          expect(player.proTeam).toBe('Arizona Cardinals');
        });
      });
    });

    describe('proTeamAbbreviation', () => {
      describe('manualParse', () => {
        test('maps team id to human readable abbreviation', () => {
          const player = buildPlayer({ proTeamId: 22 });
          expect(player.proTeamAbbreviation).toBe('ARI');
        });
      });
    });

    describe('defaultPosition', () => {
      describe('manualParse', () => {
        // Literal expectations rather than a lookup through the map the parser itself uses. The
        // previous version asserted `parse(id) === map[id]`, which held no matter what the map
        // said, and picked id 2 -- one of only two ids the wrong map happened to get right.
        //
        // Ids and players verified against real 2026 ESPN payloads.
        describe.each([
          [1, 'QB', 'Josh Allen'],
          [2, 'RB', 'Jahmyr Gibbs'],
          [3, 'WR', 'Ja\'Marr Chase'],
          [4, 'TE', 'Trey McBride'],
          [5, 'K', 'Brandon Aubrey'],
          [16, 'D/ST', 'Texans D/ST']
        ])('when defaultPositionId is %i', (defaultPositionId, position, example) => {
          test(`is ${position} (${example})`, () => {
            const player = buildPlayer({ defaultPositionId });
            expect(player.defaultPosition).toBe(position);
          });
        });

        describe('when ESPN sends an id this project has not verified', () => {
          test('leaves the position undefined rather than guessing', () => {
            const player = buildPlayer({ defaultPositionId: 11 });
            expect(player.defaultPosition).toBeUndefined();
          });
        });
      });
    });

    describe('eligiblePositions', () => {
      describe('manualParse', () => {
        test('maps lineup slot ids to positions', () => {
          // Josh Allen's real eligibleSlots. Note 1 is TQB here while defaultPositionId 1 is QB:
          // the two enums are different, and this pair of tests is what pins them apart.
          const player = buildPlayer({ eligibleSlots: [0, 1, 7, 20, 21] });

          expect(player.eligiblePositions).toEqual(['QB', 'TQB', 'OP', 'Bench', 'IR']);
        });
      });
    });

    describe('acquiredDate', () => {
      describe('manualParse', () => {
        describe('when data is passed', () => {
          test('returns a Date', () => {
            const acquisitionDate = 1545432134218;
            const data = { acquisitionDate };

            const player = buildPlayer(data);
            expect(player.acquiredDate).toEqual(new Date(acquisitionDate));
          });
        });

        describe('when data is not passed', () => {
          test('returns undefined', () => {
            const acquisitionDate = undefined;
            const data = { acquisitionDate };

            const player = buildPlayer(data);
            expect(player.acquiredDate).toBeUndefined();
          });
        });
      });
    });
  });
});
