import Player from '../player/player';

import { parsePlayerStats } from '../player-stats/player-stats';

/**
 * Represents a player and their raw stats.
 *
 * @augments {Player}
 */
class FreeAgentPlayer extends Player {
  static displayName = 'FreeAgentPlayer';

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
  static responseMap = {
    ...Player.responseMap,

    rawStatsForYear: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => parsePlayerStats({
        responseData,
        constructorParams,
        usesPoints: false,
        seasonId: constructorParams.seasonId,
        statKey: 'stats',
        statSourceId: 0,
        statSplitTypeId: 0
      })
    },
    projectedRawStatsForYear: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => parsePlayerStats({
        responseData,
        constructorParams,
        usesPoints: false,
        seasonId: constructorParams.seasonId,
        statKey: 'stats',
        statSourceId: 1,
        statSplitTypeId: 0
      })
    },

    rawStatsForScoringPeriod: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => parsePlayerStats({
        responseData,
        constructorParams,
        usesPoints: false,
        seasonId: constructorParams.seasonId,
        scoringPeriodId: constructorParams.scoringPeriodId,
        statKey: 'stats',
        statSourceId: 0,
        statSplitTypeId: 1
      })
    },
    projectedRawStatsForScoringPeriod: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => parsePlayerStats({
        responseData,
        constructorParams,
        usesPoints: false,
        seasonId: constructorParams.seasonId,
        scoringPeriodId: constructorParams.scoringPeriodId,
        statKey: 'stats',
        statSourceId: 1,
        statSplitTypeId: 1
      })
    }
  };
}

export default FreeAgentPlayer;
