# godot-grill eval — baseline and results

Suite: 7 cases for `godot-grill`. grill-01 should fire; grill-02 and grill-03 guard against
over-triggering; grill-04 measures an ordinary un-grill-phrased request. grill-05 to grill-07
repeat 04, 03 and 02 inside a scaffolded Godot project, so the SessionStart card is injected.

```
claude plugin eval . --case "grill-*" --scaffold --ablation with-without --judge-model sonnet --no-publish
```

`--scaffold` is required: without it grill-05 to grill-07 run in an empty workspace and silently
repeat grill-04, grill-03 and grill-02.

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

## Report rule reworked — 2026-10-09 (`results/2026-10-09T18-17-43-794Z`)

The routing row was dropped and the "report before you build" rule itself now ends: "A report
states; it never ends on your own questions. Need an answer or a go-ahead first? Invoke
`godot-grill`." Three in-project cases, 5 runs per arm, clean (0 errors), $8.01, 608 s
(`--case "*-in-project" --scaffold --runs 5 -j 3`).

| Case | With | Without | `trigger-grill` | Notes |
|---|---|---|---|---|
| grill-05-plain-request-in-project | 0.87 | 0.87 | **4/5** | the four fired runs all 1.00; the fifth dumped code with no report |
| grill-06-neg-bugfix-in-project | 1.00 | 1.00 | 0/5 | bug fixed, `no-questions` 5/5 |
| grill-07-skip-questions-in-project | 0.80 | 0.87 | 0/5 | `no-questions` 5/5; `assumptions-stated` 2/5 with, 3/5 without |

- grill-05 fire rate by card wording: unchanged 0/3, trailing sentence 2/5, table row 2/5, this
  rule 4/5. Stopping the report from carrying its own questions is what moved it.
- grill-07 is grill-02's "skip the questions" prompt in a scaffolded project: the rule does not
  override an explicit off-ramp. It has no baseline on the old card, so its `assumptions-stated`
  figure cannot be attributed to this change; with-arm answers list decisions under headings such
  as "What I picked and what I rejected", which the judge does not always count as assumptions.
- **`bounded-or-builds` was tightened after this run started** (grill-04 and grill-05): path (b)
  now requires an explicit list or table of the choices made on the user's behalf; choices implicit
  in the code or a "how it works" summary do not count. The old wording passed 3 of 5 no-plugin
  answers that dumped 5-10 KB of code and never listed an assumption. Re-judging this run's ten
  grill-05 answers under the new wording (`claude -p --model sonnet`, one vote each): with 4/5,
  without **0/5** — about 0.87 vs 0.33. Figures for this grader before and after are not
  comparable; the next full run records the first real ones.

## Pre-release regression — 2026-10-11 (`results/2026-10-11T19-20-09-278Z`)

All seven grill cases, 3 runs per arm, `--scaffold -j 3`. Clean, mean Δ +0.12, $10.28, 764 s.
First full run under the tightened `bounded-or-builds`.

| Case | With | Without | Δ | `trigger-grill` | Notes |
|---|---|---|---|---|---|
| grill-01-new-system | 0.92 | 0.50 | +0.42 | 3/3 | `numbered-recommended` 2/3 |
| grill-02-skip-questions | 1.00 | 0.78 | +0.22 | 0/3 | |
| grill-03-neg-bugfix | 1.00 | 1.00 | 0.00 | 0/3 | |
| grill-04-plain-request | 0.33 | 0.22 | +0.11 | 0/3 | `bounded-or-builds` 0/3 in the with arm: no card in an empty workspace, and the grader no longer passes unlisted assumptions |
| grill-05-plain-request-in-project | 0.56 | 0.33 | +0.22 | 2/3 | one fired run 1.00; one fired run failed `bounded-or-builds`; the unfired run dumped code |
| grill-06-neg-bugfix-in-project | 1.00 | 1.00 | 0.00 | 0/3 | |
| grill-07-skip-questions-in-project | 0.89 | 1.00 | -0.11 | 0/3 | `no-questions` 3/3; `assumptions-stated` 2/3 |

grill-05 fired 2/3 here against 4/5 in the previous run; with three runs that is within noise,
and the fire rate across both runs is 6/8. A plain request inside a project is still the weakest
path: when the grill does not fire the answer is a code dump with no report.

## Card sentence scoped after review — 2026-10-12

A code review pointed out that "Need an answer or a go-ahead first? Invoke `godot-grill`" has no
carve-out: read literally it covers a bug fix missing one fact, a brainstorming check-in, or
another plugin's approval step. Two scoped wordings, in-project cases, 5 runs per arm:

| Card sentence | Run | grill-05 fired | grill-05 with | grill-06 fired | grill-07 `no-questions` |
|---|---|---|---|---|---|
| "Need an answer or a go-ahead first?" (unscoped) | two earlier runs | 6/8 | 0.87, 0.56 | 0/8 | 8/8 |
| "Open design decisions needing the developer's answer first?" | `results/2026-10-11T20-35-16-725Z` | 2/5 | 0.60 | 0/5 | invalid — session limit |
| "A design decision needs the developer's answer or go-ahead first?" | `results/2026-10-12T04-52-39-540Z` | **4/5** | 0.87 | 0/5 | 5/5 |

The third wording is the one kept. Dropping "go-ahead" halved the fire rate: when the grill does
not fire, the agent sees itself as asking for a go-ahead on a design, not as having open
decisions, so the sentence has to name that. All four fired runs passed both scored graders.
grill-07's `assumptions-stated` was 2/5 with and 3/5 without, as in the earlier run — not a card
effect. What this still does not measure: a bug fix that is missing one fact, and a workflow
plugin's own approval gate.

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
- **grill-01 to grill-04 measure description-only routing, never the card** (grill-05 to grill-07 do measure it). Eval runs start in an empty
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

## v1.16.0 card check — 2026-10-22 (`results/2026-10-21T23-30-31-845Z`; old-card control in a worktree of `8c28fea`, `…T23-39-03-962Z`)

The v1.16.0 card adds `rendering-pipeline`, `web-services` and `web-export` and drops "Skills carry
trade-offs — surface them." from the report rule (the `godot-grill` sentence is unchanged). The
in-project cases were re-run on the new card, then grill-05 on the old card as a control.

| Case | Card | With | Without | `trigger-grill` |
|---|---|---|---|---|
| grill-05-plain-request-in-project | v1.16.0 | 0.33 | 0.33 | 0/3 |
| grill-05-plain-request-in-project | pre-change (`8c28fea`) | 0.56 | 0.33 | 1/3 (that run 1.00) |
| grill-06-neg-bugfix-in-project | v1.16.0 | 1.00 | 1.00 | 0/3 (correct: a bug fix) |
| grill-07-skip-questions-in-project | v1.16.0 | 0.89 | 0.89 | 0/3 (correct: user said skip) |

- **Both arms fell, not only the new card.** On 2026-10-09 grill-05 scored 0.87 / 0.87 with
  `godot-grill` firing 4/5. Now the old card fires 1/3 and the without arm is 0.33 too
  (`bounded-or-builds` FAIL in every without run). Something outside the card moved — the agent
  model or the judge — and the base answer no longer passes by building on stated assumptions.
- 1/3 vs 0/3 between the two cards is one run, inside the noise this file already describes for
  three runs per arm. The dropped sentence is not shown to matter, but it is not ruled out either.
- grill-06 and grill-07 behave as intended on the new card: no grill on a bug fix or when told to
  skip questions.
- Open: re-baseline grill-05 with 5 runs per arm on both cards before the next card change.
