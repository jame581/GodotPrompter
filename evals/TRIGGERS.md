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

## Fix round 1 — 2026-11-11

### Limits of this harness (read before the conclusion above)

- **This harness measures Claude Code only.** `claude plugin eval` runs Claude Code with the
  SessionStart card. The #18 `godot-brainstorming` complaint is Codex-specific: `AGENTS.md`
  @-imports the 14.5 KB bootstrap into every Codex session. A Claude Code baseline cannot
  reproduce it, and a clean result here says nothing about Codex or Antigravity. The byte
  baseline above is the only Codex/Antigravity measure.
- The scaffold's `CLAUDE.md` carries a `## GodotPrompter` section (to silence the hook's offer),
  which is a second nudge to invoke a skill. Every with-arm result includes it.
- **Regex widened after the baseline.** The neg-01..03 graders originally matched only the
  namespaced form (`godot-prompter:<name>`). They now match `(godot-prompter:)?<name>`, and the
  catch-all matches `godot-prompter:` or any of the 59 names in `skills/index.json`, each with
  `(?<![\w-])` / `(?![\w-])` guards. The 2026-11-11 baseline rows above were produced by the old
  regex and were not re-run. If the harness records a bare skill name, the old rows undercount
  fires (the neg-04/05 rows below, which used the new regex, saw the same call counted by both
  the per-skill and `skill-calls` graders).
- grill-05 was run with `--runs 5` (override of the case's `runs: 3`), as follow-up §6 requires.
- Card size: the validator's own method (`validateCard`: the text between the markers minus the
  leading newline, UTF-8 bytes) gives **3,072 B**, exactly the cap. The 3,071 above was my
  estimate and is wrong; 3,073 is the raw slice with that newline kept.

### neg-04 and neg-05: extend an existing system (richer scaffold)

Same flags as above with `--runs 5`. The scaffold adds `ItemData` (with `get_tooltip()`),
`ItemDatabase`, an `InventorySlot` scene/script and an inventory grid, an `Ability` base class
with cost, cooldown, range and four hooks, `Fireball`, and `StatusEffect`/`StatusEffectHost`/
`BurnEffect`. neg-01..03 keep the simpler scaffold, so they stay comparable to each other.

| Case | Prompt | With | Without | Fired (with arm, of 5) | Skill calls per run | Run dir | Cost |
|---|---|---|---|---|---|---|---|
| neg-04-extend-existing-inventory-in-project | add item rarity (common/rare/epic) and show it in the slot tooltip | 1.00 | 1.00 | `inventory-system` **5/5**; `resource-pattern` 0/5; `godot-brainstorming` 0/5; `godot-grill` 0/5 | 1, 1, 1, 1, 1 | `results/2026-11-11T00-09-31-525Z` | $3.83 |
| neg-05-extend-existing-abilities-in-project | stun ability like Fireball, disables the target for 2 s | 1.00 | 1.00 | `ability-system` **5/5**; `godot-brainstorming` 0/5; `godot-grill` 0/5 | 1, 1, 1, 1, 1 | `results/2026-11-11T00-12-30-770Z` | $2.32 |

- Both cases fail the F6 criterion at baseline (named domain skill at most 1 of 3), so unlike
  neg-01..03 they can show an improvement. The llm grader passed every run in both arms: the
  skill adds cost, not correctness, here. With-arm runs cost $0.26-$0.72 against $0.14-$0.29
  without; neg-05 is $0.31-$0.35 against $0.14-$0.18.
- `godot-brainstorming` and `godot-grill` never fired. The over-use reproduced under Claude Code
  is the domain skill loaded on a task inside a system the project already has.
- neg-01 (a bug fix in the same system) fired `inventory-system` 1 of 6 times, neg-03 0 of 6:
  the trigger is "extend or add", not "touch".
- Round cost $6.15; task total about $23.9.
