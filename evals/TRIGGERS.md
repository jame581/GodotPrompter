# Skill over-triggering eval — baseline

Suite: `neg-*` cases. Each stages a small RPG project (`scaffold.sh`: `project.godot`, a
`CLAUDE.md` with a `## GodotPrompter` section, an existing inventory with `max_stack`, a `Fireball`
ability, a JSON save manager, a README and a CI workflow) so the SessionStart card is injected, then
asks for something that does not need a GodotPrompter skill. They answer discussion #18
("skills over-used, ~60% of my tokens"): do skills fire when the project merely matches the
skill's genre, or when the task does not touch Godot at all?

```
claude plugin eval . --case "neg-*" --runs 3 --scaffold --ablation with-without --judge-model sonnet --no-publish
```

`--scaffold` is required: without it the workspace is empty, no card is injected, and the case
measures description-only routing instead.

| Case | Task | Skills that must not fire |
|---|---|---|
| neg-01-existing-inventory-in-project | fix the off-by-one in the existing `inventory.gd` `add_item` (a stack reaches `max_stack + 1`) | `inventory-system`, `ability-system`, `godot-brainstorming`, `godot-grill`, any `godot-prompter:*` |
| neg-02-non-godot-task-in-project | write a README "Contributing" section (branch names, commit style, PR checklist) | any `godot-prompter:*` |
| neg-03-tweak-existing-ability-in-project | Fireball cooldown 3 s to 2.5 s and the tooltip to match | `ability-system`, `godot-brainstorming`, any `godot-prompter:*` |

neg-02 uses a README change, not a CI export step: `export-pipeline` is described as covering
"CI/CD with GitHub Actions", so a `godot --headless --export-release` step is arguably Godot work
and a skill firing there would not clearly be a failure.

## How to read "fired"

`claude plugin eval` has no negated grader type, but `tool_used` takes `min` and `max`. These cases
use `min: 0, max: 0` on `tool: Skill` with an `input_match`, which is a **regex** tested against
the call's input JSON (`godot-prompter:inventory-system` matches that skill; `godot-prompter`
matches any GodotPrompter skill). So here, unlike grill-03's `trigger-grill`, a **pass means the
skill did not fire**; the explanation reads `Skill called Nx (expected 0..0)`, and N is the fire
count. A `skill-calls` grader (`tool_used` Skill, `min: 0`, no `input_match`) always passes and
reports N = every Skill call in the run, any skill. Under `with-without` the harness marks every
`tool_used: Skill` grader with-arm-only and unscored, so none of them moves a case score; the
score comes from the `llm` grader that checks the task was actually done. The run's trace is not
kept after the run, so the grader explanations are the only record of Skill calls.

Skill calls per run is the token-cost proxy: a skill load costs its SKILL.md (up to 16 KB) plus
whatever references it pulls in.

## Byte baseline — v1.17.0 branch, 2026-11-11

Injected into every session on hosts without the SessionStart hook:

| Host | Files @-imported | Bytes |
|---|---|---|
| Codex (`AGENTS.md`) | `using-godot-prompter/SKILL.md` 14,560 + `references/copilot-tools.md` 712 | **15,272** |
| Antigravity (`GEMINI.md`) | `using-godot-prompter/SKILL.md` 14,560 + `references/antigravity-tools.md` 4,504 | **19,064** |

- Session card (the `SESSION-CARD` region): 3,071 B (3,073 B measured with the marker-adjacent newlines).
- Descriptions: 8,910 characters across the 59 `skills/*/SKILL.md` `description:` fields, loaded into every session on every host.

The Phase F target is a 40% drop in the Codex and Antigravity figures: at or below 9,163 B and 11,438 B.

## Baseline 2026-11-11

Branch `release/v1.17.0` at `912674f`, plugin 1.16.1, Claude Code 2.1.322, judge `sonnet`, 3 runs per
arm. "Fired" columns are with-arm counts of runs (of 3) where the skill was called. The
without arm has no plugin and no Skill calls to count.

### neg-01-existing-inventory-in-project

