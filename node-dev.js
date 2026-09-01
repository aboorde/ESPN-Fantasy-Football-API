(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["espn-fantasy-football-api"] = factory();
	else
		root["espn-fantasy-football-api"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/base-classes/base-object/base-object.js"
/*!*****************************************************!*\
  !*** ./src/base-classes/base-object/base-object.js ***!
  \*****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _internal_collections_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../internal/collections.js */ "./src/internal/collections.js");
/* harmony import */ var _internal_objects_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../internal/objects.js */ "./src/internal/objects.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils.js */ "./src/utils.js");





/**
 * @typedef {object} ResponseMapValueObject
 *
 * The `responseMap` can have two values: a string or a ResponseMapValueObject. When string, the
 * data found on that response is directly mapped to the BaseObject without mutation. When
 * ResponseMapValueObject, the data at the `key` will be used to create BaseObject(s) or
 * manually parsed with a provided `manualParse function`. Either result is attached to the
 * BaseObject being populated.
 *
 * @property {string} key The key on the response data where the data can be found. This must be
 *                        defined.
 * @property {BaseObject} BaseObject The BaseObject to create with the response data.
 * @property {boolean} isArray Whether or not the response data is an array. Useful for
 *                             attributes such as "teams".
 * @property {boolean} parseAbsent Whether to run `manualParse` even when the response has no
 *                                 value at `key`. Off by default: a parser is normally written
 *                                 to shape a value, so calling it with `undefined` is how it
 *                                 throws, and leaving the attribute unset is what
 *                                 `_processResponseMapItem` already does with an undefined
 *                                 result. Turn it on for a parser whose output is meaningful
 *                                 without input -- `map(undefined)` giving `[]` for a roster
 *                                 ESPN has not sent, say -- or one that reads `rawData` rather
 *                                 than its own key.
 * @property {Function} manualParse A function to manually apply logic to the response. This
 *                                  function must return its result to be attached to the
 *                                  populated BaseObject. The arguments to this function are:
 *                                  (data at the key), (the whole response), (the instance being
 *                                  populated).
 * @example
 * static responseMap = {
 *   teamId: 'teamId',
 *   team: {
 *     key: 'team_on_response',
 *     BaseObject: true
 *   },
 *   teams: {
 *     key: 'teams_on_response',
 *     BaseObject: Team,
 *     isArray: true
 *   },
 *   manualTeams: {
 *     key: 'manual_teams_on_response',
 *     BaseObject: Team,
 *     manualParse: (responseData, response, constructorParams, instance) => (
 *       Team.buildFromServer(responseData)
 *     )
 *   }
 * };
 */

/**
 * The base class for all project objects. Provides data mapping functionality.
 */
class BaseObject {
  /**
   * Maps keys on the instance to where their data lives on an API response. Subclasses override
   * this, and a subclass that extends another mapped class spreads its parent's map explicitly:
   *
   *     static responseMap = { ...Player.responseMap, ownKey: 'own_key' };
   *
   * @type {Record<string, (string|ResponseMapValueObject)>}
   */
  static responseMap = {};

  /**
   * @param {object} options Properties to be assigned to the BaseObject. Must match the keys of the
   *                         BaseObject's `responseMap` or valid options defined by the class's
   *                         `constructor`.
   */
  constructor(options = {}) {
    if (!(0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.isEmpty)(options)) {
      this.constructor._populateObject({
        data: options,
        instance: this,
        isDataFromServer: false
      });
    }
  }

  /**
   * The class name. Minification will break `this.constructor.name`; this allows for readable
   * logging even in minified code.
   * @type {string}
   */
  static displayName = 'BaseObject';

  /**
   * Helper for processing items on `responseMap`s that are objects.
   * @private
   *
   * @param  {object} options The arguments to this helper.
   * @param  {object} options.data The response data at the responseMap entry's key.
   * @param  {object} options.rawData The complete response data, before any key lookup.
   * @param  {BaseObject} options.instance The instance to populate. This instance will be mutated.
   * @param  {object} options.constructorParams Params to be passed to the instance's constructor.
   *                                            Useful for passing parent data, such as `leagueId`.
   * @param  {string} options.value The value of the responseMap entry being parsed.
   * @returns {*} The parsed value to attach to the instance.
   */
  static _processObjectValue({
    data, rawData, constructorParams, instance, value
  }) {
    if (!value.key) {
      throw new Error(
        `${this.displayName}: _populateObject: Invalid responseMap object. Object must define ` +
        'key. See docs for typedef of ResponseMapValueObject.'
      );
    }

    const responseData = (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(data, value.key);
    if (typeof value.manualParse === 'function') {
      // ESPN omits keys constantly -- a settings block for a league that has none, a roster for a
      // week it has not scored, a member for a departed manager. A parser written to shape a value
      // throws when handed `undefined`, so every model was growing its own guard: five different
      // idioms across nine files, and three sites that still had none. Returning `undefined` here
      // completes the contract the output side already keeps at `_processResponseMapItem`, where
      // an undefined result leaves the attribute unset. `parseAbsent` opts out.
      if (responseData === undefined && !value.parseAbsent) {
        return undefined;
      }
      return value.manualParse(responseData, data, rawData, constructorParams, instance);
    } else if (value.BaseObject) {
      const buildInstance = (passedData) => (
        value.BaseObject.buildFromServer(passedData, constructorParams, rawData)
      );

      return value.isArray ? (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)(responseData, buildInstance) : buildInstance(responseData);
    }

    throw new Error(
      `${this.displayName}: _populateObject: Invalid responseMap object. Object must define ` +
      '`BaseObject` or `manualParse`. See docs for typedef of ResponseMapValueObject.'
    );
  }

  /**
   * Helper method for `_populateObject` that houses the attribute mapping logic. Should never be
   * used by other methods. See {@link ResponseMapValueObject} for `responseMap` documentation.
   * @private
   *
   * @param  {object} options The arguments to this helper.
   * @param  {object} options.data The response data at the responseMap entry's key.
   * @param  {object} options.rawData The complete response data, before any key lookup.
   * @param  {BaseObject} options.instance The instance to populate. This instance will be mutated.
   * @param  {object} options.constructorParams Params to be passed to the instance's constructor.
   *                                            Useful for passing parent data, such as `leagueId`.
   * @param  {boolean} options.isDataFromServer When true, the data came from the ESPN API over the
   *                                            wire. When false, the data came locally.
   * @param  {string} options.key The key of the responseMap entry being parsed.
   * @param  {string} options.value The value of the responseMap entry being parsed.
   */
  static _processResponseMapItem({
    data, rawData, constructorParams, instance, isDataFromServer, key, value
  }) {
    let item;

    if (!isDataFromServer) {
      item = (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(data, key);
    } else if (typeof value === 'string') {
      item = (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(data, value);
    } else if ((0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(value)) {
      item = this._processObjectValue({
        data, rawData, constructorParams, instance, value
      });
    } else {
      throw new Error(
        `${this.displayName}: _populateObject: Did not recognize responseMap value type for key ` +
        `${key}`
      );
    }

    if (item !== undefined) {
      (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.setPath)(instance, key, item);
    }
  }

  /**
   * Returns the passed instance of the BaseObject populated with the passed data, mapping the
   * attributes defined in the value of responseMap to the matching key.
   * @private
   *
   * @param  {object} options The arguments to this helper.
   * @param  {object} options.data The data to map onto the passed instance.
   * @param  {object} options.rawData The complete response data, before any key lookup.
   * @param  {object} options.constructorParams Params to be passed to the instance's constructor.
   *                                            Useful for passing parent data, such as `leagueId`.
   * @param  {BaseObject} options.instance The instance to populate. This instance will be mutated.
   * @param  {boolean} options.isDataFromServer When true, the data came from ESPN. When false, the
   *                                            data came locally.
   * @returns {BaseObject} The mutated BaseObject instance.
   */
  static _populateObject({
    data, rawData, constructorParams, instance, isDataFromServer
  }) {
    if (!instance) {
      throw new Error(`${this.displayName}: _populateObject: Did not receive instance to populate`);
    } else if ((0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.isEmpty)(data)) {
      return instance;
    }

    ;(0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.each)(this.responseMap, (value, key) => {
      this._processResponseMapItem({
        data, rawData, constructorParams, instance, isDataFromServer, key, value
      });
    });

    return instance;
  }

  /**
   * Returns a new instance of the BaseObject populated with the passed data that came from ESPN,
   * mapping the attributes defined in the value of responseMap to the matching key. Use this method
   * when constructing BaseObjects with server responses.
   * @param  {object} data Data originating from the server.
   * @param  {object} constructorParams Params to be passed to the instance's constructor. Useful
   *                                    for passing parent data, such as `leagueId`.
   * @returns {BaseObject} A new instance of the BaseObject populated with the passed data.
   */
  static buildFromServer(data, constructorParams) {
    const instance = new this(constructorParams);

    const flatData = this.flattenResponse ? (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.flattenObjectSansNumericKeys)(data) : data;

    this._populateObject({
      data: flatData,
      rawData: data,
      constructorParams,
      instance,
      isDataFromServer: true
    });

    return instance;
  }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (BaseObject);


/***/ },

/***/ "./src/boxscore-player/boxscore-player.js"
/*!************************************************!*\
  !*** ./src/boxscore-player/boxscore-player.js ***!
  \************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _internal_objects_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../internal/objects.js */ "./src/internal/objects.js");
/* harmony import */ var _player_player__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../player/player */ "./src/player/player.js");
/* harmony import */ var _player_stats_player_stats__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../player-stats/player-stats */ "./src/player-stats/player-stats.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../constants */ "./src/constants.js");







/**
 * @typedef {import('../player-stats/player-stats').default} PlayerStats
 */

/**
 * Represents a player and their stats on a boxscore.
 *
 * @augments {Player}
 */
class BoxscorePlayer extends _player_player__WEBPACK_IMPORTED_MODULE_1__["default"] {
  static displayName = 'BoxscorePlayer';

  /**
   * @typedef {object} BoxscorePlayerMap
   *
   * The attributes BoxscorePlayer adds. Everything on Player is inherited through the class
   * hierarchy rather than restated here.
   *
   * @property {import('../constants').PlayerAvailabilityStatus} availabilityStatus The fantasy
   *                                                             roster status of the player.
   * @property {string} rosteredPosition The position the player is slotted at in the fantasy
   *                                     lineup.
   * @property {number} totalPoints The total points scored by the player.
   * @property {PlayerStats} pointBreakdown The PlayerStats model with the points scored by the
   *                                        player.
   * @property {PlayerStats} projectedPointBreakdown The PlayerStats model with the points ESPN
   *                                                 projected for the player.
   * @property {PlayerStats} rawStats The PlayerStats model with the raw statistics registered by
   *                                  the player.
   * @property {PlayerStats} projectedRawStats The PlayerStats model with the raw statistics ESPN
   *                                           projected for the player.
   */

  /**
   * @type {BoxscorePlayerMap}
   */
  static responseMap = {
    ..._player_player__WEBPACK_IMPORTED_MODULE_1__["default"].responseMap,

    availabilityStatus: {
      key: 'status',
      manualParse: (responseData, data, rawData) => rawData.playerPoolEntry.status
    },
    rosteredPosition: {
      key: 'lineupSlotId',
      manualParse: (responseData) => (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_0__.getPath)(_constants__WEBPACK_IMPORTED_MODULE_3__.slotCategoryIdToPositionMap, responseData)
    },
    totalPoints: 'appliedStatTotal',
    pointBreakdown: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => (0,_player_stats_player_stats__WEBPACK_IMPORTED_MODULE_2__.parsePlayerStats)({
        responseData,
        constructorParams,
        usesPoints: true,
        statKey: 'appliedStats',
        statSourceId: 0,
        statSplitTypeId: 1
      })
    },
    projectedPointBreakdown: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => (0,_player_stats_player_stats__WEBPACK_IMPORTED_MODULE_2__.parsePlayerStats)({
        responseData,
        constructorParams,
        usesPoints: true,
        statKey: 'appliedStats',
        statSourceId: 1,
        statSplitTypeId: 1
      })
    },
    rawStats: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => (0,_player_stats_player_stats__WEBPACK_IMPORTED_MODULE_2__.parsePlayerStats)({
        responseData,
        constructorParams,
        usesPoints: false,
        statKey: 'stats',
        statSourceId: 0,
        statSplitTypeId: 1
      })
    },
    projectedRawStats: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => (0,_player_stats_player_stats__WEBPACK_IMPORTED_MODULE_2__.parsePlayerStats)({
        responseData,
        constructorParams,
        usesPoints: false,
        statKey: 'stats',
        statSourceId: 1,
        statSplitTypeId: 1
      })
    }
  };
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (BoxscorePlayer);


/***/ },

/***/ "./src/boxscore/boxscore.js"
/*!**********************************!*\
  !*** ./src/boxscore/boxscore.js ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _internal_collections_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../internal/collections.js */ "./src/internal/collections.js");
/* harmony import */ var _boxscore_player_boxscore_player__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../boxscore-player/boxscore-player */ "./src/boxscore-player/boxscore-player.js");
/* harmony import */ var _matchup_matchup__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../matchup/matchup */ "./src/matchup/matchup.js");





/**
 * Represents a boxscore for a week: a {@link Matchup} plus the rosters that produced its scores.
 *
 * Both are built from the same `schedule` entry, so the pairing, the result and the scores are
 * inherited rather than restated. What a Boxscore adds is the part ESPN only sends for the scoring
 * period you asked about: the two lineups and their projections.
 *
 * @augments {Matchup}
 */
class Boxscore extends _matchup_matchup__WEBPACK_IMPORTED_MODULE_2__["default"] {
  static displayName = 'Boxscore';

  /**
   * @typedef {object} BoxscoreMap
   *
   * The attributes Boxscore adds. Everything on Matchup -- `id`, `matchupPeriodId`, `winner`,
   * `playoffTierType`, both team ids, both scores and both win probabilities -- is inherited
   * through the class hierarchy rather than restated here.
   *
   * @property {number} homeProjectedScore The projected total points scored by the home team.
   *   NOTE: This field is only populated in the boxscore for the current matchup period!
   * @property {BoxscorePlayer[]} homeRoster The home team's roster, containing player info and
   *                                         stats.
   *
   * @property {number} awayProjectedScore The projected total points scored by the away team.
   *   NOTE: This field is only populated in the boxscore for the current matchup period!
   * @property {BoxscorePlayer[]} awayRoster The away team's roster, containing player info and
   *                                         stats.
   */

  /**
   * @type {BoxscoreMap}
   */
  static responseMap = {
    ..._matchup_matchup__WEBPACK_IMPORTED_MODULE_2__["default"].responseMap,

    homeProjectedScore: 'home.totalProjectedPointsLive',
    homeRoster: {
      key: 'home.rosterForCurrentScoringPeriod.entries',
      isArray: true,
      // An unplayed week has no roster key at all, and `[]` is what callers iterate. Without this
      // the absent-key guard would leave the attribute unset instead.
      parseAbsent: true,
      manualParse: (responseData, data, rawData, constructorParams) => (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)(
        responseData,
        (playerData) => _boxscore_player_boxscore_player__WEBPACK_IMPORTED_MODULE_1__["default"].buildFromServer(playerData, constructorParams)
      )
    },

    awayProjectedScore: 'away.totalProjectedPointsLive',
    awayRoster: {
      key: 'away.rosterForCurrentScoringPeriod.entries',
      isArray: true,
      parseAbsent: true,
      manualParse: (responseData, data, rawData, constructorParams) => (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)(
        responseData,
        (playerData) => _boxscore_player_boxscore_player__WEBPACK_IMPORTED_MODULE_1__["default"].buildFromServer(playerData, constructorParams)
      )
    }
  };
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Boxscore);


