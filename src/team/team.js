import map from 'lodash/map';
import round from 'lodash/round';
import trim from 'lodash/trim';

import BaseCacheableObject from '../base-classes/base-cacheable-object/base-cacheable-object.js';

import Player from '../player/player';

/**
 * Represents a fantasy football team in a league.
 *
 * @augments {BaseCacheableObject}
 */
class Team extends BaseCacheableObject {
  constructor(options = {}) {
    super(options);

    this.leagueId = options.leagueId;

    this.seasonId = options.seasonId;
  }

  static displayName = 'Team';

  /**
   * Returns valid id params when 'id', `leagueId`, and 'seasonId' are passed.
   *
   * @param   {object} params The params to use.
   * @returns {object|undefined} An object containing the params, or `undefined`.
   */
  static getIDParams(params = {}) {
    if (params.id && params.leagueId && params.seasonId) {
      return {
        id: params.id,
        leagueId: params.leagueId,
        seasonId: params.seasonId
      };
    }

    return undefined;
  }

  /**
   * @typedef  {object} TeamMap
   *
   * NOTE: `playoffPct`, `divisionWinPct`, `simulatedRank` and `playoffClinchType` are only present
   * on ESPN's `mStandings` view. `Client#getTeamsAtWeek` requests it, so they are populated there.
   * `Client#getHistoricalTeamsAtWeek` does not, because ESPN runs no live playoff simulation for a
   * completed season: on historical teams these are `undefined` by design, and
   * `finalStandingsPosition` is the field that carries the answer instead.
   *
   * @property {number} id The id of the team in the ESPN universe.
   * @property {string} abbreviation The team's abbreviation.
   * @property {string} name The team's name.
   * @property {string} ownerName The team's primary owner's name. `undefined` when ESPN sends no
   *                              matching league member, or sends one with no name on it.
   * @property {string} primaryOwnerId The SWID of the team's primary owner.
   * @property {string[]} ownerIds The SWIDs of every owner of the team.
   * @property {string} logoURL The URL for the team's uploaded logo.
   * @property {number} waiverRank The team's position in the current waiver order.
   * @property {number} divisionId The id of the division the team plays in.
   *
   * @property {Player[]} roster The team's roster of players.
   *
   * @property {number} wins The number of regular season match-ups the team has won.
   * @property {number} losses The number of regular season match-ups the team has lost.
   * @property {number} ties The number of regular season match-ups the team has tied.
   * @property {number} divisionWins The number of regular season match-ups the team has won in the
   *                                 division.
   * @property {number} divisionLosses The number of regular season match-ups the team has lost in
   *                                   the division.
   * @property {number} divisionTies The number of regular season match-ups the team has tied in the
   *                                 division.
   * @property {number} homeWins The number of regular season match-ups the team has won at home.
   * @property {number} homeLosses The number of regular season match-ups the team has lost at home.
   * @property {number} homeTies The number of regular season match-ups the team has tied at home.
   * @property {number} awayWins The number of regular season match-ups the team has won away.
   * @property {number} awayLosses The number of regular season match-ups the team has lost away.
   * @property {number} awayTies The number of regular season match-ups the team has tied away.
   *
   * @property {string} streakType Whether the team's current run of results is a `WIN`, a `LOSS`,
   *                               or `NONE` when no games have been played.
   * @property {number} streakLength How many consecutive results the `streakType` covers.
   * @property {number} gamesBack How far the team trails the leader, in games.
   *
   * @property {number} totalPointsScored The total points scored by the team in the regular season
   *                                      and playoffs combined.
   * @property {number} regularSeasonPointsFor The total points scored by the team in the regular
   *                                           season.
   * @property {number} regularSeasonPointsAgainst The total points scored against the team in the
   *                                               regular season.
   * @property {number} winningPercentage The percentage of games won by the team in the regular
   *                                      season.
   * @property {number} pointsAdjusted Points added to or removed from the team by the commissioner.
   * @property {number} pointsDelta The change in the team's points from the previous scoring
   *                                period.
   *
   * @property {number} playoffSeed The seeding for the team entering the playoffs.
   * @property {number} finalStandingsPosition The final standings position the team ended the
   *                                           season in.
   * @property {number} playoffPct ESPN's simulated probability the team reaches the playoffs, from
   *                               0 to 1.
   * @property {number} divisionWinPct ESPN's simulated probability the team wins its division, from
   *                                   0 to 1.
   * @property {number} simulatedRank The final rank ESPN's simulation most often produces.
   * @property {number} currentProjectedRank The rank ESPN currently projects the team to finish in.
   * @property {number} draftDayProjectedRank The rank ESPN projected on draft day.
   * @property {string} playoffClinchType Whether the team has clinched a playoff spot, a bye, or a
   *                                      division. `UNKNOWN` until ESPN can determine it.
   * @property {boolean} isEliminated Whether the team is mathematically out of the playoff race.
   * @property {number} eliminationMatchupPeriod The matchup period in which the team was
   *                                             eliminated, or 0 if it has not been.
   *
   * @property {number} acquisitionBudgetSpent The FAAB the team has spent on waiver claims. Pair
   *                                           with `League#acquisitionBudget` for the remainder.
   * @property {number} acquisitionCount The number of players the team has acquired.
   * @property {number} dropCount The number of players the team has dropped.
   * @property {number} tradeCount The number of trades the team has completed.
   * @property {number} moveToIRCount The number of players the team has moved to injured reserve.
   */

