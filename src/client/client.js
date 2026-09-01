import { filter, find, isEmpty, map, uniq } from '../internal/collections.js';
import { getPath, mergeConfig } from '../internal/objects.js';

import Boxscore from '../boxscore/boxscore';
import DraftPlayer from '../draft-player/draft-player';
import FreeAgentPlayer from '../free-agent-player/free-agent-player';
import League from '../league/league';
import Matchup from '../matchup/matchup';
import NFLGame from '../nfl-game/nfl-game';
import Team from '../team/team';

import { flattenObjectSansNumericKeys } from '../utils';
import createHttp from './http';

/**
 * @typedef  {object} ActivityTeam
 *
 * The raw ESPN team object an action is attributed to, passed through untouched. Only the fields
 * this client resolves against are declared; ESPN sends around two dozen more.
 *
 * @property {number} id The team's id within the league.
 * @property {string} name The team's name.
 * @property {string} abbrev The team's abbreviation.
 */

/**
 * @typedef  {object} ActivityPlayer
 *
 * The player an action targeted. Two shapes, because there are two sources: a roster entry when the
 * player is still on the team that moved them, and a player-card entry when they are not. Which one
 * you get is not knowable in advance, so read both.
 *
 * @property {number} [playerId] Set on a roster entry.
 * @property {{player: {fullName: string}}} [playerPoolEntry] Set on a roster entry.
 * @property {{fullName: string}} [player] Set on a player-card entry.
 */

/**
 * @typedef  {object} ActivityIds
 *
 * The message's raw ids, before this client resolves one of them to a team.
 *
 * @property {number} [from] The team that gave up the player. For a waiver claim ESPN reuses this
 *                           field for the winning bid instead.
 * @property {number} [for] The team a drop is recorded against.
 * @property {number} [to] The team that received the player.
 */

/**
 * @typedef  {object} ActivityAction
 *
 * One transaction within an activity topic. These are plain objects rather than a BaseObject:
 * `team` and `player` are ESPN's own raw shapes, passed through so a caller can read whatever it
 * needs from them.
 *
 * NOTE: `team` and `player` are both lookups that can miss -- a message naming a team that is no
 * longer in the league, or a player neither on a roster nor returned by the player-card endpoint.
 * They are optional here because they are genuinely absent in those cases, not as a formality.
 *
 * @property {ActivityTeam} [team] The team that made the move, resolved from the message's `from`,
 *                                 `for` or `to` id depending on the action.
 * @property {'FA ADDED'|'WAIVER ADDED'|'DROPPED'|'TRADED'|'UNKNOWN'} action The kind of
 *                          transaction. `UNKNOWN` when ESPN sends a message type this client does
 *                          not label.
 * @property {ActivityPlayer|null} [player] The player the action targeted.
 * @property {number} bidAmount The winning FAAB bid, for a `WAIVER ADDED`. Zero otherwise.
 * @property {number} date Epoch milliseconds for the topic the action belongs to.
 * @property {number} targetId The ESPN id of the player the action targeted.
 * @property {ActivityIds} ids The message's raw `from`, `for` and `to` ids.
 */

/**
 * Maps ESPN's numeric `messageTypeId` onto the readable label `getRecentActivity` reports.
 *
 * ESPN uses three separate ids for a drop depending on how it happened.
 */
const ACTIVITY_TYPE_BY_MESSAGE_ID = {
  178: 'FA ADDED',
  179: 'DROPPED',
  180: 'WAIVER ADDED',
  181: 'DROPPED',
  239: 'DROPPED',
  244: 'TRADED'
};

/**
 * The labels `getRecentActivity` reports, as a frozen object.
 *
 * Unlike the ESPN enums in `constants.js`, this union is closed and safe to treat as exhaustive:
 * these are values this client produces, not values ESPN sends. `UNKNOWN` covers every message
 * type not in the map above.
 *
 * @type {Readonly<Record<string, ActivityAction['action']>>}
 */
const ACTIVITY_ACTION = Object.freeze({
  FA_ADDED: 'FA ADDED',
  WAIVER_ADDED: 'WAIVER ADDED',
  DROPPED: 'DROPPED',
  TRADED: 'TRADED',
  UNKNOWN: 'UNKNOWN'
});