/***/ },

/***/ "./src/client/client.js"
/*!******************************!*\
  !*** ./src/client/client.js ***!
  \******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ACTIVITY_ACTION: () => (/* binding */ ACTIVITY_ACTION),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _internal_collections_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../internal/collections.js */ "./src/internal/collections.js");
/* harmony import */ var _internal_objects_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../internal/objects.js */ "./src/internal/objects.js");
/* harmony import */ var _boxscore_boxscore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../boxscore/boxscore */ "./src/boxscore/boxscore.js");
/* harmony import */ var _draft_player_draft_player__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../draft-player/draft-player */ "./src/draft-player/draft-player.js");
/* harmony import */ var _free_agent_player_free_agent_player__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../free-agent-player/free-agent-player */ "./src/free-agent-player/free-agent-player.js");
/* harmony import */ var _league_league__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../league/league */ "./src/league/league.js");
/* harmony import */ var _matchup_matchup__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../matchup/matchup */ "./src/matchup/matchup.js");
/* harmony import */ var _nfl_game_nfl_game__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../nfl-game/nfl-game */ "./src/nfl-game/nfl-game.js");
/* harmony import */ var _team_team__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../team/team */ "./src/team/team.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../utils */ "./src/utils.js");
/* harmony import */ var _http__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./http */ "./src/client/http.js");














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

    this._http = (0,_http__WEBPACK_IMPORTED_MODULE_10__["default"])({
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
      const schedule = (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(data, 'schedule');
      const matchups = (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.filter)(schedule, { matchupPeriodId });

      return (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)(matchups, (matchup) => (
        _boxscore_boxscore__WEBPACK_IMPORTED_MODULE_2__["default"].buildFromServer(matchup, { leagueId: this.leagueId, seasonId, scoringPeriodId })
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
      (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)((0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(data, 'schedule'), (matchup) => (
        _matchup_matchup__WEBPACK_IMPORTED_MODULE_6__["default"].buildFromServer(matchup, { leagueId: this.leagueId, seasonId })
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
      (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)(draftData.draftDetail.picks, (draftPick) => {
        const playerInfo = (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.find)(
          playerData.players,
          (player) => player.player.id === draftPick.playerId
        );

        const data = {
          ...draftPick,
          ...(0,_utils__WEBPACK_IMPORTED_MODULE_9__.flattenObjectSansNumericKeys)(playerInfo)
        };

        return _draft_player_draft_player__WEBPACK_IMPORTED_MODULE_3__["default"].buildFromServer(data, { seasonId, scoringPeriodId });
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
      const schedule = (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(data[0], 'schedule'); // Data is an array instead of object
      const matchups = (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.filter)(schedule, { matchupPeriodId });

      return (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)(matchups, (matchup) => (
        _boxscore_boxscore__WEBPACK_IMPORTED_MODULE_2__["default"].buildFromServer(matchup, { leagueId: this.leagueId, seasonId, scoringPeriodId })
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
      const players = (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(data, 'players');
      return (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)(players, (player) => (
        _free_agent_player_free_agent_player__WEBPACK_IMPORTED_MODULE_4__["default"].buildFromServer(player, {
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
    const teams = (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(responseData, 'teams');
    const members = (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(responseData, 'members');

    const mergedData = (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)(teams, (team) => {
      // The absent-tolerant `find`, not `Array#find`: a response with no `members` key, or a team
      // whose `primaryOwner` has left the league, would otherwise throw and take the whole call.
      const owner = (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.find)(members, (member) => member.id === team.primaryOwner);
      return { owner, ...team }; // Don't spread owner to prevent id and other attributes clashing
    });

    return (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)(mergedData, (team) => (
      _team_team__WEBPACK_IMPORTED_MODULE_8__["default"].buildFromServer(team, { leagueId: this.leagueId, seasonId, scoringPeriodId })
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
      const events = (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(data, 'events');
      return (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)(events, (game) => _nfl_game_nfl_game__WEBPACK_IMPORTED_MODULE_7__["default"].buildFromServer(game));
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
      const leagueData = { ...(0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(data, 'settings'), status: (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(data, 'status') };

      return _league_league__WEBPACK_IMPORTED_MODULE_5__["default"].buildFromServer(leagueData, { leagueId: this.leagueId, seasonId });
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

    const msgTypes = (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(MESSAGE_IDS_BY_ACTIVITY_TYPE, msgType, ALL_ACTIVITY_MESSAGE_IDS);

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
      const activity = (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)(
        communicationData.topics,
        (topic) => this._buildActivity(topic, leagueData)
      );
      // Only the players `_buildActivity` could not resolve off a roster need looking up, and a
      // topic set can name the same player more than once.
      const searchIds = (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.uniq)(
        (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)((0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.filter)(activity.flat(), (msg) => !msg.player), (msg) => msg.targetId)
      );

      // Every player resolved from a roster, so the player-card request would be a round trip
      // asking ESPN to match an empty id list.
      if ((0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.isEmpty)(searchIds)) {
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
        (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)(activity, (action) => (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)(action, (msg) => {
          if (!msg.player) {
            return {
              ...msg,
              player: (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.find)(playerData.players, (player) => player.id === msg.targetId)
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

    return (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)(topic.messages, (message) => {
      let team;
      let action = 'UNKNOWN';
      let player = null;
      let bidAmount = 0;
      const msgId = message.messageTypeId;

      if (msgId === 244) {
        team = (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.find)(teams, (x) => x.id === message.from);
      } else if (msgId === 239) {
        team = (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.find)(teams, (x) => x.id === message.for);
      } else {
        team = (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.find)(teams, (x) => x.id === message.to);
      }

      if (ACTIVITY_TYPE_BY_MESSAGE_ID[msgId]) {
        action = ACTIVITY_TYPE_BY_MESSAGE_ID[msgId];
      }
      if (action === 'WAIVER ADDED') {
        bidAmount = message.from || 0;
      }
      if (team) {
        player = (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.find)(team.roster.entries, (x) => x.playerId === message.targetId);
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
      return (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.mergeConfig)(config, { headers, credentials: 'include' });
    }

    return config;
  }

  static _buildRoute({ base, params }) {
    return `${base}${params}`;
  }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Client);



/***/ },

/***/ "./src/client/http.js"
/*!****************************!*\
  !*** ./src/client/http.js ***!
  \****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_BASE_URL: () => (/* binding */ DEFAULT_BASE_URL),
/* harmony export */   HttpError: () => (/* binding */ HttpError),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * The host and path prefix every ESPN fantasy v3 route resolves against. Requests that live on
 * another host override it per-call via `config.baseURL`.
 * @type {string}
 */
const DEFAULT_BASE_URL = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/';

/**
 * Headers sent on every request. Per-request headers merge over these.
 * @type {Record<string, string>}
 */
const DEFAULT_HEADERS = { Accept: 'application/json' };

/**
 * How long a single attempt may take, in milliseconds.
 *
 * Generous rather than snappy: `getFreeAgents` asks for 2000 players and `getDraftInfo` for 3000,
 * and those payloads are megabytes. A request that hangs forever is the failure being prevented
 * here, not a slow one. Note this is per *attempt* -- with the default retry count the worst case
 * is roughly three times this plus backoff.
 * @type {number}
 */
const DEFAULT_TIMEOUT = 30000;

/**
 * How many times a failed request is retried. ESPN flakes; this is the same policy already proven
 * against this host in the sibling Python ingest.
 * @type {number}
 */
const DEFAULT_RETRIES = 2;

/**
 * Base backoff between attempts, in milliseconds. Doubled per attempt, with jitter.
 * @type {number}
 */
const DEFAULT_RETRY_DELAY = 250;

/**
 * Statuses worth trying again. A 4xx is the caller's problem -- bad league id, expired cookies, a
 * route that no longer exists -- and retrying it just spends time to fail identically.
 *
 * @param   {number} status The response status.
 * @returns {boolean} Whether a retry could plausibly succeed.
 */
const isRetryableStatus = (status) => status === 429 || status >= 500;

/**
 * Reads a `Retry-After` header, in seconds.
 *
 * The header is specified as either a number of seconds or an HTTP date. Only the seconds form is
 * read; anything else yields `undefined` and the caller falls back to its backoff curve.
 *
 * The parsed number rather than the Response itself ends up on `HttpError`, deliberately: a
 * Response carries headers, and this error is documented as safe to log wholesale.
 *
 * @param   {object} [response] The response to read.
 * @returns {number|undefined} Seconds to wait, when the header says so.
 */
const parseRetryAfter = (response) => {
  const seconds = Number(response?.headers?.get?.('retry-after'));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
};

/**
 * Sleeps, resolving early if the signal aborts.
 *
 * Waiting out a backoff after the caller has cancelled would make an abort take seconds to be
 * noticed.
 *
 * @param   {number} ms How long to wait.
 * @param   {AbortSignal} [signal] A signal that cuts the wait short.
 * @returns {Promise<void>} Resolves when the wait is over or the signal aborts.
 */
const sleep = (ms, signal) => new Promise((resolve) => {
  const timer = setTimeout(resolve, ms);
  signal?.addEventListener('abort', () => {
    clearTimeout(timer);
    resolve();
  }, { once: true });
});

/**
 * How long to wait before the next attempt.
 *
 * ESPN's `Retry-After` wins when it sends one, since it knows better than any backoff curve. It is
 * specified as either seconds or an HTTP date; only the seconds form is honored, and anything
 * unreadable falls through to the curve.
 *
 * @param   {Error} error The failure from the attempt that just failed.
 * @param   {number} attempt The zero-based attempt number that just failed.
 * @param   {number} baseDelay The configured base delay.
 * @returns {number} Milliseconds to wait.
 */
const retryDelayFor = (error, attempt, baseDelay) => {
  if (error?.retryAfter > 0) {
    return error.retryAfter * 1000;
  }

  // Jittered, so that the parallel requests in getDraftInfo and getRecentActivity do not all come
  // back at the same instant and reproduce whatever load caused the failure.
  return (baseDelay * (2 ** attempt)) * (1 + Math.random());
};

/**
 * The key a response is cached under.
 *
 * The URL alone is not enough. `getFreeAgents` and the player half of `getDraftInfo` build
 * byte-identical URLs and differ only in `x-fantasy-filter` -- one asks for free agents and
 * waivers, the other for the top 3000 by ownership. Keyed on URL alone, one method would be served
 * the other's response.
 *
 * The `Cookie` header is deliberately not part of the key: a Client holds one credential set for
 * its whole life, so it cannot vary within a cache.
 *
 * @param   {string} url The resolved URL.
 * @param   {Record<string, string>} [headers] The request headers.
 * @returns {string} The cache key.
 */
const cacheKeyFor = (url, headers) => `${url}\n${headers?.['x-fantasy-filter'] ?? ''}`;

/**
 * Thrown when a request does not produce a parseable JSON body with a 2xx status.
 *
 * This deliberately carries no request headers. Those hold the `espn_s2` and `SWID` cookies, and
 * consumers routinely log caught errors wholesale.
 */
class HttpError extends Error {
  /**
   * @param {object} options Required options object.
   * @param {string} options.message Human-readable description of the failure.
   * @param {number} options.status The response's HTTP status code.
   * @param {string} options.statusText The response's HTTP status text.
   * @param {*} options.data The parsed response body, or the raw text when it is not JSON.
   * @param {string} options.url The URL that was requested. Never contains credentials.
   * @param {number} [options.retryAfter] Seconds ESPN asked the caller to wait, from the
   *                                      `Retry-After` header, when it sent a parseable one.
   */
  constructor({
    message, status, statusText, data, url, retryAfter
  }) {
    super(message);

    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.url = url;
    this.retryAfter = retryAfter;
  }
}

/**
 * Builds the HTTP client a `Client` makes its requests through.
 *
 * `fetch` is a parameter rather than a global reference so that tests -- and anything else wanting
 * to observe or stand in for the network -- can supply their own. It is what lets a recorded ESPN
 * payload be replayed through the whole parse stack, and what lets a test assert the *resolved*
 * URL rather than the route fragment that goes into it.
 *
 * @param   {object} [options] Options.
 * @param   {Function} [options.fetch] The fetch implementation to use. Defaults to the platform's,
 *                                    resolved per request rather than captured here.
 * @returns {{get: Function}} An HTTP client bound to that fetch.
 */
/**
 * Builds the HTTP client a `Client` makes its requests through.
 *
 * `fetch` is a parameter rather than a global reference so that tests -- and anything else wanting
 * to observe or stand in for the network -- can supply their own. It is what lets a recorded ESPN
 * payload be replayed through the whole parse stack, and what lets a test assert the *resolved*
 * URL rather than the route fragment that goes into it.
 *
 * @param   {object} [options] Options.
 * @param   {Function} [options.fetch] The fetch implementation to use. Defaults to the platform's,
 *                                    resolved per request rather than captured here.
 * @param   {number} [options.timeout] Per-attempt timeout in milliseconds. `0` disables it.
 * @param   {number} [options.retries] How many times to retry a failed request.
 * @param   {number} [options.retryDelay] Base backoff in milliseconds, doubled per attempt.
 * @param   {false|{ttl: number, max: number}} [options.cache] Response cache. Off by default. When
 *   on, successful responses are held for `ttl` milliseconds, at most `max` of them.
 * @returns {{get: Function}} An HTTP client.
 */
const createHttp = ({
  fetch: fetchImpl,
  timeout: defaultTimeout = DEFAULT_TIMEOUT,
  retries = DEFAULT_RETRIES,
  retryDelay = DEFAULT_RETRY_DELAY,
  cache = false
} = {}) => {
  // Insertion-ordered, which is what makes the eviction below least-recently-*stored*. Held on the
  // closure rather than at module scope: the previous cache in this project was a static that
  // outlived every object that wrote to it, and that is the mistake not being repeated.
  const responses = new Map();

  const readCache = (key) => {
    const entry = responses.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      responses.delete(key);
      return undefined;
    }

    return entry;
  };

  const writeCache = (key, data) => {
    responses.set(key, { data, expiresAt: Date.now() + cache.ttl });

    while (responses.size > cache.max) {
      responses.delete(responses.keys().next().value);
    }
  };

  /**
   * Performs one attempt and returns the parsed body.
   *
   * @param   {string} url The resolved URL.
   * @param   {object} init The fetch init.
   * @returns {Promise<*>} The parsed response body.
   * @throws  {HttpError} When the status is not 2xx, or the body is not JSON.
   */
  const attempt = async (url, init) => {
    // Resolved per request rather than captured at construction, so that this behaves exactly as
    // the previous direct `fetch(...)` call did for anything that patches the global.
    const doFetch = fetchImpl || globalThis.fetch;

    const response = await doFetch(url, init);

    // A response body may only be read once. Reading it as text and parsing by hand keeps the raw
    // payload available to report on, which `response.json()` would have consumed and discarded.
    const body = await response.text();

    let data;
    let isJson = true;
    try {
      data = JSON.parse(body);
    } catch {
      isJson = false;
    }

    if (!response.ok) {
      // Status is checked before parsing so that an outage serving an HTML error page surfaces as
      // its actual status rather than as a JSON syntax error.
      throw new HttpError({
        message: `Request failed with status code ${response.status}`,
        status: response.status,
        statusText: response.statusText,
        data: isJson ? data : body,
        url,
        retryAfter: parseRetryAfter(response)
      });
    }

    if (!isJson) {
      throw new HttpError({
        message: `Request succeeded with status code ${response.status} but the body was not JSON`,
        status: response.status,
        statusText: response.statusText,
        data: body,
        url
      });
    }

    return data;
  };

  return {
    /**
     * Performs a GET request and resolves with the parsed JSON body.
     *
     * @param   {string} route The route to resolve against `baseURL`.
     * @param   {object} [config] Request options.
     * @param   {string} [config.baseURL] Overrides the default base URL for routes on other hosts.
     * @param   {Record<string, string>} [config.headers] Headers merged over the defaults.
     * @param   {string} [config.credentials] Passed through to `fetch`. `'include'` lets a browser
     *                                        attach its own ESPN cookies; inert under Node.
     * @param   {AbortSignal} [config.signal] Cancels the request. An abort is terminal -- it is
     *                                        never retried.
     * @param   {number} [config.timeout] Overrides the per-attempt timeout for this request.
     * @returns {Promise<*>} The parsed response body.
     * @throws  {HttpError} When the status is not 2xx, or the body is not JSON.
     */
    async get(route, config = {}) {
      const {
        baseURL = DEFAULT_BASE_URL, headers, credentials, signal, timeout = defaultTimeout
      } = config;
      const url = new URL(route, baseURL).toString();
      const key = cacheKeyFor(url, headers);

      if (cache) {
        const hit = readCache(key);
        if (hit) {
          return hit.data;
        }
      }

      let lastError;

      for (let tries = 0; tries <= retries; tries += 1) {
        // Composed fresh per attempt: a timeout signal is spent once it fires, so reusing one
        // would make every retry after a timeout abort instantly.
        const signals = [];
        if (signal) {
          signals.push(signal);
        }
        if (timeout) {
          signals.push(AbortSignal.timeout(timeout));
        }

        try {
          const data = await attempt(url, {
            headers: { ...DEFAULT_HEADERS, ...headers },
            credentials,
            signal: signals.length ? AbortSignal.any(signals) : undefined
          });

          if (cache) {
            writeCache(key, data);
          }

          return data;
        } catch (error) {
          // The caller cancelled. Retrying would ignore them, and the delay before noticing would
          // be the whole backoff curve.
          if (signal?.aborted) {
            throw error;
          }

          // A 4xx is the caller's problem -- a bad league id, expired cookies, a route that moved.
          // Trying again spends time to fail identically. A non-JSON 2xx body is the same: the
          // request worked, the answer is just not what this client can read.
          if (error instanceof HttpError && !isRetryableStatus(error.status)) {
            throw error;
          }

          lastError = error;

          if (tries < retries) {
            await sleep(retryDelayFor(error, tries, retryDelay), signal);
          }
        }
      }

      throw lastError;
    }
  };
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (createHttp);



/***/ },

/***/ "./src/constants.js"
/*!**************************!*\
  !*** ./src/constants.js ***!
  \**************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   INJURY_STATUS: () => (/* binding */ INJURY_STATUS),
/* harmony export */   MATCHUP_RESULT: () => (/* binding */ MATCHUP_RESULT),
/* harmony export */   PLAYER_AVAILABILITY_STATUS: () => (/* binding */ PLAYER_AVAILABILITY_STATUS),
/* harmony export */   WINNING_TEAM: () => (/* binding */ WINNING_TEAM),
/* harmony export */   defaultPositionIdToPosition: () => (/* binding */ defaultPositionIdToPosition),
/* harmony export */   nflTeamIdToNFLTeam: () => (/* binding */ nflTeamIdToNFLTeam),
/* harmony export */   nflTeamIdToNFLTeamAbbreviation: () => (/* binding */ nflTeamIdToNFLTeamAbbreviation),
/* harmony export */   scoringIdToItem: () => (/* binding */ scoringIdToItem),
/* harmony export */   scoringItemToId: () => (/* binding */ scoringItemToId),
/* harmony export */   slotCategoryIdToPositionMap: () => (/* binding */ slotCategoryIdToPositionMap)
/* harmony export */ });
/**
 * Maps ESPN's `lineupSlotId` enum to readable positions.
 *
 * This is the enum used by `eligibleSlots` and by a roster entry's `lineupSlotId` -- the slots a
 * player may be *started* in. It includes combination slots (`RB/WR`), `Bench` and `IR`, which are
 * lineup concepts rather than positions.
 *
 * NOTE: ESPN has a *second*, incompatible position enum, `defaultPositionId`, which describes what
 * a player *is* rather than where they may be slotted. The two overlap on `2` (RB) and `16`
 * (D/ST) and disagree everywhere else, so reading one through the other silently yields a wrong
 * but plausible position. Use {@link defaultPositionIdToPosition} for that enum.
 *
 * @type {Record<number, string>}
 */
const slotCategoryIdToPositionMap = {
  0: 'QB',
  1: 'TQB',
  2: 'RB',
  3: 'RB/WR',
  4: 'WR',
  5: 'WR/TE',
  6: 'TE',
  7: 'OP',
  8: 'DT',
  9: 'DE',
  10: 'LB',
  11: 'DL',
  12: 'CB',
  13: 'S',
  14: 'DB',
  15: 'DP',
  16: 'D/ST',
  17: 'K',
  18: 'P',
  19: 'HC',
  20: 'Bench',
  21: 'IR',
  22: 'INVALID_CODE', // https://github.com/cwendt94/espn-api/blob/master/espn_api/football/constant.py#L24
  23: 'RB/WR/TE',
  24: 'ER',
  25: 'Rookie'
};

/**
 * Maps ESPN's `defaultPositionId` enum to readable positions.
 *
 * This is the enum on a player object describing the position the player actually plays, and it is
 * also the enum `pointsOverrides` is keyed by in a league's scoring settings. It is NOT the same
 * enum as {@link slotCategoryIdToPositionMap}: there, `1` is `TQB`, `3` is `RB/WR`, `4` is `WR`
 * and `5` is `WR/TE`.
 *
 * Verified against real 2026 player payloads: Josh Allen is `1`, Jahmyr Gibbs `2`, Ja'Marr Chase
 * `3`, Trey McBride `4`, Brandon Aubrey `5`, and a D/ST `16`.
 *
 * Only those six ids are listed, because only those six are confirmed. ESPN issues further ids for
 * IDP positions, and this project has no payload to verify them against. An unlisted id resolves to
 * `undefined` rather than to a guess -- an absent position is recoverable, a confidently wrong one
 * is not.
 *
 * @type {Record<number, string>}
 */
const defaultPositionIdToPosition = {
  1: 'QB',
  2: 'RB',
  3: 'WR',
  4: 'TE',
  5: 'K',
  16: 'D/ST'
};

/**
 * Maps `proTeam` numerical enum to readable team names.
 * @type {object}
 */
const nflTeamIdToNFLTeam = {
  [-1]: 'Bye',
  1: 'Atlanta Falcons',
  2: 'Buffalo Bills',
  3: 'Chicago Bears',
  4: 'Cincinnati Bengals',
  5: 'Cleveland Browns',
  6: 'Dallas Cowboys',
  7: 'Denver Broncos',
  8: 'Detroit Lions',
  9: 'Green Bay Packers',
  10: 'Tennessee Titans',
  11: 'Indianapolis Colts',
  12: 'Kansas City Chiefs',
  13: 'Las Vegas Raiders',
  14: 'Los Angeles Rams',
  15: 'Miami Dolphins',
  16: 'Minnesota Vikings',
  17: 'New England Patriots',
  18: 'New Orleans Saints',
  19: 'New York Giants',
  20: 'New York Jets',
  21: 'Philadelphia Eagles',
  22: 'Arizona Cardinals',
  23: 'Pittsburgh Steelers',
  24: 'Los Angeles Chargers',
  25: 'San Francisco 49ers',
  26: 'Seattle Seahawks',
  27: 'Tampa Bay Buccaneers',
  28: 'Washington Commanders',
  29: 'Carolina Panthers',
  30: 'Jacksonville Jaguars',
  33: 'Baltimore Ravens',
  34: 'Houston Texans'
};

/**
 * Maps `proTeam` numerical enum to readable team name abbreviations.
 * @type {object}
 */
const nflTeamIdToNFLTeamAbbreviation = {
  [-1]: 'Bye',
  1: 'ATL',
  2: 'BUF',
  3: 'CHI',
  4: 'CIN',
  5: 'CLE',
  6: 'DAL',
  7: 'DEN',
  8: 'DET',
  9: 'GB',
  10: 'TEN',
  11: 'IND',
  12: 'KC',
  13: 'LV',
  14: 'LAR',
  15: 'MIA',
  16: 'MIN',
  17: 'NE',
  18: 'NO',
  19: 'NYG',
  20: 'NYJ',
  21: 'PHI',
  22: 'ARI',
  23: 'PIT',
  24: 'LAC',
  25: 'SF',
  26: 'SEA',
  27: 'TB',
  28: 'WSH',
  29: 'CAR',
  30: 'JAX',
  33: 'BAL',
  34: 'HOU'
};

/**
 * @typedef {object} ScoringItems
 *
 * `scoringItemToId` and `scoringIdToItem` map between numerical ids and human-readable attribute
 * names. While some attributes are straight-forward (yards, attempts, completions, etc.), some
 * attributes are niche items such as ranges.
 *
 * Scoring items that are not configured or enabled in a league's settings may still be populated on
 * API responses.
 *
 * There are several scoring categories scoring all have "per increment" scoring, i.e. points for
 * every <X> yards gained. The typically scoring pattern is something like 0.1 point per 1 yard. The
 * <X> point per 1 yard attribute does not include the "Per1Yard" suffix; only attributes like
 * "Per5Yards" have the matching suffix. "Per5Yards" scoring means that 5 total yards gained is
 * given 1 point, 9 total yards gained would be given 1 point, and 10 total yards gained given 2
 * points.
 *
 * Passing scoring items are typically only present for QBs, but position players (like RBs, WRs,
 * TEs) will occasionally make a passing play as well.
 *
 * Defensive yards allowed and points allowed are inclusive and only scored when their condition
 * is met. For example, if a DST allowed 360 yards, then `defensive350To399YardsAllowed` will be
 * scored (value is 1 when statistical) and the other defensive yard stats will not be populated.
 *
 * @property {number} passingAttempts Total passing attempts.
 * @property {number} passingYards Total passing yards.
 * @property {number} passingCompletions Total passing completions.
 * @property {number} passingIncompletions Total passing incompletions.
 * @property {number} passingCompletionPercentage Passing completions divided by passing attempts.
 *                                                This value is 0-100.
 * @property {number} passingFirstDowns Total passes resulting in first downs.
 * @property {number} passingTouchdowns Total passing TDs.
 * @property {number} passing2PtConversion Total passing 2 point conversion.
 * @property {number} passingInterceptions Total passing attempts resulting in an interception
 *                                         (typically negative points).
 * @property {number} sacked Total times the passer is sacked.
 *
 * @property {number} passingYardsPer5Yards Passing yards scored in 5 yard increments. See summary
 *                                          note for more detail.
 * @property {number} passingYardsPer10Yards Passing yards scored in 10 yard increments. See summary
 *                                           note for more.
 * @property {number} passingYardsPer20Yards Passing yards scored in 20 yard increments. See summary
 *                                           note for more.
 * @property {number} passingYardsPer25Yards Passing yards scored in 25 yard increments. See summary
 *                                           note for more.
 * @property {number} passingYardsPer50Yards Passing yards scored in 50 yard increments. See summary
 *                                           note for more.
 * @property {number} passingYardsPer100Yards Passing yards scored in 100 yard increments. See
 *                                            summary note for more.
 *
 * @property {number} passingCompletionsPer5Completions Passing completions scored in 5 completion
 *                                                      increments. See summary note for more.
 * @property {number} passingCompletionsPer10Completions Passing completions scored in 10 completion
 *                                                       increments. See summary note for more.
 * @property {number} passingIncompletionsPer5Incompletions Passing incompletions scored in 5
 *                                                          incompletion increments. See summary
 *                                                          note for more.
 * @property {number} passingIncompletionsPer10Incompletions Passing incompletions scored in 10
 *                                                           incompletion increments. See summary
 *                                                           note for more.
 *
 * @property {number} passingYards300To399 If the player threw for 300-399 yards in the game.
 * @property {number} passingYards400Plus If the player threw for 400+ yards in the game.
 * @property {number} passingTouchdowns40Plus Total number of passing touchdowns where the passing
 *                                            touchdown play was 40 yards or more.
 * @property {number} passingTouchdowns50Plus Total number of passing touchdowns where the passing
 *                                            touchdown play was 50 yards or more.
 *
 *
 * @property {number} rushingAttempts Total rushing attempts.
 * @property {number} rushingYards Total rushing yards.
 * @property {number} rushingYardsPerAttempt Rushing yards divided by rushing attempts.
 * @property {number} rushingFirstDowns Total rushes resulting in first downs.
 * @property {number} rushingTouchdowns Total rushing touchdowns.
 * @property {number} rushing2PtConversions Total rushing 2 point conversions.
 *
 * @property {number} rushingYardsPer5Yards Rushing yards scored in 5 yard increments. See summary
 *                                         note for more.
 * @property {number} rushingYardsPer10Yards Rushing yards scored in 10 yard increments. See summary
 *                                          note for more.
 * @property {number} rushingYardsPer20Yards Rushing yards scored in 20 yard increments. See summary
 *                                          note for more.
 * @property {number} rushingYardsPer25Yards Rushing yards scored in 25 yard increments. See summary
 *                                          note for more.
 * @property {number} rushingYardsPer50Yards Rushing yards scored in 50 yard increments. See summary
 *                                          note for more.
 * @property {number} rushingYardsPer100Yards Rushing yards scored in 100 yard increments. See
 *                                           summary note for more.
 *
 * @property {number} rushingAttemptsPer5Attempts Rushing attempts scored in 5 attempt increments.
 *                                                See summary note for more.
 * @property {number} rushingAttemptsPer10Attempts Rushing attempts scored in 10 attempt increments.
 *                                                 See summary note for more.
 *
 * @property {number} rushingTouchdowns40Plus Total number of rushing touchdowns where the rushing
 *                                            touchdown play was 40 yards or more.
 * @property {number} rushingTouchdowns50Plus Total number of rushing touchdowns where the rushing
 *                                            touchdown play was 50 yards or more.
 * @property {number} rushingGame100To199Yards Scored if the player rushes for 100-199 yards in a
 *                                             NFL game.
 * @property {number} rushingGame200PlusYards Scored if the player rushes for 200+ yards in a NFL
 *                                            game.
 *
 * @property {number} receivingTargets Total times the player was targeted on a pass, regardless
 *                                     if the pass was completed.
 * @property {number} receivingReceptions Total receptions (only populated in PPR
 *                                        leagues).
 * @property {number} receivingYards Total receiving yards.
 * @property {number} receivingFirstDowns Total catches resulting in first downs.
 * @property {number} receivingTouchdowns Total receiving touchdowns.
 * @property {number} receivingYardsAfterCatch Total yards gained by the player after passes were
 *                                             caught.
 * @property {number} receivingYardsPerReception Total yards divided by receptions.
 * @property {number} receiving2PtConversions Total receiving 2 point conversions.
 *
 * @property {number} receivingYardsPer5Yards Receiving yards scored in 5 yard increments. See
 *                                            summary note for more.
 * @property {number} receivingYardsPer10Yards Receiving yards scored in 10 yard increments. See
 *                                             summary note for more.
 * @property {number} receivingYardsPer20Yards Receiving yards scored in 20 yard increments. See
 *                                             summary note for more.
 * @property {number} receivingYardsPer25Yards Receiving yards scored in 25 yard increments. See
 *                                             summary note for more.
 * @property {number} receivingYardsPer50Yards Receiving yards scored in 50 yard increments. See
 *                                             summary note for more.
 * @property {number} receivingYardsPer100Yards Receiving yards scored in 100 yard increments. See
 *                                              summary note for more.
 *
 * @property {number} receptionsPer5Receptions Receptions scored in 5 reception increments. See
 *                                             summary note for more.
 * @property {number} receptionsPer10Receptions Receptions scored in 10 reception increments. See
 *                                             summary note for more.
 *
 * @property {number} receivingTouchdowns40Plus Total number of receiving touchdowns where the
 *                                              receiving touchdown play was 40 yards or more.
 * @property {number} receivingTouchdowns50Plus Total number of receiving touchdowns where the
 *                                              receiving touchdown play was 50 yards or more.
 * @property {number} receivingGame100To199Yards Scored if the player catches for 100-199 yards in a
 *                                               NFL game.
 * @property {number} receivingGame200PlusYards Scored if the player catches for 200+ yards in a NFL
 *                                              game.)
 *
 *
 * @property {number} fumbles Total fumbles, regardless of whether the fumble was recovered by the
 *                            opposing team (i.e "lost") or not
 * @property {number} lostFumbles Total fumbles lost (typically negative points) (applies to all
 *                                offensive players).
 * @property {number} totalTurnovers Total turnovers (typically fumbles and interceptions, possibly
 *                              safeties and downs as well?)
 *
 * @property {number} madeFieldGoals Made field goal attempts (any distance).
 * @property {number} attemptedFieldGoals Total field goal attempts (any distance).
 * @property {number} missedFieldGoals Missed field goal attempts (any distance)
 *                                     (typically negative points).
 *
 * @property {number} madeFieldGoalsFrom60Plus Total made field goals from 60 yards or further.
 * @property {number} madeFieldGoalsFrom50Plus Total made field goals from 50 yards or further.
 * @property {number} madeFieldGoalsFrom50To59 Total made field goals from 50 yards to 59 yards.
 * @property {number} madeFieldGoalsFrom40To49 Total made field goals from 40 yards to 49 yards.
 * @property {number} madeFieldGoalsFromUnder40 Total made field goals from under 40 yards.
 * @property {number} attemptedFieldGoalsFrom60Plus Total attempted field goals from 60 yards or
 *                                                  further.
 * @property {number} attemptedFieldGoalsFrom50Plus Total attempted field goals from 50 yards or
 *                                                  further.
 * @property {number} attemptedFieldGoalsFrom50To59 Total attempted field goals from 50 yards to
 *                                                  59 yards.
 * @property {number} attemptedFieldGoalsFrom40To49 Total attempted field goals from 40 yards to
 *                                                  49 yards.
 * @property {number} attemptedFieldGoalsFromUnder40 Total attempted field goals from under 40
 *                                                   yards.
 * @property {number} missedFieldGoalsFrom60Plus Total missed field goals from 60 yards or
 *                                               further (typically negative or zero points).
 * @property {number} missedFieldGoalsFrom50Plus Total missed field goals from 50 yards or
 *                                               further (typically negative or zero points).
 * @property {number} missedFieldGoalsFrom50To59 Total missed field goals from 50 yards to 59
 *                                               yards (typically negative or zero points).
 * @property {number} missedFieldGoalsFrom40To49 Total missed field goals from 40 yards to 49
 *                                               yards (typically negative or zero points).
 * @property {number} missedFieldGoalsFromUnder40 Total missed field goals from under 40 yards
 *                                                (typically negative or zero points).
 *
 * @property {number} fieldGoalMadeYards The total yards in distance of all made field goals scored
 *                                       in 1 yard increments.
 * @property {number} fieldGoalMadeYardsPer5Yards The total yards in distance of all made field
 *                                                goals scored in 5 yard increments.
 * @property {number} fieldGoalMadeYardsPer10Yards The total yards in distance of all made field
 *                                                 goals scored in 10 yard increments.
 * @property {number} fieldGoalMadeYardsPer20Yards The total yards in distance of all made field
 *                                                 goals scored in 20 yard increments.
 * @property {number} fieldGoalMadeYardsPer25Yards The total yards in distance of all made field
 *                                                 goals scored in 25 yard increments.
 * @property {number} fieldGoalMadeYardsPer50Yards The total yards in distance of all made field
 *                                                 goals scored in 50 yard increments.
 * @property {number} fieldGoalMadeYardsPer100Yards The total yards in distance of all made field
 *                                                  goals scored in 100 yard increments.
 * @property {number} fieldGoalMissedYards The total yards in distance of all missed field goals
 *                                         scored in 1 yard increments.
 * @property {number} fieldGoalMissedYardsPer5Yards The total yards in distance of all missed field
 *                                                  goals scored in 5 yard increments.
 * @property {number} fieldGoalMissedYardsPer10Yards The total yards in distance of all missed field
 *                                                   goals scored in 10 yard increments.
 * @property {number} fieldGoalMissedYardsPer20Yards The total yards in distance of all missed field
 *                                                   goals scored in 20 yard increments.
 * @property {number} fieldGoalMissedYardsPer25Yards The total yards in distance of all missed field
 *                                                   goals scored in 25 yard increments.
 * @property {number} fieldGoalMissedYardsPer50Yards The total yards in distance of all missed field
 *                                                   goals scored in 50 yard increments.
 * @property {number} fieldGoalMissedYardsPer100Yards The total yards in distance of all missed
 *                                                    field goals scored in 100 yard increments.
 * @property {number} fieldGoalAttemptedYards The total yards in distance of all attempted field
 *                                            goals scored in 1 yard increments.
 * @property {number} fieldGoalAttemptedYardsPer5Yards The total yards in distance of all attempted
 *                                                     field goals scored in 5 yard increments.
 * @property {number} fieldGoalAttemptedYardsPer10Yards The total yards in distance of all attempted
 *                                                      field goals scored in 10 yard increments.
 * @property {number} fieldGoalAttemptedYardsPer20Yards The total yards in distance of all attempted
 *                                                      field goals scored in 20 yard increments.
 * @property {number} fieldGoalAttemptedYardsPer25Yards The total yards in distance of all attempted
 *                                                      field goals scored in 25 yard increments.
 * @property {number} fieldGoalAttemptedYardsPer50Yards The total yards in distance of all attempted
 *                                                      field goals scored in 50 yard increments.
 * @property {number} fieldGoalAttemptedYardsPer100Yards The total yards in distance of all
 *                                                       attempted field goals scored in 100 yard
 *                                                       increments.
 *
 * @property {number} madeExtraPoints Made extra point attempts.
 * @property {number} attemptedExtraPoints Total extra point attempts.
 * @property {number} missedExtraPoints Missed extra point attempts (typically negative points).
 *
 * @property {number} defensiveBlockedKickForTouchdowns When a DST blocks any kick and returns it
 *                                                      for a touchdown.
 * @property {number} defensiveInterceptions When a DST records an interception.
 * @property {number} defensiveFumbles When a DST recovers a fumble.
 * @property {number} defensiveBlockedKicks When a DST blocks any kick.
 * @property {number} defensiveSafeties When a DST records a safety.
 * @property {number} defensiveSacks When a DST records a sack.
 * @property {number} defensiveHalfSacks When a DST records an half sack. Like an assist for sacks.
 *
 * @property {number} kickoffReturnTouchdown When a DST returns a kickoff for a touchdown.
 * @property {number} puntReturnTouchdown When a DST returns a punt for a touchdown.
 * @property {number} fumbleReturnTouchdown When a DST returns a fumble for a touchdown.
 * @property {number} interceptionReturnTouchdown When a DST returns an interception for a
 *                                                touchdown.
 * @property {number} totalReturnTouchdowns Total times a DST returns a kick, punt, fumble, or
 *                                          interception for a touchdown.
 *
 * @property {number} kickoffReturnYards Total yards on kickoff returns.
 * @property {number} puntReturnYards Total yards on punt returns.
 *
 * @property {number} kickoffReturnYardsPer10Yards Kickoff return yards scored in 10 yard
 *                                                 increments.
 * @property {number} kickoffReturnYardsPer25Yards Kickoff return yards scored in 25 yard
 *                                                 increments.
 * @property {number} puntReturnYardsPer10Yards Punt return yards scored in 10 yard increments.
 * @property {number} puntReturnYardsPer25Yards Punt return yards scored in 25 yard increments.
 *
 * @property {number} defensiveForcedFumbles No description
 * @property {number} defensiveAssistedTackles No description
 * @property {number} defensiveSoloTackles No description
 * @property {number} defensiveTotalTackles No description
 * @property {number} defensiveTacklesPer3Tackles No description
 * @property {number} defensiveTacklesPer5Tackles No description
 * @property {number} defensiveStuffs No description
 *
 * @property {number} defensivePointsAllowed Total points allowed by the defense in the NFL game
 *                                           (real points allowed, not fantasy points).
 * @property {number} defensive0PointsAllowed When a DST allowed 0 points in their NFL game.
 * @property {number} defensive1To6PointsAllowed When a DST allowed 1-6 points in their NFL game.
 * @property {number} defensive7To13PointsAllowed When a DST allowed 7-13 points in their NFL
 *                                                game.
 * @property {number} defensive14To17PointsAllowed When a DST allowed 14-17 points in their NFL
 *                                                 game.
 * @property {number} defensive18To21PointsAllowed When a DST allows 18-21 points in their NFL
 *                                                 game.
 * @property {number} defensive22To27PointsAllowed When a DST allows 22-27 points in their NFL
 *                                                 game.
 * @property {number} defensive28To34PointsAllowed When a DST allows 28-34 points in their NFL
 *                                                 game.
 * @property {number} defensive35To45PointsAllowed When a DST allows 35-45 points in their NFL
 *                                                 game.
 * @property {number} defensiveOver45PointsAllowed When a DST allows more than 45 points in their
 *                                                 NFL game.
 *
 * @property {number} defensiveYardsAllowed Total yards allowed by a DST.
 * @property {number} defensiveLessThan100YardsAllowed When a DST allows less than 100 yards in
 *                                                     their NFL game.
 * @property {number} defensive100To199YardsAllowed When a DST allows 100-199 yards in their NFL
 *                                                  game.
 * @property {number} defensive200To299YardsAllowed When a DST allows 200-299 yards in their NFL
 *                                                  game.
 * @property {number} defensive350To399YardsAllowed When a DST allows 350-399 yards in their NFL
 *                                                  game.
 * @property {number} defensive400To449YardsAllowed When a DST allows 400-449 yards in their NFL
 *                                                  game.
 * @property {number} defensive450To499YardsAllowed When a DST allows 450-499 yards in their NFL
 *                                                  game.
 * @property {number} defensive500To549YardsAllowed When a DST allows 500-549 yards in their NFL
 *                                                  game.
 * @property {number} defensiveOver550YardsAllowed When a DST allows 550 or more yards in their
 *                                                 NFL game.
 *
 * @property {number} teamWin Scored when the NFL player's team wins their NFL game.
 * @property {number} teamLoss Scored when the NFL player's team loses their NFL game.
 * @property {number} teamTie Scored when the NFL player's team ties their NFL game.
 * @property {number} teamPointsScored Fantasy points awarded based on the total points scored by
 *                                     a player's team in their NFL game.
 *
 * @property {number} teamWinMargin25Plus Scored when a player's NFL team wins their NFL games by
 *                                        25 or more points.
 * @property {number} teamWinMargin20To24 Scored when a player's NFL team wins their NFL games by
 *                                        20-24 points.
 * @property {number} teamWinMargin15To19 Scored when a player's NFL team wins their NFL games by
 *                                        15-19 points.
 * @property {number} teamWinMargin10To14 Scored when a player's NFL team wins their NFL games by
 *                                        10-14 points.
 * @property {number} teamWinMargin5To9 Scored when a player's NFL team wins their NFL games by 5-9
 *                                      points.
 * @property {number} teamWinMargin1To4 Scored when a player's NFL team wins their NFL games by 1-4
 *                                      points.
 *
 * @property {number} teamLossMargin25Plus Scored when a player's NFL team loses their NFL games by
 *                                         25 or more points.
 * @property {number} teamLossMargin20To24 Scored when a player's NFL team loses their NFL games by
 *                                         20-24 points.
 * @property {number} teamLossMargin15To19 Scored when a player's NFL team loses their NFL games by
 *                                         15-19 points.
 * @property {number} teamLossMargin10To14 Scored when a player's NFL team loses their NFL games by
 *                                         10-14 points.
 * @property {number} teamLossMargin5To9 Scored when a player's NFL team loses their NFL games by
 *                                       5-9 points.
 * @property {number} teamLossMargin1To4 Scored when a player's NFL team loses their NFL games by
 *                                       1-4 points.
 *
 * @property {number} netPunts No description.
 * @property {number} puntYards No description.
 * @property {number} puntsInsideThe10 Total number of punts ending inside the opponent's 10 yard
 *                                     line.
 * @property {number} puntsInsideThe20 Total number of punts ending inside the opponent's 20 yard
 *                                     line.
 * @property {number} fairCatches lol
 */

/**
 * @type {ScoringItems}
 */
const scoringItemToId = {
  passingAttempts: '0',
  passingCompletions: '1',
  passingIncompletions: '2',
  passingYards: '3',
  passingTouchdowns: '4',

  passingYardsPer5Yards: '5',
  passingYardsPer10Yards: '6',
  passingYardsPer20Yards: '7',
  passingYardsPer25Yards: '8',
  passingYardsPer50Yards: '9',
  passingYardsPer100Yards: '10',

  passingCompletionsPer5Completions: '11',
  passingCompletionsPer10Completions: '12',
  passingIncompletionsPer5Incompletions: '13',
  passingIncompletionsPer10Incompletions: '14',

  passingTouchdowns40Plus: '15',
  passingTouchdowns50Plus: '16',

  passingYards300To399: '17',
  passingYards400Plus: '18',

  passing2PtConversions: '19',
  passingInterceptions: '20',
  passingCompletionPercentage: '21',

  rushingAttempts: '23',
  rushingYards: '24',
  rushingTouchdowns: '25',
  rushing2PtConversions: '26',

  rushingYardsPer5Yards: '27',
  rushingYardsPer10Yards: '28',
  rushingYardsPer20Yards: '29',
  rushingYardsPer25Yards: '30',
  rushingYardsPer50Yards: '31',
  rushingYardsPer100Yards: '32',

  rushingAttemptsPer5Attempts: '33',
  rushingAttemptsPer10Attempts: '34',

  rushingTouchdowns40Plus: '35',
  rushingTouchdowns50Plus: '36',

  rushingGame100To199Yards: '37',
  rushingGame200PlusYards: '38',

  rushingYardsPerAttempt: '39',

  // 41 is a legacy id for receptions?
  receivingYards: '42',
  receivingTouchdowns: '43',
  receiving2PtConversions: '44',
  // 45 and 46 were a second, unreachable pair of receivingTouchdowns{40,50}Plus entries. The
  // later '56'/'57' definitions below always won, so removing these changes no lookup.

  receivingYardsPer5Yards: '47',
  receivingYardsPer10Yards: '48',
  receivingYardsPer20Yards: '49',
  receivingYardsPer25Yards: '50',
  receivingYardsPer50Yards: '51',
  receivingYardsPer100Yards: '52',

  receivingReceptions: '53',
  receptionsPer5Receptions: '54',
  receptionsPer10Receptions: '55',

  receivingTouchdowns40Plus: '56',
  receivingTouchdowns50Plus: '57',

  receivingTargets: '58',
  receivingYardsAfterCatch: '59',
  receivingYardsPerReception: '60',

  fumbles: '68',
  lostFumbles: '72',
  totalTurnovers: '73',

  madeFieldGoalsFrom60Plus: '201',
  attemptedFieldGoalsFrom60Plus: '202',
  missedFieldGoalsFrom60Plus: '203',

  madeFieldGoalsFrom50Plus: '74',
  attemptedFieldGoalsFrom50Plus: '75',
  missedFieldGoalsFrom50Plus: '76',

  madeFieldGoalsFrom50To59: '198',
  attemptedFieldGoalsFrom50To59: '199',
  missedFieldGoalsFrom50To59: '200',

  madeFieldGoalsFrom40To49: '77',
  attemptedFieldGoalsFrom40To49: '78',
  missedFieldGoalsFrom40To49: '79',

  madeFieldGoalsFromUnder40: '80',
  attemptFieldGoalsFromUnder40: '81',
  missedFieldGoalsFromUnder40: '82',

  madeFieldGoals: '83',
  attemptedFieldGoals: '84',
  missedFieldGoals: '85',

  fieldGoalMadeYards: '214',
  fieldGoalMadeYardsPer5Yards: '217',
  fieldGoalMadeYardsPer10Yards: '218',
  fieldGoalMadeYardsPer20Yards: '219',
  fieldGoalMadeYardsPer25Yards: '220',
  fieldGoalMadeYardsPer50Yards: '221',
  fieldGoalMadeYardsPer100Yards: '222',
  fieldGoalMissedYards: '215',
  fieldGoalMissedYardsPer5Yards: '223',
  fieldGoalMissedYardsPer10Yards: '224',
  fieldGoalMissedYardsPer20Yards: '225',
  fieldGoalMissedYardsPer25Yards: '226',
  fieldGoalMissedYardsPer50Yards: '227',
  fieldGoalMissedYardsPer100Yards: '228',
  fieldGoalAttemptedYards: '216',
  fieldGoalAttemptedYardsPer5Yards: '229',
  fieldGoalAttemptedYardsPer10Yards: '230',
  fieldGoalAttemptedYardsPer20Yards: '231',
  fieldGoalAttemptedYardsPer25Yards: '232',
  fieldGoalAttemptedYardsPer50Yards: '233',
  fieldGoalAttemptedYardsPer100Yards: '234',

  madeExtraPoints: '86',
  attemptedExtraPoints: '87',
  missedExtraPoints: '88',

  defensiveBlockedKickForTouchdowns: '93',
  defensiveInterceptions: '95',
  defensiveFumbles: '96',
  defensiveBlockedKicks: '97',
  defensiveSafeties: '98',
  defensiveSacks: '99',
  defensiveHalfSacks: '100',

  kickoffReturnTouchdown: '101',
  puntReturnTouchdown: '102',
  fumbleReturnTouchdown: '103',
  interceptionReturnTouchdown: '104',
  totalReturnTouchdowns: '105',

  defensiveForcedFumbles: '106',
  defensiveAssistedTackles: '107',
  defensiveSoloTackles: '108',
  defensiveTotalTackles: '109',
  defensiveTacklesPer3Tackles: '110',
  defensiveTacklesPer5Tackles: '111',
  defensiveStuffs: '112',

  kickoffReturnYards: '114',
  puntReturnYards: '115',

  defensivePointsAllowed: '120',
  defensive0PointsAllowed: '89',
  defensive1To6PointsAllowed: '90',
  defensive7To13PointsAllowed: '91',
  defensive14To17PointsAllowed: '92',
  defensive18To21PointsAllowed: '121',
  defensive22To27PointsAllowed: '122',
  defensive28To34PointsAllowed: '123',
  defensive35To45PointsAllowed: '124',
  defensiveOver45PointsAllowed: '125',

  defensiveYardsAllowed: '127',
  defensiveLessThan100YardsAllowed: '128',
  defensive100To199YardsAllowed: '129',
  defensive200To299YardsAllowed: '130',
  defensive350To399YardsAllowed: '132',
  defensive400To449YardsAllowed: '133',
  defensive450To499YardsAllowed: '134',
  defensive500To549YardsAllowed: '135',
  defensiveOver550YardsAllowed: '136',

  netPunts: '138',
  puntYards: '139',
  puntsInsideThe10: '140',
  puntsInsideThe20: '141',
  fairCatches: '146',

  teamWin: '155',
  teamLoss: '156',
  teamTie: '157',
  teamPointsScored: '158',

  teamWinMargin25Plus: '161',
  teamWinMargin20To24: '162',
  teamWinMargin15To19: '163',
  teamWinMargin10To14: '164',
  teamWinMargin5To9: '165',
  teamWinMargin1To4: '166',
  teamLossMargin25Plus: '172',
  teamLossMargin20To24: '171',
  teamLossMargin15To19: '170',
  teamLossMargin10To14: '169',
  teamLossMargin5To9: '168',
  teamLossMargin1To4: '167'
};

const scoringIdToItem = Object.fromEntries(
  Object.entries(scoringItemToId).map(([item, id]) => [id, item])
);

/**
 * ESPN's own string enums, as open unions.
 *
 * Each is written `... | (string & {})` rather than as a closed union, deliberately. These lists
 * are hand-maintained knowledge about an API this project does not control, and that knowledge has
 * already been wrong here: `defaultPositionId` was read through the lineup-slot enum for years,
 * reporting four of the six fantasy positions incorrectly. A closed union would let a consumer
 * write an exhaustive `switch`, have TypeScript certify it complete, and then meet a value ESPN
 * sends that is not on the list. The open form gives autocomplete without the false promise.
 *
 * A few carry runtime constants below, for the values a consumer is likely to compare against.
 */

/**
 * How players are acquired onto a roster.
 * @typedef {'FREEAGENCY' |
 *   'WAIVERS_TRADITIONAL' |
 *   'WAIVERS_CONTINUOUS' |
 *   (string & {})} AcquisitionType
 */

/**
 * How a league drafts.
 * @typedef {'OFFLINE' |
 *   'SNAKE' |
 *   'AUTOPICK' |
 *   'SNAIL' |
 *   'AUCTION' |
 *   (string & {})} DraftType
 */

/**
 * A player's injury status.
 * @typedef {'ACTIVE' |
 *   'BEREAVEMENT' |
 *   'DAY_TO_DAY' |
 *   'DOUBTFUL' |
 *   'FIFTEEN_DAY_DL' |
 *   'INJURY_RESERVE' |
 *   'OUT' |
 *   'PATERNITY' |
 *   'PROBABLE' |
 *   'QUESTIONABLE' |
 *   'SEVEN_DAY_DL' |
 *   'SIXTY_DAY_DL' |
 *   'SUSPENSION' |
 *   'TEN_DAY_DL' |
 *   (string & {})} InjuryStatus
 */

/**
 * How keeper order is determined.
 * @typedef {'TRADITIONAL' |
 *   'END_OF_DRAFT' |
 *   'SELECTED_ROUND' |
 *   (string & {})} KeeperOrderType
 */

/**
 * When a starting lineup locks.
 * @typedef {'INDIVIDUAL_GAME' |
 *   'FIRSTGAME_SCORINGPERIOD' |
 *   (string & {})} LineupLockTime
 */

/**
 * The result of a matchup, from one team's side. This is what a streak is made of.
 * @typedef {'WIN' |
 *   'LOSS' |
 *   'TIE' |
 *   'NONE' |
 *   (string & {})} MatchupResult
 */

/**
 * How a tied matchup is broken.
 * @typedef {'NONE' |
 *   'HOME_TEAM_WINS' |
 *   'SLOT_POINTS' |
 *   'STAT_POINTS' |
 *   'FIRSTGAME_SCORINGPERIOD' |
 *   (string & {})} MatchupTiebreaker
 */

/**
 * A player's status for fantasy rostering purposes.
 * @typedef {'FREEAGENT' |
 *   'ONTEAM' |
 *   'WAIVERS' |
 *   (string & {})} PlayerAvailabilityStatus
 */

/**
 * How a player moved.
 * @typedef {'NONE' |
 *   'LINEUP' |
 *   'ADD' |
 *   'DROP' |
 *   'DRAFT' |
 *   'UNDRAFT' |
 *   'DRAFT_TRADE' |
 *   (string & {})} PlayerMoveType
 */

/**
 * How playoff seeds are determined.
 * @typedef {'UNKNOWN' |
 *   'H2H_RECORD' |
 *   'TOTAL_POINTS_SCORED' |
 *   'INTRA_DIVISION_RECORD' |
 *   'TOTAL_POINTS_AGAINST' |
 *   'RAW_STAT' |
 *   (string & {})} PlayoffSeedingRule
 */

/**
 * A kind of transaction.
 * @typedef {'TRADE_DECLINE' |
 *   'TRADE_PROPOSAL' |
 *   'TRADE_ACCEPT' |
 *   'TRADE_UPHOLD' |
 *   'TRADE_VETO' |
 *   'WAIVER_ERROR' |
 *   'TRADE_ERROR' |
 *   'WAIVER' |
 *   'ROSTER' |
 *   'FUTURE_ROSTER' |
 *   'RETRO_ROSTER' |
 *   'FREEAGENT' |
 *   'DRAFT' |
 *   (string & {})} TransactionType
 */

/**
 * Which side won a matchup.
 * @typedef {'HOME' |
 *   'AWAY' |
 *   'TIE' |
 *   'UNDECIDED' |
 *   (string & {})} WinningTeam
 */

/**
 * Runtime values for {@link WinningTeam}, so a consumer can compare against a constant rather than
 * repeating a string literal.
 * @type {Readonly<Record<'HOME'|'AWAY'|'TIE'|'UNDECIDED', WinningTeam>>}
 */
const WINNING_TEAM = Object.freeze({
  HOME: 'HOME',
  AWAY: 'AWAY',
  TIE: 'TIE',
  UNDECIDED: 'UNDECIDED'
});

/**
 * Runtime values for {@link MatchupResult}.
 * @type {Readonly<Record<'WIN'|'LOSS'|'TIE'|'NONE', MatchupResult>>}
 */
const MATCHUP_RESULT = Object.freeze({
  WIN: 'WIN',
  LOSS: 'LOSS',
  TIE: 'TIE',
  NONE: 'NONE'
});

/**
 * Runtime values for {@link PlayerAvailabilityStatus}.
 * @type {Readonly<Record<'FREEAGENT'|'ONTEAM'|'WAIVERS', PlayerAvailabilityStatus>>}
 */
const PLAYER_AVAILABILITY_STATUS = Object.freeze({
  FREEAGENT: 'FREEAGENT',
  ONTEAM: 'ONTEAM',
  WAIVERS: 'WAIVERS'
});

/**
 * Runtime values for {@link InjuryStatus}. Only the statuses a fantasy manager acts on are given
 * constants; the type accepts the rest, and any ESPN adds.
 * @type {Readonly<Record<string, InjuryStatus>>}
 */
const INJURY_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  DAY_TO_DAY: 'DAY_TO_DAY',
  DOUBTFUL: 'DOUBTFUL',
  INJURY_RESERVE: 'INJURY_RESERVE',
  OUT: 'OUT',
  QUESTIONABLE: 'QUESTIONABLE',
  SUSPENSION: 'SUSPENSION'
});


/***/ },

/***/ "./src/draft-player/draft-player.js"
/*!******************************************!*\
  !*** ./src/draft-player/draft-player.js ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _player_player__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../player/player */ "./src/player/player.js");
/* harmony import */ var _player_stats_player_stats__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../player-stats/player-stats */ "./src/player-stats/player-stats.js");



/**
 * @typedef {import('../player-stats/player-stats').default} PlayerStats
 */

/**
 * Represents a player in a draft.
 *
 * @augments {Player}
 */
class DraftPlayer extends _player_player__WEBPACK_IMPORTED_MODULE_0__["default"] {
  static displayName = 'DraftPlayer';

  /**
   * @typedef {object} DraftPlayerMap
   *
   * The attributes DraftPlayer adds. Everything on Player is inherited through the class hierarchy
   * rather than restated here.
   *
   * @property {number} id The id of the player in the ESPN universe.
   * @property {number} teamId The teamId of the fantasy team that drafted the player. Use
   *   `Client#getTeamAtWeek` to access fantasy team data.
   *
   * @property {number} overallPickNumber The overall pick number
   * @property {number} roundNumber The round in which the pick occurred
   * @property {number} roundPickNumber The pick number inside the round
   *
   * @property {boolean} isKeeper FOR KEEPER DRAFTS ONLY: Whether or not the "drafted" player is a
   *   keeper pick
   *
   * @property {number} bidAmount FOR AUCTION DRAFTS ONLY: How much the winning bid was
   * @property {number} nominatingTeamId FOR AUCTION DRAFTS ONLY: The teamId of the fantasy team
   *   that nominatied the player. Use `Client#getTeamAtWeek` to access fantasy team data.
   *
   * @property {number} positionalRanking ESPN's ranking of the player within their position.
   * @property {number} overallRanking ESPN's overall ranking of the player.
   * @property {number} pointsScoredThisSeason The total points the player scored across the season.
   *
   * @property {PlayerStats} rawStatsForYear The PlayerStats model with the raw statistics
   *                                         registered by the player over the season.
   * @property {PlayerStats} projectedRawStatsForYear The PlayerStats model with the raw statistics
   *                                                  ESPN projected for the player over the season.
   */

  /**
   * @type {DraftPlayerMap}
   */
  static responseMap = {
    ..._player_player__WEBPACK_IMPORTED_MODULE_0__["default"].responseMap,

    id: 'playerId',
    teamId: 'teamId',

    overallPickNumber: 'overallPickNumber',
    roundNumber: 'roundId',
    roundPickNumber: 'roundPickNumber',

    isKeeper: 'keeper',

    bidAmount: 'bidAmount',
    nominatingTeamId: 'nominatingTeamId',

    positionalRanking: {
      key: 'ratings',
      manualParse: (responseData) => Object.values(responseData)[0]?.positionalRanking
    },
    overallRanking: {
      key: 'ratings',
      manualParse: (responseData) => Object.values(responseData)[0]?.totalRanking
    },

    rawStatsForYear: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => (0,_player_stats_player_stats__WEBPACK_IMPORTED_MODULE_1__.parsePlayerStats)({
        responseData,
        constructorParams,
        usesPoints: false,
        seasonId: constructorParams.seasonId,
        statKey: 'stats',
        statSourceId: 0,
        statSplitTypeId: 0
      })
    },
    projectedRawStatsForYear: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => (0,_player_stats_player_stats__WEBPACK_IMPORTED_MODULE_1__.parsePlayerStats)({
        responseData,
        constructorParams,
        usesPoints: false,
        seasonId: constructorParams.seasonId,
        statKey: 'stats',
        statSourceId: 1,
        statSplitTypeId: 0
      })
    },

    pointsScoredThisSeason: {
      key: 'ratings',
      manualParse: (responseData) => Object.values(responseData)[0]?.totalRating
    }
  };
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (DraftPlayer);


/***/ },

/***/ "./src/free-agent-player/free-agent-player.js"
/*!****************************************************!*\
  !*** ./src/free-agent-player/free-agent-player.js ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _player_player__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../player/player */ "./src/player/player.js");
/* harmony import */ var _player_stats_player_stats__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../player-stats/player-stats */ "./src/player-stats/player-stats.js");




/**
 * @typedef {import('../player-stats/player-stats').default} PlayerStats
 */

/**
 * Represents a player and their raw stats.
 *
 * @augments {Player}
 */
class FreeAgentPlayer extends _player_player__WEBPACK_IMPORTED_MODULE_0__["default"] {
  static displayName = 'FreeAgentPlayer';

  /**
   * @typedef {object} FreeAgentPlayerMap
   *
   * The attributes FreeAgentPlayer adds. Everything on Player is inherited through the class
   * hierarchy rather than restated here.
   *
   * @property {PlayerStats} rawStatsForYear The PlayerStats model with the raw statistics
   *                                         registered by the player over the season.
   * @property {PlayerStats} projectedRawStatsForYear The PlayerStats model with the raw statistics
   *                                                  ESPN projected for the player over the season.
   * @property {PlayerStats} rawStatsForScoringPeriod The PlayerStats model with the raw statistics
   *                                                  registered by the player in the scoring
   *                                                  period.
   * @property {PlayerStats} projectedRawStatsForScoringPeriod The PlayerStats model with the raw
   *                                                           statistics ESPN projected for the
   *                                                           player in the scoring period.
   */

  /**
   * @type {FreeAgentPlayerMap}
   */
  static responseMap = {
    ..._player_player__WEBPACK_IMPORTED_MODULE_0__["default"].responseMap,

    rawStatsForYear: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => (0,_player_stats_player_stats__WEBPACK_IMPORTED_MODULE_1__.parsePlayerStats)({
        responseData,
        constructorParams,
        usesPoints: false,
        seasonId: constructorParams.seasonId,
        statKey: 'stats',
        statSourceId: 0,
        statSplitTypeId: 0
      })
    },
    projectedRawStatsForYear: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => (0,_player_stats_player_stats__WEBPACK_IMPORTED_MODULE_1__.parsePlayerStats)({
        responseData,
        constructorParams,
        usesPoints: false,
        seasonId: constructorParams.seasonId,
        statKey: 'stats',
        statSourceId: 1,
        statSplitTypeId: 0
      })
    },

    rawStatsForScoringPeriod: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => (0,_player_stats_player_stats__WEBPACK_IMPORTED_MODULE_1__.parsePlayerStats)({
        responseData,
        constructorParams,
        usesPoints: false,
        seasonId: constructorParams.seasonId,
        scoringPeriodId: constructorParams.scoringPeriodId,
        statKey: 'stats',
        statSourceId: 0,
        statSplitTypeId: 1
      })
    },
    projectedRawStatsForScoringPeriod: {
      key: 'stats',
      manualParse: (responseData, data, rawData, constructorParams) => (0,_player_stats_player_stats__WEBPACK_IMPORTED_MODULE_1__.parsePlayerStats)({
        responseData,
        constructorParams,
        usesPoints: false,
        seasonId: constructorParams.seasonId,
        scoringPeriodId: constructorParams.scoringPeriodId,
        statKey: 'stats',
        statSourceId: 1,
        statSplitTypeId: 1
      })
    }
  };
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (FreeAgentPlayer);


/***/ },

/***/ "./src/internal/collections.js"
/*!*************************************!*\
  !*** ./src/internal/collections.js ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   each: () => (/* binding */ each),
/* harmony export */   entriesOf: () => (/* binding */ entriesOf),
/* harmony export */   filter: () => (/* binding */ filter),
/* harmony export */   find: () => (/* binding */ find),
/* harmony export */   isEmpty: () => (/* binding */ isEmpty),
/* harmony export */   isPlainObject: () => (/* binding */ isPlainObject),
/* harmony export */   map: () => (/* binding */ map),
/* harmony export */   mapKeys: () => (/* binding */ mapKeys),
/* harmony export */   uniq: () => (/* binding */ uniq)
/* harmony export */ });
/**
 * The handful of lodash behaviors this project actually depended on, written out.
 *
 * lodash was the only runtime dependency, and 210 of the bundle's 226 modules. Most of its uses
 * here were a native method spelled differently. A few were not, and those are the reason this file
 * exists rather than a sweep of inline replacements:
 *
 *   - lodash's collection functions accept `undefined` and return an empty result. ESPN omits keys
 *     constantly -- no `members` for a league whose managers have all left, no `schedule` before
 *     the season is generated, no roster for a week that has not been scored -- and several call
 *     sites lean on that, with comments saying so. `[].map` on `undefined` throws.
 *   - lodash's `merge` is deep. `_buildRequestConfig` uses it to add a `Cookie` header to a config
 *     that may already carry `x-fantasy-filter`; a shallow spread replaces the header object and
 *     drops the filter, breaking private-league requests only.
 *   - lodash's `trim` accepts `undefined`. `String#trim` does not.
 *
 * Each of those is tested here for its absent-input case specifically, so the behavior is a
 * stated contract rather than an accident of the implementation.
 */

/**
 * Whether a value is a plain object -- an object literal or `Object.create(null)`, not an array,
 * a Date, or a class instance.
 *
 * @param   {*} value The value to test.
 * @returns {boolean} Whether it is a plain object.
 */
const isPlainObject = (value) => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/**
 * Whether a collection has nothing in it. `undefined`, `null`, `[]` and `{}` are all empty.
 *
 * @param   {*} value The value to test.
 * @returns {boolean} Whether it holds nothing.
 */
const isEmpty = (value) => {
  if (value === undefined || value === null) {
    return true;
  }

  if (Array.isArray(value) || typeof value === 'string') {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return true;
};

/**
 * The entries of an array or object, as `[key, value]` pairs. `undefined` yields none.
 *
 * @param   {Array|object} [collection] The collection to walk.
 * @returns {Array<[string|number, *]>} Its entries.
 */
const entriesOf = (collection) => {
  if (collection === undefined || collection === null) {
    return [];
  }

  return Array.isArray(collection) ?
      collection.map((value, index) => [index, value]) :
      Object.entries(collection);
};

/**
 * Calls `iteratee(value, key)` for each entry. Tolerates an absent collection.
 *
 * @param {Array|object} [collection] The collection to walk.
 * @param {Function} iteratee Called with `(value, key)`.
 */
const each = (collection, iteratee) => {
  entriesOf(collection).forEach(([key, value]) => iteratee(value, key));
};

/**
 * Maps over an array or an object's values. An absent collection maps to `[]`.
 *
 * The empty-array result is load-bearing: `Boxscore`'s rosters are parsed with `parseAbsent`
 * precisely so an unplayed week yields `[]` rather than an unset attribute.
 *
 * @param   {Array|object} [collection] The collection to map.
 * @param   {Function} iteratee Called with `(value, key)`.
 * @returns {Array} The mapped values.
 */
const map = (collection, iteratee) => entriesOf(collection).map(([key, value]) => (
  iteratee(value, key)
));

/**
 * Filters an array or an object's values. An absent collection filters to `[]`.
 *
 * @param   {Array|object} [collection] The collection to filter.
 * @param   {Function|object} predicate A function, or an object of properties to match.
 * @returns {Array} The matching values.
 */
const filter = (collection, predicate) => (
  map(collection, (value) => value).filter(toPredicate(predicate))
);

/**
 * Finds the first matching value, or `undefined`. An absent collection finds nothing rather than
 * throwing -- a response with no `members` key, or a team whose `primaryOwner` has left the league,
 * would otherwise take the whole call down.
 *
 * @param   {Array|object} [collection] The collection to search.
 * @param   {Function|object} predicate A function, or an object of properties to match.
 * @returns {*} The first match, or `undefined`.
 */
const find = (collection, predicate) => (
  map(collection, (value) => value).find(toPredicate(predicate))
);

/**
 * Turns a matches-shorthand into a predicate function: `{a: 1}` becomes a test for `a === 1`.
 *
 * `filter(schedule, { matchupPeriodId })` reads better than the closure it stands in for, and this
 * is the only shorthand the project uses.
 *
 * @param   {Function|object} predicate A function, or an object of properties to match.
 * @returns {Function} A predicate function.
 */
function toPredicate(predicate) {
  if (typeof predicate === 'function') {
    return predicate;
  }

  const pairs = Object.entries(predicate);
  return (candidate) => pairs.every(([key, value]) => candidate?.[key] === value);
}

/**
 * Rekeys an object, leaving the values alone.
 *
 * @param   {object} [object] The object to rekey.
 * @param   {Function} iteratee Called with `(value, key)`, returning the new key.
 * @returns {object} The rekeyed object.
 */
const mapKeys = (object, iteratee) => Object.fromEntries(
  entriesOf(object).map(([key, value]) => [iteratee(value, key), value])
);

/**
 * The unique values of an array, in first-seen order.
 *
 * @param   {Array} [array] The array to dedupe.
 * @returns {Array} Its unique values.
 */
const uniq = (array) => [...new Set(array ?? [])];




/***/ },

/***/ "./src/internal/objects.js"
/*!*********************************!*\
  !*** ./src/internal/objects.js ***!
  \*********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getPath: () => (/* binding */ getPath),
/* harmony export */   mergeConfig: () => (/* binding */ mergeConfig),
/* harmony export */   setPath: () => (/* binding */ setPath)
/* harmony export */ });
/**
 * Path access and merging, the two lodash behaviors with no direct native equivalent.
 *
 * See `./collections.js` for why this project writes these out rather than depending on lodash.
 */

/**
 * Splits a dotted path into its segments. A path that is already an array passes through.
 *
 * @param   {string|Array<string|number>} path The path.
 * @returns {Array<string|number>} Its segments.
 */
const segmentsOf = (path) => (Array.isArray(path) ? path : String(path).split('.'));

/**
 * Reads a value at a dotted path, returning `defaultValue` when any segment is missing.
 *
 * Only `undefined` falls back to the default, matching lodash. A stored `null` is a value, and
 * ESPN sends plenty of them.
 *
 * @param   {object} [object] The object to read from.
 * @param   {string|number|Array} path The path to read.
 * @param   {*} [defaultValue] Returned when the path resolves to `undefined`.
 * @returns {*} The value at the path, or `defaultValue`.
 */
const getPath = (object, path, defaultValue) => {
  let current = object;

  for (const segment of segmentsOf(path)) {
    if (current === undefined || current === null) {
      return defaultValue;
    }
    current = current[segment];
  }

  return current === undefined ? defaultValue : current;
};

/**
 * Writes a value at a dotted path, creating intermediate objects as needed.
 *
 * @param {object} object The object to write into. Mutated.
 * @param {string|number|Array} path The path to write.
 * @param {*} value The value to write.
 */
const setPath = (object, path, value) => {
  const segments = segmentsOf(path);
  let current = object;

  segments.slice(0, -1).forEach((segment) => {
    if (typeof current[segment] !== 'object' || current[segment] === null) {
      current[segment] = {};
    }
    current = current[segment];
  });

  current[segments[segments.length - 1]] = value;
};

/**
 * Merges request configs, combining their `headers` rather than replacing them.
 *
 * This is the one merge in the project that has to be deep, and the reason is narrow enough to
 * name: `Client#_buildRequestConfig` adds a `Cookie` header to a config that may already carry
 * `x-fantasy-filter`. A shallow spread replaces the whole headers object, silently dropping the
 * filter -- and only on private-league requests, since that is the only time a Cookie is added.
 *
 * Neither input is mutated.
 *
 * @param   {object} [base] The caller's config.
 * @param   {object} [addition] The config to layer over it.
 * @returns {object} A new config.
 */
const mergeConfig = (base, addition) => ({
  ...base,
  ...addition,
  ...((base?.headers || addition?.headers) ?
      { headers: { ...base?.headers, ...addition?.headers } } :
      {})
});




/***/ },

/***/ "./src/internal/values.js"
/*!********************************!*\
  !*** ./src/internal/values.js ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   roundTo: () => (/* binding */ roundTo),
/* harmony export */   toSafeInt: () => (/* binding */ toSafeInt),
/* harmony export */   trimOrEmpty: () => (/* binding */ trimOrEmpty)
/* harmony export */ });
/**
 * Scalar coercions, matching the lodash behaviors this project relied on.
 *
 * See `./collections.js` for why this project writes these out rather than depending on lodash.
 */

/**
 * Rounds to a number of decimal places.
 *
 * Shifts by exponent rather than multiplying, which is what keeps `roundTo(1.005, 2)` at `1.01`
 * instead of the `1` that `Math.round(1.005 * 100) / 100` produces -- 1.005 is not exactly
 * representable, and multiplying commits to the error before rounding.
 *
 * @param   {number} value The number to round.
 * @param   {number} [precision] Decimal places.
 * @returns {number} The rounded number.
 */
const roundTo = (value, precision = 0) => {
  const shifted = Number(`${value}e${precision}`);
  return Number.isNaN(shifted) ? Number(value) : Number(`${Math.round(shifted)}e${-precision}`);
};

/**
 * Converts to an integer, clamped to the safe integer range, with anything unconvertible becoming
 * `0`. ESPN sends scores and ids as strings, and sends `''` for a game that has not been played.
 *
 * @param   {*} value The value to convert.
 * @returns {number} The integer.
 */
const toSafeInt = (value) => {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return 0;
  }

  return Math.min(Math.max(Math.trunc(number), -Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
};

/**
 * Trims a string, treating an absent one as empty. `String#trim` throws on `undefined`, and a
 * league member ESPN sends with no `firstName` is exactly that case.
 *
 * @param   {string} [value] The string to trim.
 * @returns {string} The trimmed string, or `''`.
 */
const trimOrEmpty = (value) => (value === undefined || value === null ? '' : String(value).trim());




/***/ },

/***/ "./src/league/league.js"
/*!******************************!*\
  !*** ./src/league/league.js ***!
  \******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _internal_collections_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../internal/collections.js */ "./src/internal/collections.js");
/* harmony import */ var _internal_objects_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../internal/objects.js */ "./src/internal/objects.js");
/* harmony import */ var _internal_values_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../internal/values.js */ "./src/internal/values.js");
/* harmony import */ var _base_classes_base_object_base_object__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../base-classes/base-object/base-object */ "./src/base-classes/base-object/base-object.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils */ "./src/utils.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../constants */ "./src/constants.js");










