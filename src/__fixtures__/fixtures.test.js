import fs from 'node:fs';
import path from 'node:path';

import Boxscore from '../boxscore/boxscore.js';
import Client from '../client/client.js';
import FreeAgentPlayer from '../free-agent-player/free-agent-player.js';
import League from '../league/league.js';
import Team from '../team/team.js';

import activity from './activity.json';
import boxscores from './boxscores.json';
import freeAgents from './free-agents.json';
import leagueSettings from './league-settings.json';
import playerCards from './player-cards.json';
import teams from './teams.json';

/**
 * Replays recorded ESPN payloads through a real Client.
 *
 * Every other test in this project constructs the exact object the code under test expects. That
 * verifies the code does what it was written to do; it cannot verify that what it was written to do
 * matches what ESPN sends. The four defects this branch fixed were all of the second kind.
 *
 * The player, schedule and settings payloads here are real, trimmed from live 2026 responses. The
 * `teams`/`members` envelope and the activity topics are hand-written with invented names and
 * SWIDs, because this repository is public -- see the personal-data guard at the bottom.
 */
describe('recorded ESPN payloads', () => {
  const respond = (body) => ({
    ok: true, status: 200, statusText: 'OK', text: () => Promise.resolve(JSON.stringify(body))
  });

  const clientReturning = (...bodies) => {
    const fetchMock = jest.fn();
    bodies.forEach((body) => fetchMock.mockResolvedValueOnce(respond(body)));
    return new Client({ leagueId: 213213, fetch: fetchMock });
  };

  describe('getFreeAgents', () => {
    let players;

    beforeEach(async () => {
      players = await clientReturning(freeAgents)
        .getFreeAgents({ seasonId: 2026, scoringPeriodId: 1 });
    });

    test('builds a FreeAgentPlayer per player in the response', () => {
      expect(players).toHaveLength(freeAgents.players.length);
      players.forEach((player) => expect(player).toBeInstanceOf(FreeAgentPlayer));
    });

    // The regression that motivated this whole file. These are real defaultPositionIds off a real
    // 2026 payload, and reading them through the lineup-slot enum produced TQB, RB/WR, WR, WR/TE.
    test.each([
      ['Josh Allen', 'QB'],
      ['Jahmyr Gibbs', 'RB'],
      ['Ja\'Marr Chase', 'WR'],
      ['Trey McBride', 'TE'],
      ['Brandon Aubrey', 'K'],
      ['Texans D/ST', 'D/ST']
    ])('reads %s as a %s', (fullName, position) => {
      expect(players.find((p) => p.fullName === fullName).defaultPosition).toBe(position);
    });

    test('reads eligible positions through the lineup slot enum', () => {
      // Josh Allen's real eligibleSlots are [0, 7, 20, 21].
      expect(players.find((p) => p.fullName === 'Josh Allen').eligiblePositions)
        .toEqual(['QB', 'OP', 'Bench', 'IR']);
    });

    test('resolves the pro team from the real proTeamId', () => {
      const chase = players.find((p) => p.fullName === 'Ja\'Marr Chase');

      expect(chase.proTeam).toBe('Cincinnati Bengals');
      expect(chase.proTeamAbbreviation).toBe('CIN');
    });

    test('populates the season and scoring period stat splits ESPN sends', () => {
      const allen = players.find((p) => p.fullName === 'Josh Allen');

      expect(allen.projectedRawStatsForScoringPeriod).toBeDefined();
      expect(allen.rawStatsForYear).toBeDefined();
    });
  });

  describe('getTeamsAtWeek', () => {
    let parsed;

    beforeEach(async () => {
      parsed = await clientReturning(teams).getTeamsAtWeek({ seasonId: 2026, scoringPeriodId: 1 });
    });

    test('builds a Team per team in the response', () => {
      expect(parsed).toHaveLength(3);
      parsed.forEach((team) => expect(team).toBeInstanceOf(Team));
    });

    test('reads the record off the nested paths ESPN uses', () => {
      const [first] = parsed;

      expect(first.wins).toBe(9);
      expect(first.losses).toBe(4);
      expect(first.divisionWins).toBe(4);
      expect(first.homeWins).toBe(5);
      expect(first.awayWins).toBe(4);
      expect(first.streakType).toBe('WIN');
      expect(first.winningPercentage).toBe(69.23);
    });

    test('reads the mStandings-only simulation fields', () => {
      expect(parsed[0].playoffPct).toBe(0.97);
      expect(parsed[0].simulatedRank).toBe(2.3);
      expect(parsed[0].playoffClinchType).toBe('CLINCHED_PLAYOFF_BERTH');
    });

    test('joins the owner in from members', () => {
      expect(parsed[0].ownerName).toBe('Ada Fixture');
    });

    test('leaves ownerName unset when ESPN sends only blank names', () => {
      expect(parsed[1].ownerName).toBeUndefined();
    });

    // A departed manager has no members entry at all.
    test('leaves ownerName unset for a team whose owner has left the league', () => {
      expect(parsed[2].ownerName).toBeUndefined();
    });

    test('builds the roster from the nested playerPoolEntry', () => {
      expect(parsed[0].roster).toHaveLength(2);
      expect(parsed[0].roster[0].fullName).toEqual(expect.any(String));
    });
  });

  describe('getBoxscoreForWeek', () => {
    let parsed;

    beforeEach(async () => {
      parsed = await clientReturning(boxscores).getBoxscoreForWeek({
        seasonId: 2026, matchupPeriodId: 1, scoringPeriodId: 1
      });
    });

    test('builds a Boxscore per matchup in the requested period', () => {
      expect(parsed.length).toBeGreaterThan(0);
      parsed.forEach((boxscore) => expect(boxscore).toBeInstanceOf(Boxscore));
    });

    test('reads both rosters off rosterForCurrentScoringPeriod.entries', () => {
      expect(parsed[0].homeRoster).toHaveLength(2);
      expect(parsed[0].awayRoster).toHaveLength(2);
    });

    test('reads the rostered position through the lineup slot enum', () => {
      parsed[0].homeRoster.forEach((player) => {
        expect(player.rosteredPosition).toEqual(expect.any(String));
      });
    });

    test('inherits the matchup half of the response', () => {
      expect(parsed[0].homeTeamId).toEqual(expect.any(Number));
      expect(parsed[0].winner).toEqual(expect.any(String));
    });
  });

  describe('getLeagueInfo', () => {
    let league;

    beforeEach(async () => {
      league = await clientReturning(leagueSettings).getLeagueInfo({ seasonId: 2026 });
    });

    test('builds a League', () => {
      expect(league).toBeInstanceOf(League);
    });

    test('reads the settings sub-objects ESPN nests', () => {
      expect(league.rosterSettings.lineupPositionCount).toEqual(expect.any(Object));
      expect(league.scheduleSettings.numberOfRegularSeasonMatchups).toEqual(expect.any(Number));
      expect(league.acquisitionSettings.budget).toEqual(expect.any(Number));
      expect(league.tradeSettings.deadlineDate).toBeInstanceOf(Date);
    });

    test('separates base scoring from D/ST overrides on a real payload', () => {
      // statId 89 is defensive points allowed: worth nothing to anyone, 5 to a D/ST.
      expect(league.scoringSettings.base.defensive0PointsAllowed).toBe(0);
      expect(league.scoringSettings.overrides['D/ST'].defensive0PointsAllowed).toBe(5);
    });

    test('keeps a real scoring rule whose stat id this project cannot name', () => {
      // statId 63 is worth 6 points in this league and had no entry in scoringItemToId.
      expect(league.scoringSettings.base.statId63).toBe(6);
    });

    test('rekeys lineup slot counts by position', () => {
      expect(Object.keys(league.rosterSettings.lineupPositionCount)).toContain('QB');
    });
  });

  describe('getRecentActivity', () => {
    let parsed;

    beforeEach(async () => {
      parsed = await clientReturning(activity, teams, playerCards)
        .getRecentActivity({ seasonId: 2026 });
    });

    test('returns one array of actions per topic', () => {
      expect(parsed).toHaveLength(activity.topics.length);
    });

    test('labels each ESPN message type', () => {
      expect(parsed[0].map((action) => action.action)).toEqual(['FA ADDED', 'DROPPED']);
      expect(parsed[1][0].action).toBe('WAIVER ADDED');
      expect(parsed[2].map((action) => action.action)).toEqual(['TRADED', 'UNKNOWN']);
    });

    test('reads the winning bid off the field ESPN reuses for it', () => {
      expect(parsed[1][0].bidAmount).toBe(17);
    });

    test('attributes a trade to the team that gave the player up', () => {
      expect(parsed[2][0].team.id).toBe(1);
    });

    test('resolves a player still on the roster without a player-card lookup', () => {
      expect(parsed[0][0].player.playerPoolEntry.player.fullName).toEqual(expect.any(String));
    });

    test('resolves a name from the roster shape', () => {
      expect(parsed[0][0].playerName).toEqual(expect.any(String));
      expect(parsed[0][0].playerName).toBe(parsed[0][0].player.playerPoolEntry.player.fullName);
    });

    test('resolves a name from the player-card shape too', () => {
      // The point of the field: the two raw shapes nest the name differently, and a caller
      // reading them by hand has to know that. Here both come back the same way.
      expect(parsed[1][0].playerName).toBe('Waiver Fixture');
      expect(parsed[2][0].playerName).toBe('Traded Fixture');
    });

    test('leaves the name undefined when the player resolved to nothing', () => {
      // The UNKNOWN message targets an id on no roster and in no card response.
      expect(parsed[2][1].playerName).toBeUndefined();
    });

    test('falls back to the player-card response for a player on no roster', () => {
      // The card response wraps each player, the same way kona_player_info does -- which is why
      // the two shapes exist and why playerName below is worth having.
      expect(parsed[1][0].player.player.fullName).toBe('Waiver Fixture');
    });
  });

  // Fail-closed backstop rather than a scrubber. This repository is public, so the check is that
  // no real identifier can reach it, whatever a future fixture is cut from.
  //
  // Note this is an allowlist, not a deny-list of real names. A deny-list would have to spell out
  // the very names it exists to keep out of a public repository.
  describe('no personal data', () => {
    const files = fs.readdirSync(__dirname)
      .filter((name) => name.endsWith('.json'))
      .map((name) => [name, fs.readFileSync(path.join(__dirname, name), 'utf8')]);

    /**
     * Every ESPN league-member object in a parsed fixture.
     *
     * A member is identified by carrying `displayName`; NFL player objects have `firstName` and
     * `lastName` but never that, which is what keeps real players -- public figures, and the point
     * of the payload -- out of this check.
     *
     * @param   {*} node The value to walk.
     * @returns {object[]} The member objects found beneath it.
     */
    const membersIn = (node) => {
      if (Array.isArray(node)) {
        return node.flatMap(membersIn);
      }
      if (node === null || typeof node !== 'object') {
        return [];
      }
      const nested = Object.values(node).flatMap(membersIn);
      return node.displayName === undefined ? nested : [node, ...nested];
    };

    // The synthetic identities the fixtures are allowed to contain.
    const ALLOWED_NAMES = ['Ada', 'Fixture', 'ada-fixture', 'blank-fixture', ''];

    test('there are fixtures to check', () => {
      expect(files.length).toBeGreaterThan(0);
    });

    test.each(files)('%s carries no real SWID', (name, contents) => {
      const identifiers = contents.match(
        /\{[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}\}/g
      ) ?? [];

      // Every synthetic SWID is zeroed but for its last block. A real one is not.
      identifiers.forEach((id) => expect(id).toMatch(/^\{00000000-0000-0000-0000-0000/));
    });

    test.each(files)('%s names only synthetic league members', (name, contents) => {
      membersIn(JSON.parse(contents)).forEach((member) => {
        [member.firstName, member.lastName, member.displayName].forEach((value) => {
          expect(ALLOWED_NAMES).toContain((value ?? '').trim());
        });
      });
    });
  });
});
