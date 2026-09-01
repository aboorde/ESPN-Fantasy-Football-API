import forEach from 'lodash/forEach';
import get from 'lodash/get';

import Player from '../player/player';

import Team from './team';

describe('Team', () => {
  describe('constructor', () => {
    describe('when options are not passed', () => {
      const testPropIsUndefined = (prop) => {
        test(`${prop} is undefined`, () => {
          const newInstance = new Team();
          expect(get(newInstance, prop)).toBeUndefined();
        });
      };

      testPropIsUndefined('leagueId');
      testPropIsUndefined('seasonId');
    });

    describe('when options are passed', () => {
      const testPropIsSetFromOptions = (prop) => {
        test(`${prop} is set from options`, () => {
          const value = 25;
          const newInstance = new Team({ [prop]: value });
          expect(get(newInstance, prop)).toBe(value);
        });
      };

      testPropIsSetFromOptions('leagueId');
      testPropIsSetFromOptions('seasonId');
    });
  });

  describe('responseMap', () => {
    const buildTeam = (data, options) => Team.buildFromServer(data, options);

    describe('roster', () => {
      describe('manualParse', () => {
        test('returns an array of players', () => {
          const data = {
            owner: {
              firstName: 'Test',
              id: '{BAD5167F-96F5-40FF-AFF0-4D2CC92F4058}',
              lastName: 'Owner'
            },
            roster: {
              entries: [{
                playerPoolEntry: { id: 0 }
              }, {
                playerPoolEntry: { id: 1 }
              }, {
                playerPoolEntry: { id: 2 }
              }]
            }
          };

          const team = buildTeam(data, { seasonId: 2018 });

          expect.hasAssertions();
          forEach(team.roster, (player, index) => {
            expect(player).toBeInstanceOf(Player);
            expect(player.id).toBe(index);
            expect(player.seasonId).toBe(team.seasonId);
          });
        });
      });
    });

    describe('ownerName', () => {
      describe('manualParse', () => {
        test('joins the member first and last name', () => {
          const team = buildTeam({ owner: { firstName: 'Nixon', lastName: 'Ball' } });
          expect(team.ownerName).toBe('Nixon Ball');
        });

        test('trims whitespace around each part', () => {
          const team = buildTeam({ owner: { firstName: '  Nixon ', lastName: ' Ball  ' } });
          expect(team.ownerName).toBe('Nixon Ball');
        });

        describe('when ESPN sends no matching member', () => {
          test('leaves ownerName unset rather than throwing', () => {
            const team = buildTeam({ id: 1, abbrev: 'BALL' });
            expect(team.ownerName).toBeUndefined();
          });
        });

        describe('when the member carries no name', () => {
          test('leaves ownerName unset rather than setting a blank string', () => {
            const team = buildTeam({ owner: { displayName: 'nixon_b' } });
            expect(team.ownerName).toBeUndefined();
          });
        });
      });
    });

    describe('when populated from a measured ESPN response', () => {
      // Recorded 2026-09-01 from `?view=mRoster&view=mTeam&view=mStandings` on a live league. Every
      // path asserted below was observed on the wire. A mapping that drifts from ESPN's shape fails
      // here instead of silently returning `undefined` forever, which is precisely how
      // `wavierRank: 'wavierRank'` survived in shipped code and docs for years.
      const responseData = {
        id: 1,
        abbrev: 'BALL',
        name: 'Ball\'s Balls',
        logo: 'https://g.espncdn.com/lm-static/logo-packs/ffl/warriors-13.svg',
        primaryOwner: '{00000000-0000-0000-0000-000000000001}',
        owners: ['{00000000-0000-0000-0000-000000000001}'],
        waiverRank: 1,
        divisionId: 0,
        points: 1422.5,
        pointsAdjusted: 2,
        pointsDelta: -3.5,
        playoffSeed: 14,
        rankCalculatedFinal: 9,
        currentProjectedRank: 1,
        draftDayProjectedRank: 4,
        playoffClinchType: 'UNKNOWN',
        eliminated: false,
        eliminationMatchupPeriod: 0,
        currentSimulationResults: {
          divisionWinPct: 0.0895,
          playoffPct: 0.498,
          rank: 1
        },
        transactionCounter: {
          acquisitionBudgetSpent: 120,
          acquisitions: 3,
          drops: 1,
          moveToIR: 2,
          trades: 4
        },
        record: {
          overall: {
            gamesBack: 1.5,
            losses: 6,
            percentage: 0.5,
            pointsAgainst: 1300.25,
            pointsFor: 1422.5,
            streakLength: 3,
            streakType: 'WIN',
            ties: 1,
            wins: 7
          }
        }
      };

      const expectedAttributes = {
        waiverRank: 1,
        divisionId: 0,
        primaryOwnerId: '{00000000-0000-0000-0000-000000000001}',
        ownerIds: ['{00000000-0000-0000-0000-000000000001}'],
        streakType: 'WIN',
        streakLength: 3,
        gamesBack: 1.5,
        pointsAdjusted: 2,
        pointsDelta: -3.5,
        playoffPct: 0.498,
        divisionWinPct: 0.0895,
        simulatedRank: 1,
        currentProjectedRank: 1,
        draftDayProjectedRank: 4,
        playoffClinchType: 'UNKNOWN',
        isEliminated: false,
        eliminationMatchupPeriod: 0,
        acquisitionBudgetSpent: 120,
        acquisitionCount: 3,
        dropCount: 1,
        tradeCount: 4,
        moveToIRCount: 2
      };

      forEach(expectedAttributes, (expectedValue, attribute) => {
        test(`${attribute} is populated`, () => {
          const team = buildTeam(responseData, { seasonId: 2026 });
          expect(get(team, attribute)).toEqual(expectedValue);
        });
      });
    });

    describe('when ESPN omits the mStandings simulation fields', () => {
      // getHistoricalTeamsAtWeek does not request `mStandings`, because ESPN runs no live playoff
      // simulation for a completed season. These must be absent rather than throw.
      const simulationAttributes = [
        'playoffPct', 'divisionWinPct', 'simulatedRank', 'playoffClinchType'
      ];

      forEach(simulationAttributes, (attribute) => {
        test(`${attribute} is undefined`, () => {
          const team = buildTeam({ id: 1, abbrev: 'BALL', playoffSeed: 3 }, { seasonId: 2017 });
          expect(get(team, attribute)).toBeUndefined();
        });
      });
    });
  });
});
