import Player from '../player/player';

import { statsEntry } from '../player-stats/player-stats';

/**
 * @typedef {import('../player-stats/player-stats').default} PlayerStats
 */

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

    rawStatsForYear: statsEntry({
      statKey: 'stats', statSourceId: 0, statSplitTypeId: 0, useSeason: true
    }),
    projectedRawStatsForYear: statsEntry({
      statKey: 'stats', statSourceId: 1, statSplitTypeId: 0, useSeason: true
    }),

    rawStatsForScoringPeriod: statsEntry({
      statKey: 'stats', statSourceId: 0, statSplitTypeId: 1, useSeason: true, useScoringPeriod: true
    }),
    projectedRawStatsForScoringPeriod: statsEntry({
      statKey: 'stats', statSourceId: 1, statSplitTypeId: 1, useSeason: true, useScoringPeriod: true
    })
  };
}

export default FreeAgentPlayer;
