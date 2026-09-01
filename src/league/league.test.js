import { each } from '../internal/collections.js';
import { getPath } from '../internal/objects.js';
import { toSafeInt } from '../internal/values.js';

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

      // Literal keys rather than a lookup through the same map the parser uses. The fixture's
      // lineup slot ids are 1 and 3, which the lineupSlotId enum calls TQB and RB/WR.
      test('rekeys lineupSlotCounts by lineup slot position', () => {
        const league = League.buildFromServer(data);
        expect(league.rosterSettings.lineupPositionCount).toEqual({ TQB: 2, 'RB/WR': 3 });
      });

      test('rekeys positionLimits by lineup slot position', () => {
        const league = League.buildFromServer(data);
        expect(league.rosterSettings.positionLimits).toEqual({ TQB: 2, 'RB/WR': 3 });
      });

      // Two slot ids the map does not know both used to resolve to `undefined`, so they became one
      // `"undefined"` key and the first one's count was dropped on the floor. ESPN adds slot ids.
      test('keeps unknown lineup slot ids distinct instead of collapsing them', () => {
        const league = League.buildFromServer({
          rosterSettings: { lineupSlotCounts: { 0: 1, 26: 2, 27: 3 } }
        });

        expect(league.rosterSettings.lineupPositionCount).toEqual({
          QB: 1, slotId26: 2, slotId27: 3
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
        const expected = toSafeInt(
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
      // The fixture covers all four cases at once: a plain item (statId 0), an item whose base is
      // overridden for one position (statId 2, worth 6 to everyone and 9 to a D/ST), and a stat id
      // the project has no name for (999).
      test('splits base points from per-position overrides', () => {
        const league = League.buildFromServer(data);
        expect(league.scoringSettings).toStrictEqual({
          base: {
            passingAttempts: 1,
            passingCompletions: 4,
            passingIncompletions: 6,
            statId999: 75
          },
          overrides: {
            'D/ST': { passingIncompletions: 9 }
          }
        });
      });

      test('keeps the base value of an overridden stat', () => {
        const league = League.buildFromServer(data);

        // The old shape reported only the override, so a stat worth 6 to every position and 9 to a
        // D/ST came back as a flat 9 and the 6 was unrecoverable.
        expect(league.scoringSettings.base.passingIncompletions).toBe(6);
        expect(league.scoringSettings.overrides['D/ST'].passingIncompletions).toBe(9);
      });

      test('keeps a stat id it has no name for', () => {
        const league = League.buildFromServer(data);
        expect(league.scoringSettings.base.statId999).toBe(75);
      });

      describe('when ESPN sends scoring settings with no items', () => {
        test('yields empty base and overrides rather than throwing', () => {
          const league = League.buildFromServer({ ...data, scoringSettings: {} });

          expect(league.scoringSettings).toStrictEqual({ base: {}, overrides: {} });
        });
      });

      describe('when a position override uses an id the project cannot name', () => {
        test('keys it by the raw position id rather than dropping it', () => {
          const league = League.buildFromServer({
            ...data,
            scoringSettings: {
              scoringItems: [{ points: 3, pointsOverrides: { 11: 7 }, statId: 0 }]
            }
          });

          expect(league.scoringSettings.overrides).toStrictEqual({
            positionId11: { passingAttempts: 7 }
          });
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
          // Four real items from the same league, chosen for what they exercise. 53 is a plain
          // rule; 89 is D/ST-only (base 0, override 5); 206 is worth 2 to every position *except*
          // D/ST, which is the case the old flat shape reported as a bare 0; 63 has no name in
          // this project's map and used to be discarded outright.
          scoringItems: [
            { statId: 53, points: 0.5 },
            { statId: 89, points: 0, pointsOverrides: { 16: 5 } },
            { statId: 206, points: 2, pointsOverrides: { 16: 0 } },
            { statId: 63, points: 6 }
          ],
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

      each(expectedAttributes, (expectedValue, attribute) => {
        test(`${attribute} is populated`, () => {
          expect(getPath(League.buildFromServer(measured), attribute)).toEqual(expectedValue);
        });
      });

      test('maps tradeSettings.deadlineDate as a JS Date instance', () => {
        const league = League.buildFromServer(measured);
        expect(league.tradeSettings.deadlineDate).toEqual(new Date(1799265600000));
      });

      test('reports a stat worth 2 to every position but 0 to a D/ST as both', () => {
        const league = League.buildFromServer(measured);

        expect(league.scoringSettings.base.statId206).toBe(2);
        expect(league.scoringSettings.overrides['D/ST'].statId206).toBe(0);
      });

      test('keeps a scoring rule whose stat id this project cannot name', () => {
        const league = League.buildFromServer(measured);
        expect(league.scoringSettings.base.statId63).toBe(6);
      });

      test('resolves a D/ST override through the defaultPositionId enum', () => {
        const league = League.buildFromServer(measured);

        // 16 is D/ST in both position enums, but `defensive0PointsAllowed` proves the override was
        // filed under a position rather than collapsed onto the base value.
        expect(league.scoringSettings.base.defensive0PointsAllowed).toBe(0);
        expect(league.scoringSettings.overrides['D/ST'].defensive0PointsAllowed).toBe(5);
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

      each(settingsAttributes, (attribute) => {
        test(`${attribute} is undefined rather than throwing`, () => {
          const league = League.buildFromServer({ name: 'sparse', size: 10 });
          expect(getPath(league, attribute)).toBeUndefined();
        });
      });
    });
  });
});
