# ESPN-Fantasy-Football-API overhaul — design

Date: 2026-09-01
Branch: `feat/overhaul`
Status: approved, pre-implementation

## Why

A staff-level review of this fork found four confirmed defects, one of which is live and wrong
for four of the six fantasy positions. It also found that the repository's safety mechanisms —
100% test coverage, a committed-artifact drift gate, a jsdoc-to-declaration pipeline — each have
a hole large enough that the defects passed through them unnoticed.

This document records what is wrong, what was decided, and what was deliberately rejected. The
companion log (`2026-09-01-overhaul-log.md`) tracks execution.

## Context

* Sole consumers are the author's own projects. `discord-bot` installs this repo by git SHA
  (currently pinned at `b8c2e61`) and uses `getRecentActivity`, `getBoxscoreForWeek`,
  `getTeamsAtWeek` and `getLeagueInfo`. `draft-2026` is a Python backend that talks to ESPN
  directly and does **not** consume this library, but duplicates its ESPN domain knowledge and
  therefore serves as an independent cross-check on it.
* The repository is **public** (`aboorde/ESPN-Fantasy-Football-API`). Anything committed is
  permanent and world-readable.
* Upstream (`mkreiser/ESPN-Fantasy-Football-API`) is tracked best-effort only. Breaking changes
  cost one commit in one consumer.

## Confirmed defects

### D1 — `Player#defaultPosition` is wrong for QB, WR, TE and K

`Player.responseMap.defaultPosition` resolves ESPN's `defaultPositionId` through
`slotCategoryIdToPositionMap`. That map is the **`lineupSlotId`** enum. `defaultPositionId` is a
different enum that happens to share the value `16` for D/ST and `2` for RB.

Reproduced through the shipped `node-dev.js` bundle, with ids taken from a real 2026 kona payload:

| Player | `defaultPositionId` | Reported | Correct |
| --- | --- | --- | --- |
| Josh Allen | 1 | `TQB` | `QB` |
| Jahmyr Gibbs | 2 | `RB` | `RB` |
| Ja'Marr Chase | 3 | `RB/WR` | `WR` |
| Trey McBride | 4 | `WR` | `TE` |
| Brandon Aubrey | 5 | `WR/TE` | `K` |
| Texans D/ST | 16 | `D/ST` | `D/ST` |

Affects `Player`, `BoxscorePlayer`, `FreeAgentPlayer` and `DraftPlayer` — every player model the
library produces. `eligiblePositions` is **correct**: `eligibleSlots` really is the `lineupSlotId`
enum. One map serving two enums is the root cause.

Cross-check: `draft-2026/backend/config.py` carries
`POSITION_BY_ID = {1:"QB", 2:"RB", 3:"WR", 4:"TE", 5:"K", 16:"D/ST"}`, commented *"verified
against the 2026 kona cache"*.

### D2 — `League#scoringSettings` discards scoring rules

Two independent losses, measured against the real WPFL 2026 settings payload (45 scoring items):

1. **Four items are dropped entirely.** `scoringItemToId` has no entry for statIds `63`, `131`,
   `206` or `209`, and the reducer's `if (!key) return acc` silently discards them. StatId `63`
   is worth 6.0 points.
2. **Position overrides are collapsed lossily.** 27 of the 45 items carry `pointsOverrides`. The
   code does `acc[key] = first(values(pointsOverrides))`, which throws away both *which position*
   the override applies to and the base `points`. WPFL's statId `206` is `points: 2.0` with
   `overrides: {'16': 0.0}` — base 2 for every position, 0 for D/ST. The library would report `0`.

Not currently wrong for WPFL's *mapped* items (all four with a nonzero base happen to have
base == override == 6.0), but the shape cannot represent the data.

`pointsOverrides` keys are in the **`defaultPositionId`** enum, not `lineupSlotId` — confirmed by
`draft-2026/backend/tests/test_scoring.py:41`, which sources them from `defaultPositionId` and
validates the result reproduces ESPN's own `appliedTotal` for >98% of 300+ projections. Resolving
them through `slotCategoryIdToPositionMap` would reintroduce D1.

### D3 — `BaseCacheableObject` subclasses share their parent's cache

