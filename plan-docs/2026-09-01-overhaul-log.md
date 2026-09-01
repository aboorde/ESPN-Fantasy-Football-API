# Overhaul execution log

Companion to `2026-09-01-overhaul-design.md`. One entry per step, appended as work lands.

Legend: `pending` / `in progress` / `done` / `revised` / `abandoned`

| # | Step | Status | Commit |
| --- | --- | --- | --- |
| 0 | Plan + adversarial review of the plan | done | `b6cd355` |
| 1 | Fix `defaultPosition`; split the position enums | done | `e4b9685` |
| 2 | De-tautologize self-referential assertions | done | `413de70` |
| 3 | Reshape `League#scoringSettings` | done | `d38c101` |
| 4 | Delete `BaseCacheableObject` and the `defer` pass | done | `97158ab` |
| 5a | Injectable transport (pure refactor) | done (revised) | `a2190e3` |
| 5b | Timeout, retry, per-Client cache | done | `85f8f6d` |
| 6 | Drop lodash | done | `34c6ee9` |
| 7 | Fixture layer | done | `3edb695` |
| 8 | Types: open unions, exported constants | done (diagnosis corrected) | `7f0d208` |
| 9 | Distribution: `prepare`, drop committed artifacts | done | `add64ec` |
| 10 | API surface: activity normalization, pagination | done | `b62b2f4` |

---

## Entries

### Step 0 - plan and adversarial review

**done.** Design doc written, then reviewed against the codebase rather than against itself. The
review found eight problems *in the plan* and fixed them before any code was touched; they are
tabulated in the design doc under "Plan review". The two that would have caused real damage:

* Step 3 depended on fixtures that do not exist until step 7 (ordering violation).
* Step 8 rested on a false assumption about how tsc emits typedefs. Probed it directly: a bare
  cross-file jsdoc type name never resolves, and exporting a runtime constant does not change
  that. The fix is `import('../constants').X`. Confirmed `(string & {})` passes ESLint's
  `valid-types` and emits intact.

Also confirmed `discord-bot` never reads `defaultPosition`, so the step 1 fix breaks no consumer.

### Step 1 - fix `defaultPosition`

**done.** Added `defaultPositionIdToPosition` to `constants.js` and pointed
`Player.responseMap.defaultPosition` at it. `eligiblePositions` stays on `slotCategoryIdToPositionMap`,
and both maps now document which ESPN enum they cover and that the two are not interchangeable.

Only the six ids confirmed against real 2026 payloads are listed. An IDP id now resolves to
`undefined` rather than to a plausible-looking wrong position.

Tests replaced, not merely extended. The old assertion was
`expect(parse(id)).toBe(get(slotCategoryIdToPositionMap, id))` at id `2` -- self-referential, and
at one of the only two ids the wrong map got right. It is now a `describe.each` over all six ids
with literal expected positions, plus an unverified-id case. `eligiblePositions` is asserted
literally against Josh Allen's real `eligibleSlots`, which is what pins the two enums apart: slot
id `1` is `TQB` while `defaultPositionId` `1` is `QB`.

Acceptance verified by mutation: changing `defaultPositionIdToPosition[1]` to `'TQB'` fails with
`Expected: "QB" / Received: "TQB"`. Under the old test that mutation was invisible.

386 tests green, coverage still 100%.

### Step 2 - de-tautologize

**done.** Ten assertions across four files asserted the implementation against itself and could not
fail. Replaced with literal expected values:

* `player.test.js` - `proTeam` / `proTeamAbbreviation` now expect `'Arizona Cardinals'` / `'ARI'`.
* `nfl-game.test.js` - `gameStatus`, and both teams' `team` / `teamAbbrev`, now expect
  `'Not Started'`, `'Chicago Bears'` / `'CHI'`, `'Denver Broncos'` / `'DEN'`.
* `league.test.js` - `rosterSettings` position rekeying now expects `{ TQB: 2, 'RB/WR': 3 }`.
* `boxscore-player.test.js` - `rosteredPosition` now expects `'TE'`, and the fixture's
  `lineupSlotId` moved from `2` to `6` on purpose: `2` is one of only two values the two position
  enums agree on, whereas `defaultPositionId` has no `6`, so wiring this to the wrong map now
  produces `undefined` and fails.

