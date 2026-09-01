import { each, mapKeys } from '../internal/collections.js';
import { getPath } from '../internal/objects.js';
import { toSafeInt } from '../internal/values.js';

import BaseObject from '../base-classes/base-object/base-object';

import { toDate } from '../utils';

import {
  defaultPositionIdToPosition,
  scoringIdToItem,
  slotCategoryIdToPositionMap
} from '../constants';

/**
 * @typedef {import('../constants').AcquisitionType} AcquisitionType
 */

/**
 * @typedef {import('../constants').DraftType} DraftType
 */

/**
 * @typedef {import('../constants').KeeperOrderType} KeeperOrderType
 */

/**
 * @typedef {import('../constants').LineupLockTime} LineupLockTime
 */

/**
 * @typedef {import('../constants').MatchupTiebreaker} MatchupTiebreaker
 */

/**
 * @typedef {import('../constants').PlayoffSeedingRule} PlayoffSeedingRule
 */

/**
 * Represents basic information about an ESPN fantasy football league.
 *
 * @augments {BaseObject}
 */
class League extends BaseObject {
  static displayName = 'League';

  /**
   * @typedef {object} DraftSettings
   *
   * @property {Date} date The date of the draft.
   * @property {DraftType} type The type of draft.
   * @property {number} timePerPick The amount of time to make a selection.
   * @property {boolean} canTradeDraftPicks Whether or not draft picks can be traded.
   * @property {number} auctionBudget The budget each team bids with in an auction draft.
   * @property {number} keeperCount The number of players each team may keep.
   * @property {KeeperOrderType} orderType How the order was determined.
   * @property {number[]} pickOrder The team ids in draft order.
   */

  /**
   * @typedef {object} RosterSettings
   *
   * @property {object} lineupPositionCount How many slots of each position are in a starting
   *                                        lineup. Key is position; value is count.
   * @property {object} positionLimits The maximum number of players that may be rostered of each
   *                                   position. Key is position; value is count.
   * @property {LineupLockTime} locktime When the lineup locks.
   */

  /**
   * @typedef {object} ScheduleSettings
   *
   * @property {number} numberOfRegularSeasonMatchups The number of regular season matchups a team
   *                                                  will have on the schedule.
   * @property {number} regularSeasonMatchupLength How many weeks each regular season matchup lasts.
   * @property {number} numberOfPlayoffMatchups The number of playoff matchups a team will have
   *                                            on the schedule.
   * @property {number} playoffMatchupLength How many weeks each playoff matchup lasts.
   * @property {number} numberOfPlayoffTeams The number of playoff teams there will be.
   * @property {object[]} divisions The league's divisions. Each has an `id`, `name` and `size`.
   * @property {PlayoffSeedingRule} playoffSeedingRule The tiebreak used
   *   to seed the playoffs.
   * @property {boolean} playoffReseed Whether the bracket reseeds between playoff rounds.
   */

  /**
   * @typedef {object} AcquisitionSettings
   *
   * @property {number} budget The FAAB each team starts the season with. Pair with
   *                           `Team#acquisitionBudgetSpent` for a team's remaining budget.
   * @property {boolean} isUsingBudget Whether the league bids FAAB rather than running a waiver
   *                                  order.
   * @property {AcquisitionType} type How players are acquired.
   * @property {number} limit The season-long acquisition cap, or -1 when unlimited.
   * @property {number} minimumBid The smallest FAAB bid the league accepts.
   * @property {number} waiverHours How long a dropped player sits on waivers.
   * @property {string[]} waiverProcessDays The days waivers are processed on.
   * @property {number} waiverProcessHour The hour of the day waivers are processed.
   * @property {boolean} waiverOrderReset Whether the waiver order resets after a claim.
   */

  /**
   * @typedef {object} TradeSettings
   *
   * @property {Date} deadlineDate The date after which trades may no longer be proposed.
   * @property {number} max The maximum number of trades a team may make, or -1 when unlimited.
   * @property {number} vetoVotesRequired How many votes are needed to veto a trade.
   * @property {number} revisionHours How long a trade sits pending before it processes.
   */

  /**
   * @typedef {object} FinanceSettings
   *
   * @property {number} entryFee The cost to join the league.
   * @property {number} miscFee A miscellaneous fee applied to each team.
   * @property {number} perLoss The fee charged for each loss.
   * @property {number} perTrade The fee charged for each trade.
   * @property {number} playerAcquisition The fee charged for each acquisition.
   * @property {number} playerDrop The fee charged for each drop.
   * @property {number} playerMoveToActive The fee charged to activate a player.
   * @property {number} playerMoveToIR The fee charged to move a player to injured reserve.
   */

