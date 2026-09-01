import { find } from '../internal/collections.js';
import { getPath } from '../internal/objects.js';

import BaseObject from '../base-classes/base-object/base-object';
import { scoringItemToId } from '../constants';

/**
 * Represents statistical values for a player's fantasy performance. The values may be real
 * statistical values (yards, attempts, etc) or fantasy point values.
 *
 * The stat map is not comprehensive, but should cover normal standard and PPR scoring rules. The
 * largest missing piece is IDP scoring.
 *
 * @augments {BaseObject}
 */
class PlayerStats extends BaseObject {
  constructor(options = {}) {
    super(options);

    this.usesPoints = options.usesPoints;
  }

  static displayName = 'PlayerStats';

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
  static responseMap = {
    ...scoringItemToId
  };
}

export const parsePlayerStats = ({
  responseData,
  constructorParams,
  usesPoints,

  seasonId,
  scoringPeriodId,

  statKey,
  statSourceId,
  statSplitTypeId
}) => {
  const filters = { statSourceId, statSplitTypeId };

  if (seasonId) {
    filters.seasonId = seasonId;
  }

  if (scoringPeriodId) {
    filters.scoringPeriodId = scoringPeriodId;
  }

  const statData = find(responseData, filters);
  const params = { ...constructorParams, usesPoints };
  return PlayerStats.buildFromServer(getPath(statData, statKey), params);
};

export default PlayerStats;
