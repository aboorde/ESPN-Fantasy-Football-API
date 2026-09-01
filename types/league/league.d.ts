export default League;
/**
 * Represents basic information about an ESPN fantasy football league.
 *
 * @augments {BaseObject}
 */
declare class League extends BaseObject {
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
     * @property {ScoringSettings} scoringSettings The scoring settings of the league.
     */
    /**
     * @type {LeagueMap}
     */
    static responseMap: {
        /**
         * The name of the league.
         */
        name: string;
        /**
         * The number of teams in the league.
         */
        size: number;
        /**
         * Whether or not the league is publically visible and accessible.
         */
        isPublic: boolean;
        /**
         * The current matchup period id (see README.md for
         * matchupPeriod v. scoringPeriod)
         */
        currentMatchupPeriodId: number;
        /**
         * The current scoring period id (see README.md for
         * matchupPeriod v. scoringPeriod)
         */
        currentScoringPeriodId: number;
        /**
         * The first scoring period of the season.
         */
        firstScoringPeriodId: number;
        /**
         * The last scoring period of the season.
         */
        finalScoringPeriodId: number;
        /**
         * The seasons this league has history for.
         */
        previousSeasons: number[];
        /**
         * Whether the league is currently active.
         */
        isActive: boolean;
        /**
         * Whether every team slot has been claimed.
         */
        isFull: boolean;
        /**
         * The number of teams that have joined.
         */
        teamsJoined: number;
        /**
         * How matchups are scored, e.g. `H2H_POINTS`.
         */
        scoringType: string;
        /**
         * The tiebreak applied to a tied regular season matchup.
         */
        matchupTieRule: string;
        /**
         * The tiebreak applied to a tied playoff matchup.
         */
        playoffMatchupTieRule: string;
        /**
         * The draft settings of the league.
         */
        draftSettings: {
            /**
             * The date of the draft.
             */
            date: Date;
            /**
             * The type of draft.
             */
            type: DRAFT_TYPE;
            /**
             * The amount of time to make a selection.
             */
            timePerPick: number;
            /**
             * Whether or not draft picks can be traded.
             */
            canTradeDraftPicks: boolean;
            /**
             * The budget each team bids with in an auction draft.
             */
            auctionBudget: number;
            /**
             * The number of players each team may keep.
             */
            keeperCount: number;
            /**
             * How the draft order was determined.
             */
            orderType: string;
            /**
             * The team ids in draft order.
             */
            pickOrder: number[];
        };
        /**
         * The roster settings of the league.
         */
        rosterSettings: {
            /**
             * How many slots of each position are in a starting
             * lineup. Key is position; value is count.
             */
            lineupPositionCount: object;
            /**
             * The maximum number of players that may be rostered of each
             * position. Key is position; value is count.
             */
            positionLimits: object;
            /**
             * When the starting lineup for a roster locks.
             */
            locktime: LINEUP_LOCK_TIMES;
        };
        /**
         * The schedule settings of the league.
         */
        scheduleSettings: {
            /**
             * The number of regular season matchups a team
             * will have on the schedule.
             */
            numberOfRegularSeasonMatchups: number;
            /**
             * How many weeks each regular season matchup lasts.
             */
            regularSeasonMatchupLength: number;
            /**
             * The number of playoff matchups a team will have
             * on the schedule.
             */
            numberOfPlayoffMatchups: number;
            /**
             * How many weeks each playoff matchup lasts.
             */
            playoffMatchupLength: number;
            /**
             * The number of playoff teams there will be.
             */
            numberOfPlayoffTeams: number;
            /**
             * The league's divisions. Each has an `id`, `name` and `size`.
             */
            divisions: object[];
            /**
             * The tiebreak used to seed the playoffs.
             */
            playoffSeedingRule: string;
            /**
             * Whether the bracket reseeds between playoff rounds.
             */
            playoffReseed: boolean;
        };
        /**
         * The waiver and FAAB settings of the league.
         */
        acquisitionSettings: {
            /**
             * The FAAB each team starts the season with. Pair with
             * `Team#acquisitionBudgetSpent` for a team's remaining budget.
             */
            budget: number;
            /**
             * Whether the league bids FAAB rather than running a waiver
             * order.
             */
            isUsingBudget: boolean;
            /**
             * How players are acquired, e.g. `WAIVERS_TRADITIONAL`.
             */
            type: string;
            /**
             * The season-long acquisition cap, or -1 when unlimited.
             */
            limit: number;
            /**
             * The smallest FAAB bid the league accepts.
             */
            minimumBid: number;
            /**
             * How long a dropped player sits on waivers.
             */
            waiverHours: number;
            /**
             * The days waivers are processed on.
             */
            waiverProcessDays: string[];
            /**
             * The hour of the day waivers are processed.
             */
            waiverProcessHour: number;
            /**
             * Whether the waiver order resets after a claim.
             */
            waiverOrderReset: boolean;
        };
        /**
         * The trade settings of the league.
         */
        tradeSettings: {
            /**
             * The date after which trades may no longer be proposed.
             */
            deadlineDate: Date;
            /**
             * The maximum number of trades a team may make, or -1 when unlimited.
             */
            max: number;
            /**
             * How many votes are needed to veto a trade.
             */
            vetoVotesRequired: number;
            /**
             * How long a trade sits pending before it processes.
             */
            revisionHours: number;
        };
        /**
         * The dues and fees of the league.
         */
        financeSettings: {
            /**
             * The cost to join the league.
             */
            entryFee: number;
            /**
             * A miscellaneous fee applied to each team.
             */
            miscFee: number;
            /**
             * The fee charged for each loss.
             */
            perLoss: number;
            /**
             * The fee charged for each trade.
             */
            perTrade: number;
            /**
             * The fee charged for each acquisition.
             */
            playerAcquisition: number;
            /**
             * The fee charged for each drop.
             */
            playerDrop: number;
            /**
             * The fee charged to activate a player.
             */
            playerMoveToActive: number;
            /**
             * The fee charged to move a player to injured reserve.
             */
            playerMoveToIR: number;
        };
        /**
         * The scoring settings of the league.
         */
        scoringSettings: {
            /**
             * What each stat is worth for every position.
             */
            base: Record<string, number>;
            /**
             * What a stat is worth for one
             * position specifically, keyed by position and then by scoring item. A position appears here
             * only for the stats it overrides; everything else for that position comes from `base`. In
             * practice ESPN uses this for D/ST. An unrecognized position id appears as `positionId<N>`.
             */
            overrides: Record<string, Record<string, number>>;
        };
    };
}
import BaseObject from '../base-classes/base-object/base-object';

// Instance attributes, projected from the jsdoc by scripts/build-types.mjs.

type LeagueAttributes = typeof League.responseMap;
interface League extends LeagueAttributes {}
