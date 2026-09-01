export default Boxscore;
/**
 * Represents a boxscore for a week: a {@link Matchup} plus the rosters that produced its scores.
 *
 * Both are built from the same `schedule` entry, so the pairing, the result and the scores are
 * inherited rather than restated. What a Boxscore adds is the part ESPN only sends for the scoring
 * period you asked about: the two lineups and their projections.
 *
 * @augments {Matchup}
 */
declare class Boxscore extends Matchup {
    /**
     * @typedef {object} BoxscoreMap
     *
     * The attributes Boxscore adds. Everything on Matchup -- `id`, `matchupPeriodId`, `winner`,
     * `playoffTierType`, both team ids, both scores and both win probabilities -- is inherited
     * through the class hierarchy rather than restated here.
     *
     * @property {number} homeProjectedScore The projected total points scored by the home team.
     *   NOTE: This field is only populated in the boxscore for the current matchup period!
     * @property {BoxscorePlayer[]} homeRoster The home team's roster, containing player info and
     *                                         stats.
     *
     * @property {number} awayProjectedScore The projected total points scored by the away team.
     *   NOTE: This field is only populated in the boxscore for the current matchup period!
     * @property {BoxscorePlayer[]} awayRoster The away team's roster, containing player info and
     *                                         stats.
     */
    /**
     * @type {BoxscoreMap}
     */
    static responseMap: {
        /**
         * The projected total points scored by the home team.
         * NOTE: This field is only populated in the boxscore for the current matchup period!
         */
        homeProjectedScore: number;
        /**
         * The home team's roster, containing player info and
         * stats.
         */
        homeRoster: BoxscorePlayer[];
        /**
         * The projected total points scored by the away team.
         * NOTE: This field is only populated in the boxscore for the current matchup period!
         */
        awayProjectedScore: number;
        /**
         * The away team's roster, containing player info and
         * stats.
         */
        awayRoster: BoxscorePlayer[];
    };
}
import Matchup from '../matchup/matchup';
import BoxscorePlayer from '../boxscore-player/boxscore-player';

// Instance attributes, projected from the jsdoc by scripts/build-types.mjs.

type BoxscoreAttributes = typeof Boxscore.responseMap;
interface Boxscore extends BoxscoreAttributes {}
