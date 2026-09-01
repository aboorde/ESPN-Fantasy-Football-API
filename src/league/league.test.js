import forEach from 'lodash/forEach';
import get from 'lodash/get';
import keys from 'lodash/keys';
import toSafeInteger from 'lodash/toSafeInteger';

import { slotCategoryIdToPositionMap } from '../constants.js';

import League from './league';

describe('League', () => {
  describe('responseMap', () => {
    let data;
    let draftSettings;
    let rosterSettings;
    let scheduleSettings;

    beforeEach(() => {
      draftSettings = {
        date: 1535476500000,
        type: 'SNAKE',
        timePerSelection: 120,
        isTradingEnabled: true
      };

      rosterSettings = {
        lineupSlotCounts: {
          1: 2,
          3: 3
        },
        positionLimits: {
          1: 2,
          3: 3
        },
        rosterLocktimeType: 'INDIVIDUAL_GAME'
      };

      scheduleSettings = {
        matchupPeriodCount: 15,
        matchupPeriodLength: 1,
        playoffMatchupPeriodLength: 1,
        playoffTeamCount: 4
      };

      data = {
        draftSettings,
        rosterSettings,
        scheduleSettings,
        scoringSettings: {
          scoringItems: [{
            points: 1, statId: 0
          }, {
            points: 4, statId: 1
          }, {
            points: 6, pointsOverrides: { 16: 9 }, statId: 2
          }, {
            points: 75, statId: 999
          }]
        }
      };
    });

    describe('draftSettings', () => {
      test('returns an object', () => {
        const league = League.buildFromServer(data);
        expect(league.draftSettings).toEqual(expect.any(Object));
      });

      test('maps date as a JS Date instance', () => {
        const league = League.buildFromServer(data);
        expect(league.draftSettings.date).toEqual(new Date(draftSettings.date));
      });

      test('maps type directly', () => {
        const league = League.buildFromServer(data);
        expect(league.draftSettings.type).toBe(draftSettings.type);
      });

      test('maps timePerPick directly', () => {
        const league = League.buildFromServer(data);
        expect(league.draftSettings.timePerPick).toBe(draftSettings.timePerSelection);
      });

      test('maps canTradeDraftPicks directly', () => {
        const league = League.buildFromServer(data);
        expect(league.draftSettings.canTradeDraftPicks).toBe(draftSettings.isTradingEnabled);
      });
    });

    describe('rosterSettings', () => {
      test('returns an object', () => {
        const league = League.buildFromServer(data);
        expect(league.rosterSettings).toEqual(expect.any(Object));
      });

      test('maps lineupSlotCounts to object using slotCategoryIdToPositionMap for keys', () => {
        const league = League.buildFromServer(data);
        expect.assertions(keys(rosterSettings.lineupSlotCounts).length);

        forEach(rosterSettings.lineupSlotCounts, (value, key) => {
          const position = get(slotCategoryIdToPositionMap, key);
          expect(get(league.rosterSettings.lineupPositionCount, position)).toBe(value);
        });
      });

      test('maps positionLimits to object using slotCategoryIdToPositionMap for keys', () => {
        const league = League.buildFromServer(data);
        expect.assertions(keys(rosterSettings.positionLimits).length);

        forEach(rosterSettings.positionLimits, (value, key) => {
          const position = get(slotCategoryIdToPositionMap, key);
          expect(get(league.rosterSettings.positionLimits, position)).toBe(value);
        });
      });

      test('maps locktime directly', () => {
        const league = League.buildFromServer(data);
        expect(league.rosterSettings.locktime).toBe(rosterSettings.rosterLocktimeType);
      });
    });

    describe('scheduleSettings', () => {
      test('returns an object', () => {
        const league = League.buildFromServer(data);
        expect(league.scheduleSettings).toEqual(expect.any(Object));
      });

      test('maps numberOfRegularSeasonMatchups directly', () => {
        const league = League.buildFromServer(data);
        expect(league.scheduleSettings.numberOfRegularSeasonMatchups).toBe(
          scheduleSettings.matchupPeriodCount
        );
      });

      test('maps regularSeasonMatchupLength directly', () => {
        const league = League.buildFromServer(data);
        expect(league.scheduleSettings.regularSeasonMatchupLength).toBe(
          scheduleSettings.matchupPeriodLength
        );
      });

      test('calculates numberOfPlayoffMatchups', () => {
        const league = League.buildFromServer(data);
        const expected = toSafeInteger(
          (
            17 - (scheduleSettings.matchupPeriodCount * scheduleSettings.matchupPeriodLength)
          ) / scheduleSettings.playoffMatchupPeriodLength
        );

        expect(league.scheduleSettings.numberOfPlayoffMatchups).toBe(expected);
      });

      test('maps playoffMatchupLength directly', () => {
        const league = League.buildFromServer(data);
        expect(league.scheduleSettings.playoffMatchupLength).toBe(
          scheduleSettings.playoffMatchupPeriodLength
        );
      });

      test('maps numberOfPlayoffTeams directly', () => {
        const league = League.buildFromServer(data);
        expect(league.scheduleSettings.numberOfPlayoffTeams).toBe(
          scheduleSettings.playoffTeamCount
        );
      });
    });

    describe('scoringSettings', () => {
      test('maps to object using constants', () => {
        const league = League.buildFromServer(data);
        expect(league.scoringSettings).toStrictEqual({
          passingAttempts: 1,
          passingIncompletions: 9,
          passingCompletions: 4
        });
      });
    });

    describe('when populated from a measured ESPN response', () => {
      // Recorded 2026-09-01 from `?view=mSettings` on a live league, trimmed only by shortening
      // the long arrays. Asserting against the real shape is what stops a path that no longer
      // matches ESPN from silently returning undefined forever.
      const measured = {
        name: 'WestPark Fantasy League Est. ~07',
        size: 14,
        isPublic: false,
        acquisitionSettings: {
          acquisitionBudget: 1000,
          acquisitionLimit: -1,
          acquisitionType: 'WAIVERS_TRADITIONAL',
          isUsingAcquisitionBudget: true,
          minimumBid: 0,
          waiverHours: 24,
          waiverOrderReset: true,
          waiverProcessDays: ['THURSDAY', 'MONDAY'],
          waiverProcessHour: 11
        },
        draftSettings: {
          auctionBudget: 200,
          date: 1787880600000,
          isTradingEnabled: false,
          keeperCount: 0,
          orderType: 'DRAFT_START',
          pickOrder: [1, 10, 14],
          timePerSelection: 60,
          type: 'AUCTION'
        },
        financeSettings: {
          entryFee: 10,
          miscFee: 0,
          perLoss: 0,
          perTrade: 0,
          playerAcquisition: 0,
          playerDrop: 0,
          playerMoveToActive: 0,
          playerMoveToIR: 0
        },
        scheduleSettings: {
          divisions: [{ id: 0, name: 'East', size: 14 }],
          matchupPeriodCount: 14,
          matchupPeriodLength: 1,
          playoffMatchupPeriodLength: 1,
          playoffReseed: false,
          playoffSeedingRule: 'TOTAL_POINTS_SCORED',
          playoffTeamCount: 6
        },
        scoringSettings: {
          matchupTieRule: 'NONE',
          playoffMatchupTieRule: 'NONE',
          scoringItems: [],
          scoringType: 'H2H_POINTS'
        },
        tradeSettings: {
          deadlineDate: 1799265600000,
          max: -1,
          revisionHours: 0,
          vetoVotesRequired: 4
        },
        status: {
          currentMatchupPeriod: 1,
          finalScoringPeriod: 17,
          firstScoringPeriod: 1,
          isActive: true,
          isFull: true,
          latestScoringPeriod: 1,
          previousSeasons: [2010, 2011],
          teamsJoined: 14
        }
      };

      const expectedAttributes = {
        currentMatchupPeriodId: 1,
        currentScoringPeriodId: 1,
        firstScoringPeriodId: 1,
        finalScoringPeriodId: 17,
        previousSeasons: [2010, 2011],
        isActive: true,
        isFull: true,
        teamsJoined: 14,
        scoringType: 'H2H_POINTS',
        matchupTieRule: 'NONE',
        playoffMatchupTieRule: 'NONE',
        'acquisitionSettings.budget': 1000,
        'acquisitionSettings.isUsingBudget': true,
        'acquisitionSettings.type': 'WAIVERS_TRADITIONAL',
        'acquisitionSettings.limit': -1,
        'acquisitionSettings.minimumBid': 0,
        'acquisitionSettings.waiverHours': 24,
        'acquisitionSettings.waiverProcessDays': ['THURSDAY', 'MONDAY'],
        'acquisitionSettings.waiverProcessHour': 11,
        'acquisitionSettings.waiverOrderReset': true,
        'tradeSettings.max': -1,
        'tradeSettings.vetoVotesRequired': 4,
        'tradeSettings.revisionHours': 0,
        'financeSettings.entryFee': 10,
        'financeSettings.playerMoveToIR': 0,
        'draftSettings.auctionBudget': 200,
        'draftSettings.keeperCount': 0,
        'draftSettings.orderType': 'DRAFT_START',
        'draftSettings.pickOrder': [1, 10, 14],
        'scheduleSettings.playoffSeedingRule': 'TOTAL_POINTS_SCORED',
        'scheduleSettings.playoffReseed': false,
        'scheduleSettings.divisions': [{ id: 0, name: 'East', size: 14 }]
      };

      forEach(expectedAttributes, (expectedValue, attribute) => {
        test(`${attribute} is populated`, () => {
          expect(get(League.buildFromServer(measured), attribute)).toEqual(expectedValue);
        });
      });

      test('maps tradeSettings.deadlineDate as a JS Date instance', () => {
        const league = League.buildFromServer(measured);
        expect(league.tradeSettings.deadlineDate).toEqual(new Date(1799265600000));
      });

      test('derives numberOfPlayoffMatchups from status.finalScoringPeriod', () => {
        const league = League.buildFromServer(measured);
        // 17 final scoring periods less 14 regular season matchups, one week each.
        expect(league.scheduleSettings.numberOfPlayoffMatchups).toBe(3);
      });

      describe('when the season runs longer than the NFL does today', () => {
        test('the playoff matchup count follows finalScoringPeriod rather than a literal 17', () => {
          const longer = { ...measured, status: { ...measured.status, finalScoringPeriod: 18 } };
          const league = League.buildFromServer(longer);
          expect(league.scheduleSettings.numberOfPlayoffMatchups).toBe(4);
        });
      });
    });

    describe('when ESPN omits a settings block', () => {
      const settingsAttributes = [
        'draftSettings', 'rosterSettings', 'scheduleSettings',
        'acquisitionSettings', 'tradeSettings', 'financeSettings', 'scoringSettings'
      ];

      forEach(settingsAttributes, (attribute) => {
        test(`${attribute} is undefined rather than throwing`, () => {
          const league = League.buildFromServer({ name: 'sparse', size: 10 });
          expect(get(league, attribute)).toBeUndefined();
        });
      });
    });
  });
});
