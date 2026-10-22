# Token Budget Debt — v1.7.0 baseline

> **Closed in v1.7.3 (2026-05-07).** The deferred list is empty; every `SKILL.md` is at or below the 16 KB budget. Kept as the history of the initiative.

The validator (`token-budget-exceeded` warning, added in v1.7.0) flags every `skills/*/SKILL.md` ≥ 16 KB. v1.7.0 restructured the top 10 plus `addon-development` using **Pattern X** (core SKILL.md + `references/<topic>.md`). The remaining **24 skills** are still over budget and tracked here for v1.7.x point releases.

## The Pattern X recipe

The structural recipe is the same for every restructure:

1. Identify what stays in SKILL.md: intro, distinguishing-choices table, canonical recipe, anti-patterns, checklist
2. Identify what moves: edge-case recipes, advanced patterns, long code samples, version-specific deep dives
3. Create `skills/<name>/references/<topic>.md` per move (with `> ← Back to [SKILL.md](../SKILL.md)` header)
4. Replace each moved section in SKILL.md with a 2-3 sentence summary + relative link `[references/<file>.md](references/<file>.md)`
5. Verify: SKILL.md ≤ 16 KB (ideally ≤ 14 KB), no `[orphan-reference]` warnings, GDScript-then-C# pattern preserved within sections

## v1.7.0 progress (2026-05-06)

11 skills restructured to Pattern X:

| Skill | Before | After | Reference files |
|---|---:|---:|---:|
| `godot-optimization` | 37 KB | 11.5 KB | 4 |
| `ai-navigation` | 37 KB | 15.6 KB | 4 |
| `animation-system` | 35 KB | 16.0 KB | 6 |
| `3d-essentials` | 35 KB | 15.9 KB | 6 |
| `physics-system` | 34 KB | 15.9 KB | 7 |
| `dedicated-server` | 31 KB | 11.4 KB | 4 |
| `hud-system` | 28 KB | 11.2 KB | 4 |
| `inventory-system` | 28 KB | 13.5 KB | 3 |
| `audio-system` | 28 KB | 13.6 KB | 4 |
| `godot-ui` | 27 KB | 13.7 KB | 4 |
| `addon-development` | 20 KB | 12.0 KB | 3 |

Plus the new **`gdscript-advanced`** skill ships with 3 references at 9.8 KB SKILL.md (born under budget).

## v1.7.1 progress (2026-05-07)

10 more skills restructured to Pattern X (next 10 heaviest from the deferred list):

| Skill | Before | After | Reference files |
|---|---:|---:|---:|
| `input-handling` | 27 KB | 14.5 KB | 4 |
| `dialogue-system` | 26 KB | 10.6 KB | 5 |
| `multiplayer-sync` | 26 KB | 10.4 KB | 4 |
| `shader-basics` | 26 KB | 15.5 KB | 5 |
| `godot-debugging` | 26 KB | 12.0 KB | 4 |
| `particles-vfx` | 25 KB | 14.2 KB | 5 |
| `procedural-generation` | 24 KB | 4.9 KB | 4 |
| `multiplayer-basics` | 24 KB | 15.6 KB | 3 |
| `xr-development` | 24 KB | 15.0 KB | 5 |
| `2d-essentials` | 24 KB | 8.6 KB | 5 |

Validator: 56 → 42 warnings (10 token-budget closures + 4 incidental C# parity closures as sections moved to references along with their already-paired C# blocks).

## v1.7.2 progress (2026-05-07)

10 more skills restructured to Pattern X (next 10 heaviest from the v1.7.1 deferred list):

| Skill | Before | After | Reference files |
|---|---:|---:|---:|
| `gdscript-patterns` | 23 KB | 14.8 KB | 5 |
| `tween-animation` | 22 KB | 13.2 KB | 4 |
| `save-load` | 22 KB | 4.6 KB | 4 |
| `dependency-injection` | 20 KB | 9.1 KB | 5 |
| `godot-testing` | 20 KB | 9.3 KB | 3 |
| `camera-system` | 20 KB | 10.8 KB | 4 |
| `resource-pattern` | 19 KB | 9.3 KB | 5 |
| `csharp-signals` | 19 KB | 9.4 KB | 4 |
| `responsive-ui` | 18 KB | 8.6 KB | 4 |
| `math-essentials` | 18 KB | 12.4 KB | 3 |

Validator: 42 → 22 warnings (10 token-budget closures + 10 incidental parity closures as sections moved to references along with their already-paired C# blocks, including 4 from gdscript-patterns moving accepted-warning sections into references).

## v1.7.3 progress (2026-05-07) — initiative complete

The final 4 over-budget skills restructured to Pattern X. **Every SKILL.md in the repo is now ≤ 16 KB.**

| Skill | Before | After | Reference files |
|---|---:|---:|---:|
| `state-machine` | 17.9 KB | 13.4 KB | 1 |
| `export-pipeline` | 17.7 KB | 13.9 KB | 2 |
| `godot-brainstorming` | 17.6 KB | 14.1 KB | 1 |
| `event-bus` | 16.8 KB | 14.7 KB | 1 |

Validator: 22 → 17 warnings (4 token-budget closures + 1 incidental parity closure as the event-bus testing section moved to references).

**v1.7.x token-budget initiative complete.** 35 skills restructured across v1.7.0–v1.7.3. No skills remain in the deferred list.

## Deferred (count: 0)

The deferred list is empty as of v1.7.3. The token-budget initiative is complete — every SKILL.md is at or below the 16 KB budget.

## Accepted

None at v1.7.0 baseline. If a future skill genuinely needs > 16 KB SKILL.md (and Pattern X cannot apply), it goes here with justification.
