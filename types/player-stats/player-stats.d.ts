export function parsePlayerStats({ responseData, constructorParams, usesPoints, seasonId, scoringPeriodId, statKey, statSourceId, statSplitTypeId }: {
    responseData: any;
    constructorParams: any;
    usesPoints: any;
    seasonId: any;
    scoringPeriodId: any;
    statKey: any;
    statSourceId: any;
    statSplitTypeId: any;
}): BaseObject;
export default PlayerStats;
import BaseObject from '../base-classes/base-object/base-object';
/**
 * Represents statistical values for a player's fantasy performance. The values may be real
 * statistical values (yards, attempts, etc) or fantasy point values.
 *
 * The stat map is not comprehensive, but should cover normal standard and PPR scoring rules. The
 * largest missing piece is IDP scoring.
 *
 * @augments {BaseObject}
 */
declare class PlayerStats extends BaseObject {
    /**
     * @typedef {Record<string, string>} ScoringItems
     *
     * Maps each readable scoring item name onto the ESPN stat id it is found at. Referenced by the
     * `@type` below, which previously named a type defined nowhere -- harmless while the jsdoc was
     * only read by humans, a dangling reference once declarations are generated from it.
     *
     * NOTE: this describes the *map*, not an instance. A populated PlayerStats holds numbers at these
     * keys, which is why its instance type is declared separately by scripts/build-types.mjs rather
     * than projected from this map like every other model's.
     */
    /**
     * @type {ScoringItems}
     */
    static responseMap: {
        [x: string]: string;
    };
    constructor(options?: {});
    usesPoints: any;
}

// Instance attributes, projected from the jsdoc by scripts/build-types.mjs.

type PlayerStatsAttributes = { [scoringItem: string]: number };
interface PlayerStats extends PlayerStatsAttributes {}
