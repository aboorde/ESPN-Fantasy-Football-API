import filter from 'lodash/filter';
import find from 'lodash/find';
import forEach from 'lodash/forEach';
import get from 'lodash/get';
import map from 'lodash/map';
import merge from 'lodash/merge';

import Boxscore from '../boxscore/boxscore';
import DraftPlayer from '../draft-player/draft-player';
import FreeAgentPlayer from '../free-agent-player/free-agent-player';
import League from '../league/league';
import NFLGame from '../nfl-game/nfl-game';
import Team from '../team/team';

import { flattenObjectSansNumericKeys } from '../utils';
import http from './http';

/**
 * Provides functionality to make a variety of API calls to ESPN for a given fantasy football
 * league. This class should be used by consuming projects.
 *
 * @class
 */
class Client {
  static _validateV3Params(seasonId, route, alternateRoute = '') {
    if (seasonId < 2018) {
      throw new Error(`Cannot call ${route} with a season ID prior to 2018 due to ESPN limitations (see README.md#espn-databases-and-data-storage for more).${alternateRoute ? `Call Client#${alternateRoute} for historical data instead.` : ''}`);
    }
  }

  static _validateHistoricalParams(seasonId, route, alternateRoute) {
    if (seasonId >= 2018) {
      // Historical routes should always have a modern endpoint, so alternateRoute is required.
      throw new Error(`Cannot call ${route} with a season ID after 2017 due to ESPN limitations (see README.md#espn-databases-and-data-storage for more). Call Client#${alternateRoute} for new data instead.`);
    }
  }

  constructor(options = {}) {
    this.leagueId = options.leagueId;

    this.setCookies({ espnS2: options.espnS2, SWID: options.SWID });

    // Maps ESPN's numeric `messageTypeId`s onto readable transaction labels, and readable keys
    // back onto the ids `getRecentActivity` filters by.
    this.ACTIVITY_MAP = {
      178: 'FA ADDED',
      180: 'WAIVER ADDED',
      179: 'DROPPED',
      181: 'DROPPED',
      239: 'DROPPED',
      244: 'TRADED',
      FA: 178,
      WAIVER: 180,
      TRADED: 244
    };
  }

  /**
   * Set cookies from ESPN for interacting with private leagues in NodeJS. Both cookies must be
   * provided to be set. See the README for instructions on how to find these cookies.
   *
   * @param {object} options Required options object.
   * @param {string} options.espnS2 The value of the `espn_s2` cookie key:value pair to auth with.
   * @param {string} options.SWID The value of the `SWID` cookie key:value pair to auth with.
   */
  setCookies({ espnS2, SWID }) {
    if (espnS2 && SWID) {
      this.espnS2 = espnS2;
      this.SWID = SWID;
    }
  }

  /**
   * Returns all boxscores for a week.
   *
   * NOTE: Due to the way ESPN populates data, both the `scoringPeriodId` and `matchupPeriodId` are
   * required and must correspond with each other correctly.
   *
   * @param  {object} options Required options object.
   * @param  {number} options.seasonId The season in which the boxscore occurs.
   * @param  {number} options.matchupPeriodId The matchup period in which the boxscore occurs.
   * @param  {number} options.scoringPeriodId The scoring period in which the boxscore occurs.
   * @returns {Boxscore[]} All boxscores for the week
   */
  getBoxscoreForWeek({ seasonId, matchupPeriodId, scoringPeriodId }) {
    this.constructor._validateV3Params(
      seasonId,
      'getBoxscoreForWeek',
      'getHistoricalScoreboardForWeek'
    );

    const route = this.constructor._buildRoute({
      base: `${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: `?view=mMatchup&view=mMatchupScore&scoringPeriodId=${scoringPeriodId}`
    });

    return http.get(route, this._buildRequestConfig()).then((data) => {
      const schedule = get(data, 'schedule');
      const matchups = filter(schedule, { matchupPeriodId });

      return map(matchups, (matchup) => (
        Boxscore.buildFromServer(matchup, { leagueId: this.leagueId, seasonId, scoringPeriodId })
      ));
    });
  }

  /**
   * Returns all draft picks for a given season.
   *
   * @param  {object} options Required options object.
   * @param  {number} options.seasonId The season in which the draft occurs.
   * @param  {number} [options.scoringPeriodId] The scoring period to pull player data from.
   *   Defaults to preseason.
   * @returns {DraftPlayer[]} All drafted players sorted in draft order
   */
  getDraftInfo({ seasonId, scoringPeriodId = 0 }) {
    this.constructor._validateV3Params(seasonId, 'getDraftInfo');

    const draftRoute = this.constructor._buildRoute({
      base: `${seasonId}/segments/0/leagues/${this.leagueId}`,
      params:
      `?view=mDraftDetail&view=mMatchup&view=mMatchupScore&scoringPeriodId=${scoringPeriodId}`
    });
    const playerRoute = this.constructor._buildRoute({
      base: `${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: `?scoringPeriodId=${scoringPeriodId}&view=kona_player_info`
    });

    return Promise.all([
      http.get(draftRoute, this._buildRequestConfig()),
      http.get(playerRoute, this._buildRequestConfig({
        headers: {
          'x-fantasy-filter': JSON.stringify({
            players: {
              limit: 3000,
              sortPercOwned: {
                sortAsc: false,
                sortPriority: 1
              }
            }
          })
        }
      }))
    ]).then(([draftData, playerData]) => (
      map(draftData.draftDetail.picks, (draftPick) => {
        const playerInfo = find(
          playerData.players,
          (player) => player.player.id === draftPick.playerId
        );

        const data = {
          ...draftPick,
          ...flattenObjectSansNumericKeys(playerInfo)
        };

        return DraftPlayer.buildFromServer(data, { seasonId, scoringPeriodId });
      })));
  }

  /**
   * Returns boxscores WITHOUT ROSTERS for PREVIOUS seasons. Useful for pulling historical
   * scoreboards.
   *
   * NOTE: This route will error for the current season, as ESPN only exposes this data for previous
   * seasons.
   *
   * NOTE: Due to the way ESPN populates data, both the `scoringPeriodId` and `matchupPeriodId` are
   * required and must correspond with each other correctly.
   *
   * @param  {object} options Required options object.
   * @param  {number} options.seasonId The season in which the boxscore occurs.
   * @param  {number} options.matchupPeriodId The matchup period in which the boxscore occurs.
   * @param  {number} options.scoringPeriodId The scoring period in which the boxscore occurs.
   * @returns {Boxscore[]} All boxscores for the week
   */
  getHistoricalScoreboardForWeek({ seasonId, matchupPeriodId, scoringPeriodId }) {
    this.constructor._validateHistoricalParams(
      seasonId,
      'getHistoricalScoreboardForWeek',
      'getBoxscoreForWeek'
    );

    const route = this.constructor._buildRoute({
      base: `${this.leagueId}`,
      params: `?scoringPeriodId=${scoringPeriodId}&seasonId=${seasonId}` +
        '&view=mMatchupScore&view=mScoreboard&view=mSettings&view=mTopPerformers&view=mTeam'
    });

    const requestConfig = this._buildRequestConfig({
      baseURL: 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/leagueHistory/'
    });
    return http.get(route, requestConfig).then((data) => {
      const schedule = get(data[0], 'schedule'); // Data is an array instead of object
      const matchups = filter(schedule, { matchupPeriodId });

      return map(matchups, (matchup) => (
        Boxscore.buildFromServer(matchup, { leagueId: this.leagueId, seasonId, scoringPeriodId })
      ));
    });
  }

  /**
   * Returns all free agents (in terms of the league's rosters) for a given week.
   *
   * NOTE: `scoringPeriodId` of 0 corresponds to the preseason; `18` for after the season ends.
   *
   * @param  {object} options Required options object.
   * @param  {number} options.seasonId The season to grab data from.
   * @param  {number} options.scoringPeriodId The scoring period to grab free agents from.
   * @returns {FreeAgentPlayer[]} The list of free agents.
   */
  getFreeAgents({ seasonId, scoringPeriodId }) {
    this.constructor._validateV3Params(seasonId, 'getFreeAgents');

    const route = this.constructor._buildRoute({
      base: `${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: `?scoringPeriodId=${scoringPeriodId}&view=kona_player_info`
    });

    const config = this._buildRequestConfig({
      headers: {
        'x-fantasy-filter': JSON.stringify({
          players: {
            filterStatus: {
              value: ['FREEAGENT', 'WAIVERS']
            },
            limit: 2000,
            sortPercOwned: {
              sortAsc: false,
              sortPriority: 1
            }
          }
        })
      }
    });

    return http.get(route, config).then((data) => {
      const players = get(data, 'players');
      return map(players, (player) => (
        FreeAgentPlayer.buildFromServer(player, {
          leagueId: this.leagueId,
          seasonId,
          scoringPeriodId
        })
      ));
    });
  }

  /**
   * Returns an array of Team object representing each fantasy football team in the FF league.
   *
   * @param  {object} options Required options object.
   * @param  {number} options.seasonId The season to grab data from.
   * @param  {number} options.scoringPeriodId The scoring period in which to grab teams from.
   * @returns {Team[]} The list of teams.
   */
  getTeamsAtWeek({ seasonId, scoringPeriodId }) {
    this.constructor._validateV3Params(seasonId, 'getTeamsAtWeek', 'getHistoricalTeamsAtWeek');

    const route = this.constructor._buildRoute({
      base: `${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: `?scoringPeriodId=${scoringPeriodId}&view=mRoster&view=mTeam`
    });

    return http.get(route, this._buildRequestConfig()).then((data) => (
      this._parseTeamResponse(data, seasonId, scoringPeriodId)
    ));
  }

  /**
   * Returns an array of Team object representing each fantasy football team in a pre-2018 FF
   * league.
   *
   * NOTE: This route will error for the current season, as ESPN only exposes this data for previous
   * seasons.
   *
   * @param  {object} options Required options object.
   * @param  {number} options.seasonId The season to grab data from.  This value must be before 2018
   * @param  {number} options.scoringPeriodId The scoring period in which to grab teams from.
   * @returns {Team[]} The list of teams.
   */
  getHistoricalTeamsAtWeek({ seasonId, scoringPeriodId }) {
    this.constructor._validateHistoricalParams(
      seasonId,
      'getHistoricalTeamsAtWeek',
      'getTeamsAtWeek'
    );

    const route = this.constructor._buildRoute({
      base: `${this.leagueId}`,
      params: `?scoringPeriodId=${scoringPeriodId}&seasonId=${seasonId}` +
        '&view=mMatchupScore&view=mScoreboard&view=mSettings&view=mTopPerformers&view=mTeam&view=mRoster'
    });

    const requestConfig = this._buildRequestConfig({
      baseURL: 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/leagueHistory/'
    });

    return http.get(route, requestConfig).then((data) => (
      // Data returns an array for historical teams (??)
      this._parseTeamResponse(data[0], seasonId, scoringPeriodId)
    ));
  }

  _parseTeamResponse(responseData, seasonId, scoringPeriodId) {
    // Join member (owner) information with team data before dumping into builder
    const teams = get(responseData, 'teams');
    const members = get(responseData, 'members');

    const mergedData = map(teams, (team) => {
      const owner = members.find((member) => member.id === team.primaryOwner);
      return { owner, ...team }; // Don't spread owner to prevent id and other attributes clashing
    });

    return map(mergedData, (team) => (
      Team.buildFromServer(team, { leagueId: this.leagueId, seasonId, scoringPeriodId })
    ));
  }

  /**
   * Returns all NFL games that occur in the passed timeframe. NOTE: Date format must be "YYYYMMDD".
   *
   * @param  {object} options Required options object.
   * @param  {string} options.startDate Must be in "YYYYMMDD" format.
   * @param  {string} options.endDate   Must be in "YYYYMMDD" format.
   * @returns {NFLGame[]} The list of NFL games.
   */
  getNFLGamesForPeriod({ startDate, endDate }) {
    const route = this.constructor._buildRoute({
      base: 'apis/fantasy/v2/games/ffl/games',
      params: `?dates=${startDate}-${endDate}&pbpOnly=true` // cspell:disable-line pbp
    });

    const requestConfig = this._buildRequestConfig({ baseURL: 'https://site.api.espn.com/' });

    return http.get(route, requestConfig).then((data) => {
      const events = get(data, 'events');
      return map(events, (game) => NFLGame.buildFromServer(game));
    });
  }

  /**
   * Returns info on an ESPN fantasy football league
   *
   * @param   {object} options Required options object.
   * @param   {number} options.seasonId The season to grab data from.
   * @returns {League} The league info.
   */
  getLeagueInfo({ seasonId }) {
    this.constructor._validateV3Params(seasonId, 'getLeagueInfo');

    const route = this.constructor._buildRoute({
      base: `${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: '?view=mSettings'
    });

    return http.get(route, this._buildRequestConfig()).then((data) => {
      const settingsData = get(data, 'settings');
      const statusData = get(data, 'status');
      const leagueData = {
        currentMatchupPeriodId: statusData.currentMatchupPeriod,
        currentScoringPeriodId: statusData.latestScoringPeriod,
        ...settingsData
      };

      return League.buildFromServer(leagueData, { leagueId: this.leagueId, seasonId });
    });
  }

  /**
   * Returns recent transaction activity (adds, drops, waiver claims and trades) for an ESPN
   * fantasy football league, newest first. Each element of the returned array corresponds to one
   * activity topic and holds one action per message within that topic.
   *
   * @param   {object} options Required options object.
   * @param   {number} options.seasonId The season to grab data from.
   * @param   {string} [options.msgType] Restricts results to a single activity type. Accepts a key
   *                                     of `ACTIVITY_MAP`: `FA`, `WAIVER` or `TRADED`. When
   *                                     omitted, every transaction type is returned.
   * @returns {Promise<object[][]>} A promise resolving to the league's recent activity.
   */
  getRecentActivity({ seasonId, msgType = '' }) {
    this.constructor._validateV3Params(seasonId, 'getRecentActivity');

    let topics = [];
    let msgTypes = [178, 180, 179, 239, 181, 244];
    const searchIds = [];
    let activity = [];
    if (msgType in this.ACTIVITY_MAP) {
      msgTypes = [this.ACTIVITY_MAP[msgType]];
    }

    const route = this.constructor._buildRoute({
      base: `apis/v3/games/ffl/seasons/${seasonId}/segments/0/leagues/${this.leagueId}/communication`,
      params: '?view=kona_league_communication'
    });

    const config = this._buildRequestConfig({
      baseURL: 'https://lm-api-reads.fantasy.espn.com/',
      headers: {
        'x-fantasy-filter': JSON.stringify({
          topics: {
            filterType: { value: ['ACTIVITY_TRANSACTIONS'] },
            limit: 25,
            limitPerMessageSet: { value: 25 },
            offset: 0,
            sortMessageDate: { sortPriority: 1, sortAsc: false },
            sortFor: { sortPriority: 2, sortAsc: false },
            filterIncludeMessageTypeIds: { value: msgTypes }
          }
        })
      }
    });

    const leagueRoute = this.constructor._buildRoute({
      base: `apis/v3/games/ffl/seasons/${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: '?view=mTeam&view=mRoster&view=mMatchup&view=mSettings&view=mStandings'
    });

    const leagueConfig = this._buildRequestConfig({
      baseURL: 'https://lm-api-reads.fantasy.espn.com/'
    });

    return http.get(route, config).then((communicationData) => {
      topics = communicationData.topics;
      return http.get(leagueRoute, leagueConfig);
    }).then((leagueData) => {
      activity = map(topics, (topic) => this._buildActivity(topic, leagueData));
      forEach(activity, (action) => {
        forEach(action, (msg) => {
          if (!msg.player) {
            searchIds.push(msg.targetId);
          }
        });
      });

      const playerRoute = this.constructor._buildRoute({
        base: `apis/v3/games/ffl/seasons/${seasonId}/segments/0/leagues/${this.leagueId}`,
        params: '?view=kona_playercard'
      });

      const playerConfig = this._buildRequestConfig({
        baseURL: 'https://lm-api-reads.fantasy.espn.com/',
        headers: {
          'x-fantasy-filter': JSON.stringify({
            players: {
              filterIds: { value: searchIds },
              filterStatsForTopScoringPeriodIds: {
                value: 17, additionalValue: [`00${seasonId}`, `10${seasonId}`]
              }
            }
          })
        }
      });

      return http.get(playerRoute, playerConfig);
    }).then((playerData) => map(activity, (action) => map(action, (msg) => {
      if (!msg.player) {
        return {
          ...msg,
          player: find(playerData.players, (player) => player.id === msg.targetId)
        };
      }
      return msg;
    })));
  }

  /**
   * Maps a single activity topic onto its actions, resolving the team responsible for each message
   * and, when the targeted player is still on that team's roster, the player entry itself. Messages
   * whose player cannot be resolved here are looked up separately by `getRecentActivity`.
   *
   * @param   {object} topic An activity topic from the `kona_league_communication` view.
   * @param   {object} data League response data used to resolve teams and their rosters.
   * @returns {object[]} The actions parsed from the topic's messages.
   * @private
   */
  _buildActivity(topic, data) {
    const { teams } = data;
    const { date } = topic;

    return map(topic.messages, (message) => {
      let team;
      let action = 'UNKNOWN';
      let player = null;
      let bidAmount = 0;
      const msgId = message.messageTypeId;

      if (msgId === 244) {
        team = find(teams, (x) => x.id === message.from);
      } else if (msgId === 239) {
        team = find(teams, (x) => x.id === message.for);
      } else {
        team = find(teams, (x) => x.id === message.to);
      }

      if (this.ACTIVITY_MAP[msgId]) {
        action = this.ACTIVITY_MAP[msgId];
      }
      if (action === 'WAIVER ADDED') {
        bidAmount = message.from || 0;
      }
      if (team) {
        player = find(team.roster.entries, (x) => x.playerId === message.targetId);
      }

      const ids = {
        from: message.from,
        for: message.for,
        to: message.to
      };

      return {
        team, action, player, bidAmount, date, targetId: message.targetId, ids
      };
    });
  }

  /**
   * Correctly builds a request config with cookies, if set on the instance
   *
   * @param   {object} config A request config.
   * @returns {object} A request config with cookies added if set on instance
   * @private
   */
  _buildRequestConfig(config) {
    if ((this.espnS2 && this.SWID)) {
      const headers = { Cookie: `espn_s2=${this.espnS2}; SWID=${this.SWID};` };
      return merge({}, config, { headers, credentials: 'include' });
    }

    return config;
  }

  static _buildRoute({ base, params }) {
    return `${base}${params}`;
  }
}

export default Client;