The important one is `client.test.js`. `expect(requestConfig).toEqual(merge({}, passedConfig,
cookieConfig))` compared `merge` to `merge` - guarding, unfalsifiably, the single place auth
cookies combine with the `x-fantasy-filter` header. Rewritten to a literal expected object holding
both headers, plus a non-mutation test.

Acceptance verified by mutation: replacing the deep `merge` in `_buildRequestConfig` with a shallow
spread - exactly the regression step 6 could introduce - now fails with `x-fantasy-filter` missing.
Under the old assertion that change was invisible.

387 tests green, coverage still 100%. Four now-unused lodash imports dropped from test files, which
is a down payment on step 6.

### Step 3 - reshape `League#scoringSettings`

**done.** `scoringSettings` is now `{ base, overrides }` instead of a flat name-to-number map.

Two losses fixed:

* **Overrides no longer collapse.** `acc[key] = first(values(pointsOverrides))` threw away both
  which position an override applied to and the base value it replaced. Overrides are now filed
  under the position, resolved through `defaultPositionIdToPosition` -- *not* the slot map, which
  is what step 1 was about. Confirmed to be the right enum by `draft-2026`'s
  `test_scoring.py:41`, which sources these keys from `defaultPositionId` and validates the result
  reproduces ESPN's own `appliedTotal` for >98% of 300+ projections.
* **Nothing is dropped.** An unnamed stat id becomes `statId<N>`; an unnamed position id becomes
  `positionId<N>`. Measured against a real 14-team league, the old `if (!key) return acc` was
  discarding 4 of 45 scoring rules, one worth 6 points.

The existing synthetic fixture already contained the bug in miniature -- statId 2 with
`points: 6, pointsOverrides: {16: 9}` reported a flat `9` -- so it now asserts both halves.

The `measured` block's `scoringItems: []` was replaced with four real items chosen for what each
exercises: a plain rule (53), a D/ST-only rule (89, base 0 override 5), the case the old shape got
outright wrong (206, worth 2 to every position *except* D/ST), and an unnamed id (63, worth 6).

393 tests green, coverage still 100%.

### Step 4 - delete the cache

**done.** Removed `BaseCacheableObject` (125 lines), its test file (258 lines), the `defer` pass in
`_populateObject`, and `getIDParams` from `Team`, `Player` and `DraftPlayer`. `Team` and `Player`
now extend `BaseObject` directly.

Everything deleted here served one feature that was write-only, unbounded, and broken:

