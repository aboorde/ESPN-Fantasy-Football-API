export default DraftPlayer;
export type PlayerStats = import("../player-stats/player-stats").default;
/**
 * @typedef {import('../player-stats/player-stats').default} PlayerStats
 */
/**
 * Represents a player in a draft.
 *
 * @augments {Player}
 */
declare class DraftPlayer extends Player {
    /**
     * @typedef {object} DraftPlayerMap
     *
     * The attributes DraftPlayer adds. Everything on Player is inherited through the class hierarchy
     * rather than restated here.
     *
     * @property {number} id The id of the player in the ESPN universe.
     * @property {number} teamId The teamId of the fantasy team that drafted the player. Use
     *   `Client#getTeamAtWeek` to access fantasy team data.
     *
     * @property {number} overallPickNumber The overall pick number
     * @property {number} roundNumber The round in which the pick occurred
     * @property {number} roundPickNumber The pick number inside the round
     *
     * @property {boolean} isKeeper FOR KEEPER DRAFTS ONLY: Whether or not the "drafted" player is a
     *   keeper pick
     *
     * @property {number} bidAmount FOR AUCTION DRAFTS ONLY: How much the winning bid was
     * @property {number} nominatingTeamId FOR AUCTION DRAFTS ONLY: The teamId of the fantasy team
     *   that nominatied the player. Use `Client#getTeamAtWeek` to access fantasy team data.
     *
     * @property {number} positionalRanking ESPN's ranking of the player within their position.
     * @property {number} overallRanking ESPN's overall ranking of the player.
     * @property {number} pointsScoredThisSeason The total points the player scored across the season.
     *
     * @property {PlayerStats} rawStatsForYear The PlayerStats model with the raw statistics
     *                                         registered by the player over the season.
     * @property {PlayerStats} projectedRawStatsForYear The PlayerStats model with the raw statistics
     *                                                  ESPN projected for the player over the season.
     */
    /**
     * @type {DraftPlayerMap}
     */
    static responseMap: {
        /**
         * The id of the player in the ESPN universe.
         */
        id: number;
        /**
         * The teamId of the fantasy team that drafted the player. Use
         * `Client#getTeamAtWeek` to access fantasy team data.
         */
        teamId: number;
        /**
         * The overall pick number
         */
        overallPickNumber: number;
        /**
         * The round in which the pick occurred
         */
        roundNumber: number;
        /**
         * The pick number inside the round
         */
        roundPickNumber: number;
        /**
         * FOR KEEPER DRAFTS ONLY: Whether or not the "drafted" player is a
         * keeper pick
         */
        isKeeper: boolean;
        /**
         * FOR AUCTION DRAFTS ONLY: How much the winning bid was
         */
        bidAmount: number;
        /**
         * FOR AUCTION DRAFTS ONLY: The teamId of the fantasy team
         * that nominatied the player. Use `Client#getTeamAtWeek` to access fantasy team data.
         */
        nominatingTeamId: number;
        /**
         * ESPN's ranking of the player within their position.
         */
        positionalRanking: number;
        /**
         * ESPN's overall ranking of the player.
         */
        overallRanking: number;
        /**
         * The total points the player scored across the season.
         */
        pointsScoredThisSeason: number;
        /**
         * The PlayerStats model with the raw statistics
         * registered by the player over the season.
         */
        rawStatsForYear: PlayerStats;
        /**
         * The PlayerStats model with the raw statistics
         * ESPN projected for the player over the season.
         */
        projectedRawStatsForYear: PlayerStats;
    };
}
import Player from '../player/player';

// Instance attributes, projected from the jsdoc by scripts/build-types.mjs.

type DraftPlayerAttributes = typeof DraftPlayer.responseMap;
interface DraftPlayer extends DraftPlayerAttributes {}
