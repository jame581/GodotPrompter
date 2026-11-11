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
| Codex after F2 | `using-godot-prompter/SKILL.md` 8,273 (`copilot-tools.md` import dropped) | **8,273** (-45.8%) |
| Antigravity after F2 | `using-godot-prompter/SKILL.md` 8,273 + `references/antigravity-tools.md` 1,494 | **9,767** (-48.8%) |

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

## F3 signal run, card v1 — 2026-11-11

Card at `7a2aaf0` (skip rule added: changes to an existing system go to its code, non-Godot files
need no skill; "two-line script" and "loaded a skill already" red flags dropped; card 3,071 B).
`--runs 3 --scaffold --ablation with-without --judge-model sonnet --no-publish -j 3`. A quick
signal, not the F6 measurement.

| Case | With | Without | Fired (with arm, of 3) | Skill calls per run (with) | Run dir | Cost |
|---|---|---|---|---|---|---|
| neg-04-extend-existing-inventory-in-project | 1.00 | 1.00 | `inventory-system` **0/3** (baseline 5/5); `resource-pattern` 0/3; `godot-brainstorming` 0/3; `godot-grill` 0/3 | 0, 0, 0 | `results/2026-11-11T00-29-52-043Z` | $2.15 |
| neg-05-extend-existing-abilities-in-project | 1.00 | 1.00 | `ability-system` **0/3** (baseline 5/5); `godot-brainstorming` 0/3; `godot-grill` 0/3 | 0, 0, 0 | `results/2026-11-11T00-29-52-167Z` | $1.83 |
| grill-05-plain-request-in-project (positive control) | 0.33 | 0.33 | `godot-grill` 0/3 (baseline 0/5) | not recorded | `results/2026-11-11T00-22-16-231Z` | $5.27 |

- No GodotPrompter skill fired in any of the six neg with-arm runs, against 10 of 10 at baseline,
  and scores held at 1.00 in both arms. With-arm runs cost $0.24-$0.71.
- grill-05 is unchanged: 0/3 against 0/5, `bounded-or-builds` failing in every run of both arms
  as before. The card change does not show a loss there, but a 0 baseline cannot show one either.
  The positive cases that do fire (skill-01..18, grill-01, grill-04) were not re-run; F6 does.
- Round cost $9.25.
- Note: the signal runs' aggregate (`report.html`/summary) shows `runsPerCase` 5, taken from the
  neg-04/05 `case.yaml`, but each arm ran 3 (`--runs 3`). The per-run lines above are the record.

## F3 signal run, card v2 — 2026-11-11

Card at `b7dee46` (review round 1: "design settled by the user" row, separate bug-fix row, no-skill
row limited to "No Godot content: docs, generic CI, repo tooling", red flags scoped to new
systems, "Full index" line and "Teaching while building" row dropped; card 3,044 B; the hook now
injects the absolute skill-index path). Same flags as v1. Each arm ran 3 (`--runs 3`).

| Case | With | Without | Fired (with arm, of 3) | Skill calls per run (with) | Run dir | Cost |
|---|---|---|---|---|---|---|
| neg-04-extend-existing-inventory-in-project | 1.00 | 1.00 | `inventory-system` **0/3**; `resource-pattern` 0/3; `godot-brainstorming` 0/3; `godot-grill` 0/3 | 0, 0, 0 | `results/2026-11-11T00-38-25-288Z` | $2.60 |
| neg-05-extend-existing-abilities-in-project | 1.00 | 1.00 | `ability-system` **0/3**; `godot-brainstorming` 0/3; `godot-grill` 0/3 | 0, 0, 0 | `results/2026-11-11T00-38-25-271Z` | $1.52 |

- The skip holds on v2: 0 of 6 with-arm runs loaded any GodotPrompter skill (v1 0/6, F1 10/10).
  With-arm runs cost $0.24-$0.61.
- grill-05 was not re-run on v2. The v2 grill row ("design settled by the user") is narrower than
  v1's "known design", which should not lower grill routing, but this is not measured; F6 does.
- Round cost $4.12.

## F6 after Phase F (card v2, 2026-11-11)

Branch `release/v1.17.0` at `27553b9` (F2 slim bootstrap, F3 card v2, F4 rewritten descriptions),
plugin 1.16.1, Claude Code 2.1.322, judge `sonnet`. Every run uses `--ablation with-without
--judge-model sonnet --no-publish -j 3`; neg and in-project grill cases add `--scaffold`.
"Fired" is the with-arm count of runs in which the skill was called.

```
claude plugin eval . --case "neg-0N*" --runs 3|5 --scaffold --ablation with-without --judge-model sonnet --no-publish -j 3
```

### Per-case table

