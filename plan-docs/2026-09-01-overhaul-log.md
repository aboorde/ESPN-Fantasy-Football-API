# Overhaul execution log

Companion to `2026-09-01-overhaul-design.md`. One entry per step, appended as work lands.

Legend: `pending` / `in progress` / `done` / `revised` / `abandoned`

| # | Step | Status | Commit |
| --- | --- | --- | --- |
| 0 | Plan + adversarial review of the plan | done | `b6cd355` |
| 1 | Fix `defaultPosition`; split the position enums | done | `PENDING` |
| 2 | De-tautologize self-referential assertions | done | `PENDING` |
| 3 | Reshape `League#scoringSettings` | pending | |
| 4 | Delete `BaseCacheableObject` and the `defer` pass | pending | |
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
