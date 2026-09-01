/**
 * The ESPN host every route below is built from. Named once so a caller assembling its own
 * `baseURL` does not retype it.
 * @type {string}
 */
const ESPN_HOST = 'https://lm-api-reads.fantasy.espn.com/';

/**
 * The host and path prefix every ESPN fantasy v3 route resolves against. Requests that live on
 * another host override it per-call via `config.baseURL`.
 * @type {string}
 */
const DEFAULT_BASE_URL = `${ESPN_HOST}apis/v3/games/ffl/seasons/`;

/**
 * The prefix for the `leagueHistory` routes, which serve seasons before 2018.
 * @type {string}
 */
const LEAGUE_HISTORY_BASE_URL = `${ESPN_HOST}apis/v3/games/ffl/leagueHistory/`;

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
 * How long a cached response stays fresh, and how many are kept, when the caller turns the cache on
 * without saying.
 *
 * Both need a default rather than being left undefined: `size > undefined` and `Date.now() +
 * undefined <= Date.now()` are both false, so a half-specified cache never evicted and never
 * expired -- it just grew, holding whole ESPN payloads.
 * @type {number}
 */
const DEFAULT_CACHE_TTL = 60000;

/** @type {number} */
const DEFAULT_CACHE_MAX = 50;

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
 * Every header takes part rather than that one by name. Naming it would fix today's collision and
 * leave the next one -- a request varying by some other header gets a silent wrong hit, with no
 * error and nothing to test against.
 *
 * `Cookie` is the deliberate exception: a Client holds one credential set for its whole life, so it
 * cannot vary within a cache, and leaving it out keeps credentials from sitting in a map key.
 *
 * @param   {string} url The resolved URL.
 * @param   {Record<string, string>} [headers] The request headers.
 * @returns {string} The cache key.
 */
const cacheKeyFor = (url, headers) => {
  const relevant = Object.keys(headers ?? {})
    .filter((name) => name.toLowerCase() !== 'cookie')
    .sort()
    .map((name) => `${name}:${headers[name]}`)
    .join('\n');

  return `${url}\n${relevant}`;
};

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
 * @param   {number} [options.timeout] Per-attempt timeout in milliseconds. `0` disables it.
 * @param   {number} [options.retries] How many times to retry a failed request.
 * @param   {number} [options.retryDelay] Base backoff in milliseconds, doubled per attempt.
 * @param   {boolean|{ttl?: number, max?: number}} [options.cache] Response cache. Off by default.
 *   When on, successful responses are held for `ttl` milliseconds, at most `max` of them; either
 *   may be omitted, and `true` takes both defaults (60s, 50 entries).
 * @returns {{get: Function}} An HTTP client.
 */
const createHttp = ({
  fetch: fetchImpl,
  timeout: defaultTimeout = DEFAULT_TIMEOUT,
  retries = DEFAULT_RETRIES,
  retryDelay = DEFAULT_RETRY_DELAY,
  cache = false
} = {}) => {
  // Normalized once so that a partial config cannot produce a cache that grows without bound.
  // `cache: true` and `cache: {ttl}` were both reachable and both did exactly that.
  const cacheConfig = cache ?
      {
        ttl: cache.ttl ?? DEFAULT_CACHE_TTL,
        max: cache.max ?? DEFAULT_CACHE_MAX
      } :
    false;

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
    responses.set(key, { data, expiresAt: Date.now() + cacheConfig.ttl });

    while (responses.size > cacheConfig.max) {
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

      if (cacheConfig) {
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

          if (cacheConfig) {
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

export default createHttp;
export {
  DEFAULT_BASE_URL, ESPN_HOST, HttpError, LEAGUE_HISTORY_BASE_URL
};