/**
 * Represents basic information about an ESPN fantasy football league.
 *
 * @augments {BaseObject}
 */
class League extends _base_classes_base_object_base_object__WEBPACK_IMPORTED_MODULE_3__["default"] {
  static displayName = 'League';

  /**
   * @typedef {object} DraftSettings
   *
   * @property {Date} date The date of the draft.
   * @property {import('../constants').DraftType} type The type of draft.
   * @property {number} timePerPick The amount of time to make a selection.
   * @property {boolean} canTradeDraftPicks Whether or not draft picks can be traded.
   * @property {number} auctionBudget The budget each team bids with in an auction draft.
   * @property {number} keeperCount The number of players each team may keep.
   * @property {import('../constants').KeeperOrderType} orderType How the order was determined.
   * @property {number[]} pickOrder The team ids in draft order.
   */

  /**
   * @typedef {object} RosterSettings
   *
   * @property {object} lineupPositionCount How many slots of each position are in a starting
   *                                        lineup. Key is position; value is count.
   * @property {object} positionLimits The maximum number of players that may be rostered of each
   *                                   position. Key is position; value is count.
   * @property {import('../constants').LineupLockTime} locktime When the lineup locks.
   */

  /**
   * @typedef {object} ScheduleSettings
   *
   * @property {number} numberOfRegularSeasonMatchups The number of regular season matchups a team
   *                                                  will have on the schedule.
   * @property {number} regularSeasonMatchupLength How many weeks each regular season matchup lasts.
   * @property {number} numberOfPlayoffMatchups The number of playoff matchups a team will have
   *                                            on the schedule.
   * @property {number} playoffMatchupLength How many weeks each playoff matchup lasts.
   * @property {number} numberOfPlayoffTeams The number of playoff teams there will be.
   * @property {object[]} divisions The league's divisions. Each has an `id`, `name` and `size`.
   * @property {import('../constants').PlayoffSeedingRule} playoffSeedingRule The tiebreak used
   *   to seed the playoffs.
   * @property {boolean} playoffReseed Whether the bracket reseeds between playoff rounds.
   */