`static get cache()` reads `this._cache` through the prototype chain, so a subclass returns its
parent's cache whenever the parent was populated first. Verified: `BoxscorePlayer.cache ===
Player.cache` is `true`. The class doc explicitly claims the opposite.

Latent only: nothing in `src/` ever *reads* the cache. It is written on every parse and never
evicted, so it is also an unbounded retainer — `getFreeAgents` writes up to 2000 instances per
call. `defer` (the two-pass machinery in `_populateObject`) exists solely to serve it and is used
by zero models.

### D4 — Committed artifacts drift from source

9 of the last 25 commits changed `src/` without rebuilding the committed bundles:

```
c1a29fc 7af84cd c6c2860 1085ff4 85857a2 851b7f1 3d3fd66 d5668e0 0050b3f
```

At each, HEAD's source did not match HEAD's bundles. Pinning to any of them — the documented
install method — silently yields stale parse logic. `85857a2` ("Replace axios with the native
fetch client") is the sharpest: the source had switched transports, the shipped bundle still
contained axios.

## Why the safety nets missed all of this

**Coverage was 100% and proved nothing.** The tests assert the implementation against itself:

```js
// player.test.js — passes even if the map says {2: 'BANANA'}
expect(player.defaultPosition).toBe(get(slotCategoryIdToPositionMap, defaultPositionId));
```

Roughly ten assertions share this shape across `player`, `nfl-game`, `league` and
`boxscore-player`. The `defaultPosition` case additionally picks id `2` — the one non-D/ST value
that is correct by coincidence.

The same pattern guards the highest-risk merge in the codebase, `client.test.js:110`:

```js
expect(requestConfig).toEqual(merge({}, passedConfig, cookieConfig));
```

`_buildRequestConfig` *is* `merge`. This assertion cannot fail. It guards the combination of auth
cookies with the `x-fantasy-filter` header — if the lodash removal replaces that deep merge with a
shallow spread, `headers` is replaced rather than combined, `x-fantasy-filter` disappears, and
`getFreeAgents` / `getDraftInfo` / `getRecentActivity` break **for private leagues only**, while
the test — updated to use the same spread — stays green.

Line and branch coverage cannot distinguish `map([])` from `map(undefined)`; they are the same
line and the same branch.

## Decisions

| # | Decision | Rejected alternative and why |
| --- | --- | --- |
| A | Private fork; own consumers only | Upstream contribution — the divergence (fetch client, generated types, new methods) has no path upstream |
| B | Bugs plus targeted structural work; stay on JS + jsdoc | Full TypeScript migration — rewrites 8k lines including 380 tests for a two-consumer fork |
| C | Delete the instance cache; add an opt-in TTL cache | Fixing the instance cache — still write-only, still unbounded, still global mutable state |
| D | Per-**Client** bounded cache, not module-global | Module-global — repeats exactly the untestable shared-mutable-state mistake being deleted, and would let two credential sets share an entry |
| E | 30s per-attempt timeout, `retries: 2`, never on 4xx, abort terminal | 15s — too aggressive for the 2000- and 3000-player pulls. No retry — ESPN flakes; `draft-2026` already retries against this host |
| F | Injectable `fetch` | Module mocking — blocks fixture replay without adding a nock-style dependency |
| G | Split the two position enums; `scoringSettings` becomes `{base, overrides}`; unmapped ids surface as `statIdN` | Extending the id map only — keeps a documented-as-complete map that isn't. Numeric keys alongside named ones — ambiguous, and naming an id later would silently change a key's type |
| H | Layered tests: de-tautologize now, add fixture replay, keep `test:integration` | Retiring the integration suite — it is the only thing that talks to real ESPN and is the sole drift canary |
| I | Fixtures split by PII content, not by source | A `responseMap`-derived allowlist scrubber — several mapped values are whole subtrees, and `getRecentActivity` passes the PII-bearing `team` object through raw. Hundreds of lines of security-critical tooling, disproportionate |
| J | Drop lodash entirely; hand-roll null-tolerant helpers | Keeping `lodash/get` — leaves a dependency for one function |
| K | No CI; correct the README instead | Restoring CI — explicitly declined |
| L | `"prepare": "npm run build"`; stop committing artifacts | Pre-push hook — bypassable and per-clone opt-in. README checklist — the control that already failed |
| M | **Open** unions on enum fields | Closed unions — these are hand-maintained guesses about an external API, and D1 proves that knowledge unreliable. A closed union lets a consumer write an exhaustive `switch` that TS certifies complete while ESPN sends something else |
| N | Normalize the activity player shape; add `limit`/`offset` | Deriving `matchupPeriodId` — the consumer already solved it better in `espnPeriod.ts`; a library version means a hidden extra request and only helps historical weeks |

## Work plan

Each step is one commit. Steps 1–3 are correctness and land first so they bisect cleanly.

### 1. Fix `defaultPosition`

* Add `defaultPositionIdToPosition = {1:'QB', 2:'RB', 3:'WR', 4:'TE', 5:'K', 16:'D/ST'}`.
* Point `Player.responseMap.defaultPosition` at it. Leave `eligiblePositions` on the slot map.
* Document both maps with which ESPN enum each covers.
* **Acceptance:** a test asserting all six ids against literal position strings.

### 2. De-tautologize

* Replace every `expect(x).toBe(get(someMap, id))` with literal expected values.
* Replace `client.test.js:110`'s `toEqual(merge(...))` with a literal config object that
  explicitly contains **both** a pre-existing header and the `Cookie` header.
* **Acceptance:** mutating any entry of `slotCategoryIdToPositionMap`, `nflTeamIdToNFLTeam` or
  `nflTeamIdToNFLTeamAbbreviation` fails a test. Making `_buildRequestConfig` shallow fails a test.
* Must land before step 6.

### 3. Reshape `scoringSettings`

* `{ base: {name: points}, overrides: {position: {name: points}} }`.
* Overrides keyed via `defaultPositionIdToPosition`.
* Stat ids with no name surface as `statId<N>` rather than being dropped.
* **Acceptance:** a fixture-driven test over the real WPFL settings shape proving no item is lost
  and that a base/override pair is represented distinctly.

### 4. Delete the cache

* Remove `BaseCacheableObject`, its test file, and the `defer` pass in `_populateObject`.
* Re-parent `Team` and `Player` onto `BaseObject`.
* Remove `getIDParams` / `getCacheId` from models.
* **Acceptance:** suite green; no reference to `cache`, `defer` or `getCacheId` outside history.

### 5. Rewrite the HTTP layer

* `Client` options gain `{ timeout = 30000, retries = 2, cache = false, fetch = globalThis.fetch }`.
* Per-attempt `AbortSignal.timeout`; per-call `signal` composed with `AbortSignal.any`.
* Retry on network errors and 429/5xx only. Never 4xx. Never after an abort. Exponential backoff
  with jitter, honouring `Retry-After`.
* `cache: {ttl, max}` on the Client instance, keyed by resolved URL, bounded by `max`.
* **Acceptance:** tests for each of — timeout fires; 4xx does not retry; 5xx retries twice then
  throws; abort is terminal; cache hit avoids a second fetch; cache evicts past `max`.

### 6. Drop lodash

* New `src/internal/` helpers preserving the semantics the codebase depends on:
  * `mapOrEmpty`, `filterOrEmpty`, `findIn` — tolerate `undefined` collections
  * `getPath` / `setPath` — dotted-path access
  * `mergeConfig` — **deep** merge of `headers`
  * `trimOrEmpty`, `roundTo`, `toSafeInt`
* **Acceptance:** each helper has a test for its `undefined` input case. `mergeConfig` has a test
  proving two header objects combine. Bundle contains no lodash module.

### 7. Fixture layer

* `src/__fixtures__/` holding trimmed payloads.
* PII-free sources taken from `draft-2026/data/cache/` — schedule, players, draft, and the
  `settings` subtree.
* `members[]` and the `teams[]` envelope hand-written with synthetic names and SWIDs, wrapped
  around real roster entries.
* `kona_league_communication` captured fresh and given the same synthetic envelope.
* A guard test failing on any `{8-4-4-4-12}` GUID or known league member name in the fixture tree.
* Fixtures replayed through the injectable `fetch` against the real `Client`.
* `integration-tests/` untouched — retained as the ESPN drift canary.

### 8. Types

* Export unions as frozen objects where a consumer would compare against them: `WINNING_TEAM`,
  `INJURY_STATUSES`, `PLAYER_AVAILABILITY_STATUSES`, activity actions. Types-only for the rest.
* Annotate all ten bare-`string` enum fields with **open** unions (`… | (string & {})`).
* Delete the `JSDOC_DEFINED_TYPES` ESLint workaround.
* Leave TS2417 alone; `build-types.mjs` already documents why.

### 9. Distribution

* Add `"prepare": "npm run build"`. Drop `verify:artifacts` and `prepublishOnly`.
* Delete and gitignore `node.js`, `node.js.map`, `node-dev.js`, `node.js.LICENSE.txt`,
  `node.d.ts`, `types/`.
* Rewrite the README install section; **remove the false claim that CI enforces the rebuild**.

### 10. API surface

* `ActivityAction` gains resolved `playerName` and `playerId`, keeping raw `player`.
* `getRecentActivity` accepts `limit` and `offset`, defaulting to today's 25 / 0.

## Out of scope

CI (declined), TypeScript migration (declined), deriving `matchupPeriodId` (rejected — the
consumer's `espnPeriod.ts` already does it better), TS2417 static-side errors (invisible under
`skipLibCheck`, and the fix reintroduces the duplication the class hierarchy exists to avoid).

## Risks

| Risk | Mitigation |
| --- | --- |
| Shallow-merge regression in `_buildRequestConfig` breaks private leagues only | Step 2 lands a literal-value test before step 6 touches it |
| Losing lodash's `undefined` tolerance reintroduces crashes on ESPN's omitted keys | Helpers keep the semantics explicitly and each is tested for `undefined` |
| `--ignore-scripts` would skip `prepare`, leaving no `node.js` | Consumer uses plain `npm install`. Documented; fallback is `npm pack` tarballs |
| Real league data reaching a public repo | PII confined to `members[]` and the `teams[]` envelope, both hand-written synthetic; GUID/name guard test as a fail-closed backstop |
| Ten commits is a large surface to review | One concern per commit; correctness first so it bisects cleanly |

## Follow-on (not this branch)

* Repin `discord-bot` to the new SHA.
* Collapse its `player?.playerPoolEntry?.player.fullName ?? …` chain to `action.playerName`.
  That chain is currently unguarded at `.player.fullName` and can throw.
