export default Player;
/**
 * Represents an NFL player. This model is not directly associated with any fantasy team.
 *
 * @augments {BaseObject}
 */
declare class Player extends BaseObject {
    static flattenResponse: boolean;
    /**
     * @typedef {object} PlayerMap
     *
     * @property {number} id The id of the player in the ESPN universe.
     * @property {string} firstName The first name of the player.
     * @property {string} lastName The last name of the player.
     * @property {string} fullName The full name of the player.
     * @property {number} jerseyNumber The jersey number the player wears.
     * @property {string} proTeam The NFL team the player is rostered on.
     * @property {string} proTeamAbbreviation The NFL team abbreviation the player is rostered on.
     * @property {string} defaultPosition The position the player plays. `undefined` for the IDP
     *                                     position ids this project cannot verify.
     *   NOTE: this comes from a different ESPN enum than `eligiblePositions`.
     * @property {string[]} eligiblePositions A list of the eligible positions in a fantasy roster the
     *                                        player may be slotted in.
     *
     * @property {number} averageDraftPosition The average position the player was drafted at in ESPN
     *                                         snake drafts.
     * @property {number} auctionValueAverage The average auction price the player fetched in ESPN
     *                                         auction drafts.
     * @property {number} percentChange The change in player ownership percentage in the last
     *                                  week across all ESPN leagues.
     * @property {number} percentStarted The percentage of ESPN league in which this player is/was
     *                                   started.
     * @property {number} percentOwned The percentage of ESPN leagues in which this player is owned.
     *
     * @property {Date} acquiredDate The datetime the player was acquired by their current fantasy
     *                               team.
     *
     * @property {PLAYER_AVAILABILITY_STATUSES} availabilityStatus The fantasy roster status of the
     *                                                             player.
     * @property {boolean} isDroppable Whether or not the player can be dropped from a team.
     * @property {boolean} isInjured Whether or not the player is injured.
     * @property {INJURY_STATUSES} injuryStatus The specific injury status/timeline of the player.
     * @property {object} outlooksByWeek ESPN's written outlook for the player, keyed by scoring
     *                                   period.
     */
    /**
     * @type {PlayerMap}
     */
    static responseMap: {
        /**
         * The id of the player in the ESPN universe.
         */
        id: number;
        /**
         * The first name of the player.
         */
        firstName: string;
        /**
         * The last name of the player.
         */
        lastName: string;
        /**
         * The full name of the player.
         */
        fullName: string;
        /**
         * The jersey number the player wears.
         */
        jerseyNumber: number;
        /**
         * The NFL team the player is rostered on.
         */
        proTeam: string;
        /**
         * The NFL team abbreviation the player is rostered on.
         */
        proTeamAbbreviation: string;
        /**
         * The position the player plays. `undefined` for the IDP
         *  position ids this project cannot verify.
         * NOTE: this comes from a different ESPN enum than `eligiblePositions`.
         */
        defaultPosition: string;
        /**
         * A list of the eligible positions in a fantasy roster the
         * player may be slotted in.
         */
        eligiblePositions: string[];
        /**
         * The average position the player was drafted at in ESPN
         * snake drafts.
         */
        averageDraftPosition: number;
        /**
         * The average auction price the player fetched in ESPN
         *  auction drafts.
         */
        auctionValueAverage: number;
        /**
         * The change in player ownership percentage in the last
         * week across all ESPN leagues.
         */
        percentChange: number;
        /**
         * The percentage of ESPN league in which this player is/was
         * started.
         */
        percentStarted: number;
        /**
         * The percentage of ESPN leagues in which this player is owned.
         */
        percentOwned: number;
        /**
         * The datetime the player was acquired by their current fantasy
         * team.
         */
        acquiredDate: Date;
        /**
         * The fantasy roster status of the
         * player.
         */
        availabilityStatus: PLAYER_AVAILABILITY_STATUSES;
        /**
         * Whether or not the player can be dropped from a team.
         */
        isDroppable: boolean;
        /**
         * Whether or not the player is injured.
         */
        isInjured: boolean;
        /**
         * The specific injury status/timeline of the player.
         */
        injuryStatus: INJURY_STATUSES;
        /**
         * ESPN's written outlook for the player, keyed by scoring
         * period.
         */
        outlooksByWeek: object;
    };
    constructor(options?: {});
    seasonId: any;
    scoringPeriodId: any;
}
import BaseObject from '../base-classes/base-object/base-object.js';

// Instance attributes, projected from the jsdoc by scripts/build-types.mjs.

type PlayerAttributes = typeof Player.responseMap;
interface Player extends PlayerAttributes {}