  /**
   * @typedef {object} AcquisitionSettings
   *
   * @property {number} budget The FAAB each team starts the season with. Pair with
   *                           `Team#acquisitionBudgetSpent` for a team's remaining budget.
   * @property {boolean} isUsingBudget Whether the league bids FAAB rather than running a waiver
   *                                  order.
   * @property {import('../constants').AcquisitionType} type How players are acquired.
   * @property {number} limit The season-long acquisition cap, or -1 when unlimited.
   * @property {number} minimumBid The smallest FAAB bid the league accepts.
   * @property {number} waiverHours How long a dropped player sits on waivers.
   * @property {string[]} waiverProcessDays The days waivers are processed on.
   * @property {number} waiverProcessHour The hour of the day waivers are processed.
   * @property {boolean} waiverOrderReset Whether the waiver order resets after a claim.
   */

  /**
   * @typedef {object} TradeSettings
   *
   * @property {Date} deadlineDate The date after which trades may no longer be proposed.
   * @property {number} max The maximum number of trades a team may make, or -1 when unlimited.
   * @property {number} vetoVotesRequired How many votes are needed to veto a trade.
   * @property {number} revisionHours How long a trade sits pending before it processes.
   */

  /**
   * @typedef {object} FinanceSettings
   *
   * @property {number} entryFee The cost to join the league.
   * @property {number} miscFee A miscellaneous fee applied to each team.
   * @property {number} perLoss The fee charged for each loss.
   * @property {number} perTrade The fee charged for each trade.
   * @property {number} playerAcquisition The fee charged for each acquisition.
   * @property {number} playerDrop The fee charged for each drop.
   * @property {number} playerMoveToActive The fee charged to activate a player.
   * @property {number} playerMoveToIR The fee charged to move a player to injured reserve.
   */

