export default BaseCacheableObject;
/**
 * The base class for all project objects that can be cached. This class is extremely useful for
 * classes which have unique identifiers but cannot make API calls.
 *
 * Note: The id used for caching may be different than any id used by the response from the wire.
 * This allows for caching of an instance with the same id but different season data. Example:
 * League with different `seasonId`s can all be cached using this functionality. See the
 * `getCacheId` method for implementation.
 *
 * When managing the cache, never set an object to an `undefined` id. Always check that the result
 * from `getCacheId` is valid (see `_populateObject` for an example). Otherwise the cache will not
 * be in the correct state.
 *
 * @augments {BaseObject}
 */
declare class BaseCacheableObject extends BaseObject {
    /**
     * Defers to `BaseObject._populateObject` and then caches the instance using the caching id from
     * `getCacheId`.
     * @override
     */
    static override _populateObject({ data, constructorParams, rawData, instance, isDataFromServer }: {
        data: any;
        constructorParams: any;
        rawData: any;
        instance: any;
        isDataFromServer: any;
    }): BaseObject;
    /**
     * Sets the cache object.
     * @param {Record<string, BaseCacheableObject>} cache The cache to
     *                                                     assign, keyed by caching id.
     */
    static set cache(cache: Record<string, BaseCacheableObject>);
    /**
     * Returns all cached instances of an BaseCacheableObject. If no cache exists, a cache object is
     * created. This implementation ensures each class has a unique cache of only instances of the
     * BaseCacheableObject that does not overlap with other BaseCacheableObject classes. The keys of
     * the cache should use the caching id implemented in `getCacheId`.
     * @returns {Record<string, BaseCacheableObject>} The cache of BaseCacheableObjects.
     */
    static get cache(): Record<string, BaseCacheableObject>;
    /**
     * Resets cache to an empty object.
     */
    static clearCache(): void;
    /**
     * Returns a cached instance matching the passed caching id if it exists. Otherwise, returns
     * undefined.
     * @param  {number} id This id must match the form of the caching id provided by `getCacheId`.
     * @returns {BaseCacheableObject|undefined} The cached instance, or undefined when absent.
     */
    static get(id: number): BaseCacheableObject | undefined;
    /**
     * Should be overridden by each subclass. Returns an object containing all IDs used for API
     * requests and caching.
     * @returns {object} The ID params. Empty on the base class.
     */
    static getIDParams(): object;
    /**
     * Constructs and returns an id for the cache if possible from the passed params. If construction
     * is not possible, returns undefined.
     * @param  {object} idParams The ID params to build the caching id from.
     * @returns {string|undefined} The caching id, or undefined when one cannot be built.
     */
    static getCacheId(idParams: object): string | undefined;
    /**
     * Returns an object containing all IDs used for API requests and caching for the instance.
     * @returns {object} The ID params for this instance.
     */
    getIDParams(): object;
    /**
     * Returns the id used for caching. Important for classes that have multiple identifiers. Example:
     * League is identified by its `leagueId` and its `seasonId`. This method prevents separate
     * seasons from overriding each other's data.
     * @returns {string | undefined} The caching id for this instance, or undefined when one
     *                               cannot be built.
     */
    getCacheId(): string | undefined;
}
import BaseObject from '../base-object/base-object.js';