| Case | Runs per arm | With | Without | Fired (with arm) | Skill calls per run (with) | Run dir | Cost |
|---|---|---|---|---|---|---|---|
| neg-01-existing-inventory-in-project | 3 | 1.00 | 1.00 | `inventory-system` **0/3**, `ability-system` 0/3, `godot-brainstorming` 0/3, `godot-grill` 0/3, any 0/3 | 0, 0, 0 | `results/2026-11-11T00-55-17-296Z` | $0.79 |
| neg-02-non-godot-task-in-project | 3 | 1.00 | 1.00 | any GodotPrompter 0/3 | 0, 0, 0 | `results/2026-11-11T00-55-57-428Z` | $0.72 |
| neg-03-tweak-existing-ability-in-project | 3 | 1.00 | 1.00 | `ability-system` 0/3, `godot-brainstorming` 0/3, any 0/3 | 0, 0, 0 | `results/2026-11-11T00-56-31-374Z` | $1.53 |
| neg-04-extend-existing-inventory-in-project | 5 | 1.00 | 1.00 | `inventory-system` **0/5** (F1 5/5), `resource-pattern` 0/5, `godot-brainstorming` 0/5, `godot-grill` 0/5, any 0/5 | 0, 0, 0, 0, 0 | `results/2026-11-11T13-30-32-000Z` | $4.24 |
| neg-05-extend-existing-abilities-in-project | 5 | 1.00 | 1.00 | `ability-system` **0/5** (F1 5/5), `godot-brainstorming` 0/5, `godot-grill` 0/5, any 0/5 | 0, 0, 0, 0, 0 | `results/2026-11-11T13-34-58-611Z` | $3.53 |
| grill-05-plain-request-in-project | 5 | 0.47 | 0.33 | `godot-grill` **2/5** (F1 0/5) | not recorded | `results/2026-11-11T13-39-01-116Z` | $8.14 |
| grill-06-neg-bugfix-in-project | 3 | 1.00 | 1.00 | `godot-grill` 0/3 (correct) | not recorded | `results/2026-11-11T13-48-46-856Z` | $0.82 |
| grill-07-skip-questions-in-project | 3 | 0.89 | 0.78 | `godot-grill` 0/3 (correct) | not recorded | `results/2026-11-11T13-49-31-760Z` | $1.37 |
| grill-01-new-system (no scaffold) | 3 | 1.00 | 0.25 | `godot-grill` 3/3 | not recorded | `results/2026-11-11T13-51-35-567Z` | $1.07 |
| grill-04-plain-request (no scaffold) | 3 | 0.56 | 0.33 | `godot-grill` 0/3 | not recorded | `results/2026-11-11T13-52-42-979Z` | $0.87 |
| skill-01 to skill-18 (17 cases, 3 runs per arm) | 3 | see SKILLS.md | | `trigger-skill` 3/3 in 16 cases, `web-services` 2/3 | trigger grader only | `results/2026-11-11T13-30-33-023Z` | $27.60 |

neg-01..03 ran before the usage limit hit and are valid (no errors, no zeros). Their with-arm runs
cost $0.15-$0.42, against $0.24-$0.59 for the F1 runs of neg-04/05. neg-04/05 with-arm runs now
cost $0.23-$0.59 each and are all 0-Skill-call runs, so the remaining cost is the answer itself.

### Comparison with the success criteria

1. **Neg cases: named domain skill at most 1 of 3, `godot-brainstorming` 0.** For the 5-run cases
   neg-04 and neg-05 the threshold used is at most 1 of 5 (the 3-run 1/3 scaled down). **PASS.**
   The named domain skill fired 0/3 in neg-01, neg-03, 0/5 in neg-04 and neg-05, and
   `godot-brainstorming` fired 0 in every neg case. F1: neg-01 1/3, neg-04 5/5, neg-05 5/5. No
   GodotPrompter skill fired in any of the 19 with-arm neg runs (F1: 11 of 28).
2. **No positive case loses more than one fire of three against its previous recorded count.**
   **PASS.** Previous counts: skill-16 3/3 (SKILLS.md, `…T01-13-33-867Z`); grill-01 3/3
   (GRILL.md, green re-measure); grill-04 0/3; grill-05 0/5 (F1; 4/5 on 2026-10-09). Now: skill-16
   2/3 (-1, within the allowance), grill-01 3/3, grill-04 0/3, grill-05 2/5 (up from 0/5). The
   other 16 skill cases fired 3/3, so none can have lost a fire from a prior count of at most 3.
   Not every skill-0x row has a recorded fire count in SKILLS.md; where none is recorded, 3/3 is
   the ceiling and is reported as is.
3. **Injected bytes down at least 40%.** **PASS** (from the byte baseline above, not re-measured):
   Codex 15,272 to 8,273 B (-45.8%), Antigravity 19,064 to 9,767 B (-48.8%). Targets were
   at or below 9,163 B and 11,438 B.