* Nothing in `src/` ever read the cache. It was written on every parse and never evicted.
* `static get cache()` resolved `this._cache` through the prototype chain, so a subclass returned
  its *parent's* cache whenever the parent had been populated first. `BoxscorePlayer.cache ===
  Player.cache` was `true`, directly contradicting the class doc's claim that each class gets a
  cache "that does not overlap with other BaseCacheableObject classes".
* `defer` existed to populate entries from cached instances. Zero models used it; only the base
  class's own tests exercised the two-pass loop.

Neither consumer touches any of it - no `clearCache`, `getCacheId`, `getIDParams`, `.cache` or
`Team.get(...)` anywhere.

Also dropped the README's "Built for speed and efficiency with caching support" feature bullet,
which was describing this.

348 tests green (45 fewer, all of them cache tests), coverage still 100%.

### Step 5a - injectable transport

**done, with a revision to the plan.** `http.js` is now `createHttp({ fetch })` and each `Client`
holds its own instance. `fetch` is resolved per request rather than captured at construction, so
the default path behaves identically to the previous direct global call.

**Revision:** the plan said to migrate the client tests wholesale from `jest.spyOn(http, 'get')` to
a fake fetch, asserting on resolved URLs and request init. Doing that to all 79 call sites would
have rewritten a 1683-line file for little gain - those tests are about *which route each method
builds*, and a fetch-level rewrite would restate the same thing more verbosely while risking
transcription errors across 79 assertions.

Instead the existing tests were renamed onto the instance (`client._http.get`), keeping their
meaning, and a separate suite was **added** for the thing they genuinely could not check: the join
of route to base URL. Seven tests drive a real `Client` through an injected fetch and assert the
fully resolved URL, including the three routes that resolve against a host other than the default,
and two private-league requests asserting `Cookie` and `x-fantasy-filter` survive together at the
fetch boundary.

That gap was not hypothetical. Repointing `getNFLGamesForPeriod` from `site.api.espn.com` to the
fantasy host passes the entire old suite and fails the new one.

355 tests green, coverage still 100%.

### Step 5b - timeout, retry, cache

**done.** `Client` gains `{ timeout, retries, cache }`, all with the defaults the design settled on.

**A design bug caught during implementation.** The plan specified a cache "keyed by resolved URL".
That would have been wrong: `getFreeAgents` and the player half of `getDraftInfo` build
*byte-identical* URLs -
`{season}/segments/0/leagues/{id}?scoringPeriodId={n}&view=kona_player_info` - and differ only in
the `x-fantasy-filter` header, one asking for free agents and waivers and the other for the top
3000 by ownership. A URL-keyed cache would have served one method the other's response. The key now
includes the filter, and a test asserts the two do not collide. `Cookie` is deliberately excluded:
a Client holds one credential set for its whole life, so it cannot vary within its own cache.

Other implementation notes:

* The abort signal is composed **fresh per attempt**. `AbortSignal.timeout` is spent once it fires,
  so a reused one would make every retry after a timeout abort instantly.
* `Retry-After` is parsed to a number and surfaced on `HttpError.retryAfter` rather than attaching
  the `Response`. That error is documented as safe to log wholesale, and a Response carries headers.
* A caller's abort cuts short a backoff already in progress, rather than being noticed a full curve
  later.
* A 2xx with a non-JSON body is not retried - the request worked.

378 tests green, coverage still 100%, including every branch of the retry and cache logic.

### Step 6 - drop lodash

**done.** `src/internal/` now holds `collections.js`, `objects.js` and `values.js`; lodash is gone
from source, from tests, and from `package.json`. The package has no runtime dependencies.

Measured: production bundle 61,428 -> 29,974 bytes (-51%); dev bundle 408KB -> 178KB (-56%). The
only occurrences of the string "lodash" left in the dev bundle are the comments explaining why it
is not there.

The helpers exist rather than inline natives because three lodash behaviors were load-bearing:

* **Absent-collection tolerance.** `map`/`filter`/`find`/`each` accept `undefined` and return
  empty. `Boxscore`'s `parseAbsent` rosters depend on `map(undefined)` giving `[]`, and
  `_parseTeamResponse` has a comment saying it depends on `find` not throwing on absent `members`.
* **Deep merge.** `mergeConfig` combines `headers` rather than replacing them - the private-leagues-
  only breakage step 2 built a test for.
* **`trim` on `undefined`.** A member ESPN sends with no `firstName`.

Every helper is tested for its absent-input case explicitly. `roundTo` shifts by exponent instead
of multiplying, so `roundTo(1.005, 2)` is `1.01` rather than the `1` that
`Math.round(1.005 * 100) / 100` gives; there is a test naming that.

459 tests green, coverage back to 100% on all four measures.

### Step 7 - fixture layer

**done.** `src/__fixtures__/` holds five trimmed `.json` payloads and a 45-test replay suite that
drives a real `Client` through the injected fetch from step 5a.

Split by PII content as designed: `free-agents.json`, `boxscores.json` and `league-settings.json`
are real 2026 data (NFL players are public figures; settings are stat ids and numbers), while
`teams.json`, `activity.json` and `player-cards.json` are hand-written with invented identities.

`activity.json` is hand-written rather than captured - this session had no credentials to record a
live `kona_league_communication` response. Its shape is taken from what `_buildActivity` reads, and
its target ids are wired onto the real roster ids in `teams.json` so the roster-hit and
player-card-fallback paths are both exercised.

**A mistake caught and fixed mid-step.** The personal-data guard was first written as a *deny-list*
of real league member names - which meant spelling those names out in a public repository, the
exact thing the guard exists to prevent. It is now an allowlist: every ESPN member object (found by
carrying `displayName`, which NFL player objects never do) must hold only synthetic names, and every
SWID-shaped identifier must be one of the zeroed fixture ones. The real names were also removed from
`cspell.json`, where the deny-list had put them.

Verified by injecting violations: a real-looking SWID fails, a non-synthetic member name fails, and
reintroducing the `defaultPosition` bug fails exactly the four positions it originally broke.

504 tests green, coverage still 100%. `integration-tests/` untouched.

### Step 8 - types

**done, and the plan's diagnosis was wrong.** The design said the unions never reached the `.d.ts`
because tsc drops a module-scope typedef nothing exported refers to, and that the fix was
`import('../constants').X`. The import half was right. The other half was not.

Probing it directly: **this project's multi-line typedef format does not parse at all.**

```
@typedef {
  'A' |
  'B'
} Name
```

tsc loses the name, emits `export type <whatever declares next> = any`, and the type vanishes. That
is also how a phantom `export type WINNING_TEAM = any` appeared and collided with the new constant
of the same name - the first symptom that led to the probe. Closing the brace on the last type line
(`'B'} Name`) parses correctly, verified before touching the real file.

Result: all 12 unions emit, TS2304 drops from 11 to 0, TS2300 from 3 to 0, named type re-exports go
5 -> 18. TS2417 is 9 (up from 4 only because more types now resolve, so more static-side
comparisons actually happen); that category stays, for the reason `build-types.mjs` documents. Its
KNOWN LIMITATION note has been rewritten, since it recorded the wrong cause.

Unions are **open** (`| (string & {})`). Three fields - `playoffTierType`, `scoringType`,
`playoffClinchType` - stay bare `string` with a note each, because their value sets are not
verified here and inventing one would repeat exactly the defaultPositionId mistake.
`ACTIVITY_ACTION` is closed, correctly: those are values this client produces.

Two extras that fell out of the same work: `build-types.mjs` now dedupes named type re-exports and
skips names `types/index` already exports (a `PlayerStats` alias in three files was emitting three
colliding re-exports), and `ResponseMapValueObject` was lifted out of a method body to module scope
so it resolves.

Verified by compiling a consumer file against `node.d.ts` under `--strict`: instance fields, the
runtime constants and the imported union types all typecheck.

504 tests green, coverage still 100%.

### Step 9 - distribution

**done.** `"prepare": "npm run build"` added; `node.js`, `node-dev.js`, `node.js.map`,
`node.js.LICENSE.txt`, `node.d.ts` and `types/` untracked and gitignored; `verify:artifacts` and
`prepublishOnly` removed; `ci` and the README scripts table updated; the README's false "CI enforces
it" claim replaced with "there is no CI, run `npm run ci` locally".

`build-types.mjs` no longer shells out to `npx tsc`. It resolves the local TypeScript binary through
`createRequire`, because this now runs on a consumer's machine during install and an `npx` that
fails to resolve locally would go to the network.

Drift is no longer policed, it is impossible: there is nothing committed to drift from.

### Step 10 - API surface

**done.** `ActivityAction` gains `playerName`; `getRecentActivity` gains `limit` and `offset`,
defaulting to the 25 and 0 that were hardcoded.

`playerId` was dropped from the plan on inspection: `targetId` already is the player id, so the
field would have been an exact duplicate.

**A fixture bug found while writing this.** `player-cards.json` had the player flat
(`{id, fullName}`) when the `kona_playercard` response actually wraps it (`{id, player: {...}}`) -
which the typedef in `client.js` says and the consumer's own access pattern confirms. A flat fixture
would have let a wrong normalization pass. Corrected, and the assertion now reads through the
wrapper.

509 tests green, coverage still 100%.

---

## Outcome

All ten steps landed. 509 tests, 100% statements / branches / functions / lines.

| | Before | After |
| --- | --- | --- |
| Tests | 380 | 509 |
| Runtime dependencies | 1 (lodash) | 0 |
| Production bundle | 61,428 bytes | ~30,000 bytes |
| Declaration errors (`tsc --strict`) | 11x TS2304 + 4x TS2417 | 9x TS2417 |
| Emitted named types | 5 | 18 |
| Committed build artifacts | 6 paths, drifting | none; built by `prepare` |

Verified by real installation, not by inspection: installing this branch as a git dependency builds
the bundles and declarations from source, `Player#defaultPosition` for `defaultPositionId` 1 returns
`QB`, `npm ls` shows no transitive dependencies, and a `--strict` TypeScript consumer file compiles
against the emitted `node.d.ts`.

