import forEach from 'lodash/forEach';

import BoxscorePlayer from '../boxscore-player/boxscore-player';

import Matchup from '../matchup/matchup';

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

    describe('the attributes inherited from Matchup', () => {
      // Boxscore extends Matchup, so the pairing, the result and the scores are mapped once. This
      // asserts the inheritance holds rather than re-testing the mappings themselves, which
      // matchup.test.js covers.
      test('are populated on a Boxscore', () => {
        const boxscore = buildBoxscore({
          id: 1,
          matchupPeriodId: 4,
          playoffTierType: 'WINNERS_BRACKET',
          winner: 'HOME',
          home: { teamId: 3, totalPoints: 123, winProbability: 0.51 },
          away: { teamId: 2, totalPoints: 324, winProbability: 0.49 }
        });

        expect(boxscore).toBeInstanceOf(Matchup);
        expect(boxscore.id).toBe(1);
        expect(boxscore.matchupPeriodId).toBe(4);
        expect(boxscore.playoffTierType).toBe('WINNERS_BRACKET');
        expect(boxscore.winner).toBe('HOME');
        expect(boxscore.homeScore).toBe(123);
        expect(boxscore.homeWinProbability).toBe(0.51);
        expect(boxscore.awayWinProbability).toBe(0.49);
      });
    });

    describe('when ESPN sends a week with no rosters', () => {
      // The sparse shape of a future week. Matchup tolerates it; Boxscore's own additions must too.
      test('the roster attributes are empty rather than throwing', () => {
        const boxscore = buildBoxscore({
          id: 98,
          matchupPeriodId: 14,
          winner: 'UNDECIDED',
          home: { teamId: 6, totalPoints: 0 },
          away: { teamId: 13, totalPoints: 0 }
        });

        expect(boxscore.homeProjectedScore).toBeUndefined();
        expect(boxscore.homeRoster).toEqual([]);
        expect(boxscore.awayRoster).toEqual([]);
      });
    });
  });
});