### Notes

- skill-05, skill-16, skill-17 and skill-18 are **re-measurements of graders changed in Phases A and
  B** (METALFX scaling modes in `upscaling-code-correct`, the `Web` platform name in
  `web-code-correct`, the word-boundary regex in `names-download-file-or-part`), which had not been
  re-run. Scores: skill-05 1.00 / 1.00, skill-16 0.92 / 1.00, skill-17 1.00 / 0.42, skill-18 1.00 /
  1.00. They behave as before; skill-16's one 0.75 run is a `download-code-correct` unanimous FAIL
  (the same kind of split as the earlier 0.92).
- **The eval scaffolds still carry the pre-1.17 CLAUDE.md line "before implementing any Godot
  system", deliberately.** That is the worst case for existing users, whose project instructions
  keep nudging a skill after upgrading. The skip held anyway.
- **This harness is Claude Code only.** It cannot reproduce the Codex `godot-brainstorming`
  complaint in #18; the byte rows above are the only Codex/Antigravity measure.
- grill-05 fired 2/5 on card v2 (0/5 at F1). The score is 0.47 / 0.33: `bounded-or-builds` still
  failed in 9 of 10 runs, so only the fire rate moved. Two fires of five is inside the noise
  noted in GRILL.md, but it is not a loss.
- Rate limit: the first F6 pass hit the 5-hour usage limit partway. The invalid dirs are
  `…T00-55-22-593Z` (skill-*, 16 of 17 cases zero-scored, $2.61), `…T00-57-58-099Z` (neg-04, $0.85),
  and the zero-cost dirs `…T00-58-28-670Z`, `…T00-58-37-837Z`, `…T00-58-46-694Z`, `…T00-58-51-761Z`,
  `…T00-58-56-976Z`, `…T00-59-02-234Z`. They are not recorded as results; all of those cases were
  re-run after the reset. neg-01..03 from that pass completed normally and are used.
- Cost: valid runs $50.68 (neg $10.81, grill $12.27, skills $27.60), invalid $3.46: $54.1 in all,
  over the $40 budget. The skill-* pass alone was $27.60 for 102 runs.

## Corrections after the final review of Phases C and F (2026-11-11)

Appended; the sections above are unchanged.

- **Criterion 3 used pre-F3 bytes.** At HEAD `skills/using-godot-prompter/SKILL.md` is 9,061 B (wc -c), so
  Codex injects 9,061 B (-40.7% against 15,272) and Antigravity 9,061 + 1,494 = 10,555 B (-44.6%
  against 19,064). Still **PASS**, but Codex has only 102 B under the 9,163 B target. Any bootstrap
  growth in Phase D or E breaks criterion 3.
- **Criterion 2 wording (grill-05).** The F6 verdict compared grill-05 with F1 (0/5). The v1.16 card
  shipped at 4/5 on 2026-10-12 and 2/3 on 2026-10-21, so F6's 2/5 is below the pre-Phase-F level, and
  "not a loss" above overstates it. The same correction is appended to GRILL.md.
- **"No recorded fire count" caveat was inaccurate.** Only skill-03 lacks a recorded fire count, and
  that case was dropped. skill-16's 0.75 run is the run where the skill did not fire. skill-17's
  with-arm rise (0.92 to 1.00) is the MetalFX grader fix. The neg-04 without-arm cost range low end
  is $0.15, not $0.14. The post-F4 description total is 8,897 chars (baseline 8,910).
- **Cost.** Phase F evals totalled about $87 (F1 about $23.9, F3 rounds about $9.4, F6 about $54.1
  including the $3.46 invalid pass), against a planned $35-50.

## Positive in-project routing (card v2) — 2026-11-11

New case `pos-01-new-system-in-project` (rich RPG scaffold shared with neg-04/05; the project has no
dialogue system; the prompt gives the full design: per-NPC lines, interact key advances, box closes
after the last line, simple box at the bottom). Run on card v2 with
`claude plugin eval . --case "pos-01*" --scaffold --ablation with-without --judge-model sonnet --no-publish`.

| Case | Runs per arm | With | Without | Fired (with arm) | Run dir | Cost |
|---|---|---|---|---|---|---|
| pos-01-new-system-in-project | 3 | 1.00 | 1.00 | `dialogue-system` **3/3**, any GodotPrompter skill 3/3, `godot-grill` 0/3 (indicator, unscored) | `results/2026-11-11T14-13-23-902Z` | $2.02 |

With the design settled by the user, card v2 still routes to the domain skill (3/3, threshold was
2/3), and does not grill. The answer-quality score is 1.00 in both arms, so the case measures routing
only, not a quality lift. The card was not changed.