  /**
   * @typedef {object} ScoringSettings
   *
   * A league's scoring rules, in the two parts ESPN actually sends them in.
   *
   * Keys are the readable scoring item names from `constants.js`. A stat id the project has no
   * name for appears as `statId<N>` rather than being dropped -- the name map is incomplete and
   * ESPN keeps adding ids, so an unreadable rule beats a missing one.
   *
   * @property {Record<string, number>} base What each stat is worth for every position.
   * @property {Record<string, Record<string, number>>} overrides What a stat is worth for one
   *   position specifically, keyed by position and then by scoring item. A position appears here
   *   only for the stats it overrides; everything else for that position comes from `base`. In
   *   practice ESPN uses this for D/ST. An unrecognized position id appears as `positionId<N>`.
   */

  /**
   * @typedef {object} LeagueMap
   *
   * @property {string} name The name of the league.
   * @property {number} size The number of teams in the league.
   * @property {boolean} isPublic Whether or not the league is publically visible and accessible.
   *
   * @property {number} currentMatchupPeriodId The current matchup period id (see README.md for
   *   matchupPeriod v. scoringPeriod)
   * @property {number} currentScoringPeriodId The current scoring period id (see README.md for
   *   matchupPeriod v. scoringPeriod)
   * @property {number} firstScoringPeriodId The first scoring period of the season.
   * @property {number} finalScoringPeriodId The last scoring period of the season.
   * @property {number[]} previousSeasons The seasons this league has history for.
   * @property {boolean} isActive Whether the league is currently active.
   * @property {boolean} isFull Whether every team slot has been claimed.
   * @property {number} teamsJoined The number of teams that have joined.
   * @property {string} scoringType How matchups are scored, e.g. `H2H_POINTS`. Left as `string`:
   *   the full set of ESPN scoring types is not verified here.
   * @property {MatchupTiebreaker} matchupTieRule The tiebreak applied to
   *   a tied regular season matchup.
   * @property {MatchupTiebreaker} playoffMatchupTieRule The tiebreak
   *   applied to a tied playoff matchup.
   *
   * @property {DraftSettings} draftSettings The draft settings of the league.
   * @property {RosterSettings} rosterSettings The roster settings of the league.
   * @property {ScheduleSettings} scheduleSettings The schedule settings of the league.
   * @property {AcquisitionSettings} acquisitionSettings The waiver and FAAB settings of the league.
   * @property {TradeSettings} tradeSettings The trade settings of the league.
   * @property {FinanceSettings} financeSettings The dues and fees of the league.
   * @property {ScoringSettings} scoringSettings The scoring settings of the league.
   */