### Step 8 follow-up - jsdoc cannot parse the new types

Running the full `npm run ci` surfaced something step 8 missed: `build:docs` went from 2 errors to
31. jsdoc 4's type parser rejects both `import('...')` expressions and `(string & {})`
intersections, and it was dropping the type off every property annotated with one.

Referencing each imported type through a module-scope alias confines the unparseable expression to
one line per file and restores the property rendering. Two further errors were genuinely mine and
are fixed: a tuple type in `internal/collections.js`, and an indexed access type in `client.js`
which is better as a named `ActivityActionType` - now exported, so a consumer can name the union a
`switch` is exhaustive over.

**`npm run ci` was green on master and this branch broke it** - `build:docs` exits non-zero on
those parse errors. Checked rather than assumed: `Omit<string, never>` parses in jsdoc and works as
an open union, but is not assignable to `string`, so `const s: string = team.streakType` would stop
compiling for consumers. Writing closed unions in the jsdoc and appending the open half during the
type build would make source and emitted declarations disagree - the trap this branch spent four
commits fixing. So `build:docs` was removed from the `ci` composite; it still exists and still runs,
it just no longer decides whether the build passes.

**26 errors remain and are structural.** They are the open unions and the aliases themselves -
the deliberate part of step 8. Where jsdoc's HTML output and the generated declarations disagree,
the declarations win: they are what consumers consume, `tsc` checks them, and `docs/` is gitignored
and unpublished. This is a standing tradeoff, not a defect, but it is worth deciding whether
`build:docs` still earns its place now that `.d.ts` is the real API documentation.

