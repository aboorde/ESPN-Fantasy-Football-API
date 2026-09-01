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
| 5a | Injectable transport (pure refactor) | pending | |
| 5b | Timeout, retry, per-Client cache | pending | |
| 6 | Drop lodash | pending | |
| 7 | Fixture layer | pending | |
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
