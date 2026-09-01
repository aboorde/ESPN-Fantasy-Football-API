/**
 * A stand-in for the `Response` that `fetch` resolves with.
 *
 * `createHttp` reads `ok`, `status`, `statusText`, `headers` and `text()` off a response, so a test
 * double has to supply all of them. Four near-copies of this object had grown across the client,
 * http and fixture suites, three of which could not express a non-200 without falling back to an
 * inline literal.
 *
 * @param   {object} [options] Options.
 * @param   {boolean} [options.ok] Whether the status is a 2xx.
 * @param   {number} [options.status] The HTTP status.
 * @param   {string} [options.statusText] The HTTP status text.
 * @param   {string} [options.body] The raw response body.
 * @param   {Record<string, string>} [options.headers] Response headers, read case-insensitively.
 * @returns {object} The Response stand-in.
 */
const buildResponse = ({
  ok = true, status = 200, statusText = 'OK', body = '{}', headers = {}
} = {}) => ({
  ok,
  status,
  statusText,
  headers: {
    get: (name) => headers[name] ?? headers[name.toLowerCase()]
  },
  text: () => Promise.resolve(body)
});

/**
 * The same thing, for a test that has a payload object rather than a serialized body.
 *
 * @param   {*} body The body to serialize.
 * @returns {object} The Response stand-in.
 */
const respondWithJson = (body) => buildResponse({ body: JSON.stringify(body) });

export { buildResponse, respondWithJson };