  /**
   * @typedef {object} ScoringSettings
   *
   * A league's scoring rules, in the two parts ESPN actually sends them in.
   *
   * Keys are the readable scoring item names from `constants.js`. A stat id the project has no
   * name for appears as `statId<N>` rather than being dropped -- the name map is incomplete and
   * ESPN keeps adding ids, so an unreadable rule beats a missing one.
   *
   * @property {Record<string, number>} base What each stat is worth for every position.
   * @property {Record<string, Record<string, number>>} overrides What a stat is worth for one
   *   position specifically, keyed by position and then by scoring item. A position appears here
   *   only for the stats it overrides; everything else for that position comes from `base`. In
   *   practice ESPN uses this for D/ST. An unrecognized position id appears as `positionId<N>`.
   */

  /**
   * @typedef {object} LeagueMap
   *
   * @property {string} name The name of the league.
   * @property {number} size The number of teams in the league.
   * @property {boolean} isPublic Whether or not the league is publically visible and accessible.
   *
   * @property {number} currentMatchupPeriodId The current matchup period id (see README.md for
   *   matchupPeriod v. scoringPeriod)
   * @property {number} currentScoringPeriodId The current scoring period id (see README.md for
   *   matchupPeriod v. scoringPeriod)
   * @property {number} firstScoringPeriodId The first scoring period of the season.
   * @property {number} finalScoringPeriodId The last scoring period of the season.
   * @property {number[]} previousSeasons The seasons this league has history for.
   * @property {boolean} isActive Whether the league is currently active.
   * @property {boolean} isFull Whether every team slot has been claimed.
   * @property {number} teamsJoined The number of teams that have joined.
   * @property {string} scoringType How matchups are scored, e.g. `H2H_POINTS`. Left as `string`:
   *   the full set of ESPN scoring types is not verified here.
   * @property {import('../constants').MatchupTiebreaker} matchupTieRule The tiebreak applied to
   *   a tied regular season matchup.
   * @property {import('../constants').MatchupTiebreaker} playoffMatchupTieRule The tiebreak
   *   applied to a tied playoff matchup.
   *
   * @property {DraftSettings} draftSettings The draft settings of the league.
   * @property {RosterSettings} rosterSettings The roster settings of the league.
   * @property {ScheduleSettings} scheduleSettings The schedule settings of the league.
   * @property {AcquisitionSettings} acquisitionSettings The waiver and FAAB settings of the league.
   * @property {TradeSettings} tradeSettings The trade settings of the league.
   * @property {FinanceSettings} financeSettings The dues and fees of the league.
   * @property {ScoringSettings} scoringSettings The scoring settings of the league.
   */

