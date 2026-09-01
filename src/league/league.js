import first from 'lodash/first';
import get from 'lodash/get';
import mapKeys from 'lodash/mapKeys';
import reduce from 'lodash/reduce';
import toSafeInteger from 'lodash/toSafeInteger';
import values from 'lodash/values';

import BaseObject from '../base-classes/base-object/base-object';

import {
  scoringIdToItem,
  slotCategoryIdToPositionMap
} from '../constants';

/**
 * ESPN sends epoch milliseconds, and omits the key entirely when unset.
 *
 * @param   {number} value The epoch milliseconds to convert.
 * @returns {Date|undefined} The date, or `undefined` when ESPN sent nothing.
 */
const toDate = (value) => (value ? new Date(value) : undefined);

/**
 * Wraps a settings parser so an absent block leaves the attribute unset instead of throwing.
 *
 * Every one of these parsers reads properties straight off its response data, so a response missing
 * the block -- an older season, a partial view, a league mid-creation -- took down the whole
 * `getLeagueInfo` call. Returning `undefined` is also better than an object of `undefined`s: it is
 * what `_populateObject` does with any other unset value, so the attribute simply does not appear.
 *
 * @param   {Function} parse The parser to guard.
 * @returns {Function} The guarded parser.
 */
const whenPresent = (parse) => (responseData, ...rest) => (
  responseData === undefined ? undefined : parse(responseData, ...rest)
);

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
   * @property {DRAFT_TYPE} type The type of draft.
   * @property {number} timePerPick The amount of time to make a selection.
   * @property {boolean} canTradeDraftPicks Whether or not draft picks can be traded.
   * @property {number} auctionBudget The budget each team bids with in an auction draft.
   * @property {number} keeperCount The number of players each team may keep.
   * @property {string} orderType How the draft order was determined.
   * @property {number[]} pickOrder The team ids in draft order.
   */

  /**
   * @typedef {object} RosterSettings
   *
   * @property {object} lineupPositionCount How many slots of each position are in a starting
   *                                        lineup. Key is position; value is count.
   * @property {object} positionLimits The maximum number of players that may be rostered of each
   *                                   position. Key is position; value is count.
   * @property {LINEUP_LOCK_TIMES} locktime When the starting lineup for a roster locks.
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
   * @property {string} playoffSeedingRule The tiebreak used to seed the playoffs.
   * @property {boolean} playoffReseed Whether the bracket reseeds between playoff rounds.
   */

  /**
   * @typedef {object} AcquisitionSettings
   *
   * @property {number} budget The FAAB each team starts the season with. Pair with
   *                           `Team#acquisitionBudgetSpent` for a team's remaining budget.
   * @property {boolean} isUsingBudget Whether the league bids FAAB rather than running a waiver
   *                                  order.
   * @property {string} type How players are acquired, e.g. `WAIVERS_TRADITIONAL`.
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
   * @property {string} scoringType How matchups are scored, e.g. `H2H_POINTS`.
   * @property {string} matchupTieRule The tiebreak applied to a tied regular season matchup.
   * @property {string} playoffMatchupTieRule The tiebreak applied to a tied playoff matchup.
   *
   * @property {DraftSettings} draftSettings The draft settings of the league.
   * @property {RosterSettings} rosterSettings The roster settings of the league.
   * @property {ScheduleSettings} scheduleSettings The schedule settings of the league.
   * @property {AcquisitionSettings} acquisitionSettings The waiver and FAAB settings of the league.
   * @property {TradeSettings} tradeSettings The trade settings of the league.
   * @property {FinanceSettings} financeSettings The dues and fees of the league.
   * @property {object} scoringSettings The scoring settings of the league.
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
      manualParse: whenPresent((responseData) => ({
        date: toDate(responseData.date),
        type: responseData.type,
        timePerPick: responseData.timePerSelection,
        canTradeDraftPicks: responseData.isTradingEnabled,
        auctionBudget: responseData.auctionBudget,
        keeperCount: responseData.keeperCount,
        orderType: responseData.orderType,
        pickOrder: responseData.pickOrder
      }))
    },

    rosterSettings: {
      key: 'rosterSettings',
      manualParse: whenPresent((responseData) => ({
        lineupPositionCount: mapKeys(
          responseData.lineupSlotCounts,
          (count, position) => get(slotCategoryIdToPositionMap, position)
        ),
        positionLimits: mapKeys(
          responseData.positionLimits,
          (count, position) => get(slotCategoryIdToPositionMap, position)
        ),
        locktime: responseData.rosterLocktimeType
      }))
    },

    scheduleSettings: {
      key: 'scheduleSettings',
      manualParse: whenPresent((responseData, data) => {
        // The season length comes from `status.finalScoringPeriod` rather than a literal 17. The
        // two agree on a standard league, but hardcoding the NFL's current season length is how
        // this silently goes wrong the year the league adds a week.
        const finalScoringPeriod = get(data, 'status.finalScoringPeriod', 17);
        const regularSeasonPeriods =
          responseData.matchupPeriodCount * responseData.matchupPeriodLength;
        const numberOfPlayoffMatchups = toSafeInteger(
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
      })
    },

    acquisitionSettings: {
      key: 'acquisitionSettings',
      manualParse: whenPresent((responseData) => ({
        budget: responseData.acquisitionBudget,
        isUsingBudget: responseData.isUsingAcquisitionBudget,
        type: responseData.acquisitionType,
        limit: responseData.acquisitionLimit,
        minimumBid: responseData.minimumBid,
        waiverHours: responseData.waiverHours,
        waiverProcessDays: responseData.waiverProcessDays,
        waiverProcessHour: responseData.waiverProcessHour,
        waiverOrderReset: responseData.waiverOrderReset
      }))
    },

    tradeSettings: {
      key: 'tradeSettings',
      manualParse: whenPresent((responseData) => ({
        deadlineDate: toDate(responseData.deadlineDate),
        max: responseData.max,
        vetoVotesRequired: responseData.vetoVotesRequired,
        revisionHours: responseData.revisionHours
      }))
    },

    financeSettings: {
      key: 'financeSettings',
      manualParse: whenPresent((responseData) => ({
        entryFee: responseData.entryFee,
        miscFee: responseData.miscFee,
        perLoss: responseData.perLoss,
        perTrade: responseData.perTrade,
        playerAcquisition: responseData.playerAcquisition,
        playerDrop: responseData.playerDrop,
        playerMoveToActive: responseData.playerMoveToActive,
        playerMoveToIR: responseData.playerMoveToIR
      }))
    },

    scoringSettings: {
      key: 'scoringSettings',
      manualParse: whenPresent((responseData) => reduce(
        responseData.scoringItems,
        (acc, { points, pointsOverrides, statId }) => {
          const key = scoringIdToItem[statId];

          if (!key) {
            return acc;
          }

          if (pointsOverrides) {
            acc[key] = first(values(pointsOverrides));
          } else {
            acc[key] = points;
          }

          return acc;
        },
        {}
      ))
    }
  };
}

export default League;
