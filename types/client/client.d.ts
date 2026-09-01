export default Client;
/**
 * The raw ESPN team object an action is attributed to, passed through untouched. Only the fields
 * this client resolves against are declared; ESPN sends around two dozen more.
 */
export type ActivityTeam = {
    /**
     * The team's id within the league.
     */
    id: number;
    /**
     * The team's name.
     */
    name: string;
    /**
     * The team's abbreviation.
     */
    abbrev: string;
};
/**
 * The player an action targeted. Two shapes, because there are two sources: a roster entry when the
 * player is still on the team that moved them, and a player-card entry when they are not. Which one
 * you get is not knowable in advance, so read both.
 */
export type ActivityPlayer = {
    /**
     * Set on a roster entry.
     */
    playerId?: number;
    /**
     * Set on a roster entry.
     */
    playerPoolEntry?: {
        player: {
            fullName: string;
        };
    };
    /**
     * Set on a player-card entry.
     */
    player?: {
        fullName: string;
    };
};
/**
 * The message's raw ids, before this client resolves one of them to a team.
 */
export type ActivityIds = {
    /**
     * The team that gave up the player. For a waiver claim ESPN reuses this
     *  field for the winning bid instead.
     */
    from?: number;
    /**
     * The team a drop is recorded against.
     */
    for?: number;
    /**
     * The team that received the player.
     */
    to?: number;
};
/**
 * One transaction within an activity topic. These are plain objects rather than a BaseObject:
 * `team` and `player` are ESPN's own raw shapes, passed through so a caller can read whatever it
 * needs from them.
 *
 * NOTE: `team` and `player` are both lookups that can miss -- a message naming a team that is no
 * longer in the league, or a player neither on a roster nor returned by the player-card endpoint.
 * They are optional here because they are genuinely absent in those cases, not as a formality.
 */
export type ActivityAction = {
    /**
     * The team that made the move, resolved from the message's `from`,
     *  `for` or `to` id depending on the action.
     */
    team?: ActivityTeam;
    /**
     * The kind of
     * transaction. `UNKNOWN` when ESPN sends a message type this client does
     * not label.
     */
    action: "FA ADDED" | "WAIVER ADDED" | "DROPPED" | "TRADED" | "UNKNOWN";
    /**
     * The player the action targeted.
     */
    player?: ActivityPlayer | null;
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
    ids: ActivityIds;
};
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
    constructor(options?: {
        leagueId?: number;
        espnS2?: string;
        SWID?: string;
        fetch?: Function;
        timeout?: number;
        retries?: number;
        cache?: false | {
            ttl: number;
            max: number;
        };
    });
    leagueId: number;
    _http: {
        get: Function;
    };
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
    _parseTeamResponse(responseData: any, seasonId: any, scoringPeriodId: any): any[];
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
    }): Promise<ActivityAction[][]>;
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
