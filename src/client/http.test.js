import createHttp, { DEFAULT_BASE_URL, HttpError } from './http';

describe('http', () => {
  // The factory takes a fetch, but these tests exercise the default path -- no fetch passed, so
  // the platform's is resolved per request and the global spy below is what answers.
  const http = createHttp();

  /**
   * Builds a stand-in for a `fetch` Response. Only the members `http.get` reads are defined, so a
   * test that starts depending on more of the interface fails loudly rather than silently.
   *
   * @param   {object} options Response attributes to simulate.
   * @param   {boolean} [options.ok] Whether the status is in the 2xx range.
   * @param   {number} [options.status] The HTTP status code.
   * @param   {string} [options.statusText] The HTTP status text.
   * @param   {string} [options.body] The raw response body.
   * @returns {object} The Response stand-in.
   */
  const buildResponse = ({
    ok = true, status = 200, statusText = 'OK', body = '{}'
  } = {}) => ({
    ok, status, statusText, text: () => Promise.resolve(body)
  });

  beforeEach(() => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(buildResponse());
  });

  describe('get', () => {
    describe('URL resolution', () => {
      test('resolves the route against the default base URL', async () => {
        await http.get('2024/segments/0/leagues/123?view=mTeam');

        expect(fetch).toHaveBeenCalledWith(
          `${DEFAULT_BASE_URL}2024/segments/0/leagues/123?view=mTeam`,
          expect.any(Object)
        );
      });

      test('resolves the route against a passed baseURL', async () => {
        await http.get('apis/fantasy/v2/games/ffl/games?dates=1-2', {
          baseURL: 'https://site.api.espn.com/'
        });

        expect(fetch).toHaveBeenCalledWith(
          'https://site.api.espn.com/apis/fantasy/v2/games/ffl/games?dates=1-2',
          expect.any(Object)
        );
      });
    });

    describe('headers', () => {
      test('sends the default Accept header when no headers are passed', async () => {
        await http.get('route');

        expect(fetch).toHaveBeenCalledWith(expect.any(String), {
          headers: { Accept: 'application/json' },
          credentials: undefined,
          signal: expect.any(AbortSignal)
        });
      });

      test('merges passed headers over the defaults', async () => {
        await http.get('route', { headers: { 'x-fantasy-filter': '{}', Cookie: 'espn_s2=a;' } });

        expect(fetch).toHaveBeenCalledWith(expect.any(String), {
          headers: {
            Accept: 'application/json',
            Cookie: 'espn_s2=a;',
            'x-fantasy-filter': '{}'
          },
          credentials: undefined,
          signal: expect.any(AbortSignal)
        });
      });

      test('lets a passed header override a default', async () => {
        await http.get('route', { headers: { Accept: 'text/plain' } });

        expect(fetch).toHaveBeenCalledWith(expect.any(String), {
          headers: { Accept: 'text/plain' },
          credentials: undefined,
          signal: expect.any(AbortSignal)
        });
      });
    });

    describe('credentials', () => {
      test('passes credentials through to fetch', async () => {
        await http.get('route', { credentials: 'include' });

        expect(fetch).toHaveBeenCalledWith(expect.any(String), {
          headers: { Accept: 'application/json' },
          credentials: 'include',
          signal: expect.any(AbortSignal)
        });
      });
    });

    describe('when the response is successful', () => {
      test('resolves with the parsed body', async () => {
        fetch.mockResolvedValue(buildResponse({ body: '{"teams":[{"id":1}]}' }));

        const data = await http.get('route');

        expect(data).toEqual({ teams: [{ id: 1 }] });
      });

      test('resolves with a parsed array body', async () => {
        fetch.mockResolvedValue(buildResponse({ body: '[{"id":1}]' }));

        const data = await http.get('route');

        expect(data).toEqual([{ id: 1 }]);
      });

      describe('when the body is not JSON', () => {
        test('throws an HttpError carrying the raw body', async () => {
          expect.assertions(2);

          fetch.mockResolvedValue(buildResponse({ body: '<html>maintenance</html>' }));

          await expect(http.get('route')).rejects.toBeInstanceOf(HttpError);
          await expect(http.get('route')).rejects.toMatchObject({
            data: '<html>maintenance</html>',
            message: 'Request succeeded with status code 200 but the body was not JSON',
            status: 200,
            statusText: 'OK',
            url: `${DEFAULT_BASE_URL}route`
          });
        });
      });
    });

    describe('when the response is not successful', () => {
      test('throws an HttpError with the parsed error body', async () => {
        expect.assertions(2);

        fetch.mockResolvedValue(buildResponse({
          body: '{"messages":["You are not authorized to view this League."]}',
          ok: false,
          status: 401,
          statusText: 'Unauthorized'
        }));

        await expect(http.get('route')).rejects.toBeInstanceOf(HttpError);
        await expect(http.get('route')).rejects.toMatchObject({
          data: { messages: ['You are not authorized to view this League.'] },
          message: 'Request failed with status code 401',
          name: 'HttpError',
          status: 401,
          statusText: 'Unauthorized',
          url: `${DEFAULT_BASE_URL}route`
        });
      });

      test('falls back to the raw body when the error body is not JSON', async () => {
        expect.assertions(1);

        fetch.mockResolvedValue(buildResponse({
          body: '<html>oops</html>',
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        }));

        await expect(http.get('route')).rejects.toMatchObject({
          data: '<html>oops</html>',
          message: 'Request failed with status code 500',
          status: 500
        });
      });
    });
  });

  describe('timeout', () => {
    test('aborts an attempt that outlives the timeout', async () => {
      const fetchMock = jest.fn((url, init) => new Promise((resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(init.signal.reason));
      }));
      const client = createHttp({ fetch: fetchMock, timeout: 10, retries: 0 });

      await expect(client.get('route')).rejects.toThrow(/abort|timed out/i);
    });

    test('does not attach a signal when the timeout is disabled and no signal is passed', async () => {
      const fetchMock = jest.fn().mockResolvedValue(buildResponse());
      const client = createHttp({ fetch: fetchMock, timeout: 0 });

      await client.get('route');

      expect(fetchMock.mock.calls[0][1].signal).toBeUndefined();
    });

    test('honours a per-request timeout over the client default', async () => {
      const fetchMock = jest.fn((url, init) => new Promise((resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(init.signal.reason));
      }));
      const client = createHttp({ fetch: fetchMock, timeout: 0, retries: 0 });

      await expect(client.get('route', { timeout: 10 })).rejects.toThrow(/abort|timed out/i);
    });
  });

  describe('retries', () => {
    const failing = (status) => buildResponse({
      ok: false, status, statusText: 'nope', body: '{}'
    });

    test('retries a 500 and resolves when a later attempt succeeds', async () => {
      const fetchMock = jest.fn()
        .mockResolvedValueOnce(failing(500))
        .mockResolvedValueOnce(buildResponse({ body: '{"ok":true}' }));
      const client = createHttp({ fetch: fetchMock, retryDelay: 0 });

      await expect(client.get('route')).resolves.toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test('retries a 429', async () => {
      const fetchMock = jest.fn()
        .mockResolvedValueOnce(failing(429))
        .mockResolvedValueOnce(buildResponse({ body: '{"ok":true}' }));
      const client = createHttp({ fetch: fetchMock, retryDelay: 0 });

      await expect(client.get('route')).resolves.toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test('gives up after the configured number of retries', async () => {
      const fetchMock = jest.fn().mockResolvedValue(failing(503));
      const client = createHttp({ fetch: fetchMock, retries: 2, retryDelay: 0 });

      await expect(client.get('route')).rejects.toMatchObject({ status: 503 });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    test('does not retry a 4xx', async () => {
      const fetchMock = jest.fn().mockResolvedValue(failing(401));
      const client = createHttp({ fetch: fetchMock, retries: 2, retryDelay: 0 });

      await expect(client.get('route')).rejects.toMatchObject({ status: 401 });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test('does not retry a 2xx whose body is not JSON', async () => {
      const fetchMock = jest.fn().mockResolvedValue(buildResponse({ body: '<html>maintenance' }));
      const client = createHttp({ fetch: fetchMock, retries: 2, retryDelay: 0 });

      await expect(client.get('route')).rejects.toThrow(/was not JSON/);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test('retries a network error', async () => {
      const fetchMock = jest.fn()
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce(buildResponse({ body: '{"ok":true}' }));
      const client = createHttp({ fetch: fetchMock, retryDelay: 0 });

      await expect(client.get('route')).resolves.toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test('waits the seconds ESPN asks for rather than its own backoff', async () => {
      const response = failing(429);
      // Fractional seconds so the test does not actually sit for a second. The point is which
      // branch decides the delay, not its magnitude.
      response.headers = { get: (name) => (name === 'retry-after' ? '0.01' : null) };
      const fetchMock = jest.fn()
        .mockResolvedValueOnce(response)
        .mockResolvedValueOnce(buildResponse({ body: '{"ok":true}' }));

      // A base delay long enough that honouring it instead would stall this test conspicuously.
      const client = createHttp({ fetch: fetchMock, retryDelay: 10000 });

      const startedAt = Date.now();
      await expect(client.get('route')).resolves.toEqual({ ok: true });
      expect(Date.now() - startedAt).toBeLessThan(1000);
    });

    test('stops waiting out a backoff as soon as the caller aborts', async () => {
      const controller = new AbortController();
      const fetchMock = jest.fn()
        .mockImplementationOnce(() => {
          // Aborts during the backoff rather than during the request, which is the case the sleep
          // has to notice. Aborting any earlier would be caught before the wait even starts.
          setTimeout(() => controller.abort(), 5);
          return Promise.resolve(failing(500));
        })
        .mockResolvedValue(buildResponse({ body: '{"ok":true}' }));
      const client = createHttp({ fetch: fetchMock, retryDelay: 10000 });

      const startedAt = Date.now();
      await client.get('route', { signal: controller.signal }).catch(() => {});

      expect(Date.now() - startedAt).toBeLessThan(1000);
    });

    test('reports a parseable Retry-After on the error', async () => {
      const response = failing(429);
      response.headers = { get: (name) => (name === 'retry-after' ? '2' : null) };
      const fetchMock = jest.fn().mockResolvedValue(response);
      const client = createHttp({ fetch: fetchMock, retries: 0 });

      await expect(client.get('route')).rejects.toMatchObject({ retryAfter: 2 });
    });

    describe('when the caller aborts', () => {
      test('is terminal -- the request is not retried', async () => {
        const controller = new AbortController();
        const fetchMock = jest.fn(() => {
          controller.abort();
          return Promise.reject(new Error('aborted'));
        });
        const client = createHttp({ fetch: fetchMock, retries: 2, retryDelay: 0 });

        await expect(client.get('route', { signal: controller.signal })).rejects.toThrow();
        expect(fetchMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('cache', () => {
    test('is off by default', async () => {
      const fetchMock = jest.fn().mockResolvedValue(buildResponse({ body: '{"n":1}' }));
      const client = createHttp({ fetch: fetchMock });

      await client.get('route');
      await client.get('route');

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test('serves a second identical request without a fetch', async () => {
      const fetchMock = jest.fn().mockResolvedValue(buildResponse({ body: '{"n":1}' }));
      const client = createHttp({ fetch: fetchMock, cache: { ttl: 60000, max: 8 } });

      await expect(client.get('route')).resolves.toEqual({ n: 1 });
      await expect(client.get('route')).resolves.toEqual({ n: 1 });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // getFreeAgents and the player half of getDraftInfo build byte-identical URLs and differ only
    // in this header. Keyed on URL alone, one would be served the other's response.
    test('does not confuse two requests that differ only by fantasy filter', async () => {
      const fetchMock = jest.fn()
        .mockResolvedValueOnce(buildResponse({ body: '{"who":"free agents"}' }))
        .mockResolvedValueOnce(buildResponse({ body: '{"who":"draft pool"}' }));
      const client = createHttp({ fetch: fetchMock, cache: { ttl: 60000, max: 8 } });

      const first = await client.get('players', { headers: { 'x-fantasy-filter': '{"a":1}' } });
      const second = await client.get('players', { headers: { 'x-fantasy-filter': '{"b":2}' } });

      expect(first).toEqual({ who: 'free agents' });
      expect(second).toEqual({ who: 'draft pool' });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test('refetches once the entry has expired', async () => {
      const fetchMock = jest.fn()
        .mockResolvedValueOnce(buildResponse({ body: '{"n":1}' }))
        .mockResolvedValueOnce(buildResponse({ body: '{"n":2}' }));
      const client = createHttp({ fetch: fetchMock, cache: { ttl: 5, max: 8 } });

      await client.get('route');
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 1000);

      await expect(client.get('route')).resolves.toEqual({ n: 2 });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test('evicts the oldest entry past max', async () => {
      const fetchMock = jest.fn().mockResolvedValue(buildResponse({ body: '{"n":1}' }));
      const client = createHttp({ fetch: fetchMock, cache: { ttl: 60000, max: 2 } });

      await client.get('one');
      await client.get('two');
      await client.get('three');
      await client.get('one'); // evicted, so this refetches

      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    test('does not cache a failed request', async () => {
      const fetchMock = jest.fn()
        .mockResolvedValueOnce(buildResponse({ ok: false, status: 404, body: '{}' }))
        .mockResolvedValueOnce(buildResponse({ body: '{"n":1}' }));
      const client = createHttp({ fetch: fetchMock, cache: { ttl: 60000, max: 8 }, retries: 0 });

      await expect(client.get('route')).rejects.toMatchObject({ status: 404 });
      await expect(client.get('route')).resolves.toEqual({ n: 1 });
    });
  });

  describe('HttpError', () => {
    test('is an Error', () => {
      const error = new HttpError({ message: 'boom', status: 404 });

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('HttpError');
      expect(error.message).toBe('boom');
      expect(error.status).toBe(404);
    });
  });
});
