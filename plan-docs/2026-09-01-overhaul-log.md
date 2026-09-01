# Overhaul execution log

Companion to `2026-09-01-overhaul-design.md`. One entry per step, appended as work lands.

Legend: `pending` / `in progress` / `done` / `revised` / `abandoned`

| # | Step | Status | Commit |
| --- | --- | --- | --- |
| 0 | Plan + adversarial review of the plan | done | `b6cd355` |
| 1 | Fix `defaultPosition`; split the position enums | pending | |
| 2 | De-tautologize self-referential assertions | pending | |
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