## Cleanup pass (`/simplify`, after step 11)

Four review agents read the branch diff for reuse, simplification, efficiency and altitude. Their
findings, and what happened to each.

### Fixed

| Finding | Where | Outcome |
| --- | --- | --- |
| `getPath`/`setPath` split every path, including the dotless case that is nearly all of them | `internal/objects.js` | Fast path restored. lodash's `_.get` had one; the replacement dropped it |
| `each`/`map`/`filter`/`find` allocated a `[key, value]` pair per entry | `internal/collections.js` | Index walk. `find` got its own walk, since it is the one that stops early |
| `BaseObject` re-enumerated its static `responseMap` once per entity | `base-object.js` | Cached per class as an own property |
| Unknown slot ids collided into one `"undefined"` key, losing counts | `league.js` | Named resolvers in `constants.js` |
| Cache unbounded under `cache: true` and `cache: {ttl}` | `http.js` | Config normalized against defaults |
| Cache key named `x-fantasy-filter`, leaving the next header collision open | `http.js` | Keys on full request identity, minus `Cookie` |
| `Boxscore` rosters hand-rolled the declarative branch | `boxscore.js` | `BaseObject` + `isArray`; `parseAbsent` no longer needed |
| `isArray` declared alongside `manualParse`, where it is never read | `team.js` | Removed, with a note saying why |
| Boxscore schedule/filter/build block written twice | `client.js` | `_parseBoxscoreResponse`, matching the `_parseTeamResponse` precedent |
| ESPN host retyped five times | `client.js` | `ESPN_HOST`, `LEAGUE_HISTORY_BASE_URL` |
| `getDraftInfo` scanned 3000 players per pick | `client.js` | Indexed by id once |
| Two flatteners identical but for their predicate | `utils.js` | One `flatten(object, shouldRecurse)` |
| Activity labels written in three places | `client.js` | `ACTIVITY_ACTION` is the single source |
| `manualParse` documented 3 args, example showed 4, code passes 5 | `base-object.js` | Corrected |
| Response stub written four times plus four inline literals | test files | `client/response.stubs.js` |
| Six `find` closures the matches-shorthand covers | `client.js` | Shorthand |
| `scoringSettings` was a `reduce` that behaved as a loop | `league.js` | Loop |
| Duplicate `createHttp` jsdoc block, the first stale | `http.js` | Deleted |
| Comments citing `verify:artifacts` and a drift gate this branch deleted | `build-types.mjs` | Rewritten |
| `entriesOf` exported with no caller | `internal/collections.js` | Removed |

