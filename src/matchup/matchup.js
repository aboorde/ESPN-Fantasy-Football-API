import get from 'lodash/get';

import BaseObject from '../base-classes/base-object/base-object';

/**
 * Represents a single matchup on a league's season schedule.
 *
 * This is the lightweight counterpart to `Boxscore`: same source data, but no rosters. A
 * Boxscore answers "who scored what in week 4"; a Matchup answers "who plays whom, all season" --
 * including weeks that have not been played, where ESPN sends no rosters, no projections and no win
 * probabilities at all.
 *
 * @augments {BaseObject}
 */
class Matchup extends BaseObject {
  static displayName = 'Matchup';

  /**
   * @typedef {object} MatchupMap
   *
   * @property {number} id The matchup's id on the schedule.
   * @property {number} matchupPeriodId The matchup period the matchup is played in.
   * @property {string} winner Which side won: `HOME`, `AWAY`, `TIE`, or `UNDECIDED` while the
   *                           matchup is unplayed or in progress.
   * @property {string} playoffTierType Which bracket the matchup belongs to. `NONE` for a regular
   *                                    season game, otherwise a playoff or consolation tier.
   *
   * @property {number} homeTeamId The home team's id. Can be used to load a cached Team.
   * @property {number} homeScore The total points scored by the home team, live where ESPN is
   *                              scoring the matchup now.
   * @property {number} homeWinProbability ESPN's live probability the home team wins, from 0 to 1.
   *   NOTE: Only populated for the current matchup period.
   *
   * @property {number} awayTeamId The away team's id. Can be used to load a cached Team. Absent on
   *                               a bye, which leagues with an odd number of teams will have.
   * @property {number} awayScore The total points scored by the away team, live where ESPN is
   *                              scoring the matchup now.
   * @property {number} awayWinProbability ESPN's live probability the away team wins, from 0 to 1.
   *   NOTE: Only populated for the current matchup period.
   */

  /**
   * @type {MatchupMap}
   */
  static responseMap = {
    id: 'id',
    matchupPeriodId: 'matchupPeriodId',
    winner: 'winner',
    playoffTierType: 'playoffTierType',

    homeTeamId: 'home.teamId',
    homeScore: {
      key: 'home',
      manualParse: (responseData) => (
        get(responseData, 'totalPointsLive') || get(responseData, 'totalPoints')
      )
    },
    homeWinProbability: 'home.winProbability',

    awayTeamId: 'away.teamId',
    awayScore: {
      key: 'away',
      manualParse: (responseData) => (
        get(responseData, 'totalPointsLive') || get(responseData, 'totalPoints')
      )
    },
    awayWinProbability: 'away.winProbability'
  };
}

export default Matchup;
