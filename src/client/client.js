/* eslint-disable linebreak-style */
/* eslint-disable jsdoc/require-param-description */
/* eslint-disable jsdoc/require-param-type */
/* eslint-disable jsdoc/require-returns-type */
/* eslint-disable class-methods-use-this */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import axios from 'axios';
import _ from 'lodash';

import Boxscore from '../boxscore/boxscore';
import FreeAgentPlayer from '../free-agent-player/free-agent-player';
import League from '../league/league';
import NFLGame from '../nfl-game/nfl-game';
import Team from '../team/team';

axios.defaults.baseURL = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/';

/**
 * Provides functionality to make a variety of API calls to ESPN for a given fantasy football
 * league. This class should be used by consuming projects.
 *
 * @class
 */
class Client {
  constructor(options = {}) {
    this.leagueId = options.leagueId;

    this.setCookies({ espnS2: options.espnS2, SWID: options.SWID });

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
   * Set cookies from ESPN for interacting with private leagues in NodeJS. Both cookie smust be
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
    const route = this.constructor._buildRoute({
      base: `${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: `?view=mMatchup&view=mMatchupScore&scoringPeriodId=${scoringPeriodId}`
    });

    return axios.get(route, this._buildAxiosConfig()).then((response) => {
      const schedule = _.get(response.data, 'schedule');
      const data = _.filter(schedule, { matchupPeriodId });

      return _.map(data, (matchup) => (
        Boxscore.buildFromServer(matchup, { leagueId: this.leagueId, seasonId })
      ));
    });
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
    const route = this.constructor._buildRoute({
      base: `${this.leagueId}`,
      params: `?scoringPeriodId=${scoringPeriodId}&seasonId=${seasonId}` +
        '&view=mMatchupScore&view=mScoreboard&view=mSettings&view=mTopPerformers&view=mTeam'
    });

    const axiosConfig = this._buildAxiosConfig({
      baseURL: 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/leagueHistory/'
    });
    return axios.get(route, axiosConfig).then((response) => {
      const schedule = _.get(response.data[0], 'schedule'); // Data is an array instead of object
      const data = _.filter(schedule, { matchupPeriodId });

      return _.map(data, (matchup) => (
        Boxscore.buildFromServer(matchup, { leagueId: this.leagueId, seasonId })
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
    const route = this.constructor._buildRoute({
      base: `${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: `?scoringPeriodId=${scoringPeriodId}&view=kona_player_info`
    });

    const config = this._buildAxiosConfig({
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

    return axios.get(route, config).then((response) => {
      const data = _.get(response.data, 'players');
      return _.map(data, (player) => (
        FreeAgentPlayer.buildFromServer(player, { leagueId: this.leagueId, seasonId })
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
    const route = this.constructor._buildRoute({
      base: `${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: `?scoringPeriodId=${scoringPeriodId}&view=mRoster&view=mTeam`
    });

    return axios.get(route, this._buildAxiosConfig()).then((response) => {
      const data = _.get(response.data, 'teams');
      return _.map(data, (team) => (
        Team.buildFromServer(team, { leagueId: this.leagueId, seasonId })
      ));
    });
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
      params: `?dates=${startDate}-${endDate}&pbpOnly=true`
    });

    const axiosConfig = this._buildAxiosConfig({ baseURL: 'https://site.api.espn.com/' });

    return axios.get(route, axiosConfig).then((response) => {
      const data = _.get(response.data, 'events');
      return _.map(data, (game) => NFLGame.buildFromServer(game));
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
    const route = this.constructor._buildRoute({
      base: `${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: '?view=mSettings'
    });

    return axios.get(route, this._buildAxiosConfig()).then((response) => {
      const data = _.get(response.data, 'settings');
      return League.buildFromServer(data, { leagueId: this.leagueId, seasonId });
    });
  }

  getExtendedLeagueInfo({ seasonId }) {
    const route = this.constructor._buildRoute({
      base: `apis/v3/games/ffl/seasons/${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: '?view=mTeam&view=mRoster&view=mMatchup&view=mSettings&view=mStandings'
    });

    const config = this._buildAxiosConfig({
      baseURL: 'https://fantasy.espn.com/'
    });

    return axios.get(route, config).then((response) => {
      const teams = response.data.teams.map((team) => ({
        ...team,
        ...this._fetchExtendedTeamData(response.data.teams, team, response.data.schedule)
      }));
      const scheduledTeams = teams.map((team) => {
        const { schedule } = team;
        team.schedule.forEach((matchup, week) => {
          teams.forEach((opponent) => {
            if (matchup === opponent.id) {
              schedule[week] = {
                ...opponent,
                ...this._fetchExtendedTeamData(teams, opponent, response.data.schedule)
              };
            }
          });
        });
        return {
          ...team,
          schedule
        };
      });
      const movTeams = scheduledTeams.map((team) => {
        const mov = [];
        team.schedule.forEach((opponent, week) => {
          mov.push(team.scores[week] - opponent.scores[week]);
        });
        return {
          ...team,
          mov
        };
      });

      return movTeams;
    });
  }

  _fetchExtendedTeamData(teams, team, data) {
    const outcomes = [];
    const scores = [];
    const schedule = [];
    data.forEach((matchup) => {
      if (Object.keys(matchup).includes('away')) {
        if (matchup.away.teamId === team.id) {
          scores.push(matchup.away.totalPoints);
          schedule.push(matchup.home.teamId);
          outcomes.push(this._getWinner(matchup.winner, true));
        } else if (matchup.home.teamId === team.id) {
          scores.push(matchup.home.totalPoints);
          schedule.push(matchup.away.teamId);
          outcomes.push(this._getWinner(matchup.winner, false));
        }
      } else if (matchup.home.teamId === team.id) {
        scores.push(matchup.home.totalPoints);
        schedule.push(matchup.home.teamId);
        outcomes.push(this._getWinner(matchup.winner, false));
      }
    });

    return {
      outcomes,
      scores,
      schedule
    };
  }

  _getWinner(winner, isAway) {
    if (winner === 'UNDECIDED') {
      return 'U';
    } else if ((isAway && winner === 'AWAY') || (!isAway && winner === 'HOME')) {
      return 'W';
    }
    return 'L';
  }

  /**
   * Returns recent transactions on an ESPN fantasy football league
   *
   * @param {object} options Required options object.
   * @param {number} options.seasonId The season to grab data from.
   * @param options.msgType
   * @returns Leagues Recent Activity
   */
  getRecentActivity({ seasonId, msgType = '' }) {
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

    const config = this._buildAxiosConfig({
      baseURL: 'https://fantasy.espn.com/',
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

    const leagueConfig = this._buildAxiosConfig({
      baseURL: 'https://fantasy.espn.com/'
    });
    return axios.get(route, config).then((response) => {
      topics = response.data.topics;
      return axios.get(leagueRoute, leagueConfig);
    }).then((res) => {
      activity = topics.map((topic) => this._buildActivity(topic, res.data));
      activity.forEach((action) => {
        action.forEach((msg) => {
          if (!msg.player) {
            searchIds.push(msg.targetId);
          }
        });
      });
      const playerRoute = this.constructor._buildRoute({
        base: `apis/v3/games/ffl/seasons/${seasonId}/segments/0/leagues/${this.leagueId}`,
        params: '?view=kona_playercard'
      });

      const playerConfig = this._buildAxiosConfig({
        baseURL: 'https://fantasy.espn.com/',
        headers: {
          'x-fantasy-filter': JSON.stringify({
            players: {
              filterIds: { value: searchIds },
              filterStatsForTopScoringPeriodIds: { value: 17, additionalValue: [`00${seasonId}`, `10${seasonId}`] }
            }
          })
        }
      });
      return axios.get(playerRoute, playerConfig);
    }).then((resp) => {
      const newData = activity.map((action) => action.map((msg) => {
        if (!msg.player) {
          return {
            ...msg,
            player: resp.data.players.find((x) => x.id === msg.targetId)
          };
        }
        return msg;
      }));
      return newData;
    });
  }

  _buildActivity(topic, data) {
    const { teams } = data;
    const actions = [];
    const { date } = topic;
    for (const msg in topic.messages) {
      let team = '';
      let action = 'UNKNOWN';
      let player = null;
      let bidAmount = 0;
      const msgId = topic.messages[msg].messageTypeId;

      if (msgId === 244) {
        team = teams.find((x) => x.id === topic.messages[msg].from);
      } else if (msgId === 239) {
        team = teams.find((x) => x.id === topic.messages[msg].for);
      } else {
        team = teams.find((x) => x.id === topic.messages[msg].to);
      }

      if (this.ACTIVITY_MAP[msgId]) {
        action = this.ACTIVITY_MAP[msgId];
      }
      if (action === 'WAIVER ADDED') {
        bidAmount = topic.messages[msg].from || 0;
      }
      if (team) {
        player = team.roster.entries.find((x) => x.playerId === topic.messages[msg].targetId);
      }

      const ids = {
        from: topic.messages[msg].from,
        for: topic.messages[msg].for,
        to: topic.messages[msg].to
      };
      actions.push({
        team, action, player, bidAmount, date, targetId: topic.messages[msg].targetId, ids
      });
    }
    return actions;
  }

  /**
   * Correctly builds an axios config with cookies, if set on the instance
   *
   * @param   {object} config An axios config.
   * @returns {object} An axios config with cookies added if set on instance
   * @private
   */
  _buildAxiosConfig(config) {
    if ((this.espnS2 && this.SWID)) {
      const headers = { Cookie: `espn_s2=${this.espnS2}; SWID=${this.SWID};` };
      return _.merge({}, config, { headers, withCredentials: true });
    }

    return config;
  }

  static _buildRoute({ base, params }) {
    return `${base}${params}`;
  }
}

export default Client;
