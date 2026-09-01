import { getPath } from '../internal/objects.js';

import Player from '../player/player';
import { parsePlayerStats } from '../player-stats/player-stats';

import { slotCategoryIdToPositionMap } from '../constants';

/**
 * @typedef {import('../player-stats/player-stats').default} PlayerStats
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
  static responseMap = {
    ...Player.responseMap,

    availabilityStatus: {
      key: 'status',
      manualParse: (responseData, data, rawData) => rawData.playerPoolEntry.status
    },
    rosteredPosition: {
      key: 'lineupSlotId',
      manualParse: (responseData) => getPath(slotCategoryIdToPositionMap, responseData)
    },
    totalPoints: 'appliedStatTotal',
    pointBreakdown: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => parsePlayerStats({
        responseData,
        constructorParams,
        usesPoints: true,
        statKey: 'appliedStats',
        statSourceId: 0,
        statSplitTypeId: 1
      })
    },
    projectedPointBreakdown: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => parsePlayerStats({
        responseData,
        constructorParams,
        usesPoints: true,
        statKey: 'appliedStats',
        statSourceId: 1,
        statSplitTypeId: 1
      })
    },
    rawStats: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => parsePlayerStats({
        responseData,
        constructorParams,
        usesPoints: false,
        statKey: 'stats',
        statSourceId: 0,
        statSplitTypeId: 1
      })
    },
    projectedRawStats: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => parsePlayerStats({
        responseData,
        constructorParams,
        usesPoints: false,
        statKey: 'stats',
        statSourceId: 1,
        statSplitTypeId: 1
      })
    }
  };
}

export default BoxscorePlayer;
