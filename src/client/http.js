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
   */
  constructor({
    message, status, statusText, data, url
  }) {
    super(message);

    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.url = url;
  }
}

const http = {
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
  async get(route, config = {}) {
    const { baseURL = DEFAULT_BASE_URL, headers, credentials } = config;
    const url = new URL(route, baseURL).toString();

    const response = await fetch(url, {
      headers: { ...DEFAULT_HEADERS, ...headers },
      credentials
    });

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
        url
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
  }
};

export default http;
export { DEFAULT_BASE_URL, HttpError };
