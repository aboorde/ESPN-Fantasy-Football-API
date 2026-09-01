import forEach from 'lodash/forEach';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import map from 'lodash/map';
import set from 'lodash/set';

import { flattenObjectSansNumericKeys } from '../../utils.js';

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
    if (!isEmpty(options)) {
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

    const responseData = get(data, value.key);
    if (isFunction(value.manualParse)) {
      // ESPN omits keys constantly -- a settings block for a league that has none, a roster for a
      // week it has not scored, a member for a departed manager. A parser written to shape a value
      // throws when handed `undefined`, so every model was growing its own guard: five different
      // idioms across nine files, and three sites that still had none. Returning `undefined` here
      // completes the contract the output side already keeps at `_processResponseMapItem`, where
      // an undefined result leaves the attribute unset. `parseAbsent` opts out.
      if (isUndefined(responseData) && !value.parseAbsent) {
        return undefined;
      }
      return value.manualParse(responseData, data, rawData, constructorParams, instance);
    } else if (value.BaseObject) {
      const buildInstance = (passedData) => (
        value.BaseObject.buildFromServer(passedData, constructorParams, rawData)
      );

      return value.isArray ? map(responseData, buildInstance) : buildInstance(responseData);
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
     * @property {boolean} defer Whether or not to wait to parse the entry until a second pass of
     *                           the map. This is useful for populating items with cached instances
     *                           that are not guaranteed to be parsed/cached during initial parsing.
     *                           Example: Using Team instances on League.
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

    let item;

    if (!isDataFromServer) {
      item = get(data, key);
    } else if (isString(value)) {
      item = get(data, value);
    } else if (isPlainObject(value)) {
      item = this._processObjectValue({
        data, rawData, constructorParams, instance, value
      });
    } else {
      throw new Error(
        `${this.displayName}: _populateObject: Did not recognize responseMap value type for key ` +
        `${key}`
      );
    }

    if (!isUndefined(item)) {
      set(instance, key, item);
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
    } else if (isEmpty(data)) {
      return instance;
    }

    const deferredMapItems = {};
    forEach(this.responseMap, (value, key) => {
      if (isPlainObject(value) && value.defer) {
        set(deferredMapItems, key, value);
      } else {
        this._processResponseMapItem({
          data, rawData, constructorParams, instance, isDataFromServer, key, value
        });
      }
    });

    forEach(deferredMapItems, (value, key) => {
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

    const flatData = this.flattenResponse ? flattenObjectSansNumericKeys(data) : data;

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

export default BaseObject;
