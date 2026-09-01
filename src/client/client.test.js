import forEach from 'lodash/forEach';
import get from 'lodash/get';
import merge from 'lodash/merge';

import Boxscore from '../boxscore/boxscore';
import DraftPlayer from '../draft-player/draft-player';
import FreeAgentPlayer from '../free-agent-player/free-agent-player';
import League from '../league/league';
import Matchup from '../matchup/matchup';
import NFLGame from '../nfl-game/nfl-game';
import Player from '../player/player';
import Team from '../team/team';

import Client from './client';
import http from './http';

// A response stand-in for the assertions that only care how a request was built, not how its
// response is parsed. It never settles, so the client assembles and returns its promise chain
// without any response handler running. A promise resolving to an empty body would instead make
// the response handler throw, and these tests discard the promise they trigger, so nothing would
// observe the rejection -- which Node treats as fatal.
const UNSETTLED_RESPONSE = new Promise(() => {});

describe('Client', () => {
  describe('constructor', () => {
    describe('when options are not passed', () => {
      const testPropIsUndefined = (prop) => {
        test(`${prop} is undefined`, () => {
          const newInstance = new Client();
          expect(get(newInstance, prop)).toBeUndefined();
        });
      };

      testPropIsUndefined('leagueId');
    });

    describe('when options are passed', () => {
      const testPropIsSetFromOptions = (prop) => {
        test(`${prop} is set from options`, () => {
          const value = 203123;
          const newInstance = new Client({ [prop]: value });
          expect(get(newInstance, prop)).toBe(value);
        });
      };

      testPropIsSetFromOptions('leagueId');
    });

    describe('when all cookies are passed on options', () => {
      test('sets cookies', () => {
        const espnS2 = 'some_espn_s2';
        const SWID = 'some_swid';

        const client = new Client({ espnS2, SWID });

        expect(client.espnS2).toBe(espnS2);
        expect(client.SWID).toBe(SWID);
      });
    });

    describe('when only espnS2 is passed on options', () => {
      test('does not set cookies', () => {
        const espnS2 = 'some_espn_s2';

        const client = new Client({ espnS2 });

        expect(client.espnS2).toBeUndefined();
        expect(client.SWID).toBeUndefined();
      });
    });

    describe('when only SWID is passed on options', () => {
      test('does not set cookies', () => {
        const SWID = 'some_swid';

        const client = new Client({ SWID });

        expect(client.espnS2).toBeUndefined();
        expect(client.SWID).toBeUndefined();
      });
    });

    describe('when no cookies are passed on options', () => {
      test('does not set cookies', () => {
        const client = new Client();

        expect(client.espnS2).toBeUndefined();
        expect(client.SWID).toBeUndefined();
      });
    });
  });

  describe('instance methods', () => {
    describe('_buildRequestConfig', () => {
      describe('when espnS2 is set on the instance', () => {
        describe('when SWID is set on the instance', () => {
          test('returns a requestConfig with Cookie merged onto headers', () => {
            const espnS2 = 'some_espn_s2';
            const SWID = 'some_swid';
            const passedConfig = {
              headers: { something: 'with a value' },
              baseRoute: 'some/base/route'
            };

            const cookieHeaders = { Cookie: `espn_s2=${espnS2}; SWID=${SWID};` };
            const cookieConfig = { headers: cookieHeaders, credentials: 'include' };

            const client = new Client({ espnS2, SWID });
            const requestConfig = client._buildRequestConfig(passedConfig);
            expect(requestConfig).toEqual(merge({}, passedConfig, cookieConfig));
          });
        });

        describe('when SWID is not set on the instance', () => {
          test('returns the passed requestConfig', () => {
            const espnS2 = 'some_espn_s2';
            const passedConfig = {
              headers: { something: 'with a value' },
              baseRoute: 'some/base/route'
            };

            const client = new Client({ espnS2 });
            const requestConfig = client._buildRequestConfig(passedConfig);
            expect(requestConfig).toEqual(passedConfig);
          });
        });
      });

      describe('when espnS2 is not set on the instance', () => {
        describe('when SWID is set on the instance', () => {
          test('returns the passed requestConfig', () => {
            const SWID = 'some_swid';
            const passedConfig = {
              headers: { something: 'with a value' },
              baseRoute: 'some/base/route'
            };

            const client = new Client({ SWID });
            const requestConfig = client._buildRequestConfig(passedConfig);
            expect(requestConfig).toEqual(passedConfig);
          });
        });

        describe('when SWID is not set on the instance', () => {
          test('returns the passed requestConfig', () => {
            const passedConfig = {
              headers: { something: 'with a value' },
              baseRoute: 'some/base/route'
            };

            const client = new Client();
            const requestConfig = client._buildRequestConfig(passedConfig);
            expect(requestConfig).toEqual(passedConfig);
          });
        });
      });
    });

    describe('setCookies', () => {
      describe('when espnS2 is set on the instance', () => {
        describe('when SWID is set on the instance', () => {
          test('sets cookies on the instance', () => {
            const espnS2 = 'some_espn_s2';
            const SWID = 'some_swid';

            const client = new Client();
            client.setCookies({ espnS2, SWID });

            expect(client.espnS2).toBe(espnS2);
            expect(client.SWID).toBe(SWID);
          });
        });

        describe('when SWID is not set on the instance', () => {
          test('does not set cookies on the instance', () => {
            const espnS2 = 'some_espn_s2';

            const client = new Client();
            client.setCookies({ espnS2 });

            expect(client.espnS2).toBeUndefined();
            expect(client.SWID).toBeUndefined();
          });
        });
      });

      describe('when espnS2 is not set on the instance', () => {
        describe('when SWID is set on the instance', () => {
          test('does not set cookies on the instance', () => {
            const SWID = 'some_swid';

            const client = new Client();
            client.setCookies({ SWID });

            expect(client.espnS2).toBeUndefined();
            expect(client.SWID).toBeUndefined();
          });
        });

        describe('when SWID is not set on the instance', () => {
          test('does not set cookies on the instance', () => {
            const client = new Client();
            client.setCookies({});

            expect(client.espnS2).toBeUndefined();
            expect(client.SWID).toBeUndefined();
          });
        });
      });
    });

    describe('getBoxscoreForWeek', () => {
      let client;
      let leagueId;
      let matchupPeriodId;
      let scoringPeriodId;
      let seasonId;

      beforeEach(() => {
        leagueId = 213213;
        matchupPeriodId = 2;
        scoringPeriodId = 3;
        seasonId = 2018;

        client = new Client({ leagueId });

        jest.spyOn(http, 'get').mockImplementation();
      });

      describe('when the seasonId is prior to 2018', () => {
        test('throws an error', () => {
          expect(() => client.getBoxscoreForWeek({
            seasonId: 2017,
            matchupPeriodId,
            scoringPeriodId
          })).toThrow();
        });
      });

      describe('when the seasonId is 2018 or after', () => {
        test('does not throw an error', () => {
          http.get.mockReturnValue(UNSETTLED_RESPONSE);

          expect(() => client.getBoxscoreForWeek({
            seasonId: 2018,
            matchupPeriodId,
            scoringPeriodId
          })).not.toThrow();
        });

        test('calls http.get with the correct params', () => {
          const routeBase = `${seasonId}/segments/0/leagues/${leagueId}`;
          const routeParams = `?view=mMatchup&view=mMatchupScore&scoringPeriodId=${scoringPeriodId}`;
          const route = `${routeBase}${routeParams}`;

          const config = {};
          jest.spyOn(client, '_buildRequestConfig').mockReturnValue(config);
          http.get.mockReturnValue(UNSETTLED_RESPONSE);

          client.getBoxscoreForWeek({ seasonId, matchupPeriodId, scoringPeriodId });
          expect(http.get).toHaveBeenCalledWith(route, config);
        });

        describe('before the promise resolves', () => {
          test('does not invoke callback', () => {
            jest.spyOn(Boxscore, 'buildFromServer').mockImplementation();
            http.get.mockReturnValue(UNSETTLED_RESPONSE);

            client.getBoxscoreForWeek({ seasonId, matchupPeriodId, scoringPeriodId });
            expect(Boxscore.buildFromServer).not.toHaveBeenCalled();
          });
        });

        describe('after the promise resolves', () => {
          test('maps response data into Boxscores', async () => {
            const response = {
              schedule: [{
                matchupPeriodId,
                home: { teamId: 2 },
                away: { teamId: 3 }
              }, {
                matchupPeriodId,
                home: { teamId: 5 },
                away: { teamId: 6 }
              }, {
                matchupPeriodId: matchupPeriodId + 1,
                home: { teamId: 6 },
                away: { teamId: 2 }
              }]
            };

            const promise = Promise.resolve(response);
            http.get.mockReturnValue(promise);

            const boxscores = await client.getBoxscoreForWeek({
              seasonId, matchupPeriodId, scoringPeriodId
            });

            expect.hasAssertions();
            expect(boxscores.length).toBe(2);
            forEach(boxscores, (boxscore, index) => {
              expect(boxscore).toBeInstanceOf(Boxscore);
              expect(boxscore.homeTeamId).toBe(response.schedule[index].home.teamId);
              expect(boxscore.awayTeamId).toBe(response.schedule[index].away.teamId);
            });
          });
        });
      });
    });

    describe('getScheduleForSeason', () => {
      let client;
      let leagueId;
      let seasonId;

      beforeEach(() => {
        leagueId = 213213;
        seasonId = 2018;

        client = new Client({ leagueId });

        jest.spyOn(http, 'get').mockImplementation();
      });

      describe('when the seasonId is prior to 2018', () => {
        test('throws an error', () => {
          expect(() => client.getScheduleForSeason({ seasonId: 2017 })).toThrow();
        });
      });

      describe('when the seasonId is 2018 or after', () => {
        test('does not throw an error', () => {
          http.get.mockReturnValue(UNSETTLED_RESPONSE);

          expect(() => client.getScheduleForSeason({ seasonId: 2018 })).not.toThrow();
        });

        test('calls http.get with the correct params', () => {
          const routeBase = `${seasonId}/segments/0/leagues/${leagueId}`;
          const routeParams = '?view=mMatchup&view=mMatchupScore';
          const route = `${routeBase}${routeParams}`;

          const config = {};
          jest.spyOn(client, '_buildRequestConfig').mockReturnValue(config);
          http.get.mockReturnValue(UNSETTLED_RESPONSE);

          client.getScheduleForSeason({ seasonId });
          expect(http.get).toHaveBeenCalledWith(route, config);
        });

        describe('before the promise resolves', () => {
          test('does not invoke callback', () => {
            jest.spyOn(Matchup, 'buildFromServer').mockImplementation();
            http.get.mockReturnValue(UNSETTLED_RESPONSE);

            client.getScheduleForSeason({ seasonId });
            expect(Matchup.buildFromServer).not.toHaveBeenCalled();
          });
        });

        describe('after the promise resolves', () => {
          test('maps every matchup period, not just one', async () => {
            const response = {
              schedule: [{
                id: 1, matchupPeriodId: 1, winner: 'HOME', playoffTierType: 'NONE',
                home: { teamId: 2, totalPoints: 110 }, away: { teamId: 3, totalPoints: 99 }
              }, {
                id: 2, matchupPeriodId: 1, winner: 'AWAY', playoffTierType: 'NONE',
                home: { teamId: 5, totalPoints: 88 }, away: { teamId: 6, totalPoints: 120 }
              }, {
                id: 3, matchupPeriodId: 2, winner: 'UNDECIDED', playoffTierType: 'NONE',
                home: { teamId: 2, totalPoints: 0 }, away: { teamId: 5, totalPoints: 0 }
              }]
            };
            http.get.mockReturnValue(Promise.resolve(response));

            const schedule = await client.getScheduleForSeason({ seasonId });

            // getBoxscoreForWeek filters this same array down to one period. This must not.
            expect(schedule.length).toBe(3);
            forEach(schedule, (matchup) => expect(matchup).toBeInstanceOf(Matchup));
            expect(schedule[0].winner).toBe('HOME');
            expect(schedule[2].matchupPeriodId).toBe(2);
            expect(schedule[2].winner).toBe('UNDECIDED');
          });

          describe('when the league has no schedule yet', () => {
            test('returns an empty array', async () => {
              http.get.mockReturnValue(Promise.resolve({}));

              const schedule = await client.getScheduleForSeason({ seasonId });
              expect(schedule).toEqual([]);
            });
          });
        });
      });
    });

    describe('getDraftInfo', () => {
      let client;
      let leagueId;
      let scoringPeriodId;
      let seasonId;

      beforeEach(() => {
        leagueId = 213213;
        scoringPeriodId = 3;
        seasonId = 2018;

        client = new Client({ leagueId });

        jest.spyOn(http, 'get').mockImplementation();
      });

      describe('when the seasonId is prior to 2018', () => {
        test('throws an error', () => {
          expect(() => client.getDraftInfo({
            seasonId: 2017,
            scoringPeriodId
          })).toThrow();
        });
      });

      describe('when the seasonId is 2018 or after', () => {
        test('does not throw an error', () => {
          http.get.mockReturnValue(Promise.resolve({
            draftDetail: {
              picks: []
            },
            players: []
          }));

          expect(() => client.getDraftInfo({
            seasonId: 2018,
            scoringPeriodId
          })).not.toThrow();
        });

        test('calls http.get with the correct params', () => {
          const draftRouteBase = `${seasonId}/segments/0/leagues/${leagueId}`;
          const draftRouteParams = `?view=mDraftDetail&view=mMatchup&view=mMatchupScore&scoringPeriodId=${scoringPeriodId}`;
          const draftRoute = `${draftRouteBase}${draftRouteParams}`;

          const playerRouteBase = `${seasonId}/segments/0/leagues/${leagueId}`;
          const playerRouteParams = `?scoringPeriodId=${scoringPeriodId}&view=kona_player_info`;
          const playerRoute = `${playerRouteBase}${playerRouteParams}`;

          const config = {};
          jest.spyOn(client, '_buildRequestConfig').mockReturnValue(config);
          http.get.mockReturnValue(Promise.resolve({
            draftDetail: {
              picks: []
            },
            players: []
          }));

          client.getDraftInfo({ seasonId, scoringPeriodId });
          expect(http.get).toHaveBeenCalledWith(draftRoute, config);
          expect(http.get).toHaveBeenCalledWith(playerRoute, config);
        });

        describe('when scoringPeriodId is not passed', () => {
          test('calls http.get with the correct params', () => {
            const draftRouteBase = `${seasonId}/segments/0/leagues/${leagueId}`;
            const draftRouteParams = '?view=mDraftDetail&view=mMatchup&view=mMatchupScore&scoringPeriodId=0';
            const draftRoute = `${draftRouteBase}${draftRouteParams}`;

            const playerRouteBase = `${seasonId}/segments/0/leagues/${leagueId}`;
            const playerRouteParams = '?scoringPeriodId=0&view=kona_player_info';
            const playerRoute = `${playerRouteBase}${playerRouteParams}`;

            const config = {};
            jest.spyOn(client, '_buildRequestConfig').mockReturnValue(config);
            http.get.mockReturnValue(Promise.resolve({
              draftDetail: {
                picks: []
              },
              players: []
            }));

            client.getDraftInfo({ seasonId });
            expect(http.get).toHaveBeenCalledWith(draftRoute, config);
            expect(http.get).toHaveBeenCalledWith(playerRoute, config);
          });
        });

        describe('after the promise resolves', () => {
          test('maps response data into Boxscores', async () => {
            const response = {
              draftDetail: {
                picks: [{
                  overallPickNumber: 1,
                  playerId: 2
                }, {
                  overallPickNumber: 2,
                  playerId: 3
                }]
              },
              players: [{
                player: {
                  id: 2
                }
              }, {
                player: {
                  id: 3
                }
              }]
            };

            const promise = Promise.resolve(response);
            http.get.mockReturnValue(promise);

            const draftPlayers = await client.getDraftInfo({ seasonId, scoringPeriodId });

            expect.hasAssertions();
            expect(draftPlayers.length).toBe(2);
            forEach(draftPlayers, (draftPlayer) => {
              expect(draftPlayer).toBeInstanceOf(DraftPlayer);
            });
          });
        });
      });
    });

    describe('getHistoricalScoreboardForWeek', () => {
      let client;
      let leagueId;
      let matchupPeriodId;
      let scoringPeriodId;
      let seasonId;

      beforeEach(() => {
        leagueId = 213213;
        matchupPeriodId = 2;
        scoringPeriodId = 3;
        seasonId = 2017;

        client = new Client({ leagueId });

        jest.spyOn(http, 'get').mockImplementation();
      });

      describe('when the seasonId is prior to 2018', () => {
        test('does not throw an error', () => {
          expect(() => client.getHistoricalScoreboardForWeek({
            seasonId,
            matchupPeriodId,
            scoringPeriodId
          })).toThrow();
        });

        test('calls http.get with the correct params', () => {
          const routeBase = `${leagueId}`;
          const routeParams = `?scoringPeriodId=${scoringPeriodId}&seasonId=${seasonId}` +
            '&view=mMatchupScore&view=mScoreboard&view=mSettings&view=mTopPerformers&view=mTeam';
          const route = `${routeBase}${routeParams}`;

          const config = {};
          jest.spyOn(client, '_buildRequestConfig').mockReturnValue(config);
          http.get.mockReturnValue(UNSETTLED_RESPONSE);

          client.getHistoricalScoreboardForWeek({ seasonId, matchupPeriodId, scoringPeriodId });
          expect(http.get).toHaveBeenCalledWith(route, config);
        });

        describe('before the promise resolves', () => {
          test('does not invoke callback', () => {
            jest.spyOn(Boxscore, 'buildFromServer').mockImplementation();
            http.get.mockReturnValue(UNSETTLED_RESPONSE);

            client.getHistoricalScoreboardForWeek({ seasonId, matchupPeriodId, scoringPeriodId });
            expect(Boxscore.buildFromServer).not.toHaveBeenCalled();
          });
        });

        describe('after the promise resolves', () => {
          test('maps response data into Boxscores', async () => {
            const response = [{
              schedule: [{
                matchupPeriodId,
                home: { teamId: 2 },
                away: { teamId: 3 }
              }, {
                matchupPeriodId,
                home: { teamId: 5 },
                away: { teamId: 6 }
              }, {
                matchupPeriodId: matchupPeriodId + 1,
                home: { teamId: 6 },
                away: { teamId: 2 }
              }]
            }];

            const promise = Promise.resolve(response);
            http.get.mockReturnValue(promise);

            const boxscores = await client.getHistoricalScoreboardForWeek({
              seasonId, matchupPeriodId, scoringPeriodId
            });

            expect.hasAssertions();
            expect(boxscores.length).toBe(2);
            forEach(boxscores, (boxscore, index) => {
              expect(boxscore).toBeInstanceOf(Boxscore);
              expect(boxscore.homeTeamId).toBe(response[0].schedule[index].home.teamId);
              expect(boxscore.awayTeamId).toBe(response[0].schedule[index].away.teamId);
            });
          });
        });
      });

      describe('when the seasonId is 2018 or after', () => {
        test('throws an error', () => {
          http.get.mockReturnValue(UNSETTLED_RESPONSE);

          expect(() => client.getHistoricalScoreboardForWeek({
            seasonId: 2018,
            matchupPeriodId,
            scoringPeriodId
          })).toThrow();
        });
      });
    });

    describe('getFreeAgents', () => {
      let client;
      let leagueId;
      let scoringPeriodId;
      let seasonId;

      beforeEach(() => {
        leagueId = 213213;
        scoringPeriodId = 3;
        seasonId = 2018;

        client = new Client({ leagueId });

        jest.spyOn(http, 'get').mockImplementation();
      });

      describe('when the seasonId is prior to 2018', () => {
        test('throws an error', () => {
          expect(() => client.getFreeAgents({
            seasonId: 2017,
            scoringPeriodId
          })).toThrow();
        });
      });

      describe('when the seasonId is 2018 or after', () => {
        test('does not throw an error', () => {
          http.get.mockReturnValue(UNSETTLED_RESPONSE);

          expect(() => client.getFreeAgents({
            seasonId: 2018,
            scoringPeriodId
          })).not.toThrow();
        });

        test('calls _buildRequestConfig with additional headers', () => {
          jest.spyOn(client, '_buildRequestConfig').mockImplementation();
          http.get.mockReturnValue(UNSETTLED_RESPONSE);

          client.getFreeAgents({ seasonId, scoringPeriodId });
          expect(client._buildRequestConfig).toHaveBeenCalledWith({
            headers: {
              'x-fantasy-filter': JSON.stringify({
                players: {
                  filterStatus: {
                    value: ['FREEAGENT', 'WAIVERS']
                  },
                  limit: 2000,
                  sortPercOwned: {
                    sortAsc: false,
                    sortPriority: 1
                  }
                }
              })
            }
          });
        });

        test('calls http.get with the correct params', () => {
          const routeBase = `${seasonId}/segments/0/leagues/${leagueId}`;
          const routeParams = `?scoringPeriodId=${scoringPeriodId}&view=kona_player_info`;
          const route = `${routeBase}${routeParams}`;

          const config = {};
          jest.spyOn(client, '_buildRequestConfig').mockReturnValue(config);
          http.get.mockReturnValue(UNSETTLED_RESPONSE);

          client.getFreeAgents({ seasonId, scoringPeriodId });
          expect(http.get).toHaveBeenCalledWith(route, config);
        });

        describe('before the promise resolves', () => {
          test('does not invoke callback', () => {
            jest.spyOn(FreeAgentPlayer, 'buildFromServer').mockImplementation();
            http.get.mockReturnValue(UNSETTLED_RESPONSE);

            client.getFreeAgents({ seasonId, scoringPeriodId });
            expect(FreeAgentPlayer.buildFromServer).not.toHaveBeenCalled();
          });
        });

        describe('after the promise resolves', () => {
          test('maps response data into FreeAgentPlayers', async () => {
            const response = {
              players: [{
                player: {
                  firstName: 'Test',
                  lastName: 'McTestFace',
                  stats: [{
                    seasonId,
                    statSourceId: 1,
                    statSplitTypeId: 0,
                    stats: [{
                      23: 2341,
                      24: 234,
                      25: 123
                    }]
                  }]
                }
              }, {
                player: {
                  firstName: 'Stable',
                  lastName: 'Genius',
                  stats: [{
                    seasonId,
                    statSourceId: 1,
                    statSplitTypeId: 0,
                    stats: [{
                      23: 32,
                      24: 23124,
                      25: 0
                    }]
                  }]
                }
              }]
            };

            const promise = Promise.resolve(response);
            http.get.mockReturnValue(promise);

            const freeAgents = await client.getFreeAgents({ seasonId, scoringPeriodId });

            expect.hasAssertions();
            expect(freeAgents.length).toBe(2);
            forEach(freeAgents, (freeAgent, index) => {
              expect(freeAgent).toBeInstanceOf(FreeAgentPlayer);
              expect(freeAgent.firstName).toBe(
                response.players[index].player.firstName
              );
              expect(freeAgent.lastName).toBe(response.players[index].player.lastName);
            });
          });
        });
      });
    });

    describe('getTeamsAtWeek', () => {
      let client;
      let leagueId;
      let scoringPeriodId;
      let seasonId;

      beforeEach(() => {
        leagueId = 213213;
        scoringPeriodId = 3;
        seasonId = 2018;

        client = new Client({ leagueId });

        jest.spyOn(http, 'get').mockImplementation();
      });

      describe('when the seasonId is prior to 2018', () => {
        test('throws an error', () => {
          http.get.mockReturnValue(UNSETTLED_RESPONSE);

          expect(() => client.getTeamsAtWeek({
            seasonId: 2017,
            scoringPeriodId
          })).toThrow();
        });
      });

      describe('when the seasonId is 2018 or after', () => {
        test('does not throw an error', () => {
          http.get.mockReturnValue(UNSETTLED_RESPONSE);

          expect(() => client.getTeamsAtWeek({
            seasonId: 2018,
            scoringPeriodId
          })).not.toThrow();
        });

        test('calls http.get with the correct params', () => {
          const routeBase = `${seasonId}/segments/0/leagues/${leagueId}`;
          const routeParams =
            `?scoringPeriodId=${scoringPeriodId}&view=mRoster&view=mTeam&view=mStandings`;
          const route = `${routeBase}${routeParams}`;

          const config = {};
          jest.spyOn(client, '_buildRequestConfig').mockReturnValue(config);
          http.get.mockReturnValue(UNSETTLED_RESPONSE);

          client.getTeamsAtWeek({ seasonId, scoringPeriodId });
          expect(http.get).toHaveBeenCalledWith(route, config);
        });

        describe('before the promise resolves', () => {
          test('does not invoke callback', () => {
            jest.spyOn(Team, 'buildFromServer').mockImplementation();
            http.get.mockReturnValue(UNSETTLED_RESPONSE);

            client.getTeamsAtWeek({ seasonId, scoringPeriodId });
            expect(Team.buildFromServer).not.toHaveBeenCalled();
          });
        });

        describe('after the promise resolves', () => {
          test('maps response data into Teams', async () => {
            const response = {
              members: [{
                firstName: 'Owner',
                id: '{BAD5167F-96F5-40FF-AFF0-4D2CC92F4057}',
                lastName: 'Dude'
              }, {
                firstName: 'Owner',
                id: '{BAD5167F-96F5-40FF-AFF0-4D2CC92F4058}',
                lastName: 'Dude'
              }, {
                firstName: 'Owner',
                id: '{BAD5167F-96F5-40FF-AFF0-4D2CC92F4059}',
                lastName: 'Dude'
              }],
              teams: [{
                abbrev: 'SWAG',
                location: 'First ',
                nickname: 'Last',
                primaryOwner: '{BAD5167F-96F5-40FF-AFF0-4D2CC92F4058}',
                record: {
                  overall: {
                    wins: 3,
                    losses: 11
                  }
                },
                roster: {
                  entries: [{
                    playerPoolEntry: {
                      firstName: 'Joe',
                      lastName: 'Montana'
                    }
                  }]
                }
              }, {
                abbrev: 'JS',
                location: 'First ',
                nickname: 'Last',
                primaryOwner: '{BAD5167F-96F5-40FF-AFF0-4D2CC92F4059}',
                record: {
                  overall: {
                    wins: 5,
                    losses: 11
                  }
                },
                roster: {
                  entries: [{
                    playerPoolEntry: {
                      firstName: 'Joe',
                      lastName: 'Smith'
                    }
                  }]
                }
              }, {
                abbrev: 'SWAG',
                location: 'First ',
                nickname: 'Last',
                primaryOwner: '{BAD5167F-96F5-40FF-AFF0-4D2CC92F4057}',
                record: {
                  overall: {
                    wins: 11,
                    losses: 8
                  }
                },
                roster: {
                  entries: [{
                    playerPoolEntry: {
                      firstName: 'Joe',
                      lastName: 'Brown'
                    }
                  }]
                }
              }]
            };

            const promise = Promise.resolve(response);
            http.get.mockReturnValue(promise);

            const teams = await client.getTeamsAtWeek({ seasonId, scoringPeriodId });

            expect.hasAssertions();
            expect(teams.length).toBe(3);
            forEach(teams, (team, index) => {
              expect(team).toBeInstanceOf(Team);
              expect(team.abbreviation).toBe(response.teams[index].abbrev);
              expect(team.ownerName).toBe('Owner Dude');

              expect(team.wins).toBe(response.teams[index].record.overall.wins);
              expect(team.losses).toBe(response.teams[index].record.overall.losses);

              expect(team.roster).toEqual(expect.any(Array));
              expect(team.roster[0]).toBeInstanceOf(Player);
              expect(team.roster[0].firstName).toBe(
                response.teams[index].roster.entries[0].playerPoolEntry.firstName
              );
            });
          });

          describe('when a team\'s primaryOwner matches no league member', () => {
            test('builds the team without an ownerName rather than throwing', async () => {
              const response = {
                members: [{ firstName: 'Owner', id: '{PRESENT}', lastName: 'Dude' }],
                teams: [
                  { abbrev: 'SWAG', primaryOwner: '{PRESENT}' },
                  { abbrev: 'GONE', primaryOwner: '{DEPARTED-MANAGER}' }
                ]
              };
              http.get.mockReturnValue(Promise.resolve(response));

              const teams = await client.getTeamsAtWeek({ seasonId, scoringPeriodId });

              expect(teams.length).toBe(2);
              expect(teams[0].ownerName).toBe('Owner Dude');
              expect(teams[1].ownerName).toBeUndefined();
              expect(teams[1].abbreviation).toBe('GONE');
            });
          });

          describe('when the response carries no members at all', () => {
            test('builds the teams without ownerNames rather than throwing', async () => {
              const response = { teams: [{ abbrev: 'SWAG', primaryOwner: '{ANY}' }] };
              http.get.mockReturnValue(Promise.resolve(response));

              const teams = await client.getTeamsAtWeek({ seasonId, scoringPeriodId });

              expect(teams.length).toBe(1);
              expect(teams[0].abbreviation).toBe('SWAG');
              expect(teams[0].ownerName).toBeUndefined();
            });
          });
        });
      });
    });

    describe('getHistoricalTeamsAtWeek', () => {
      let client;
      let leagueId;
      let scoringPeriodId;
      let seasonId;

      beforeEach(() => {
        leagueId = 213213;
        scoringPeriodId = 3;
        seasonId = 2017;

        client = new Client({ leagueId });

        jest.spyOn(http, 'get').mockImplementation();
      });

      describe('when the seasonId is prior to 2018', () => {
        test('does not throw an error', () => {
          http.get.mockReturnValue(UNSETTLED_RESPONSE);

          expect(() => client.getHistoricalTeamsAtWeek({
            seasonId,
            scoringPeriodId
          })).not.toThrow();
        });

        test('calls http.get with the correct params', () => {
          const routeBase = `${leagueId}`;
          const routeParams = `?scoringPeriodId=${scoringPeriodId}&seasonId=${seasonId}&view=mMatchupScore&view=mScoreboard&view=mSettings&view=mTopPerformers&view=mTeam&view=mRoster`;
          const route = `${routeBase}${routeParams}`;
          const config = {};
          jest.spyOn(client, '_buildRequestConfig').mockReturnValue(config);
          http.get.mockReturnValue(UNSETTLED_RESPONSE);

          client.getHistoricalTeamsAtWeek({ seasonId, scoringPeriodId });
          expect(http.get).toHaveBeenCalledWith(route, config);
        });

        describe('before the promise resolves', () => {
          test('does not invoke callback', () => {
            jest.spyOn(Team, 'buildFromServer').mockImplementation();
            http.get.mockReturnValue(UNSETTLED_RESPONSE);

            client.getHistoricalTeamsAtWeek({ seasonId, scoringPeriodId });
            expect(Team.buildFromServer).not.toHaveBeenCalled();
          });
        });

        describe('after the promise resolves', () => {
          test('maps response data into Teams', async () => {
            const response = [{
              members: [{
                firstName: 'Owner',
                id: '{BAD5167F-96F5-40FF-AFF0-4D2CC92F4057}',
                lastName: 'Dude'
              }, {
                firstName: 'Owner',
                id: '{BAD5167F-96F5-40FF-AFF0-4D2CC92F4058}',
                lastName: 'Dude'
              }, {
                firstName: 'Owner',
                id: '{BAD5167F-96F5-40FF-AFF0-4D2CC92F4059}',
                lastName: 'Dude'
              }],
              teams: [{
                abbrev: 'SWAG',
                location: 'First ',
                nickname: 'Last',
                primaryOwner: '{BAD5167F-96F5-40FF-AFF0-4D2CC92F4058}',
                record: {
                  overall: {
                    wins: 3,
                    losses: 11
                  }
                },
                roster: {
                  entries: [{
                    playerPoolEntry: {
                      firstName: 'Joe',
                      lastName: 'Montana'
                    }
                  }]
                }
              }, {
                abbrev: 'JS',
                location: 'First ',
                nickname: 'Last',
                primaryOwner: '{BAD5167F-96F5-40FF-AFF0-4D2CC92F4059}',
                record: {
                  overall: {
                    wins: 5,
                    losses: 11
                  }
                },
                roster: {
                  entries: [{
                    playerPoolEntry: {
                      firstName: 'Joe',
                      lastName: 'Smith'
                    }
                  }]
                }
              }, {
                abbrev: 'SWAG',
                location: 'First ',
                nickname: 'Last',
                primaryOwner: '{BAD5167F-96F5-40FF-AFF0-4D2CC92F4057}',
                record: {
                  overall: {
                    wins: 11,
                    losses: 8
                  }
                },
                roster: {
                  entries: [{
                    playerPoolEntry: {
                      firstName: 'Joe',
                      lastName: 'Brown'
                    }
                  }]
                }
              }]
            }];

            const promise = Promise.resolve(response);
            http.get.mockReturnValue(promise);

            const teams = await client.getHistoricalTeamsAtWeek({ seasonId, scoringPeriodId });

            expect.hasAssertions();
            expect(teams.length).toBe(3);
            forEach(teams, (team, index) => {
              expect(team).toBeInstanceOf(Team);
              expect(team.abbreviation).toBe(response[0].teams[index].abbrev);

              expect(team.wins).toBe(response[0].teams[index].record.overall.wins);
              expect(team.losses).toBe(response[0].teams[index].record.overall.losses);

              expect(team.roster).toEqual(expect.any(Array));
              expect(team.roster[0]).toBeInstanceOf(Player);
              expect(team.roster[0].firstName).toBe(
                response[0].teams[index].roster.entries[0].playerPoolEntry.firstName
              );
            });
          });
        });
      });

      describe('when the seasonId is 2018 or after', () => {
        test('throws an error', () => {
          expect(() => client.getHistoricalTeamsAtWeek({
            seasonId: 2018,
            scoringPeriodId
          })).toThrow();
        });
      });
    });

    describe('getNFLGamesForPeriod', () => {
      let client;
      let endDate;
      let startDate;

      beforeEach(() => {
        startDate = '20190912';
        endDate = '20190917';

        client = new Client({ leagueId: 213213 });

        jest.spyOn(http, 'get').mockImplementation();
      });

      describe('when the seasonId is prior to 2018', () => {
        test('does not throw an error', () => {
          http.get.mockReturnValue(UNSETTLED_RESPONSE);

          expect(() => client.getNFLGamesForPeriod({
            startDate: '20171010'
          })).not.toThrow();
        });
      });

      describe('when the seasonId is 2018 or after', () => {
        test('does not throw an error', () => {
          http.get.mockReturnValue(UNSETTLED_RESPONSE);
          expect(() => client.getNFLGamesForPeriod({
            startDate: '20181010'
          })).not.toThrow();
        });
      });

      test('calls http.get with the correct params', () => {
        const routeBase = 'apis/fantasy/v2/games/ffl/games';
        const routeParams = `?dates=${startDate}-${endDate}&pbpOnly=true`; // cspell:disable-line pbp
        const route = `${routeBase}${routeParams}`;

        const config = {};
        jest.spyOn(client, '_buildRequestConfig').mockReturnValue(config);
        http.get.mockReturnValue(UNSETTLED_RESPONSE);

        client.getNFLGamesForPeriod({ startDate, endDate });
        expect(http.get).toHaveBeenCalledWith(route, config);
      });

      describe('before the promise resolves', () => {
        test('does not invoke callback', () => {
          jest.spyOn(NFLGame, 'buildFromServer').mockImplementation();
          http.get.mockReturnValue(UNSETTLED_RESPONSE);

          client.getNFLGamesForPeriod({ startDate, endDate });
          expect(NFLGame.buildFromServer).not.toHaveBeenCalled();
        });
      });

      describe('after the promise resolves', () => {
        test('maps response data into Teams', async () => {
          const response = {
            events: [{}, {}, {}]
          };

          const promise = Promise.resolve(response);
          http.get.mockReturnValue(promise);

          const games = await client.getNFLGamesForPeriod({ startDate, endDate });

          expect.hasAssertions();
          expect(games.length).toBe(3);
          forEach(games, (game) => {
            expect(game).toBeInstanceOf(NFLGame);
          });
        });
      });
    });

    describe('getLeagueInfo', () => {
      let client;
      let seasonId;

      beforeEach(() => {
        seasonId = 2018;

        client = new Client({ leagueId: 213213 });

        jest.spyOn(http, 'get').mockImplementation();
        // The tests relying on this mock only assert request construction, so they get a
        // response that never settles rather than one whose body the handler would reject.
        http.get.mockReturnValue(UNSETTLED_RESPONSE);
      });

      describe('when the seasonId is prior to 2018', () => {
        test('throws an error', () => {
          expect(() => client.getLeagueInfo({ seasonId: 2017 })).toThrow();
        });
      });

      describe('when the seasonId is 2018 or after', () => {
        test('does not throw an error', () => {
          expect(() => client.getLeagueInfo({ seasonId: 2018 })).not.toThrow();
        });

        test('calls http.get with the correct params', () => {
          const routeBase = `${seasonId}/segments/0/leagues/${client.leagueId}`;
          const routeParams = '?view=mSettings';
          const route = `${routeBase}${routeParams}`;

          const config = {};
          jest.spyOn(client, '_buildRequestConfig').mockReturnValue(config);

          client.getLeagueInfo({ seasonId });
          expect(http.get).toHaveBeenCalledWith(route, config);
        });

        describe('before the promise resolves', () => {
          test('does not invoke callback', () => {
            jest.spyOn(League, 'buildFromServer').mockImplementation();

            client.getLeagueInfo({ seasonId });
            expect(League.buildFromServer).not.toHaveBeenCalled();
          });
        });

        describe('after the promise resolves', () => {
          test('maps response data into Teams', async () => {
            const response = {
              settings: {
                name: 'some league',
                draftSettings: {},
                rosterSettings: {},
                scheduleSettings: {},
                scoringSettings: {
                  scoringItems: []
                }
              },
              status: {
                currentMatchupPeriod: 7,
                latestScoringPeriod: 7,
                firstScoringPeriod: 1,
                finalScoringPeriod: 17,
                previousSeasons: [2016, 2017]
              }
            };

            const promise = Promise.resolve(response);
            http.get.mockReturnValue(promise);

            const league = await client.getLeagueInfo({ seasonId });
            expect(league).toBeInstanceOf(League);
            // The whole `status` object is handed to League rather than picked apart here, so
            // assert the fields that reach the model through it.
            expect(league.name).toBe('some league');
            expect(league.currentMatchupPeriodId).toBe(7);
            expect(league.currentScoringPeriodId).toBe(7);
            expect(league.firstScoringPeriodId).toBe(1);
            expect(league.finalScoringPeriodId).toBe(17);
            expect(league.previousSeasons).toEqual([2016, 2017]);
          });
        });
      });
    });

    describe('getRecentActivity', () => {
      let client;
      let seasonId;

      const routeBase = (id, leagueId) => `apis/v3/games/ffl/seasons/${id}/segments/0/leagues/${leagueId}`;

      const mockResponses = ({ topics = [], teams = [], players = [] }) => {
        http.get
          .mockReturnValueOnce(Promise.resolve({ topics }))
          .mockReturnValueOnce(Promise.resolve({ teams }))
          .mockReturnValueOnce(Promise.resolve({ players }));
      };

      const filterOf = (callIndex) => JSON.parse(
        http.get.mock.calls[callIndex][1].headers['x-fantasy-filter']
      );

      beforeEach(() => {
        seasonId = 2018;

        client = new Client({ leagueId: 213213 });

        jest.spyOn(http, 'get').mockImplementation();
        mockResponses({});
      });

      describe('when the seasonId is prior to 2018', () => {
        test('throws an error', () => {
          expect(() => client.getRecentActivity({ seasonId: 2017 })).toThrow();
        });
      });

      describe('when the seasonId is 2018 or after', () => {
        test('does not throw an error', () => {
          expect(() => client.getRecentActivity({ seasonId })).not.toThrow();
        });

        test('calls http.get with the communication route first', () => {
          client.getRecentActivity({ seasonId });

          const route = `${routeBase(seasonId, client.leagueId)}/communication` +
            '?view=kona_league_communication';
          expect(http.get.mock.calls[0][0]).toBe(route);
        });

        test('requests the communication route from the lm-api-reads host', () => {
          client.getRecentActivity({ seasonId });

          expect(http.get.mock.calls[0][1].baseURL).toBe('https://lm-api-reads.fantasy.espn.com/');
        });

        describe('when msgType is not passed', () => {
          test('filters on every transaction message type', () => {
            client.getRecentActivity({ seasonId });

            const { filterIncludeMessageTypeIds } = filterOf(0).topics;
            expect(filterIncludeMessageTypeIds.value).toEqual([178, 180, 179, 239, 181, 244]);
          });
        });

        describe('when msgType is a key on ACTIVITY_MAP', () => {
          test('filters on only that message type', () => {
            client.getRecentActivity({ seasonId, msgType: 'WAIVER' });

            const { filterIncludeMessageTypeIds } = filterOf(0).topics;
            expect(filterIncludeMessageTypeIds.value).toEqual([180]);
          });
        });

        describe('when msgType is not a key on ACTIVITY_MAP', () => {
          test('falls back to every transaction message type', () => {
            client.getRecentActivity({ seasonId, msgType: 'NOT_A_TYPE' });

            const { filterIncludeMessageTypeIds } = filterOf(0).topics;
            expect(filterIncludeMessageTypeIds.value).toEqual([178, 180, 179, 239, 181, 244]);
          });
        });

        describe('after the promises resolve', () => {
          test('requests the league view second', async () => {
            await client.getRecentActivity({ seasonId });

            const route = `${routeBase(seasonId, client.leagueId)}` +
              '?view=mTeam&view=mRoster&view=mMatchup&view=mSettings&view=mStandings';
            expect(http.get.mock.calls[1][0]).toBe(route);
          });

          test('requests the player card view third', async () => {
            await client.getRecentActivity({ seasonId });

            const route = `${routeBase(seasonId, client.leagueId)}?view=kona_playercard`;
            expect(http.get.mock.calls[2][0]).toBe(route);
          });

          describe('when the targeted player is on the acting team roster', () => {
            test('uses the roster entry and does not look the player up', async () => {
              const rosterEntry = { playerId: 555, playerPoolEntry: { player: { fullName: 'A' } } };

              http.get.mockReset();
              mockResponses({
                topics: [{
                  date: 1600000000000,
                  messages: [{ messageTypeId: 178, to: 1, targetId: 555 }]
                }],
                teams: [{ id: 1, roster: { entries: [rosterEntry] } }],
                players: []
              });

              const activity = await client.getRecentActivity({ seasonId });

              expect(activity[0][0].player).toBe(rosterEntry);
              expect(filterOf(2).players.filterIds.value).toEqual([]);
            });
          });

          describe('when the targeted player is not on the acting team roster', () => {
            test('backfills the player from the player card response', async () => {
              const cardPlayer = { id: 777, player: { fullName: 'B' } };

              http.get.mockReset();
              mockResponses({
                topics: [{
                  date: 1600000000000,
                  messages: [{ messageTypeId: 179, to: 2, targetId: 777 }]
                }],
                teams: [{ id: 2, roster: { entries: [] } }],
                players: [cardPlayer]
              });

              const activity = await client.getRecentActivity({ seasonId });

              expect(activity[0][0].player).toBe(cardPlayer);
            });

            test('requests only the unresolved player ids', async () => {
              http.get.mockReset();
              mockResponses({
                topics: [{
                  date: 1600000000000,
                  messages: [{ messageTypeId: 179, to: 2, targetId: 777 }]
                }],
                teams: [{ id: 2, roster: { entries: [] } }],
                players: []
              });

              await client.getRecentActivity({ seasonId });

              expect(filterOf(2).players.filterIds.value).toEqual([777]);
            });
          });

          describe('when a topic holds several messages', () => {
            test('returns one action per message', async () => {
              http.get.mockReset();
              mockResponses({
                topics: [{
                  date: 1600000000000,
                  messages: [
                    { messageTypeId: 178, to: 1, targetId: 1 },
                    { messageTypeId: 179, to: 1, targetId: 2 }
                  ]
                }],
                teams: [{ id: 1, roster: { entries: [] } }],
                players: []
              });

              const activity = await client.getRecentActivity({ seasonId });

              expect(activity).toHaveLength(1);
              expect(activity[0]).toHaveLength(2);
            });
          });
        });
      });
    });

    describe('_buildActivity', () => {
      let client;
      let date;

      const buildTopic = (messages) => ({ date, messages });

      beforeEach(() => {
        date = 1600000000000;
        client = new Client({ leagueId: 213213 });
      });

      describe('when the message is a free agent add', () => {
        test('resolves the team from the "to" id', () => {
          const teams = [{ id: 1, roster: { entries: [] } }];
          const topic = buildTopic([{ messageTypeId: 178, to: 1, targetId: 99 }]);

          const [action] = client._buildActivity(topic, { teams });

          expect(action.team).toBe(teams[0]);
          expect(action.action).toBe('FA ADDED');
        });
      });

      describe('when the message is a waiver add', () => {
        test('reads the bid amount off the "from" field', () => {
          const teams = [{ id: 3, roster: { entries: [] } }];
          const topic = buildTopic([{
            messageTypeId: 180, to: 3, from: 42, targetId: 99
          }]);

          const [action] = client._buildActivity(topic, { teams });

          expect(action.action).toBe('WAIVER ADDED');
          expect(action.bidAmount).toBe(42);
        });

        test('defaults the bid amount to 0 when "from" is absent', () => {
          const teams = [{ id: 3, roster: { entries: [] } }];
          const topic = buildTopic([{ messageTypeId: 180, to: 3, targetId: 99 }]);

          const [action] = client._buildActivity(topic, { teams });

          expect(action.bidAmount).toBe(0);
        });
      });

      describe('when the message is a trade', () => {
        test('resolves the team from the "from" id', () => {
          const teams = [{ id: 4, roster: { entries: [] } }, { id: 5, roster: { entries: [] } }];
          const topic = buildTopic([{
            messageTypeId: 244, from: 4, to: 5, targetId: 99
          }]);

          const [action] = client._buildActivity(topic, { teams });

          expect(action.team).toBe(teams[0]);
          expect(action.action).toBe('TRADED');
        });
      });

      describe('when the message is a drop with a "for" id', () => {
        test('resolves the team from the "for" id', () => {
          const teams = [{ id: 6, roster: { entries: [] } }];
          const topic = buildTopic([{ messageTypeId: 239, for: 6, targetId: 99 }]);

          const [action] = client._buildActivity(topic, { teams });

          expect(action.team).toBe(teams[0]);
          expect(action.action).toBe('DROPPED');
        });
      });

      describe('when the message type is not recognized', () => {
        test('marks the action UNKNOWN', () => {
          const teams = [{ id: 7, roster: { entries: [] } }];
          const topic = buildTopic([{ messageTypeId: 1, to: 7, targetId: 99 }]);

          const [action] = client._buildActivity(topic, { teams });

          expect(action.action).toBe('UNKNOWN');
        });
      });

      describe('when the targeted player is on the team roster', () => {
        test('attaches the roster entry', () => {
          const entry = { playerId: 99 };
          const teams = [{ id: 8, roster: { entries: [entry] } }];
          const topic = buildTopic([{ messageTypeId: 178, to: 8, targetId: 99 }]);

          const [action] = client._buildActivity(topic, { teams });

          expect(action.player).toBe(entry);
        });
      });

      describe('when no team matches the message', () => {
        test('leaves the player unresolved', () => {
          const topic = buildTopic([{ messageTypeId: 178, to: 404, targetId: 99 }]);

          const [action] = client._buildActivity(topic, { teams: [] });

          expect(action.team).toBeUndefined();
          expect(action.player).toBeNull();
        });
      });

      test('carries the topic date, target id and raw ids onto each action', () => {
        const teams = [{ id: 9, roster: { entries: [] } }];
        const topic = buildTopic([{
          messageTypeId: 178, to: 9, from: 1, for: 2, targetId: 99
        }]);

        const [action] = client._buildActivity(topic, { teams });

        expect(action.date).toBe(date);
        expect(action.targetId).toBe(99);
        expect(action.ids).toEqual({ from: 1, for: 2, to: 9 });
      });

      describe('when the topic has no messages', () => {
        test('returns an empty array', () => {
          expect(client._buildActivity(buildTopic(undefined), { teams: [] })).toEqual([]);
        });
      });
    });
  });
});