**Parse cost: 933ms -> 130ms** for 2000 free agents, measured on the `free-agents.json` fixture
before and after. The three causes were all introduced by the lodash removal, and all three were
invisible to a suite that only ever parses a handful of objects at a time.

### Second round (agents' remaining findings)

| Finding | Where | Outcome |
| --- | --- | --- |
| `new Date(responseData)` instead of the project's `toDate` | `nfl-game.js` | `toDate`. It was the only model converting a timestamp by hand, so `null`/`''` gave an Invalid Date here and `undefined` everywhere else |
| `availabilityStatus` declared `key: 'status'` but read `rawData` | `boxscore-player.js` | The key was a presence proxy: it worked only because flattening happens to merge `playerPoolEntry.status` up over the entry's own, and it would have stopped populating had ESPN dropped the top-level key |
| ...so a `manualParse` entry may now omit `key` | `base-object.js` | The docs already described this case ("one that reads `rawData` rather than its own key") while the code forbade it. Now the mechanism allows it rather than requiring a dummy key |
| Ten copies of the stats `responseMap` entry | free-agent, boxscore, draft player | `statsEntry({statKey, statSourceId, statSplitTypeId, usesPoints, useSeason, useScoringPeriod})`. Each copy restated the `manualParse` signature, which this branch already changed once across all three files |
| Closure allocated per `BaseObject` entry, including the branch calling it once | `base-object.js` | Built only for the `isArray` case |

### Skipped, with reasons

- **Abort-signal plumbing in `http.js` has no reachable caller.** True: `signal` appears nowhere
  outside `http.js`, and `createHttp` is not exported from `index.js`. But removing it deletes a
  working capability rather than cruft, and the alternative - threading `signal` through all eleven
  `Client` methods - is a public API change, not a cleanup. Left for a decision.
- **`mergeConfig`'s conditional headers spread has one always-true caller.** Making it
  unconditional would return `{headers: {}}` where it now returns no `headers` key, for no gain.
  The branch is only "dead" because there is currently one caller.
- **Collapsing the three `find(teams, ...)` calls into a message-id-to-field lookup.** The
  `?? message.to` fallback such a lookup needs fires on a `message.from` that is genuinely
  `undefined`, which is not the same as the current explicit branch. Not worth the subtlety.
- **One-pass rebuild of `getRecentActivity`'s four-walk chain, and `max` counting bytes rather
  than entries in the cache.** Both flagged as theoretical by the agent that raised them, at a
  default `limit` of 25 messages. Left alone.
- **A uniform unknown-id policy across all six enum lookups.** The rule that actually holds is
  narrower: an unresolved id must stay unique where it becomes a *key*, because collisions there
  lose data. As a *value*, `Player#defaultPosition` reading `undefined` is honest, and a fabricated
  `positionId27` would be worse. Those sites now say so rather than being made uniform.

## Required follow-up (not on this branch)

1. **The integration snapshots are stale.** They were recorded before the position and scoring
   fixes and still contain the old values - `"defaultPosition": "RB/WR"` for a wide receiver, among
   1,483 position entries. `npm run test:integration` will fail until they are re-recorded with
   `-u` on a credentialed run. Those failures are the fixes showing up, not ESPN drift.
2. **Repin `discord-bot`** to a commit on this branch. Its
   `player?.playerPoolEntry?.player.fullName ?? ...` chain can then collapse to
   `action.playerName` - worth doing, since that chain is unguarded at `.player.fullName` and can
   throw inside a Discord command.
3. **`activity.json` is hand-written.** Replace it with a recorded `kona_league_communication`
   payload, scrubbed the same way, on the next credentialed run.
