export default BoxscorePlayer;
export type PlayerStats = import("../player-stats/player-stats").default;
/**
 * @typedef {import('../player-stats/player-stats').default} PlayerStats
 */
/**
 * Represents a player and their stats on a boxscore.
 *
 * @augments {Player}
 */
declare class BoxscorePlayer extends Player {
    /**
     * @typedef {object} BoxscorePlayerMap
     *
     * The attributes BoxscorePlayer adds. Everything on Player is inherited through the class
     * hierarchy rather than restated here.
     *
     * @property {import('../constants').PlayerAvailabilityStatus} availabilityStatus The fantasy
     *                                                             roster status of the player.
     * @property {string} rosteredPosition The position the player is slotted at in the fantasy
     *                                     lineup.
     * @property {number} totalPoints The total points scored by the player.
     * @property {PlayerStats} pointBreakdown The PlayerStats model with the points scored by the
     *                                        player.
     * @property {PlayerStats} projectedPointBreakdown The PlayerStats model with the points ESPN
     *                                                 projected for the player.
     * @property {PlayerStats} rawStats The PlayerStats model with the raw statistics registered by
     *                                  the player.
     * @property {PlayerStats} projectedRawStats The PlayerStats model with the raw statistics ESPN
     *                                           projected for the player.
     */
    /**
     * @type {BoxscorePlayerMap}
     */
    static responseMap: {
        /**
         * The fantasy
         * roster status of the player.
         */
        availabilityStatus: import("../constants").PlayerAvailabilityStatus;
        /**
         * The position the player is slotted at in the fantasy
         * lineup.
         */
        rosteredPosition: string;
        /**
         * The total points scored by the player.
         */
        totalPoints: number;
        /**
         * The PlayerStats model with the points scored by the
         * player.
         */
        pointBreakdown: PlayerStats;
        /**
         * The PlayerStats model with the points ESPN
         * projected for the player.
         */
        projectedPointBreakdown: PlayerStats;
        /**
         * The PlayerStats model with the raw statistics registered by
         * the player.
         */
        rawStats: PlayerStats;
        /**
         * The PlayerStats model with the raw statistics ESPN
         * projected for the player.
         */
        projectedRawStats: PlayerStats;
    };
}
import Player from '../player/player';

// Instance attributes, projected from the jsdoc by scripts/build-types.mjs.

type BoxscorePlayerAttributes = typeof BoxscorePlayer.responseMap;
interface BoxscorePlayer extends BoxscorePlayerAttributes {}
