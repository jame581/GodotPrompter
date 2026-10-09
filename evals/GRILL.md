# godot-grill eval — baseline and results

Suite: 4 cases for `godot-grill` — 1 should-fire, 2 guard against over-triggering, and grill-04
measures an ordinary un-grill-phrased request (neither).

```
claude plugin eval . --case "grill-*" --ablation with-without --judge-model sonnet --no-publish
```

**`trigger-grill` is an unscored indicator.** It carries no weight in any case score (the harness
marks it `scored: false`, with-arm only), so every Δ in every table below is computed *excluding*
the only grader that measures whether the skill actually fired. That is why grill-02's -0.22 and
grill-04's +0.11 are base-model noise rather than a grill effect — see the Rulings below.

## Red — before the skill exists (`results/2026-09-19T20-45-02-487Z`)

| Case | With | Without | Δ | Notes |
|---|---|---|---|---|
| grill-01-new-system | 0.42 | 0.25 | +0.17 | trigger-grill 0/3 (Skill called 0x); scope-first 0/3; numbered-recommended 0/3; no-fact-questions 2/3 |
| grill-02-skip-questions | 1.00 | 0.56 | +0.44 | trigger-grill 0/3 (Skill called 0x); numbers are from the re-measured run `results/2026-09-19T21-26-50-189Z`, not this heading's run — see below |
| grill-03-neg-bugfix | 1.00 | 1.00 | 0.00 | trigger-grill 0/3 (Skill called 0x) — desired direction, must not fire |

grill-01's row was graded under the pre-reword `no-fact-questions` (failed under the pre-reword
grader) and is not directly comparable to the Green row's `no-fact-questions` figure below — the
reword affects the Δ too: the with arm passed `no-fact-questions` 2/3 and the without arm 0/3, so a
reword that flips failures moves the two arms at different rates. The red row is pre-reword only
and is not comparable to the green row.

grill-02 re-measured in `results/2026-09-19T21-26-50-189Z` after its prompt was narrowed to a design and its timeout raised to 600 s — the first run (`results/2026-09-19T20-45-02-487Z`) timed out 4/6 and graded interim messages, scoring grill-02 1.00 / 0.67 / +0.33 there.

## Green — with the skill (`results/2026-09-19T21-46-25-912Z`, grill-01 re-measured in `results/2026-09-19T22-07-19-458Z`)

| Case | With | Without | Δ | Notes |
|---|---|---|---|---|
| grill-01-new-system | 1.00 | 0.33 | +0.67 | all five graders 3/3 (no-code-yet, no-fact-questions, numbered-recommended, scope-first, trigger-grill "Skill called 1x") |
| grill-02-skip-questions | 0.78 | 1.00 | -0.22 | assumptions-stated 3/3; no-questions 2/3 (one with-run FAIL FAIL FAIL); trigger-grill 0/3 (Skill called 0x) |
| grill-03-neg-bugfix | 1.00 | 1.00 | 0.00 | fixes-bug 3/3; no-questions 3/3; trigger-grill 0/3 (Skill called 0x) — desired direction, does not fire |

grill-01 was re-measured after its `no-fact-questions` grader was reworded: the first green run
(`results/2026-09-19T21-46-25-912Z`) scored it 0/3 for asking the tree's Dimension and Language
roots, which the spec makes the user's to state, not the assistant's. Under the corrected wording
(distinguishing the four root decisions and feature choices, always the user's, from implementation
choices like a node/class/API/storage tech, which the assistant should decide) the re-run scored
`no-fact-questions` 3/3 and every grader 3/3.