  /**
   * @type {LeagueMap}
   */
  static responseMap = {
    name: 'name',
    size: 'size',
    isPublic: 'isPublic',

    // `Client#getLeagueInfo` hands the whole `status` object through, so everything derived from it
    // is mapped here rather than reshaped in the client.
    currentMatchupPeriodId: 'status.currentMatchupPeriod',
    currentScoringPeriodId: 'status.latestScoringPeriod',
    firstScoringPeriodId: 'status.firstScoringPeriod',
    finalScoringPeriodId: 'status.finalScoringPeriod',
    previousSeasons: 'status.previousSeasons',
    isActive: 'status.isActive',
    isFull: 'status.isFull',
    teamsJoined: 'status.teamsJoined',

    scoringType: 'scoringSettings.scoringType',
    matchupTieRule: 'scoringSettings.matchupTieRule',
    playoffMatchupTieRule: 'scoringSettings.playoffMatchupTieRule',

    draftSettings: {
      key: 'draftSettings',
      manualParse: (responseData) => ({
        date: (0,_utils__WEBPACK_IMPORTED_MODULE_4__.toDate)(responseData.date),
        type: responseData.type,
        timePerPick: responseData.timePerSelection,
        canTradeDraftPicks: responseData.isTradingEnabled,
        auctionBudget: responseData.auctionBudget,
        keeperCount: responseData.keeperCount,
        orderType: responseData.orderType,
        pickOrder: responseData.pickOrder
      })
    },

    rosterSettings: {
      key: 'rosterSettings',
      manualParse: (responseData) => ({
        lineupPositionCount: (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.mapKeys)(
          responseData.lineupSlotCounts,
          (count, position) => (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(_constants__WEBPACK_IMPORTED_MODULE_5__.slotCategoryIdToPositionMap, position)
        ),
        positionLimits: (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.mapKeys)(
          responseData.positionLimits,
          (count, position) => (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(_constants__WEBPACK_IMPORTED_MODULE_5__.slotCategoryIdToPositionMap, position)
        ),
        locktime: responseData.rosterLocktimeType
      })
    },

    scheduleSettings: {
      key: 'scheduleSettings',
      manualParse: (responseData, data) => {
        // The season length comes from `status.finalScoringPeriod` rather than a literal 17. The
        // two agree on a standard league, but hardcoding the NFL's current season length is how
        // this silently goes wrong the year the league adds a week.
        const finalScoringPeriod = (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(data, 'status.finalScoringPeriod', 17);
        const regularSeasonPeriods =
          responseData.matchupPeriodCount * responseData.matchupPeriodLength;
        const numberOfPlayoffMatchups = (0,_internal_values_js__WEBPACK_IMPORTED_MODULE_2__.toSafeInt)(
          (finalScoringPeriod - regularSeasonPeriods) / responseData.playoffMatchupPeriodLength
        );

        return {
          numberOfRegularSeasonMatchups: responseData.matchupPeriodCount,
          regularSeasonMatchupLength: responseData.matchupPeriodLength,
          numberOfPlayoffMatchups,
          playoffMatchupLength: responseData.playoffMatchupPeriodLength,
          numberOfPlayoffTeams: responseData.playoffTeamCount,
          divisions: responseData.divisions,
          playoffSeedingRule: responseData.playoffSeedingRule,
          playoffReseed: responseData.playoffReseed
        };
      }
    },

    acquisitionSettings: {
      key: 'acquisitionSettings',
      manualParse: (responseData) => ({
        budget: responseData.acquisitionBudget,
        isUsingBudget: responseData.isUsingAcquisitionBudget,
        type: responseData.acquisitionType,
        limit: responseData.acquisitionLimit,
        minimumBid: responseData.minimumBid,
        waiverHours: responseData.waiverHours,
        waiverProcessDays: responseData.waiverProcessDays,
        waiverProcessHour: responseData.waiverProcessHour,
        waiverOrderReset: responseData.waiverOrderReset
      })
    },

    tradeSettings: {
      key: 'tradeSettings',
      manualParse: (responseData) => ({
        deadlineDate: (0,_utils__WEBPACK_IMPORTED_MODULE_4__.toDate)(responseData.deadlineDate),
        max: responseData.max,
        vetoVotesRequired: responseData.vetoVotesRequired,
        revisionHours: responseData.revisionHours
      })
    },

    financeSettings: {
      key: 'financeSettings',
      manualParse: (responseData) => ({
        entryFee: responseData.entryFee,
        miscFee: responseData.miscFee,
        perLoss: responseData.perLoss,
        perTrade: responseData.perTrade,
        playerAcquisition: responseData.playerAcquisition,
        playerDrop: responseData.playerDrop,
        playerMoveToActive: responseData.playerMoveToActive,
        playerMoveToIR: responseData.playerMoveToIR
      })
    },

    scoringSettings: {
      key: 'scoringSettings',
      manualParse: (responseData) => (responseData.scoringItems ?? []).reduce(
        ({ base, overrides }, { points, pointsOverrides, statId }) => {
          // An unrecognized stat id becomes `statId<N>` rather than being dropped. The previous
          // `if (!key) return acc` discarded them silently: measured against a real 14-team
          // league, that lost 4 of its 45 scoring rules, one of them worth 6 points a go. The map
          // is incomplete and ESPN keeps adding ids, so degrading to a less readable key beats
          // losing the rule.
          const key = _constants__WEBPACK_IMPORTED_MODULE_5__.scoringIdToItem[statId] || `statId${statId}`;

          base[key] = points;

          // `pointsOverrides` is `{positionId: points}` -- what this stat is worth *for that
          // position only*, with `points` still applying to every other one. Collapsing it to a
          // single number, as this did with `first(values(pointsOverrides))`, threw away both
          // which position it applied to and the base value. A real league has items like
          // `points: 2, pointsOverrides: {16: 0}`: worth 2 to everyone except a D/ST, which the
          // old shape reported as a flat 0.
          //
          // NOTE: these keys are in the `defaultPositionId` enum, not `lineupSlotId`. See the note
          // on `defaultPositionIdToPosition`.
          (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.each)(pointsOverrides, (overridePoints, positionId) => {
            const position = (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(_constants__WEBPACK_IMPORTED_MODULE_5__.defaultPositionIdToPosition, positionId) ||
              `positionId${positionId}`;

            if (!overrides[position]) {
              overrides[position] = {};
            }
            overrides[position][key] = overridePoints;
          });

          return { base, overrides };
        },
        { base: {}, overrides: {} }
      )
    }
  };
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (League);


/***/ },

/***/ "./src/matchup/matchup.js"
/*!********************************!*\
  !*** ./src/matchup/matchup.js ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _internal_objects_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../internal/objects.js */ "./src/internal/objects.js");
/* harmony import */ var _base_classes_base_object_base_object__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../base-classes/base-object/base-object */ "./src/base-classes/base-object/base-object.js");




/**
 * Represents a single matchup on a league's season schedule.
 *
 * This is the base of the pair `Boxscore` completes: both are built from the same `schedule` entry,
 * and Boxscore is a Matchup plus the two lineups. A Matchup answers "who plays whom, all season" --
 * including weeks that have not been played, where ESPN sends no rosters, no projections and no win
 * probabilities at all -- so everything here tolerates their absence, and the roster-bearing half
 * lives on the subclass that only ever sees a scored week.
 *
 * @augments {BaseObject}
 */
class Matchup extends _base_classes_base_object_base_object__WEBPACK_IMPORTED_MODULE_1__["default"] {
  static displayName = 'Matchup';

  /**
   * @typedef {object} MatchupMap
   *
   * @property {number} id The matchup's id on the schedule.
   * @property {number} matchupPeriodId The matchup period the matchup is played in.
   * @property {import('../constants').WinningTeam} winner Which side won. `UNDECIDED` while the
   *                           matchup is unplayed or in progress.
   * @property {string} playoffTierType Which bracket the matchup belongs to. `NONE` for a regular
   *                                    season game, otherwise a playoff or consolation tier.
   *   NOTE: left as `string` rather than a union. This project has not observed the full set of
   *   tier names ESPN uses, and inventing one would be the same mistake as the position enums.
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
        (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_0__.getPath)(responseData, 'totalPointsLive') || (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_0__.getPath)(responseData, 'totalPoints')
      )
    },
    homeWinProbability: 'home.winProbability',

    awayTeamId: 'away.teamId',
    awayScore: {
      key: 'away',
      manualParse: (responseData) => (
        (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_0__.getPath)(responseData, 'totalPointsLive') || (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_0__.getPath)(responseData, 'totalPoints')
      )
    },
    awayWinProbability: 'away.winProbability'
  };
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Matchup);


/***/ },

/***/ "./src/nfl-game/nfl-game.js"
/*!**********************************!*\
  !*** ./src/nfl-game/nfl-game.js ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _internal_collections_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../internal/collections.js */ "./src/internal/collections.js");
/* harmony import */ var _internal_objects_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../internal/objects.js */ "./src/internal/objects.js");
/* harmony import */ var _internal_values_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../internal/values.js */ "./src/internal/values.js");
/* harmony import */ var _base_classes_base_object_base_object__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../base-classes/base-object/base-object */ "./src/base-classes/base-object/base-object.js");
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../constants.js */ "./src/constants.js");








