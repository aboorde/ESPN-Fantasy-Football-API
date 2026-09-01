import { each } from '../internal/collections.js';

import Matchup from './matchup';

describe('Matchup', () => {
  describe('responseMap', () => {
    const buildMatchup = (data, options) => Matchup.buildFromServer(data, options);

    describe('when populated from a measured schedule entry', () => {
      // Recorded 2026-09-01 from `?view=mMatchup&view=mMatchupScore` on a live league. The entry
      // for the matchup period being scored carries projections and win probabilities; the roster
      // keys it also carries are deliberately not mapped, which is what separates Matchup from
      // Boxscore.
      const scored = {
        id: 1,
        matchupPeriodId: 1,
        playoffTierType: 'NONE',
        winner: 'UNDECIDED',
        home: {
          teamId: 8,
          totalPoints: 0,
          totalPointsLive: 104.5,
          totalProjectedPointsLive: 105.67122322,
          winProbability: 0.51
        },
        away: {
          teamId: 1,
          totalPoints: 0,
          totalPointsLive: 98.2,
          totalProjectedPointsLive: 103.26364327,
          winProbability: 0.49
        }
      };

      each({
        id: 1,
        matchupPeriodId: 1,
        playoffTierType: 'NONE',
        winner: 'UNDECIDED',
        homeTeamId: 8,
        awayTeamId: 1,
        homeWinProbability: 0.51,
        awayWinProbability: 0.49
      }, (expectedValue, attribute) => {
        test(`${attribute} is populated`, () => {
          expect(buildMatchup(scored)[attribute]).toBe(expectedValue);
        });
      });

      test('prefers the live score over the settled score while ESPN is scoring', () => {
        const matchup = buildMatchup(scored);
        expect(matchup.homeScore).toBe(104.5);
        expect(matchup.awayScore).toBe(98.2);
      });

      test('does not map rosters', () => {
        const matchup = buildMatchup(scored);
        expect(matchup.homeRoster).toBeUndefined();
        expect(matchup.awayRoster).toBeUndefined();
      });
    });

    describe('when the matchup is a future week', () => {
      // Measured: the last scheduled matchup of a preseason league carries only teamId,
      // totalPoints, adjustment, gamesPlayed and tiebreak. No projections, no win probability.
      const future = {
        id: 98,
        matchupPeriodId: 14,
        playoffTierType: 'NONE',
        winner: 'UNDECIDED',
        home: { teamId: 6, totalPoints: 0 },
        away: { teamId: 13, totalPoints: 0 }
      };

      test('maps the pairing', () => {
        const matchup = buildMatchup(future);
        expect(matchup.matchupPeriodId).toBe(14);
        expect(matchup.homeTeamId).toBe(6);
        expect(matchup.awayTeamId).toBe(13);
        expect(matchup.winner).toBe('UNDECIDED');
      });

      test('leaves the fields ESPN omits undefined', () => {
        const matchup = buildMatchup(future);
        expect(matchup.homeWinProbability).toBeUndefined();
        expect(matchup.awayWinProbability).toBeUndefined();
      });
    });

    describe('when a team is on a bye', () => {
      // Leagues with an odd number of teams schedule a bye, and ESPN sends no `away` at all.
      test('maps the home side and leaves the away side undefined', () => {
        const bye = {
          id: 7,
          matchupPeriodId: 3,
          playoffTierType: 'NONE',
          winner: 'UNDECIDED',
          home: { teamId: 4, totalPoints: 88.5 }
        };
        const matchup = buildMatchup(bye);

        expect(matchup.homeTeamId).toBe(4);
        expect(matchup.homeScore).toBe(88.5);
        expect(matchup.awayTeamId).toBeUndefined();
        expect(matchup.awayScore).toBeUndefined();
      });
    });

    describe('when the matchup is a playoff game', () => {
      test('carries the bracket and the result', () => {
        const playoff = {
          id: 105,
          matchupPeriodId: 15,
          playoffTierType: 'WINNERS_BRACKET',
          winner: 'AWAY',
          home: { teamId: 4, totalPoints: 101.2 },
          away: { teamId: 9, totalPoints: 133.8 }
        };
        const matchup = buildMatchup(playoff);

        expect(matchup.playoffTierType).toBe('WINNERS_BRACKET');
        expect(matchup.winner).toBe('AWAY');
        expect(matchup.homeScore).toBe(101.2);
        expect(matchup.awayScore).toBe(133.8);
      });
    });
  });
});
