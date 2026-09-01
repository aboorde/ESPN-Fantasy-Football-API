# Overhaul execution log

Companion to `2026-09-01-overhaul-design.md`. One entry per step, appended as work lands.

Legend: `pending` / `in progress` / `done` / `revised` / `abandoned`

| # | Step | Status | Commit |
| --- | --- | --- | --- |
| 0 | Plan + adversarial review of the plan | done | `b6cd355` |
| 1 | Fix `defaultPosition`; split the position enums | done | `PENDING` |
| 2 | De-tautologize self-referential assertions | done | `PENDING` |
| 3 | Reshape `League#scoringSettings` | done | `PENDING` |
| 4 | Delete `BaseCacheableObject` and the `defer` pass | done | `PENDING` |
| 5a | Injectable transport (pure refactor) | done (revised) | `PENDING` |
| 5b | Timeout, retry, per-Client cache | done | `PENDING` |
| 6 | Drop lodash | done | `PENDING` |
| 7 | Fixture layer | done | `PENDING` |
| 8 | Types: open unions, exported constants | pending | |
| 9 | Distribution: `prepare`, drop committed artifacts | pending | |
| 10 | API surface: activity normalization, pagination | pending | |

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