/**
 * Represents an NFL game between two NFL teams.
 *
 * @augments {BaseObject}
 */
class NFLGame extends _base_classes_base_object_base_object__WEBPACK_IMPORTED_MODULE_3__["default"] {
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
      manualParse: (responseData) => (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(this.GAME_STATUSES, responseData)
    },
    homeTeam: {
      key: 'competitors',
      manualParse: (responseData) => this._buildTeamAttribute(
        (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.find)(responseData, { homeAway: 'home' })
      )
    },
    awayTeam: {
      key: 'competitors',
      manualParse: (responseData) => this._buildTeamAttribute(
        (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.find)(responseData, { homeAway: 'away' })
      )
    }
  };

  static _buildTeamAttribute(teamResponseData) {
    return {
      id: (0,_internal_values_js__WEBPACK_IMPORTED_MODULE_2__.toSafeInt)(teamResponseData.id),
      team: (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(_constants_js__WEBPACK_IMPORTED_MODULE_4__.nflTeamIdToNFLTeam, teamResponseData.id),
      teamAbbrev: (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(_constants_js__WEBPACK_IMPORTED_MODULE_4__.nflTeamIdToNFLTeamAbbreviation, teamResponseData.id),
      record: teamResponseData.record,
      score: (0,_internal_values_js__WEBPACK_IMPORTED_MODULE_2__.toSafeInt)(teamResponseData.score)
    };
  }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (NFLGame);


/***/ },

/***/ "./src/player-stats/player-stats.js"
/*!******************************************!*\
  !*** ./src/player-stats/player-stats.js ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   parsePlayerStats: () => (/* binding */ parsePlayerStats)