/**
 * Maps a caller's `msgType` onto every `messageTypeId` it covers.
 *
 * This was previously folded into the same object as the id-to-label map, which had two
 * consequences: `'178' in map` was true, so a numeric string filtered by the *label* rather than
 * by an id, and there was no reverse key for DROPPED at all -- so drops could not be filtered to,
 * because they span three ids and the flat map could only hold one.
 */
const MESSAGE_IDS_BY_ACTIVITY_TYPE = {
  FA: [178],
  WAIVER: [180],
  DROPPED: [179, 181, 239],
  TRADED: [244]
};

const ALL_ACTIVITY_MESSAGE_IDS = Object.keys(ACTIVITY_TYPE_BY_MESSAGE_ID).map(Number);

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

  /**
   * @param {object} [options] Options.
   * @param {number} [options.leagueId] The league to make requests against.
   * @param {string} [options.espnS2] The `espn_s2` cookie value, for private leagues.
   * @param {string} [options.SWID] The `SWID` cookie value, for private leagues.
   * @param {Function} [options.fetch] A stand-in for the platform's `fetch`. Supplying one is how
   *                                   a caller observes, records or replays requests.
   * @param {number} [options.timeout] Per-attempt timeout in milliseconds, 30000 by default. `0`
   *                                   disables it. With the default retry count, a request's worst
   *                                   case is roughly three times this plus backoff.
   * @param {number} [options.retries] How many times to retry a failed request, 2 by default. Only
   *                                   network errors and 429/5xx are retried; a 4xx never is, and
   *                                   neither is a request the caller aborted.
   * @param {false|{ttl: number, max: number}} [options.cache] Off by default. When set, successful
   *   responses are held for `ttl` milliseconds, at most `max` of them, on this Client. Nothing is
   *   shared between Clients, and dropping the Client drops the cache.
   */
  constructor(options = {}) {
    this.leagueId = options.leagueId;

    this._http = createHttp({
      fetch: options.fetch,
      timeout: options.timeout,
      retries: options.retries,
      cache: options.cache
    });

    this.setCookies({ espnS2: options.espnS2, SWID: options.SWID });
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

    return this._http.get(route, this._buildRequestConfig()).then((data) => {
      const schedule = getPath(data, 'schedule');
      const matchups = filter(schedule, { matchupPeriodId });

      return map(matchups, (matchup) => (
        Boxscore.buildFromServer(matchup, { leagueId: this.leagueId, seasonId, scoringPeriodId })
      ));
    });
  }

  /**
   * Returns every matchup on the league's schedule for a season, played or not.
   *
   * `getBoxscoreForWeek` fetches this same schedule and filters it down to a single matchup period,
   * discarding the rest. This returns all of it, which is what answers "who do I play in week 12",
   * strength of schedule, and the shape of the playoff bracket.
   *
   * NOTE: ESPN only puts playoff matchups on the schedule once it has generated them. Before then
   * the schedule covers the regular season only, so the highest `matchupPeriodId` returned equals
   * `League#scheduleSettings.numberOfRegularSeasonMatchups`.
   *
   * NOTE: The response carries roster data that Matchup does not map. Use `getBoxscoreForWeek` when
   * lineups are what you are after.
   *
   * @param  {object} options Required options object.
   * @param  {number} options.seasonId The season to grab the schedule from.
   * @returns {Matchup[]} Every matchup in the season, in ESPN's schedule order.
   */
  getScheduleForSeason({ seasonId }) {
    this.constructor._validateV3Params(seasonId, 'getScheduleForSeason');

    const route = this.constructor._buildRoute({
      base: `${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: '?view=mMatchup&view=mMatchupScore'
    });

    return this._http.get(route, this._buildRequestConfig()).then((data) => (
      map(getPath(data, 'schedule'), (matchup) => (
        Matchup.buildFromServer(matchup, { leagueId: this.leagueId, seasonId })
      ))
    ));
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
      this._http.get(draftRoute, this._buildRequestConfig()),
      this._http.get(playerRoute, this._buildRequestConfig({
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
    return this._http.get(route, requestConfig).then((data) => {
      const schedule = getPath(data[0], 'schedule'); // Data is an array instead of object
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

    return this._http.get(route, config).then((data) => {
      const players = getPath(data, 'players');
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
      // `mStandings` is what carries `currentSimulationResults` and `playoffClinchType`. Measured:
      // it adds those two keys to every team and nothing else, for 1.3% more payload.
      params: `?scoringPeriodId=${scoringPeriodId}&view=mRoster&view=mTeam&view=mStandings`
    });

    return this._http.get(route, this._buildRequestConfig()).then((data) => (
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

    return this._http.get(route, requestConfig).then((data) => (
      // Data returns an array for historical teams (??)
      this._parseTeamResponse(data[0], seasonId, scoringPeriodId)
    ));
  }

  _parseTeamResponse(responseData, seasonId, scoringPeriodId) {
    // Join member (owner) information with team data before dumping into builder
    const teams = getPath(responseData, 'teams');
    const members = getPath(responseData, 'members');

    const mergedData = map(teams, (team) => {
      // The absent-tolerant `find`, not `Array#find`: a response with no `members` key, or a team
      // whose `primaryOwner` has left the league, would otherwise throw and take the whole call.
      const owner = find(members, (member) => member.id === team.primaryOwner);
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

    return this._http.get(route, requestConfig).then((data) => {
      const events = getPath(data, 'events');
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

    return this._http.get(route, this._buildRequestConfig()).then((data) => {
      // The whole `status` object is handed through rather than picked apart here. League's
      // responseMap is where response paths belong, and reshaping in the client is exactly what
      // left previousSeasons, firstScoringPeriod and the rest unreachable.
      const leagueData = { ...getPath(data, 'settings'), status: getPath(data, 'status') };

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
   * @param   {string} [options.msgType] Restricts results to one activity type: `FA`, `WAIVER`,
   *                                     `DROPPED` or `TRADED`. Anything else, including a numeric
   *                                     message id, returns every transaction type.
   * @returns {Promise<ActivityAction[][]>} A promise resolving to the league's recent activity,
   *                                        one inner array per activity topic.
   */
  getRecentActivity({ seasonId, msgType = '' }) {
    this.constructor._validateV3Params(seasonId, 'getRecentActivity');

    const msgTypes = getPath(MESSAGE_IDS_BY_ACTIVITY_TYPE, msgType, ALL_ACTIVITY_MESSAGE_IDS);

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
      // mMatchup and mSettings contribute only top-level `schedule` and `settings`/`status`, none
      // of which this method reads -- mMatchup alone is most of a 1.4 MB response, fetched and
      // parsed on every call. mStandings stays: unlike those two it enriches `teams[]`, and each
      // team is passed to callers untouched on ActivityAction#team.
      params: '?view=mTeam&view=mRoster&view=mStandings'
    });

    const leagueConfig = this._buildRequestConfig({
      baseURL: 'https://lm-api-reads.fantasy.espn.com/'
    });

    // The league fetch does not depend on the communication fetch -- only the player-card fetch
    // below does, because it needs the target ids the topics resolve to. Running the first two
    // together takes a round trip off every call.
    return Promise.all([
      this._http.get(route, config),
      this._http.get(leagueRoute, leagueConfig)
    ]).then(([communicationData, leagueData]) => {
      const activity = map(
        communicationData.topics,
        (topic) => this._buildActivity(topic, leagueData)
      );
      // Only the players `_buildActivity` could not resolve off a roster need looking up, and a
      // topic set can name the same player more than once.
      const searchIds = uniq(
        map(filter(activity.flat(), (msg) => !msg.player), (msg) => msg.targetId)
      );

      // Every player resolved from a roster, so the player-card request would be a round trip
      // asking ESPN to match an empty id list.
      if (isEmpty(searchIds)) {
        return activity;
      }

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

      return this._http.get(playerRoute, playerConfig).then((playerData) => (
        map(activity, (action) => map(action, (msg) => {
          if (!msg.player) {
            return {
              ...msg,
              player: find(playerData.players, (player) => player.id === msg.targetId)
            };
          }
          return msg;
        }))
      ));
    });
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

      if (ACTIVITY_TYPE_BY_MESSAGE_ID[msgId]) {
        action = ACTIVITY_TYPE_BY_MESSAGE_ID[msgId];
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
      return mergeConfig(config, { headers, credentials: 'include' });
    }

    return config;
  }

  static _buildRoute({ base, params }) {
    return `${base}${params}`;
  }
}

export default Client;
export { ACTIVITY_ACTION };