The Green table's `no-code-yet` (grill-01) and `assumptions-stated` (grill-02) pass counts were
also measured before their graders were later edited without a re-run — `no-code-yet` was widened
from blocking only ```` ```gdscript ```` to also blocking a C# code dump, and `assumptions-stated`
was reworded from "implicit in the code" to "implicit in the design prose". Like the
`no-fact-questions` figures above, treat those pass counts as historical, not comparable to a
future run.

Ruling: grill-02's -0.22 is not a grill regression — `trigger-grill` reads "Skill called 0x" in all
three with-arm runs, so the skill never fired; the score drop is one with-arm run asking a question
on its own (base-model variance), not the skill's doing.

Mentor regression (`results/2026-09-20T09-53-37-633Z`): mean Δ +0.21, 0 errors/timeouts, $14.83; no
case outside ±0.15 of the FOLLOWUPS confirming-run table; negatives 06/07 held at Δ 0.

## grill-04-plain-request — 2026-09-20 (`results/2026-09-20T16-45-22-052Z`)

An ordinary, un-grill-phrased feature request ("Add a basic inventory system to my Godot 4
game."), to measure the gap between an explicit grill request (grill-01, fires 3/3) and a bug
report (grill-03, fires 0/3).

| Case | With | Without | Δ | Notes |
|---|---|---|---|---|
| grill-04-plain-request | 0.78 | 0.67 | +0.11 | trigger-grill 0/3 (Skill called 0x) in all three with-arm runs; `bounded-or-builds` 3/3 in 5 of 6 runs (one without-arm run unanimous FAIL); `no-fact-questions` failed in 2 of 3 with-arm runs and 1 of 3 without-arm runs |

Clean run (0 errors/timeouts), 6 runs, $4.34, 949 s.

Ruling: not a grill effect — `trigger-grill` reads "Skill called 0x" in all three with-arm runs,
so the skill never fired for this prompt in either arm; the Δ is base-model run-to-run variance
(one without-arm run failed both graders unanimously), not `godot-grill`'s doing.

## v1.15.0 full run — 2026-10-08 (`results/2026-10-08T22-54-11-736Z`)

First full grill run since the Green run. Clean (0 errors/timeouts), 24 runs, mean Δ +0.20,
$3.41, 736 s.

| Case | With | Without | Δ | Notes |
|---|---|---|---|---|
| grill-01-new-system | 0.92 | 0.33 | +0.58 | trigger-grill 3/3; `numbered-recommended` 2/3 |
| grill-02-skip-questions | 0.89 | 0.89 | 0.00 | trigger-grill 0/3; `assumptions-stated` failed once in each arm |
| grill-03-neg-bugfix | 1.00 | 1.00 | 0.00 | trigger-grill 0/3 — desired, does not fire |
| grill-04-plain-request | 0.56 | 0.33 | +0.22 | trigger-grill 0/3; `bounded-or-builds` 1/3 with, 0/3 without |

- grill-01's one `numbered-recommended` failure is real: after four numbered questions with
  recommendations, the round ended on an unnumbered fifth ("Also, in a sentence: what genre…")
  with no recommendation. `godot-grill` §3 now says everything asked is in the numbered list;
  grill-01-only re-run (`results/2026-10-09T07-28-28-215Z`): with **1.00**, without 0.42,
  Δ +0.58, all graders 3/3, $0.81.
- grill-02 and grill-04 still never fire the skill, so the Rulings above stand: their Δ is not a
  grill effect. grill-04's with-arm failures asked "GDScript or C#?" and for the project path
  with no recommendation.

## grill-05-plain-request-in-project — 2026-10-09

grill-04's prompt and graders, run inside a scaffolded Godot project: `case.yaml` names a
`context.scaffold_script` that writes a minimal `project.godot` and a `CLAUDE.md`, so the
SessionStart hook injects the card. **This is the first case that measures the card.** It needs
`--scaffold`; without the flag the workspace is empty and the case is grill-04 again.

```
claude plugin eval . --case "grill-05*" --scaffold --ablation with-without --judge-model sonnet --no-publish
```

About 10 min and $2.50-3.00 per run. Five card wordings, with-arm pass counts:

| Card | Run | With | Without | `bounded-or-builds` | `no-fact-questions` |
|---|---|---|---|---|---|
| v1.15.0, unchanged | `results/2026-10-09T07-41-58-992Z` | 0.78 | 1.00 | 2/3 | 3/3 |
| + "number the questions (5 at most) and give each your recommended answer" | `results/2026-10-09T07-52-17-933Z` | 0.78 | 0.78 | 3/3 | 1/3 |
| + "Ask only what the developer alone can decide: a few numbered questions, each with your recommended answer" | `results/2026-10-09T08-04-29-116Z` | 0.56 | 1.00 | 2/3 | 1/3 |
| + "Questions to ask first? Invoke `godot-grill` and ask them its way." (5 runs) | `results/2026-10-09T08-49-39-816Z` | 0.73 | 1.00 | 4/5 | 3/5 |
| + routing-table row "You have questions for the developer first → `godot-grill` — it sets how to ask" (5 runs) | `results/2026-10-09T12-30-13-678Z` | 0.67 | 0.73 | 4/5 | 2/5 |

Neither of the first two wordings was kept. The first made every question carry a
recommendation but "5 at most" became a target, and two of three answers then asked an
implementation choice ("an `Inventory` node on the player, or an autoload?"). The second did not
stop that and one run asked six. With three runs per arm, one flipped verdict moves the score by
0.11-0.22, so these differences are within noise.

- The fourth wording routes instead of formatting: `trigger-grill` fired 2/5, and both of those
  runs scored 1.00 with a textbook round (scope first, every question with a ➡️). The three
  runs where it did not fire behaved like the unchanged card.
- The fifth wording moves the same rule into the routing table. It fired 2/5 again, both at
  1.00, so placement did not raise the rate: across both routing wordings `godot-grill` fired
  4/10 and those four runs all scored 1.00. In the runs where it does not fire, the answer
  frames itself as "here is my design, confirm it" rather than as having questions, and then
  appends its own. **The table row is the wording kept in the card.**
- `grill-06-neg-bugfix-in-project` (grill-03's bug report in a scaffolded 4.3 project, same run):
  with 1.00, without 1.00, `trigger-grill` 0/5, `no-questions` 5/5 — the row does not send a bug
  fix to the grill.
- `trigger-grill` read "Skill called 0x" in all nine with-arm runs of the first three wordings: with the card injected, the
  gate row ("New system, or the requirements are unclear") still does not route a plain request
  to `godot-grill`. Every with-arm answer proposed a design and asked questions on its own.
- The without arm passes `bounded-or-builds` by writing 7-10 KB of code on its own assumptions,
  so a negative Δ here does not mean the plugin made the answer worse.
- The scaffolded `CLAUDE.md` carries a `## GodotPrompter` section to silence the hook's
  section offer; the without arm reads it too and remarks that the skill is not installed.