/* harmony export */ });
/* harmony import */ var _internal_collections_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../internal/collections.js */ "./src/internal/collections.js");
/* harmony import */ var _internal_objects_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../internal/objects.js */ "./src/internal/objects.js");
/* harmony import */ var _base_classes_base_object_base_object__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../base-classes/base-object/base-object */ "./src/base-classes/base-object/base-object.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../constants */ "./src/constants.js");






/**
 * Represents statistical values for a player's fantasy performance. The values may be real
 * statistical values (yards, attempts, etc) or fantasy point values.
 *
 * The stat map is not comprehensive, but should cover normal standard and PPR scoring rules. The
 * largest missing piece is IDP scoring.
 *
 * @augments {BaseObject}
 */
class PlayerStats extends _base_classes_base_object_base_object__WEBPACK_IMPORTED_MODULE_2__["default"] {
  constructor(options = {}) {
    super(options);

    this.usesPoints = options.usesPoints;
  }

  static displayName = 'PlayerStats';

  /**
   * @typedef {Record<string, string>} ScoringItems
   *
   * Maps each readable scoring item name onto the ESPN stat id it is found at. Referenced by the
   * `@type` below, which previously named a type defined nowhere -- harmless while the jsdoc was
   * only read by humans, a dangling reference once declarations are generated from it.
   *
   * NOTE: this describes the *map*, not an instance. A populated PlayerStats holds numbers at these
   * keys, which is why its instance type is declared separately by scripts/build-types.mjs rather
   * than projected from this map like every other model's.
   */

  /**
   * @type {ScoringItems}
   */
  static responseMap = {
    ..._constants__WEBPACK_IMPORTED_MODULE_3__.scoringItemToId
  };
}

const parsePlayerStats = ({
  responseData,
  constructorParams,
  usesPoints,

  seasonId,
  scoringPeriodId,

  statKey,
  statSourceId,
  statSplitTypeId
}) => {
  const filters = { statSourceId, statSplitTypeId };

  if (seasonId) {
    filters.seasonId = seasonId;
  }

  if (scoringPeriodId) {
    filters.scoringPeriodId = scoringPeriodId;
  }

  const statData = (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.find)(responseData, filters);
  const params = { ...constructorParams, usesPoints };
  return PlayerStats.buildFromServer((0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(statData, statKey), params);
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (PlayerStats);


/***/ },

/***/ "./src/player/player.js"
/*!******************************!*\
  !*** ./src/player/player.js ***!
  \******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _internal_collections_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../internal/collections.js */ "./src/internal/collections.js");
/* harmony import */ var _internal_objects_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../internal/objects.js */ "./src/internal/objects.js");
/* harmony import */ var _base_classes_base_object_base_object_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../base-classes/base-object/base-object.js */ "./src/base-classes/base-object/base-object.js");
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../constants.js */ "./src/constants.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils */ "./src/utils.js");








/**
 * Represents an NFL player. This model is not directly associated with any fantasy team.
 *
 * @augments {BaseObject}
 */
class Player extends _base_classes_base_object_base_object_js__WEBPACK_IMPORTED_MODULE_2__["default"] {
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
   * @property {import('../constants').PlayerAvailabilityStatus} availabilityStatus The fantasy
   *                                                             roster status of the player.
   * @property {boolean} isDroppable Whether or not the player can be dropped from a team.
   * @property {boolean} isInjured Whether or not the player is injured.
   * @property {import('../constants').InjuryStatus} injuryStatus The player's injury timeline.
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
      manualParse: (responseData) => (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(_constants_js__WEBPACK_IMPORTED_MODULE_3__.nflTeamIdToNFLTeam, responseData)
    },
    proTeamAbbreviation: {
      key: 'proTeamId',
      manualParse: (responseData) => (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(_constants_js__WEBPACK_IMPORTED_MODULE_3__.nflTeamIdToNFLTeamAbbreviation, responseData)
    },
    defaultPosition: {
      key: 'defaultPositionId',
      // `defaultPositionId` and `eligibleSlots` below are two different ESPN enums that overlap on
      // RB and D/ST. Reading this one through the slot map reported Josh Allen as a TQB, Ja'Marr
      // Chase as an RB/WR, Trey McBride as a WR and every kicker as a WR/TE.
      manualParse: (responseData) => (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(_constants_js__WEBPACK_IMPORTED_MODULE_3__.defaultPositionIdToPosition, responseData)
    },
    eligiblePositions: {
      key: 'eligibleSlots',
      manualParse: (responseData) => (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)(responseData, (posId) => (
        (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.getPath)(_constants_js__WEBPACK_IMPORTED_MODULE_3__.slotCategoryIdToPositionMap, posId)
      ))
    },

    averageDraftPosition: 'averageDraftPosition',
    auctionValueAverage: 'auctionValueAverage',
    percentChange: 'percentChange',
    percentStarted: 'percentStarted',
    percentOwned: 'percentOwned',

    acquiredDate: {
      key: 'acquisitionDate',
      manualParse: _utils__WEBPACK_IMPORTED_MODULE_4__.toDate
    },

    availabilityStatus: 'status',
    isDroppable: 'droppable',
    isInjured: 'injured',
    injuryStatus: 'injuryStatus',

    outlooksByWeek: 'outlooksByWeek'
  };
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Player);


/***/ },

/***/ "./src/team/team.js"
/*!**************************!*\
  !*** ./src/team/team.js ***!
  \**************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _internal_collections_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../internal/collections.js */ "./src/internal/collections.js");
/* harmony import */ var _internal_values_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../internal/values.js */ "./src/internal/values.js");
/* harmony import */ var _base_classes_base_object_base_object_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../base-classes/base-object/base-object.js */ "./src/base-classes/base-object/base-object.js");
/* harmony import */ var _player_player__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../player/player */ "./src/player/player.js");







/**
 * Represents a fantasy football team in a league.
 *
 * @augments {BaseObject}
 */
class Team extends _base_classes_base_object_base_object_js__WEBPACK_IMPORTED_MODULE_2__["default"] {
  constructor(options = {}) {
    super(options);

    this.leagueId = options.leagueId;

    this.seasonId = options.seasonId;
  }

  static displayName = 'Team';

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
   * @property {import('../constants').MatchupResult} streakType Whether the team's current run of
   *                               results is a `WIN`, a `LOSS`, or `NONE` when none have been
   *                               played.
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
   *                                      division. `UNKNOWN` until ESPN can determine it. Left as
   *                                      `string`: the exact clinch strings are not verified here.
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
      // A departed manager has no `members` entry, and the base class leaves the attribute unset
      // when the key is absent. This handles the other case: a member ESPN sends with blank names,
      // which used to produce the string `' '`.
      manualParse: (responseData) => {
        const name = `${(0,_internal_values_js__WEBPACK_IMPORTED_MODULE_1__.trimOrEmpty)(responseData.firstName)} ${(0,_internal_values_js__WEBPACK_IMPORTED_MODULE_1__.trimOrEmpty)(responseData.lastName)}`.trim();
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
      manualParse: (responseData, data, rawData, constructorParams) => (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.map)(
        responseData,
        (playerData) => _player_player__WEBPACK_IMPORTED_MODULE_3__["default"].buildFromServer(playerData.playerPoolEntry, constructorParams)
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
      manualParse: (responseData) => (0,_internal_values_js__WEBPACK_IMPORTED_MODULE_1__.roundTo)(responseData * 100, 2)
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Team);


/***/ },

/***/ "./src/utils.js"
/*!**********************!*\
  !*** ./src/utils.js ***!
  \**********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   flattenObject: () => (/* binding */ flattenObject),
/* harmony export */   flattenObjectSansNumericKeys: () => (/* binding */ flattenObjectSansNumericKeys),
/* harmony export */   toDate: () => (/* binding */ toDate)
/* harmony export */ });
/* harmony import */ var _internal_collections_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./internal/collections.js */ "./src/internal/collections.js");
/* harmony import */ var _internal_objects_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./internal/objects.js */ "./src/internal/objects.js");



/**
 * Warns when flattening is about to overwrite a key with a different value.
 *
 * Development only. Two ESPN sub-objects colliding on a key is a data-shape surprise worth
 * knowing about, but not worth a runtime cost in a consumer's production build.
 *
 * @param {object} flatObject The object being built.
 * @param {string} key The key about to be written.
 * @param {*} value The value about to be written.
 */
// istanbul ignore next
const warnOnOverwrite = (flatObject, key, value) => {
  if ( true && flatObject[key] && value !== flatObject[key]) {
    console.warn(`espn-fantasy-football-api: Assigning non-empty key ${key}. Set value: ${flatObject[key]}, new value: ${value}!`);
  }
};

const flattenObject = (object) => {
  const flatObject = {};

  (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.each)(object, (value, key) => {
    if ((0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(value)) {
      Object.assign(flatObject, flattenObject(value));
    } else {
      warnOnOverwrite(flatObject, key, value);
      (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.setPath)(flatObject, key, value);
    }
  });

  return flatObject;
};

const flattenObjectSansNumericKeys = (object) => {
  const flatObject = {};

  (0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.each)(object, (value, key) => {
    if ((0,_internal_collections_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(value) && !Object.keys(value).some((k) => !Number.isNaN(Number(k)))) {
      Object.assign(flatObject, flattenObjectSansNumericKeys(value));
    } else {
      warnOnOverwrite(flatObject, key, value);
      (0,_internal_objects_js__WEBPACK_IMPORTED_MODULE_1__.setPath)(flatObject, key, value);
    }
  });

  return flatObject;
};

/**
 * Converts an ESPN timestamp to a Date, leaving an absent one absent.
 *
 * ESPN sends epoch milliseconds and omits the key entirely when there is no date. `new Date()` on
 * that omission yields an Invalid Date rather than nothing, which then survives every downstream
 * check that only tests for presence.
 *
 * @param   {number} value The epoch milliseconds to convert.
 * @returns {Date|undefined} The date, or `undefined` when ESPN sent nothing.
 */
const toDate = (value) => (value ? new Date(value) : undefined);




/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	const __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		const cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		const module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			const e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	// define getter/value functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop));
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ 	
/************************************************************************/
let __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ACTIVITY_ACTION: () => (/* reexport safe */ _client_client__WEBPACK_IMPORTED_MODULE_3__.ACTIVITY_ACTION),
/* harmony export */   Boxscore: () => (/* reexport safe */ _boxscore_boxscore__WEBPACK_IMPORTED_MODULE_1__["default"]),
/* harmony export */   BoxscorePlayer: () => (/* reexport safe */ _boxscore_player_boxscore_player__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   Client: () => (/* reexport safe */ _client_client__WEBPACK_IMPORTED_MODULE_3__["default"]),
/* harmony export */   DraftPlayer: () => (/* reexport safe */ _draft_player_draft_player__WEBPACK_IMPORTED_MODULE_4__["default"]),
/* harmony export */   FreeAgentPlayer: () => (/* reexport safe */ _free_agent_player_free_agent_player__WEBPACK_IMPORTED_MODULE_5__["default"]),
/* harmony export */   HttpError: () => (/* reexport safe */ _client_http__WEBPACK_IMPORTED_MODULE_6__.HttpError),
/* harmony export */   INJURY_STATUS: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_0__.INJURY_STATUS),
/* harmony export */   League: () => (/* reexport safe */ _league_league__WEBPACK_IMPORTED_MODULE_7__["default"]),
/* harmony export */   MATCHUP_RESULT: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_0__.MATCHUP_RESULT),
/* harmony export */   Matchup: () => (/* reexport safe */ _matchup_matchup__WEBPACK_IMPORTED_MODULE_8__["default"]),
/* harmony export */   NFLGame: () => (/* reexport safe */ _nfl_game_nfl_game__WEBPACK_IMPORTED_MODULE_9__["default"]),
/* harmony export */   PLAYER_AVAILABILITY_STATUS: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_0__.PLAYER_AVAILABILITY_STATUS),
/* harmony export */   Player: () => (/* reexport safe */ _player_player__WEBPACK_IMPORTED_MODULE_10__["default"]),
/* harmony export */   PlayerStats: () => (/* reexport safe */ _player_stats_player_stats__WEBPACK_IMPORTED_MODULE_11__["default"]),
/* harmony export */   Team: () => (/* reexport safe */ _team_team__WEBPACK_IMPORTED_MODULE_12__["default"]),
/* harmony export */   WINNING_TEAM: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_0__.WINNING_TEAM)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants */ "./src/constants.js");
/* harmony import */ var _boxscore_boxscore__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./boxscore/boxscore */ "./src/boxscore/boxscore.js");
/* harmony import */ var _boxscore_player_boxscore_player__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./boxscore-player/boxscore-player */ "./src/boxscore-player/boxscore-player.js");
/* harmony import */ var _client_client__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./client/client */ "./src/client/client.js");
/* harmony import */ var _draft_player_draft_player__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./draft-player/draft-player */ "./src/draft-player/draft-player.js");
/* harmony import */ var _free_agent_player_free_agent_player__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./free-agent-player/free-agent-player */ "./src/free-agent-player/free-agent-player.js");
/* harmony import */ var _client_http__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./client/http */ "./src/client/http.js");
/* harmony import */ var _league_league__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./league/league */ "./src/league/league.js");
/* harmony import */ var _matchup_matchup__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./matchup/matchup */ "./src/matchup/matchup.js");
/* harmony import */ var _nfl_game_nfl_game__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./nfl-game/nfl-game */ "./src/nfl-game/nfl-game.js");
/* harmony import */ var _player_player__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./player/player */ "./src/player/player.js");
/* harmony import */ var _player_stats_player_stats__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./player-stats/player-stats */ "./src/player-stats/player-stats.js");
/* harmony import */ var _team_team__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./team/team */ "./src/team/team.js");

















})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});