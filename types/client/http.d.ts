export default http;
declare namespace http {
    /**
     * Performs a GET request and resolves with the parsed JSON body.
     *
     * @param   {string} route The route to resolve against `baseURL`.
     * @param   {object} [config] Request options.
     * @param   {string} [config.baseURL] Overrides the default base URL for routes on other hosts.
     * @param   {Record<string, string>} [config.headers] Headers merged over the defaults.
     * @param   {string} [config.credentials] Passed through to `fetch`. `'include'` lets a browser
     *                                        attach its own ESPN cookies; inert under Node.
     * @returns {Promise<*>} The parsed response body.
     * @throws  {HttpError} When the status is not 2xx, or the body is not JSON.
     */
    function get(route: string, config?: {
        baseURL?: string;
        headers?: Record<string, string>;
        credentials?: string;
    }): Promise<any>;
}
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
     */
    constructor({ message, status, statusText, data, url }: {
        message: string;
        status: number;
        statusText: string;
        data: any;
        url: string;
    });
    status: number;
    statusText: string;
    data: any;
    url: string;
}
