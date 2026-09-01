export default createHttp;
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
declare function createHttp({ fetch: fetchImpl, timeout: defaultTimeout, retries, retryDelay, cache }?: {
    fetch?: Function;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    cache?: false | {
        ttl: number;
        max: number;
    };
}): {
    get: Function;
};
/**
 * The host and path prefix every ESPN fantasy v3 route resolves against. Requests that live on
 * another host override it per-call via `config.baseURL`.
 * @type {string}
 */
export const DEFAULT_BASE_URL: string;
/**
 * Thrown when a request does not produce a parseable JSON body with a 2xx status.
 *
 * This deliberately carries no request headers. Those hold the `espn_s2` and `SWID` cookies, and
 * consumers routinely log caught errors wholesale.
 */
export class HttpError extends Error {
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
    constructor({ message, status, statusText, data, url, retryAfter }: {
        message: string;
        status: number;
        statusText: string;
        data: any;
        url: string;
        retryAfter?: number;
    });
    status: number;
    statusText: string;
    data: any;
    url: string;
    retryAfter: number;
}
