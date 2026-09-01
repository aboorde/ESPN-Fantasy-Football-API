import { map } from '../internal/collections.js';
import { getPath } from '../internal/objects.js';

import BaseObject from '../base-classes/base-object/base-object.js';

import {
  defaultPositionIdToPosition,
  nflTeamIdToNFLTeam,
  nflTeamIdToNFLTeamAbbreviation,
  slotCategoryIdToPositionMap
} from '../constants.js';
import { toDate } from '../utils';

/**
 * @typedef {import('../constants').InjuryStatus} InjuryStatus
 */

/**
 * @typedef {import('../constants').PlayerAvailabilityStatus} PlayerAvailabilityStatus
 */

/**
 * Represents an NFL player. This model is not directly associated with any fantasy team.
 *
 * @augments {BaseObject}
 */
class Player extends BaseObject {
  constructor(options = {}) {
    super(options);

    this.seasonId = options.seasonId;

    this.scoringPeriodId = options.scoringPeriodId;
  }

  static displayName = 'Player';

  static flattenResponse = true;

  /**
   * @typedef {object} PlayerMap
   *
   * @property {number} id The id of the player in the ESPN universe.
   * @property {string} firstName The first name of the player.
   * @property {string} lastName The last name of the player.
   * @property {string} fullName The full name of the player.
   * @property {number} jerseyNumber The jersey number the player wears.
   * @property {string} proTeam The NFL team the player is rostered on.
   * @property {string} proTeamAbbreviation The NFL team abbreviation the player is rostered on.
   * @property {string} defaultPosition The position the player plays. `undefined` for the IDP
   *                                     position ids this project cannot verify.
   *   NOTE: this comes from a different ESPN enum than `eligiblePositions`.
   * @property {string[]} eligiblePositions A list of the eligible positions in a fantasy roster the
   *                                        player may be slotted in.
   *
   * @property {number} averageDraftPosition The average position the player was drafted at in ESPN
   *                                         snake drafts.
   * @property {number} auctionValueAverage The average auction price the player fetched in ESPN
   *                                         auction drafts.
   * @property {number} percentChange The change in player ownership percentage in the last
   *                                  week across all ESPN leagues.
   * @property {number} percentStarted The percentage of ESPN league in which this player is/was
   *                                   started.
   * @property {number} percentOwned The percentage of ESPN leagues in which this player is owned.
   *
   * @property {Date} acquiredDate The datetime the player was acquired by their current fantasy
   *                               team.
   *
   * @property {PlayerAvailabilityStatus} availabilityStatus The fantasy
   *                                                             roster status of the player.
   * @property {boolean} isDroppable Whether or not the player can be dropped from a team.
   * @property {boolean} isInjured Whether or not the player is injured.
   * @property {InjuryStatus} injuryStatus The player's injury timeline.
   * @property {object} outlooksByWeek ESPN's written outlook for the player, keyed by scoring
   *                                   period.
   */

  /**
   * @type {PlayerMap}
   */
  static responseMap = {
    id: 'id',
    firstName: 'firstName',
    fullName: 'fullName',
    lastName: 'lastName',
    jerseyNumber: {
      key: 'jersey',
      manualParse: (responseData) => (responseData ? Number(responseData) : undefined)
    },
    proTeam: {
      key: 'proTeamId',
      manualParse: (responseData) => getPath(nflTeamIdToNFLTeam, responseData)
    },
    proTeamAbbreviation: {
      key: 'proTeamId',
      manualParse: (responseData) => getPath(nflTeamIdToNFLTeamAbbreviation, responseData)
    },
    defaultPosition: {
      key: 'defaultPositionId',
      // `defaultPositionId` and `eligibleSlots` below are two different ESPN enums that overlap on
      // RB and D/ST. Reading this one through the slot map reported Josh Allen as a TQB, Ja'Marr
      // Chase as an RB/WR, Trey McBride as a WR and every kicker as a WR/TE.
      manualParse: (responseData) => getPath(defaultPositionIdToPosition, responseData)
    },
    eligiblePositions: {
      key: 'eligibleSlots',
      manualParse: (responseData) => map(responseData, (posId) => (
        getPath(slotCategoryIdToPositionMap, posId)
      ))
    },

    averageDraftPosition: 'averageDraftPosition',
    auctionValueAverage: 'auctionValueAverage',
    percentChange: 'percentChange',
    percentStarted: 'percentStarted',
    percentOwned: 'percentOwned',

    acquiredDate: {
      key: 'acquisitionDate',
      manualParse: toDate
    },

    availabilityStatus: 'status',
    isDroppable: 'droppable',
    isInjured: 'injured',
    injuryStatus: 'injuryStatus',

    outlooksByWeek: 'outlooksByWeek'
  };
}

export default Player;
