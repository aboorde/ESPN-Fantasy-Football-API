import { getPath } from '../internal/objects.js';

import Player from '../player/player';
import { statsEntry } from '../player-stats/player-stats';

import { slotCategoryIdToPositionMap } from '../constants';

/**
 * @typedef {import('../player-stats/player-stats').default} PlayerStats
 */

/**
 * @typedef {import('../constants').PlayerAvailabilityStatus} PlayerAvailabilityStatus
 */

/**
 * Represents a player and their stats on a boxscore.
 *
 * @augments {Player}
 */
class BoxscorePlayer extends Player {
  static displayName = 'BoxscorePlayer';

  /**
   * @typedef {object} BoxscorePlayerMap
   *
   * The attributes BoxscorePlayer adds. Everything on Player is inherited through the class
   * hierarchy rather than restated here.
   *
   * @property {PlayerAvailabilityStatus} availabilityStatus The fantasy
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
  static responseMap = {
    ...Player.responseMap,

    availabilityStatus: {
      // No `key`: this reads `rawData`, not a key of its own. It previously declared `key:
      // 'status'` purely so the absent-key guard would not short-circuit it -- which coupled it to
      // a key it never read, and meant it stopped populating if ESPN dropped that key while the
      // real source was still there.
      manualParse: (responseData, data, rawData) => getPath(rawData, 'playerPoolEntry.status')
    },
    rosteredPosition: {
      key: 'lineupSlotId',
      manualParse: (responseData) => getPath(slotCategoryIdToPositionMap, responseData)
    },
    totalPoints: 'appliedStatTotal',
    pointBreakdown: statsEntry({
      statKey: 'appliedStats', statSourceId: 0, statSplitTypeId: 1, usesPoints: true
    }),
    projectedPointBreakdown: statsEntry({
      statKey: 'appliedStats', statSourceId: 1, statSplitTypeId: 1, usesPoints: true
    }),
    rawStats: statsEntry({ statKey: 'stats', statSourceId: 0, statSplitTypeId: 1 }),
    projectedRawStats: statsEntry({ statKey: 'stats', statSourceId: 1, statSplitTypeId: 1 })
  };
}

export default BoxscorePlayer;
