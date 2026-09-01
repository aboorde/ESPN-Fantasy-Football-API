export default Client;
/**
 * Provides functionality to make a variety of API calls to ESPN for a given fantasy football
 * league. This class should be used by consuming projects.
 *
 * @class
 */
declare class Client {
    static _validateV3Params(seasonId: any, route: any, alternateRoute?: string): void;
    static _validateHistoricalParams(seasonId: any, route: any, alternateRoute: any): void;
    static _buildRoute({ base, params }: {
        base: any;
        params: any;
    }): string;
    constructor(options?: {});
    leagueId: any;
    /**
     * Set cookies from ESPN for interacting with private leagues in NodeJS. Both cookies must be
     * provided to be set. See the README for instructions on how to find these cookies.
     *
     * @param {object} options Required options object.
     * @param {string} options.espnS2 The value of the `espn_s2` cookie key:value pair to auth with.
     * @param {string} options.SWID The value of the `SWID` cookie key:value pair to auth with.
     */
    setCookies({ espnS2, SWID }: {
        espnS2: string;
        SWID: string;
    }): void;
    espnS2: string;
    SWID: string;
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
    getBoxscoreForWeek({ seasonId, matchupPeriodId, scoringPeriodId }: {
        seasonId: number;
        matchupPeriodId: number;
        scoringPeriodId: number;
    }): Boxscore[];
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
    getScheduleForSeason({ seasonId }: {
        seasonId: number;
    }): Matchup[];
    /**
     * Returns all draft picks for a given season.
     *
     * @param  {object} options Required options object.
     * @param  {number} options.seasonId The season in which the draft occurs.
     * @param  {number} [options.scoringPeriodId] The scoring period to pull player data from.
     *   Defaults to preseason.
     * @returns {DraftPlayer[]} All drafted players sorted in draft order
     */
    getDraftInfo({ seasonId, scoringPeriodId }: {
        seasonId: number;
        scoringPeriodId?: number;
    }): DraftPlayer[];
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
    getHistoricalScoreboardForWeek({ seasonId, matchupPeriodId, scoringPeriodId }: {
        seasonId: number;
        matchupPeriodId: number;
        scoringPeriodId: number;
    }): Boxscore[];
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
    getFreeAgents({ seasonId, scoringPeriodId }: {
        seasonId: number;
        scoringPeriodId: number;
    }): FreeAgentPlayer[];
    /**
     * Returns an array of Team object representing each fantasy football team in the FF league.
     *
     * @param  {object} options Required options object.
     * @param  {number} options.seasonId The season to grab data from.
     * @param  {number} options.scoringPeriodId The scoring period in which to grab teams from.
     * @returns {Team[]} The list of teams.
     */
    getTeamsAtWeek({ seasonId, scoringPeriodId }: {
        seasonId: number;
        scoringPeriodId: number;
    }): Team[];
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
    getHistoricalTeamsAtWeek({ seasonId, scoringPeriodId }: {
        seasonId: number;
        scoringPeriodId: number;
    }): Team[];
    _parseTeamResponse(responseData: any, seasonId: any, scoringPeriodId: any): any;
    /**
     * Returns all NFL games that occur in the passed timeframe. NOTE: Date format must be "YYYYMMDD".
     *
     * @param  {object} options Required options object.
     * @param  {string} options.startDate Must be in "YYYYMMDD" format.
     * @param  {string} options.endDate   Must be in "YYYYMMDD" format.
     * @returns {NFLGame[]} The list of NFL games.
     */
    getNFLGamesForPeriod({ startDate, endDate }: {
        startDate: string;
        endDate: string;
    }): NFLGame[];
    /**
     * Returns info on an ESPN fantasy football league
     *
     * @param   {object} options Required options object.
     * @param   {number} options.seasonId The season to grab data from.
     * @returns {League} The league info.
     */
    getLeagueInfo({ seasonId }: {
        seasonId: number;
    }): League;
    /**
     * Returns recent transaction activity (adds, drops, waiver claims and trades) for an ESPN
     * fantasy football league, newest first. Each element of the returned array corresponds to one
     * activity topic and holds one action per message within that topic.
     *
     * @typedef  {object} ActivityAction
     *
     * One transaction within an activity topic. These are plain objects rather than a BaseObject:
     * `team` and `player` are ESPN's own raw shapes, passed through so a caller can read whatever it
     * needs from them.
     *
     * @property {object} team The raw ESPN team object that made the move, resolved from the
     *                         message's `from`, `for` or `to` id depending on the action.
     * @property {string} action One of `FA ADDED`, `WAIVER ADDED`, `DROPPED`, `TRADED`, or `UNKNOWN`
     *                          when ESPN sends a message type this client does not label.
     * @property {object} player The raw ESPN player entry the action targeted. Resolved from the
     *                           team's roster where the player is still on it, and from the player
     *                           card endpoint otherwise.
     * @property {number} bidAmount The winning FAAB bid, for a `WAIVER ADDED`. Zero otherwise.
     * @property {number} date Epoch milliseconds for the topic the action belongs to.
     * @property {number} targetId The ESPN id of the player the action targeted.
     * @property {object} ids The message's raw `from`, `for` and `to` ids.
     */
    /**
     * @param   {object} options Required options object.
     * @param   {number} options.seasonId The season to grab data from.
     * @param   {string} [options.msgType] Restricts results to one activity type: `FA`, `WAIVER`,
     *                                     `DROPPED` or `TRADED`. Anything else, including a numeric
     *                                     message id, returns every transaction type.
     * @returns {Promise<ActivityAction[][]>} A promise resolving to the league's recent activity,
     *                                        one inner array per activity topic.
     */
    getRecentActivity({ seasonId, msgType }: {
        seasonId: number;
        msgType?: string;
    }): Promise<{
        /**
         * The raw ESPN team object that made the move, resolved from the
         * message's `from`, `for` or `to` id depending on the action.
         */
        team: object;
        /**
         * One of `FA ADDED`, `WAIVER ADDED`, `DROPPED`, `TRADED`, or `UNKNOWN`
         * when ESPN sends a message type this client does not label.
         */
        action: string;
        /**
         * The raw ESPN player entry the action targeted. Resolved from the
         * team's roster where the player is still on it, and from the player
         * card endpoint otherwise.
         */
        player: object;
        /**
         * The winning FAAB bid, for a `WAIVER ADDED`. Zero otherwise.
         */
        bidAmount: number;
        /**
         * Epoch milliseconds for the topic the action belongs to.
         */
        date: number;
        /**
         * The ESPN id of the player the action targeted.
         */
        targetId: number;
        /**
         * The message's raw `from`, `for` and `to` ids.
         */
        ids: object;
    }[][]>;
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
    private _buildActivity;
    /**
     * Correctly builds a request config with cookies, if set on the instance
     *
     * @param   {object} config A request config.
     * @returns {object} A request config with cookies added if set on instance
     * @private
     */
    private _buildRequestConfig;
}
import Boxscore from '../boxscore/boxscore';
import Matchup from '../matchup/matchup';
import DraftPlayer from '../draft-player/draft-player';
import FreeAgentPlayer from '../free-agent-player/free-agent-player';
import Team from '../team/team';
import NFLGame from '../nfl-game/nfl-game';
import League from '../league/league';
