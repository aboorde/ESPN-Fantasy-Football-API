export default BaseObject;
/**
 * The base class for all project objects. Provides data mapping functionality.
 */
declare class BaseObject {
    /**
     * Maps keys on the instance to where their data lives on an API response. Subclasses override
     * this, and a subclass that extends another mapped class spreads its parent's map explicitly:
     *
     *     static responseMap = { ...Player.responseMap, ownKey: 'own_key' };
     *
     * @type {Record<string, (string|ResponseMapValueObject)>}
     */
    static responseMap: Record<string, (string | ResponseMapValueObject)>;
    /**
     * The class name. Minification will break `this.constructor.name`; this allows for readable
     * logging even in minified code.
     * @type {string}
     */
    static displayName: string;
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
    private static _processObjectValue;
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
    private static _processResponseMapItem;
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
    private static _populateObject;
    /**
     * Returns a new instance of the BaseObject populated with the passed data that came from ESPN,
     * mapping the attributes defined in the value of responseMap to the matching key. Use this method
     * when constructing BaseObjects with server responses.
     * @param  {object} data Data originating from the server.
     * @param  {object} constructorParams Params to be passed to the instance's constructor. Useful
     *                                    for passing parent data, such as `leagueId`.
     * @returns {BaseObject} A new instance of the BaseObject populated with the passed data.
     */
    static buildFromServer(data: object, constructorParams: object): BaseObject;
    /**
     * @param {object} options Properties to be assigned to the BaseObject. Must match the keys of the
     *                         BaseObject's `responseMap` or valid options defined by the class's
     *                         `constructor`.
     */
    constructor(options?: object);
}
