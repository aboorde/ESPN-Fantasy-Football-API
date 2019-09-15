import _ from 'lodash';
import moment from 'moment';

import BaseObject from '../base-classes/base-object/base-object';

import {
  nflTeamIdToNFLTeam,
  nflTeamIdToNFLTeamAbbreviation
} from '../constants.js';

/**
 * Represents an NFL game between two NFL teams.
 * @extends {BaseObject}
 */
class NFLGame extends BaseObject {
  static displayName = 'NFLGame';

  static GAME_STATUSES = {
    pre: 'Not Started',
    in: 'In Progress',
    post: 'Final'
  };

  /**
   * @typedef {object} NFLGame~NFLTeam
   *
   * @property {number} id The id of the NFL team in the ESPN universe.
   * @property {string} team The name of the NFL team.
   * @property {string} teamAbbrev The name abbreviation of the NFL team.
   * @property {string} record The win/loss/tie record of the NFL team.
   * @property {number} score The score of the NFL team in the game.
   */

  /**
   * @typedef {object} NFLGame~NFLGameMap
   *
   * @property {moment} startTime The date and time when the game starts in Eastern Time.
   * @property {number} quarter The quarter the game is in.
   * @property {string} clock The current game clock formatted as MM:SS.
   * @property {string} odds The odds for the game formatted as "TEAM_ABBREV LINE"
   * @property {string} broadcaster Who is broadcasting the game on TV.
   *
   * @property {string} gameStatus Whether or not the game has not started, is in progress, or has
   *                               finished.
   * @property {NFLGame~NFLTeam} homeTeam The home team in the game.
   * @property {NFLGame~NFLTeam} awayTeam The away team in the game.
   */

  /**
    * @type {NFLGame~NFLGameMap}
    */
  static responseMap = {
    startTime: {
      key: 'date',
      manualParse: (responseData) => moment(responseData)
    },
    quarter: 'period',
    clock: 'clock',
    odds: 'odds',
    broadcaster: 'broadcast',

    gameStatus: {
      key: 'status',
      manualParse: (responseData) => _.get(this.GAME_STATUSES, responseData)
    },
    homeTeam: {
      key: 'competitors',
      manualParse: (responseData) => {
        const homeTeam = _.find(responseData, { homeAway: 'home' });

        return {
          id: _.toSafeInteger(homeTeam.id),
          team: _.get(nflTeamIdToNFLTeam, homeTeam.id),
          teamAbbrev: _.get(nflTeamIdToNFLTeamAbbreviation, homeTeam.id),
          record: homeTeam.record,
          score: _.toSafeInteger(homeTeam.score)
        };
      }
    },
    awayTeam: {
      key: 'competitors',
      manualParse: (responseData) => {
        const awayTeam = _.find(responseData, { homeAway: 'away' });

        return {
          id: _.toSafeInteger(awayTeam.id),
          team: _.get(nflTeamIdToNFLTeam, awayTeam.id),
          teamAbbrev: _.get(nflTeamIdToNFLTeamAbbreviation, awayTeam.id),
          record: awayTeam.record,
          score: _.toSafeInteger(awayTeam.score)
        };
      }
    }
  };
}


export default NFLGame;