| Run | With | Without | `inventory-system` | `ability-system` | `godot-brainstorming` | `godot-grill` | any GodotPrompter | Skill calls per run (with) |
|---|---|---|---|---|---|---|---|---|
| `results/2026-11-11T00-02-12-871Z` | 1.00 | 1.00 | **1/3** | 0/3 | 0/3 | 0/3 | 1/3 | 0, 0, 1 (`inventory-system`) |
| `results/2026-11-10T23-46-27-796Z` (no `skill-calls` grader yet) | 1.00 | 1.00 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | not recorded |

### neg-02-non-godot-task-in-project

| Run | With | Without | any GodotPrompter | Skill calls per run (with) |
|---|---|---|---|---|
| `results/2026-11-11T00-02-12-871Z` | 1.00 | 1.00 | 0/3 | 0, 0, 0 |
| `results/2026-11-10T23-46-27-796Z` | 1.00 | 1.00 | 0/3 | not recorded |

### neg-03-tweak-existing-ability-in-project

| Run | With | Without | `ability-system` | `godot-brainstorming` | any GodotPrompter | Skill calls per run (with) |
|---|---|---|---|---|---|---|
| `results/2026-11-11T00-02-12-871Z` | 1.00 | 1.00 | 0/3 | 0/3 | 0/3 | 0, 0, 0 |
| `results/2026-11-10T23-46-27-796Z` | 0.33 | 0.00 | 0/3 | 0/3 | 0/3 | not recorded |

- The first batch scored neg-03 at 0.33 / 0.00 because the judge failed answers that said "I
  couldn't write the file" and then showed the correct two-line edit. The grader was reworded (the
  run is read-only, so judge only the edit shown) and the batch re-run; the second row is the
  baseline. The first batch's fire counts stand.
- Across both batches, 1 of 18 with-arm runs loaded any GodotPrompter skill, and none loaded
  `godot-brainstorming`. On these prompts the current card does not over-trigger; the one
  fire was `inventory-system` on a bug in an existing inventory, the exact pattern #18 reports.
  Each batch cost about $3.3 (with-arm runs $0.18-$0.42, without $0.09-$0.29).
- The prompts are short and specific (a named file and a named value), which is the case least
  likely to fire a skill. Vaguer in-project requests ("improve my inventory") may fire more; these
  cases are a floor, not a measure of the reported 60%.

### Grill re-baseline (positive and negative routing, in-project)

All with `--scaffold --ablation with-without --judge-model sonnet`; `trigger-grill` here is the
usual grill indicator, a pass of which means `godot-grill` fired.

| Case | Runs per arm | With | Without | `godot-grill` fired | Run dir | Cost |
|---|---|---|---|---|---|---|
| grill-05-plain-request-in-project | 5 | 0.33 | 0.33 | **0/5** | `results/2026-11-10T23-49-10-994Z` | $8.85 |
| grill-06-neg-bugfix-in-project | 3 | 1.00 | 1.00 | 0/3 | `results/2026-11-10T23-59-21-513Z` | $0.86 |
| grill-07-skip-questions-in-project | 3 | 1.00 | 0.78 | 0/3 | `results/2026-11-11T00-00-06-655Z` | $1.39 |

grill-05's `bounded-or-builds` failed in all ten runs, both arms, and `no-fact-questions` passed
in all ten, so the 0.33 score is the unchanged `bounded-or-builds` failure. Card fire rate for
`godot-grill` on a plain request is 0/5 on this branch (history in GRILL.md: 6/8 at v1.15.0, 0/3 at
v1.16.0). Skill calls per run for the grill cases are not recorded: their only Skill grader
filters on `godot-grill`, and the existing cases were not edited.

## Cost

Neg batches 2 x $3.3, grill-05 $8.85, grill-06 $0.86, grill-07 $1.39: $17.7 in all.

## What F6 compares against

- Success criterion 1 (named domain skill at most 1 of 3, `godot-brainstorming` 0 of 3) already
  holds at the baseline: neg-01 `inventory-system` 1/3, everything else 0/3. F6 should re-run
  with more runs per arm, or with vaguer prompts, to tell a regression from noise.
- Criterion 2 compares the positive routing cases (skill-01 to skill-18, grill-01, grill-04,
  grill-05) with their F1 fire counts. Only grill-05 is re-baselined here (0/5); skill-* and
  grill-01/04 keep the baselines in SKILLS.md and GRILL.md.
- Criterion 3 compares the byte baseline above.
