export default FreeAgentPlayer;
/**
 * Represents a player and their raw stats.
 *
 * @augments {Player}
 */
declare class FreeAgentPlayer extends Player {
    /**
     * @typedef {object} FreeAgentPlayerMap
     *
     * The attributes FreeAgentPlayer adds. Everything on Player is inherited through the class
     * hierarchy rather than restated here.
     *
     * @property {PlayerStats} rawStatsForYear The PlayerStats model with the raw statistics
     *                                         registered by the player over the season.
     * @property {PlayerStats} projectedRawStatsForYear The PlayerStats model with the raw statistics
     *                                                  ESPN projected for the player over the season.
     * @property {PlayerStats} rawStatsForScoringPeriod The PlayerStats model with the raw statistics
     *                                                  registered by the player in the scoring
     *                                                  period.
     * @property {PlayerStats} projectedRawStatsForScoringPeriod The PlayerStats model with the raw
     *                                                           statistics ESPN projected for the
     *                                                           player in the scoring period.
     */
    /**
     * @type {FreeAgentPlayerMap}
     */
    static responseMap: {
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
        /**
         * The PlayerStats model with the raw statistics
         * registered by the player in the scoring
         * period.
         */
        rawStatsForScoringPeriod: PlayerStats;
        /**
         * The PlayerStats model with the raw
         * statistics ESPN projected for the
         * player in the scoring period.
         */
        projectedRawStatsForScoringPeriod: PlayerStats;
    };
}
import Player from '../player/player';

// Instance attributes, projected from the jsdoc by scripts/build-types.mjs.

type FreeAgentPlayerAttributes = typeof FreeAgentPlayer.responseMap;
interface FreeAgentPlayer extends FreeAgentPlayerAttributes {}
