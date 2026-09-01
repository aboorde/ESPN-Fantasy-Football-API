# ESPN Fantasy Football API
[![npm](https://img.shields.io/npm/v/espn-fantasy-football-api.svg?colorB=deepskyblue)](https://www.npmjs.com/package/espn-fantasy-football-api) [![node](https://img.shields.io/node/v/espn-fantasy-football-api.svg)](https://www.npmjs.com/package/espn-fantasy-football-api) [![Blazing Fast](https://img.shields.io/badge/speed-blazing%20%F0%9F%94%A5-brightgreen.svg)](https://twitter.com/acdlite/status/974390255393505280)


A Javascript API client for both web and NodeJS that connects to the updated v3 ESPN fantasy football API. Available as an npm package.

## About this repository

This repository tracks [`mkreiser/ESPN-Fantasy-Football-API`](https://github.com/mkreiser/ESPN-Fantasy-Football-API)
`main` (currently v2.0.1) and adds one method on top of it: [`getRecentActivity`](#getting-recent-activity),
which returns a league's recent transactions.

It is not published to npm. The built bundles are committed so it can be installed straight from git,
pinned to a commit:

```
npm install --save git+https://github.com/aboorde/ESPN-Fantasy-Football-API.git#<commit-sha>
```

`package.json` carries a `-wpfl` prerelease suffix (e.g. `2.0.1-wpfl.2`) so that an installed copy is
distinguishable from the published `espn-fantasy-football-api` at the same upstream version.

When re-syncing with upstream, run `npm run build` and commit the regenerated bundles. CI enforces it.

### Toolchain

The build and test tooling has been modernized past upstream: ESLint 10 (flat config, no
airbnb), Jest 30, jsdoc 4 and cspell 10. Several consequences are worth knowing:

* **Node 22.18+ is required.** cspell 10 sets that floor, and `engines.node` matches it rather
  than claiming something lower: Node 18 and 20 both reached end-of-life (April 2025 and April
  2026), so a lower floor would be advertising support that nothing verifies. The bundles
  themselves use nothing newer than optional chaining and would run on far older Node — that is
  just not a configuration this repository tests. `.nvmrc` pins 24, because the committed
  bundles are byte-compared against a fresh build by `npm run ci`.
* **The bundles are no longer ES5, and are no longer transpiled at all.** Upstream compiled to
  ES5 by accident of Babel 7's default targets. This repository declares an explicit
  `browserslist` (`defaults, not op_mini all`), which resolves to Chrome 109 and newer —
  everything this package uses, including static class fields and optional chaining, is native
  there. Measured: `@babel/preset-env` transformed nothing, and removing babel-loader left
  `node.js` byte-for-byte identical. So webpack now consumes `src/` directly and Babel is not
  part of the build. Node consumers are unaffected.
* **Babel is a test-only dependency.** `babel-jest` rewrites `src/`'s ESM to CommonJS so Jest can
  load it, and `babel.config.js` carries the single plugin that does it. `@babel/core` is pinned
  to 7 to match the copy Jest itself depends on: Jest 30 requires `@babel/core@^7` outright, and
  a Babel 8 at the root collided with the `@babel/plugin-syntax-*` packages Jest pulls in, which
  are frozen at 7 because Babel 8 deleted them. That collision produced roughly two hundred
  `npm warn ERESOLVE` lines on every install.
* **One universal bundle replaced the web/node pair.** axios shipped separate browser and NodeJS
  adapters, and that was the only reason two builds existed; without it they differed by 154
  bytes. `output.globalObject` is now `this`, so a single UMD bundle loads in either environment.
  `web.js` and `web-dev.js` are gone and `main` points at `node.js`.
* **Requests use the platform's native `fetch`.** axios was removed; it accounted for 63% of the
  Node bundle's module bytes, and every feature this project used of it has a native equivalent.
  Three things change for consumers. A non-2xx response now rejects with an exported `HttpError`
  carrying `status`, `statusText`, `data` and `url` rather than an `AxiosError` — note it
  deliberately omits request headers, which hold your cookies. A 2xx response whose body is not
  JSON now throws instead of resolving to a raw string, which previously surfaced an ESPN
  maintenance page as an empty result array. And native `fetch` does not read `HTTP_PROXY` /
  `HTTPS_PROXY` automatically the way axios did; on Node 24+, run with `--use-env-proxy` (or set
  `NODE_USE_ENV_PROXY=1`) if you need proxy support.
* **TypeScript declarations ship with the package.** `node.d.ts` and `types/` are generated from
  the jsdoc in `src/` by `npm run build`, so the jsdoc stays the single source of truth and the
  declarations cannot drift from it — `npm run ci` fails if they do. TypeScript consumers get
  them automatically from `import ... from 'espn-fantasy-football-api/node.js'`; there is no
  need to hand-maintain an ambient `declare module` block.

## Features

* Supports pulling data from ESPN
* Private league support (NodeJS version only, see [Important Notes](#important-notes))
* Highly documented
* Built for speed and efficiency with caching support
* Built for extensibility by using ES6 classes

## Documentation Reference

Generate the API docs locally with `npm run build:docs`, or `npm run serve:docs` to
build and serve them on port 8080. Output lands in `docs/` and is not committed.

(Upstream publishes hosted docs for its own releases at
http://espn-fantasy-football-api.s3-website.us-east-2.amazonaws.com/. That bucket is
mkreiser's and does not reflect this repository, so `getRecentActivity` is absent from it.)

## Installation

```
npm install --save git+https://github.com/aboorde/ESPN-Fantasy-Football-API.git#<commit-sha>
```

(Installing `espn-fantasy-football-api` from npm gets you upstream, without `getRecentActivity`.)

There are two files exported in the package:

* `node.js` - Production build (**main/default file**). Despite the name it is universal: the UMD
  wrapper binds to `this`, so the same file loads under NodeJS, in a browser, and via AMD. The
  name is kept so existing `espn-fantasy-football-api/node.js` imports keep resolving.
* `node-dev.js` - The same build, unminified, to make debugging/developing easier.

## Important Notes

### ESPN Databases and Data Storage

This project simply retrieves data from ESPN and formats the responses in an easy to read and use format. ESPN is still responsible for maintaining and providing the data. Recently, many have noticed league data disappearing from previous years, including in other ESPN fantasy sports. This appears to be a result of ESPN deleting this data. While some data exists before 2017 (as of Feb. 1, 2019), some data (such as boxscores) is not longer available.

### ESPN API Changes

Since this project wraps the ESPN API, any breaking changes to the ESPN API will break this project. This occurred in February 2019 when ESPN migrated from their v2 API to a new v3 API (the original version of this project was completed in Janurary 2019). This project has been updated to consume ESPN's v3 API.

### Private Leagues

Private leagues currently only work with the NodeJS version of this project, due to limitations in setting headers in browsers.

## How to use

### ESPN API Conventions

* `leagueId` is the id for your league.
  * Example: `387659`
* `seasonId` matches the year in which the season was played.
  * Example: `2018`
* `matchupPeriod` refers to an entire match-up, including if the match-up lasts multiple weeks (not rare in playoff settings for smaller leagues).
  * Example: `3` refers to the third matchup in your league.
* `scoringPeriod` refers to a single NFL week. Since most matchups are 1 week long, the `scoringPeriod` will typically match the `matchupPeriod`. However, for multi-week matchups, `scoringPeriod` allows one to get information about a specific week in the match-up (useful in multi-week playoff match-up).
  * Example: `3` refers to the third week of the NFL season.
  * **Note**: A `scoringPeriodId` of `0` refers to the preseason before any games are played. A `scoringPeriodId` of `18` refers to the end of the season.

* If both a `matchupPeriod` and a `scoringPeriod` are used, the `scoringPeriod` takes precedence.

### Importing ESPN Fantasy Football API

```javascript
// ES6
import { ... } from 'espn-fantasy-football-api'; // production build
import { ... } from 'espn-fantasy-football-api/node'; // the same build, named explicitly
import { ... } from 'espn-fantasy-football-api/node-dev'; // unminified development build

// ES5
const { ... } = require('espn-fantasy-football-api'); // production build
const { ... } = require('espn-fantasy-football-api/node'); // the same build, named explicitly
const { ... } = require('espn-fantasy-football-api/node-dev'); // unminified development build
```

### How to Get Data

#### Creating a Client

This will allow you to call the various methods on the `Client` class to grab data for the passed league. For working with multiple leagues, create multiple `Client` instances.

```javascript
import { Client } from 'espn-fantasy-football-api';
const myClient = new Client({ leagueId: 432132 });
```

`getBoxscoreForWeek` returns one week's matchups with full rosters.
`getScheduleForSeason` returns every matchup in the season without rosters, which is what answers
"who do I play in week 12", strength of schedule, and the shape of the playoff bracket. Note that
ESPN only adds playoff matchups to the schedule once it has generated them, so before then the
highest `matchupPeriodId` returned is the last regular season week.

#### Working with Private Leagues

You need two cookies from ESPN: `espn_s2` and `SWID`. These are found at "Application > Cookies > espn.com" in the Chrome DevTools when on espn.com.

**Note**: As specified before, this functionality only works in NodeJS.

```javascript
const client = new Client({
  leagueId: 12345,
  espnS2: 'YOUR_ESPN_S2',
  SWID: 'YOUR_SWID'
});

/* OR */

const myClient = new Client({ leagueId: 12345 });
myClient.setCookies({ espnS2: 'YOUR_ESPN_S2', SWID: 'YOUR_SWID' });
```

#### Getting Recent Activity

`getRecentActivity` returns the league's most recent transactions, newest first. It is specific to
this repository and is not available in the upstream package.

```javascript
const activity = await myClient.getRecentActivity({ seasonId: 2024 });
```

The result is an array of activity topics, each holding one action per message in that topic:

```javascript
[
  [
    {
      team,        // the Team's raw response data, or undefined if it could not be resolved
      action,      // 'FA ADDED' | 'WAIVER ADDED' | 'DROPPED' | 'TRADED' | 'UNKNOWN'
      player,      // the roster entry, or the player card when the player is no longer rostered
      bidAmount,   // the winning bid on a 'WAIVER ADDED' action, otherwise 0
      date,        // the topic's timestamp, in epoch milliseconds
      targetId,    // the ESPN player id the message refers to
      ids          // the raw { from, for, to } team ids off the message
    }
  ]
]
```

Pass `msgType` to restrict the result to a single kind of transaction. It accepts `'FA'`, `'WAIVER'`
or `'TRADED'`; anything else is ignored and every type is returned.

```javascript
const trades = await myClient.getRecentActivity({ seasonId: 2024, msgType: 'TRADED' });
```

This method requires `seasonId` to be 2018 or later, and needs cookies set for private leagues.

## Example Project Usage

The following script calculate the best possible lineup each team could have started for a week:

```javascript
const _ = require('lodash');
const { Client } = require('espn-fantasy-football-api/node');

const myClient = new Client({
  leagueId: 12345,
  espnS2: 'YOUR_ESPN_S2',
  SWID: 'YOUR_SWID'
});

class Psychic {
  static filterPosition(boxscorePlayer, position) {
    return (
      boxscorePlayer.position === position ||
      _.includes(boxscorePlayer.player.eligiblePositions, position)
    );
  }

  static handleNonFlexPosition(lineup, position) {
    const players = _.filter(lineup, (player) => this.filterPosition(player, position));
    const sortedPlayers = _.sortBy(players, ['totalPoints']);
    return _.last(sortedPlayers);
  }

  static analyzeLineup(lineup, score) {
    let bestSum = 0;
    const bestRoster = [];
    let numChanges = 0;

    const bestQB = this.handleNonFlexPosition(lineup, 'QB')
    bestRoster.push(bestQB.player.fullName);
    bestSum += bestQB.totalPoints;
    if (bestQB.position === 'Bench') {
      numChanges += 1;
    }

    const bestDefense = this.handleNonFlexPosition(lineup, 'D/ST')
    bestRoster.push(bestDefense.player.fullName);
    bestSum += bestDefense.totalPoints;
    if (bestDefense.position === 'Bench') {
      numChanges += 1;
    }

    const bestKicker = this.handleNonFlexPosition(lineup, 'K')
    bestRoster.push(bestKicker.player.fullName);
    bestSum += bestKicker.totalPoints;
    if (bestKicker.position === 'Bench') {
      numChanges += 1;
    }


    const flexPlayers = _.filter(lineup, (player) => this.filterPosition(player, 'RB') ||
      this.filterPosition(player, 'WR') ||
      this.filterPosition(player, 'TE')
    );
    const sortedFlexPlayers = _.sortBy(flexPlayers, ['totalPoints']);

    const flexPos = { RB: 2, WR: 2, TE: 1, FLEX: 1 };

    while (_.sum(_.values(flexPos)) && !_.isEmpty(sortedFlexPlayers)) {
      const player = sortedFlexPlayers.pop();
      const acceptPlayer = () => {
        bestRoster.push(player.player.fullName);
        bestSum += player.totalPoints;
        if (player.position === 'Bench') {
          numChanges += 1;
        }
      }

      if (flexPos.RB && _.includes(player.player.eligiblePositions, 'RB')) {
        acceptPlayer();
        flexPos.RB -= 1;
      } else if (flexPos.WR && _.includes(player.player.eligiblePositions, 'WR')) {
        acceptPlayer();
        flexPos.WR -= 1;
      } else if (flexPos.TE && _.includes(player.player.eligiblePositions, 'TE')) {
        acceptPlayer();
        flexPos.TE -= 1;
      } else if (flexPos.FLEX) {
        acceptPlayer();
        flexPos.FLEX -= 1;
      }
    }

    return {
      bestSum,
      bestRoster,
      currentScore: score,
      numChanges
    };
  }

  static runForWeek({ seasonId, matchupPeriodId, scoringPeriodId }) {
    const bestLineups = {};
    return myClient.getBoxscoreForWeek({ seasonId, matchupPeriodId, scoringPeriodId }).then((boxes) => {
      _.forEach(boxes, (box) => {
        bestLineups[box.awayTeamId] = this.analyzeLineup(box.awayRoster, box.awayScore);
        bestLineups[box.homeTeamId] = this.analyzeLineup(box.homeRoster, box.homeScore);
      });

      return bestLineups;
    });
  }
}

Psychic.runForWeek({ seasonId: 2019, matchupPeriodId: 4, scoringPeriodId: 4 }).then((result) => {
  console.log(result);
  return result;
});
```

## Built With

[babel](https://github.com/babel/babel) + [webpack](https://github.com/webpack/webpack) - Compiles and bundles ES6 and next-gen Javascript to browser-compatible Javascript.

[eslint](https://github.com/eslint/eslint) - Fast code linting to maintain good style and code patterns.

[jest](https://github.com/facebook/jest) - Powerful and fast testing platform.

[jsdoc](https://github.com/jsdoc3/jsdoc) - Generated code documentation.

[lodash](https://github.com/lodash/lodash) - Utility library.

## Versioning

This project uses [Semantic Versioning](https://semver.org/).

## License

This project is licensed under [LGPL-3.0](https://choosealicense.com/licenses/lgpl-3.0/) (see LICENSE for details). Essentially, don't take this project and close source it.

This is my first time writing OSS and picking a license. Feel free to reach out with questions and/or concerns.

## npm scripts

| Script           | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| build            | Builds the bundles and the TypeScript declarations.          |
| build:docs       | Builds the docs.                                             |
| clean            | Runs all clean scripts.                                      |
| clean:dist       | Removes the built bundles and declarations.                  |
| clean:docs       | Removes the docs folder.                                     |
| ci               | Runs continuous integration tasks: clean, lint, unit tests, build, build:docs, and verify:artifacts. Does not run the integration tests. |
| lint             | Runs all lint tasks                                          |
| lint:js          | Ensures code style is correct. File set comes from `eslint.config.mjs`. |
| lint:spelling    | Ensures spelling is correct.                                 |
| serve:docs       | Builds and serves docs. Defaults to port 8080.               |
| test             | Starts a jest test runner with access to all unit tests. Pass `--watch` to keep jest alive and watching for changes. Pass a string as a file inclusion pattern. |
| test:integration | Runs the integration tests.                                  |
| verify:artifacts | Fails if the committed bundles or declarations no longer match `src/`. Run `build` and commit the result. |