  /**
   * @type {LeagueMap}
   */
  static responseMap = {
    name: 'name',
    size: 'size',
    isPublic: 'isPublic',

    // `Client#getLeagueInfo` hands the whole `status` object through, so everything derived from it
    // is mapped here rather than reshaped in the client.
    currentMatchupPeriodId: 'status.currentMatchupPeriod',
    currentScoringPeriodId: 'status.latestScoringPeriod',
    firstScoringPeriodId: 'status.firstScoringPeriod',
    finalScoringPeriodId: 'status.finalScoringPeriod',
    previousSeasons: 'status.previousSeasons',
    isActive: 'status.isActive',
    isFull: 'status.isFull',
    teamsJoined: 'status.teamsJoined',

    scoringType: 'scoringSettings.scoringType',
    matchupTieRule: 'scoringSettings.matchupTieRule',
    playoffMatchupTieRule: 'scoringSettings.playoffMatchupTieRule',

    draftSettings: {
      key: 'draftSettings',
      manualParse: (responseData) => ({
        date: toDate(responseData.date),
        type: responseData.type,
        timePerPick: responseData.timePerSelection,
        canTradeDraftPicks: responseData.isTradingEnabled,
        auctionBudget: responseData.auctionBudget,
        keeperCount: responseData.keeperCount,
        orderType: responseData.orderType,
        pickOrder: responseData.pickOrder
      })
    },

    rosterSettings: {
      key: 'rosterSettings',
      manualParse: (responseData) => ({
        lineupPositionCount: mapKeys(
          responseData.lineupSlotCounts,
          (count, position) => getPath(slotCategoryIdToPositionMap, position)
        ),
        positionLimits: mapKeys(
          responseData.positionLimits,
          (count, position) => getPath(slotCategoryIdToPositionMap, position)
        ),
        locktime: responseData.rosterLocktimeType
      })
    },

    scheduleSettings: {
      key: 'scheduleSettings',
      manualParse: (responseData, data) => {
        // The season length comes from `status.finalScoringPeriod` rather than a literal 17. The
        // two agree on a standard league, but hardcoding the NFL's current season length is how
        // this silently goes wrong the year the league adds a week.
        const finalScoringPeriod = getPath(data, 'status.finalScoringPeriod', 17);
        const regularSeasonPeriods =
          responseData.matchupPeriodCount * responseData.matchupPeriodLength;
        const numberOfPlayoffMatchups = toSafeInt(
          (finalScoringPeriod - regularSeasonPeriods) / responseData.playoffMatchupPeriodLength
        );

        return {
          numberOfRegularSeasonMatchups: responseData.matchupPeriodCount,
          regularSeasonMatchupLength: responseData.matchupPeriodLength,
          numberOfPlayoffMatchups,
          playoffMatchupLength: responseData.playoffMatchupPeriodLength,
          numberOfPlayoffTeams: responseData.playoffTeamCount,
          divisions: responseData.divisions,
          playoffSeedingRule: responseData.playoffSeedingRule,
          playoffReseed: responseData.playoffReseed
        };
      }
    },

    acquisitionSettings: {
      key: 'acquisitionSettings',
      manualParse: (responseData) => ({
        budget: responseData.acquisitionBudget,
        isUsingBudget: responseData.isUsingAcquisitionBudget,
        type: responseData.acquisitionType,
        limit: responseData.acquisitionLimit,
        minimumBid: responseData.minimumBid,
        waiverHours: responseData.waiverHours,
        waiverProcessDays: responseData.waiverProcessDays,
        waiverProcessHour: responseData.waiverProcessHour,
        waiverOrderReset: responseData.waiverOrderReset
      })
    },

    tradeSettings: {
      key: 'tradeSettings',
      manualParse: (responseData) => ({
        deadlineDate: toDate(responseData.deadlineDate),
        max: responseData.max,
        vetoVotesRequired: responseData.vetoVotesRequired,
        revisionHours: responseData.revisionHours
      })
    },

    financeSettings: {
      key: 'financeSettings',
      manualParse: (responseData) => ({
        entryFee: responseData.entryFee,
        miscFee: responseData.miscFee,
        perLoss: responseData.perLoss,
        perTrade: responseData.perTrade,
        playerAcquisition: responseData.playerAcquisition,
        playerDrop: responseData.playerDrop,
        playerMoveToActive: responseData.playerMoveToActive,
        playerMoveToIR: responseData.playerMoveToIR
      })
    },

    scoringSettings: {
      key: 'scoringSettings',
      manualParse: (responseData) => (responseData.scoringItems ?? []).reduce(
        ({ base, overrides }, { points, pointsOverrides, statId }) => {
          // An unrecognized stat id becomes `statId<N>` rather than being dropped. The previous
          // `if (!key) return acc` discarded them silently: measured against a real 14-team
          // league, that lost 4 of its 45 scoring rules, one of them worth 6 points a go. The map
          // is incomplete and ESPN keeps adding ids, so degrading to a less readable key beats
          // losing the rule.
          const key = scoringIdToItem[statId] || `statId${statId}`;

          base[key] = points;

          // `pointsOverrides` is `{positionId: points}` -- what this stat is worth *for that
          // position only*, with `points` still applying to every other one. Collapsing it to a
          // single number, as this did with `first(values(pointsOverrides))`, threw away both
          // which position it applied to and the base value. A real league has items like
          // `points: 2, pointsOverrides: {16: 0}`: worth 2 to everyone except a D/ST, which the
          // old shape reported as a flat 0.
          //
          // NOTE: these keys are in the `defaultPositionId` enum, not `lineupSlotId`. See the note
          // on `defaultPositionIdToPosition`.
          each(pointsOverrides, (overridePoints, positionId) => {
            const position = getPath(defaultPositionIdToPosition, positionId) ||
              `positionId${positionId}`;

            if (!overrides[position]) {
              overrides[position] = {};
            }
            overrides[position][key] = overridePoints;
          });

          return { base, overrides };
        },
        { base: {}, overrides: {} }
      )
    }
  };
}

export default League;