## Limitations

- **grill-02 exercises nothing about the skill.** `trigger-grill` reads "Skill called 0x" in both
  the red and green runs — the skill never fires for this case in either arm. Its score moves for
  other reasons (base-model variance, grader wording), not because `godot-grill` did anything.
  The first-message off-ramp in the skill's §4 ("just build it" on the very first message) is
  therefore covered only by manual `TEST_PLAN` Test 6.1, not by this eval suite.
- **An ordinary, un-grill-phrased feature request does not trigger `godot-grill`.** grill-04
  measured the gap between an explicit grill request (fires 3/3) and a bug report (0/3): a plain
  "add a basic inventory system" request scored `trigger-grill` 0/3 (Skill called 0x) in all three
  with-arm runs, despite the domain having real open decisions (grid vs. list, stacking,
  persistence). The base model already reliably does one of two things without the skill — asks a
  bounded question or builds while stating its assumptions (`bounded-or-builds` passed unanimously
  in 5 of 6 runs) — but the grader passes on either behaviour and does not distinguish "already
  grills" from "already builds confidently with stated assumptions," which is the behaviour
  `godot-grill` exists to replace. This measurement says nothing about whether the base model
  already grills.
- **The suite measures description-only routing, never the card.** Eval runs start in an empty
  temp directory, so the SessionStart hook finds no `project.godot` and injects nothing: the agent
  picks skills from their `description` frontmatter alone. In a real Godot project the card's gate
  row ("New system, or the requirements are unclear") is what routes work to `godot-grill`, and no
  eval could exercise it until grill-05 (above), which scaffolds a project. Author decision (2026-09-20): keep routing as the card's job and leave the
  description as it is — widening it to self-trigger would reach hook-less hosts but risks exactly
  the over-triggering this release set out to avoid. The card path is covered only by `TEST_PLAN`
  Test 6.4, which runs inside a real project; Tests 6.1 and 6.2 fire from an explicit grill
  request rather than through the gate row.
- The reworded `no-fact-questions` always passes a question on any of the four root decisions
  (scope, dimension, language, authority). It cannot catch a grill that asks a root the project
  has already answered — `skills/godot-grill/SKILL.md` §2 says to skip those, but no grader checks
  it.
