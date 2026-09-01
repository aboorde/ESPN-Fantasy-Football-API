import forEach from 'lodash/forEach';

import BoxscorePlayer from '../boxscore-player/boxscore-player';

import Boxscore from './boxscore';

describe('Boxscore', () => {
  describe('responseMap', () => {
    const buildBoxscore = (data, options) => Boxscore.buildFromServer(data, options);

    let data;
    let playerData;

    beforeEach(() => {
      playerData = {
        lineupSlotId: 2,
        playerPoolEntry: {
          player: {
            stats: [{
              appliedStats: {
                24: 2.3,
                25: 6
              },
              statSourceId: 0,
              statSplitTypeId: 1
            }]
          }
        }
      };

      data = {
        home: {
          totalPoints: 123,
          teamId: 3,
          rosterForCurrentScoringPeriod: {
            entries: [playerData]
          }
        },
        away: {
          totalPoints: 324,
          teamId: 2,
          rosterForCurrentScoringPeriod: {
            entries: [playerData]
          }
        }
      };
    });

    describe('homeScore', () => {
      describe('manualParse', () => {
        describe('when totalPointsLive is populated on the team\'s response', () => {
          test('maps to totalPointsLive', () => {
            data.home.totalPointsLive = data.home.totalPoints + 12;

            const boxscore = buildBoxscore(data);
            expect(boxscore.homeScore).toBe(data.home.totalPointsLive);
          });
        });

        describe('when totalPointsLive is not populated on the team\'s response', () => {
          test('maps to totalPoints', () => {
            delete data.home.totalPointsLive;

            const boxscore = buildBoxscore(data);
            expect(boxscore.homeScore).toBe(data.home.totalPoints);
          });
        });
      });
    });

    describe('awayScore', () => {
      describe('manualParse', () => {
        describe('when totalPointsLive is populated on the team\'s response', () => {
          test('maps to totalPointsLive', () => {
            data.away.totalPointsLive = data.away.totalPoints + 12;

            const boxscore = buildBoxscore(data);
            expect(boxscore.awayScore).toBe(data.away.totalPointsLive);
          });
        });

        describe('when totalPointsLive is not populated on the team\'s response', () => {
          test('maps to totalPoints', () => {
            delete data.away.totalPointsLive;

            const boxscore = buildBoxscore(data);
            expect(boxscore.awayScore).toBe(data.away.totalPoints);
          });
        });
      });
    });

    describe('homeRoster', () => {
      describe('manualParse', () => {
        test('maps to BoxscorePlayer instances', () => {
          const boxscore = buildBoxscore(data);

          expect.hasAssertions();
          forEach(boxscore.homeRoster, (player) => {
            expect(player).toBeInstanceOf(BoxscorePlayer);
          });
        });
      });
    });

    describe('awayRoster', () => {
      describe('manualParse', () => {
        test('maps to BoxscorePlayer instances', () => {
          const boxscore = buildBoxscore(data);

          expect.hasAssertions();
          forEach(boxscore.awayRoster, (player) => {
            expect(player).toBeInstanceOf(BoxscorePlayer);
          });
        });
      });
    });

    describe('the matchup result fields', () => {
      // Measured 2026-09-01: `schedule[]` entries carry these alongside home and away, and the
      // library dropped every one of them -- so a playoff game was indistinguishable from a
      // regular season one and a result could only be inferred by comparing two floats.
      const matchup = {
        id: 1,
        matchupPeriodId: 4,
        playoffTierType: 'WINNERS_BRACKET',
        winner: 'HOME',
        home: { teamId: 3, totalPoints: 123, winProbability: 0.51 },
        away: { teamId: 2, totalPoints: 324, winProbability: 0.49 }
      };

      forEach({
        matchupPeriodId: 4,
        playoffTierType: 'WINNERS_BRACKET',
        winner: 'HOME',
        homeWinProbability: 0.51,
        awayWinProbability: 0.49
      }, (expectedValue, attribute) => {
        test(`${attribute} is populated`, () => {
          expect(buildBoxscore(matchup)[attribute]).toBe(expectedValue);
        });
      });

      describe('when the matchup is a future week', () => {
        // ESPN returns a sparse entry for later weeks: no rosters, no projections, no
        // winProbability. Measured on a live preseason league, where the last scheduled matchup
        // carried only teamId, totalPoints, adjustment, gamesPlayed and tiebreak.
        test('the fields ESPN omits are undefined rather than throwing', () => {
          const sparse = {
            id: 98,
            matchupPeriodId: 14,
            playoffTierType: 'NONE',
            winner: 'UNDECIDED',
            home: { teamId: 6, totalPoints: 0 },
            away: { teamId: 13, totalPoints: 0 }
          };
          const boxscore = buildBoxscore(sparse);

          expect(boxscore.matchupPeriodId).toBe(14);
          expect(boxscore.winner).toBe('UNDECIDED');
          expect(boxscore.homeWinProbability).toBeUndefined();
          expect(boxscore.homeProjectedScore).toBeUndefined();
          expect(boxscore.homeRoster).toEqual([]);
        });
      });
    });
  });
});