  /**
   * @type {TeamMap}
   */
  static responseMap = {
    id: 'id',
    abbreviation: 'abbrev',
    name: 'name',
    ownerName: {
      key: 'owner',
      // ESPN sends no `members` entry for a departed manager, and sends members with blank names
      // for some leagues. Both used to produce `' '` or a TypeError; leaving the attribute unset is
      // both honest and what `_populateObject` does with any other undefined value.
      manualParse: (responseData) => {
        const name = `${trim(responseData?.firstName)} ${trim(responseData?.lastName)}`.trim();
        return name || undefined;
      }
    },
    primaryOwnerId: 'primaryOwner',
    ownerIds: 'owners',
    logoURL: 'logo',
    waiverRank: 'waiverRank',
    divisionId: 'divisionId',

    roster: {
      key: 'roster.entries',
      isArray: true,
      manualParse: (responseData, data, rawData, constructorParams) => map(
        responseData,
        (playerData) => Player.buildFromServer(playerData.playerPoolEntry, constructorParams)
      )
    },

    wins: 'record.overall.wins',
    losses: 'record.overall.losses',
    ties: 'record.overall.ties',
    divisionWins: 'record.division.wins',
    divisionLosses: 'record.division.losses',
    divisionTies: 'record.division.ties',
    homeWins: 'record.home.wins',
    homeLosses: 'record.home.losses',
    homeTies: 'record.home.ties',
    awayWins: 'record.away.wins',
    awayLosses: 'record.away.losses',
    awayTies: 'record.away.ties',

    streakType: 'record.overall.streakType',
    streakLength: 'record.overall.streakLength',
    gamesBack: 'record.overall.gamesBack',

    totalPointsScored: 'points',
    regularSeasonPointsFor: 'record.overall.pointsFor',
    regularSeasonPointsAgainst: 'record.overall.pointsAgainst',
    winningPercentage: {
      key: 'record.overall.percentage',
      manualParse: (responseData) => round(responseData * 100, 2)
    },
    pointsAdjusted: 'pointsAdjusted',
    pointsDelta: 'pointsDelta',

    playoffSeed: 'playoffSeed',
    finalStandingsPosition: 'rankCalculatedFinal',
    playoffPct: 'currentSimulationResults.playoffPct',
    divisionWinPct: 'currentSimulationResults.divisionWinPct',
    simulatedRank: 'currentSimulationResults.rank',
    currentProjectedRank: 'currentProjectedRank',
    draftDayProjectedRank: 'draftDayProjectedRank',
    playoffClinchType: 'playoffClinchType',
    isEliminated: 'eliminated',
    eliminationMatchupPeriod: 'eliminationMatchupPeriod',

    acquisitionBudgetSpent: 'transactionCounter.acquisitionBudgetSpent',
    acquisitionCount: 'transactionCounter.acquisitions',
    dropCount: 'transactionCounter.drops',
    tradeCount: 'transactionCounter.trades',
    moveToIRCount: 'transactionCounter.moveToIR'
  };
}

export default Team;
