import find from 'lodash/find';
import get from 'lodash/get';
import toSafeInteger from 'lodash/toSafeInteger';

import BaseObject from '../base-classes/base-object/base-object';

import {
  nflTeamIdToNFLTeam,
  nflTeamIdToNFLTeamAbbreviation
} from '../constants.js';

/**
 * Represents an NFL game between two NFL teams.
 *
 * @augments {BaseObject}
 */
class NFLGame extends BaseObject {
  static displayName = 'NFLGame';

  static GAME_STATUSES = {
    pre: 'Not Started',
    in: 'In Progress',
    post: 'Final'
  };

  /**
   * @typedef {object} NFLTeam
   *
   * @property {number} id The id of the NFL team in the ESPN universe.
   * @property {string} team The name of the NFL team.
   * @property {string} teamAbbrev The name abbreviation of the NFL team.
   * @property {string} record The win/loss/tie record of the NFL team.
   * @property {number} score The score of the NFL team in the game.
   */

  /**
   * @typedef {object} NFLGameMap
   *
   * @property {Date} startTime The date and time when the game starts in Eastern Time.
   * @property {number} quarter The quarter the game is in.
   * @property {string} clock The current game clock formatted as MM:SS.
   * @property {string} odds The odds for the game formatted as "TEAM_ABBREV LINE". NOTE: These
   *   may only display for the current week.
   * @property {string} broadcaster Who is broadcasting the game on TV.
   *
   * @property {string} gameStatus Whether or not the game has not started, is in progress, or has
   *                               finished.
   * @property {NFLTeam} homeTeam The home team in the game.
   * @property {NFLTeam} awayTeam The away team in the game.
   */

  /**
   * @type {NFLGameMap}
   */
  static responseMap = {
    startTime: {
      key: 'date',
      manualParse: (responseData) => new Date(responseData)
    },
    quarter: 'period',
    clock: 'clock',
    broadcaster: 'broadcast',
    odds: 'odds',

    gameStatus: {
      key: 'status',
      manualParse: (responseData) => get(this.GAME_STATUSES, responseData)
    },
    homeTeam: {
      key: 'competitors',
      manualParse: (responseData) => this._buildTeamAttribute(
        find(responseData, { homeAway: 'home' })
      )
    },
    awayTeam: {
      key: 'competitors',
      manualParse: (responseData) => this._buildTeamAttribute(
        find(responseData, { homeAway: 'away' })
      )
    }
  };

  static _buildTeamAttribute(teamResponseData) {
    return {
      id: toSafeInteger(teamResponseData.id),
      team: get(nflTeamIdToNFLTeam, teamResponseData.id),
      teamAbbrev: get(nflTeamIdToNFLTeamAbbreviation, teamResponseData.id),
      record: teamResponseData.record,
      score: toSafeInteger(teamResponseData.score)
    };
  }
}

export default NFLGame;
