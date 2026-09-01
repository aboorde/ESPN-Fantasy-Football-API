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
          credentials: undefined
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
          credentials: undefined
        });
      });

      test('lets a passed header override a default', async () => {
        await http.get('route', { headers: { Accept: 'text/plain' } });

        expect(fetch).toHaveBeenCalledWith(expect.any(String), {
          headers: { Accept: 'text/plain' },
          credentials: undefined
        });
      });
    });

    describe('credentials', () => {
      test('passes credentials through to fetch', async () => {
        await http.get('route', { credentials: 'include' });

        expect(fetch).toHaveBeenCalledWith(expect.any(String), {
          headers: { Accept: 'application/json' },
          credentials: 'include'
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
