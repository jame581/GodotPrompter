# godot-mentor eval — baseline and follow-ups

Suite: 7 cases (5 should-fire, 2 should-NOT-fire) testing the `godot-mentor` skill.

```
claude plugin eval . --case "0*" --ablation with-without --judge-model sonnet --no-publish
```

~50 min, ~$15 per full run (runs: 3). Judge must stay sonnet (agent runs on Opus — never self-judge).

## Baseline — v1.13.3, 2026-09-19 (`results/2026-09-19T15-56-37-946Z`)

Mean **Δ +0.17**, $14.86, 0 errors/timeouts.

| Case | With | Without | Δ |
|---|---|---|---|
| 01-teach-double-dash | 0.90 | 0.56 | +0.33 |
| 02-guide-health-bar | 0.88 | 0.79 | +0.08 |
| 03-understand-signals | 0.88 | 0.60 | +0.27 |
| 04-learning-3d-pickup | 0.98 | 0.73 | +0.25 |
| 05-csharp-learner-save | 0.94 | 0.70 | +0.24 |
| 06-neg-just-code | 1.00 | 1.00 | 0.00 |
| 07-neg-experienced-quick | 1.00 | 1.00 | 0.00 |

With-arm side-channels: 86–149 s, 7–10 turns, $0.50–0.76/run. Ceilings: 300 s, 12 turns.
Negatives must stay at Δ 0 — a drop means mentor mode is lecturing people who did not ask.

## After the fix pass — 2026-09-19 (`results/2026-09-19T18-36-24-452Z`)

Mean **Δ +0.23** (was +0.17), $14.92, 0 errors/timeouts.

| Case | With | Without | Δ | Note |
|---|---|---|---|---|
| 01-teach-double-dash | 0.98 | 0.42 | +0.56 | `dash-correct` 3/3 (was 2/3) |
| 02-guide-health-bar | 0.96 | 0.79 | +0.17 | `no-scope-creep` 2/3 (was 0/3) |
| 03-understand-signals | 0.85 | 0.67 | +0.19 | grader (3) misworded — see below |
| 04-learning-3d-pickup | 1.00 | 0.63 | +0.38 | |
| 05-csharp-learner-save | 1.00 | 0.70 | +0.30 | |
| 06-neg-just-code | 1.00 | 1.00 | 0.00 | |
| 07-neg-experienced-quick | 1.00 | 1.00 | 0.00 | |

- State-file note: 11/15 answers now mention it, all as one line in the last 3% of the answer.
- Case 03 failed `signal-concept` 3/3 on answers that met every criterion: the first rewrite of (3)
  was a "fail if" inside "Pass only if ALL hold" and did not say non-obvious wiring is allowed.
  Reworded as a positive condition; case-03-only re-run (`results/2026-09-19T19-25-10-086Z`):
  with-arm **1.00, `signal-concept` 3/3**. Its without arm lost judge calls to a session limit,
  so that run's Δ (+0.58) is invalid — take case 03's Δ from the next full run.
- Single-run dips, likely noise: 01 `beat-why` 2/3, 03 `beat-one-next` 2/3. Watch next run.
- Without-arm scores moved by up to 0.14 between runs (01: 0.56 → 0.42), so compare with-arm
  scores as well as Δ.

### Confirming run — 2026-09-19 (`results/2026-09-19T19-56-57-157Z`)

Clean run (0 judge errors), mean **Δ +0.22**, $14.94. With-arm: 01 0.96, 02 **1.00**, 03 0.92,
04 1.00, 05 1.00; negatives Δ 0. Case 03's valid Δ under the new grader: **+0.15**.

- Held: 02 `no-scope-creep` 3/3, 03 `signal-concept` 3/3, 01 `dash-correct` 3/3.
- **Open — 01 `beat-why` trending down: 3/3 → 2/3 → 1/3** across the three runs. The failing
  Concept beats contrast a *technique* ("impulse vs timed override", with a reason) rather than a
  node/API, and one names an API contrast only in a glossary aside (`is_action_just_pressed`
  rather than `is_action_pressed`). Decide: should the grader accept a technique contrast, or should
  Beat 1 require a node/API contrast as the card says ("why this node/API")?
- 03 `no-menu-paths` 2/3: one Verify beat said "Debug → Visible Collision Shapes" — a real menu
  item, but a top-menu path the card rules out. Watch; no change.

### Post-grill regression run — 2026-09-20 (`results/2026-09-20T09-53-37-633Z`)

Clean run (0 judge errors), mean **Δ +0.21**, $14.83. With-arm: 01 0.94, 02 1.00, 03 1.00, 04
0.96, 05 1.00; negatives Δ 0. Run after the `godot-grill` card wiring landed, to confirm mentor
mode was undisturbed by the new routing.

- **Resolved — 01 `beat-why` had gone 3/3 → 2/3 → 1/3 → 0/3** across the branch's four mentor
  runs (verified per-run: `15-56` 3/3, `18-36` 2/3, `19-56` 1/3, `09-53` **0/3** — this run failed
  it in all three with-arm runs, each unanimous). The grader was wrong, not the skill: case 01's
  prompt fixes the node (`CharacterBody2D`), so a dash introduces no new node, resource, or API
  for a correct answer to contrast, and the skill's own worked Beat 1 example (a jump counter vs.
  a `can_double_jump` bool) is itself a technique contrast, not a node/API one. The grader now
  accepts a named-alternative contrast that carries a reason, whether the alternative is a
  node/resource/API or an approach/technique. The next full mentor run re-measures `beat-why`;
  until then, case 01's `beat-why` figures from before this reword are not comparable to figures
  after it.

### v1.15.0 re-baseline — 2026-10-08 (`results/2026-10-08T16-30-11-748Z`, then `results/2026-10-08T21-22-39-612Z`)

First full mentor runs since the Editor beat was relaxed to reference click-paths. Both clean
(0 errors/timeouts), negatives Δ 0 in both.

| Case | Before: with | without | Δ | After: with | without | Δ |
|---|---|---|---|---|---|---|
| 01-teach-double-dash | 0.96 | 0.60 | +0.36 | 0.98 | 0.64 | +0.33 |
| 02-guide-health-bar | 1.00 | 0.69 | +0.31 | 1.00 | 0.60 | +0.40 |
| 03-understand-signals | 0.80 | 0.62 | +0.18 | 0.93 | 0.67 | +0.27 |
| 04-learning-3d-pickup | 0.87 | 0.58 | +0.29 | 0.98 | 0.56 | +0.42 |
| 05-csharp-learner-save | 0.98 | 0.82 | +0.16 | 1.00 | 0.92 | +0.08 |
| Mean Δ / cost | | | +0.18 / $12.15 | | | +0.21 / $11.76 |

The eval stores votes, not reasons; causes below come from re-asking a Sonnet judge to explain
each failing verdict (`claude -p --model sonnet`, rubric + answer).

| Before-run failure | Cause | Change |
|---|---|---|
| `no-menu-paths` 9/15 with-arm (13/15 without) | Judge called the 4.7 **Select Script/Scene** autoload button invented; two verdicts flipped on re-ask | Grader checks existence only for the places it lists and accepts button, field, and dialog names inside them |
| 03 `signal-concept` 0/3 | Intermediate user got click-by-click group, autoload, and signal-dock steps — the click-path relaxation ignored `level` | `godot-mentor` card and §4: click-paths are beginner-level; intermediate names the setup |
| 04 `area3d-pickup` 1/3 | Answers said "you don't need to change any collision layers"; `physics-system` §4 never tied `body_entered` to mask/layer | `physics-system` §4 names `monitoring` and mask-includes-layer |
| 01 `no-scope-creep` 2/3 | Judge counted the one-air-dash limit as an extra mechanic, against the skill's own scope rule | Grader: limits that stop a feature breaking in play are part of it |

After-run with-arm failures, each 1/3: 01 `beat-why` (split vote), 03 `signal-concept` (passed on
re-ask — noise), 03 `beat-one-next`, 04 `no-menu-paths` (real: the answer left a visible
self-correction, "Click **3D Scene**? No:", in a step). `no-menu-paths` after: 14/15 with-arm.
`no-menu-paths` and `no-scope-creep` figures from before this entry are not comparable to after.

### Root causes (measured before editing)

| # | Root cause | Change |
|---|---|---|
| 1 | The tween is in `hud-system`'s own health-bar recipe — mentor mode delivered a production recipe verbatim. `heal()`/`died` appear in no skill (invented). | Mentor card: "Scope: exactly what was asked" — strip domain-recipe extras |
| 2 | Concept beat ~1.3–1.4 k chars in all three runs, yet 1/3 passed: grader is noisy. Prompt is "intermediate, *but signals confuse me*". | Author decision: `level` is a baseline, not a ceiling — the named concept gets beginner depth (§4). Grader (3) changed accordingly, so **case 03 is not comparable to the baseline** |
| 3 | `player-controller`'s dash recipe had **no cooldown or air limit** (and GDScript/C# disagreed). The run delivered it, then offered the cooldown as Beat 5. | Recipe rewritten with cooldown + one air dash; mentor forbids deferring part of the ask |
| 4 | Confirmed in baseline: 7/15 with-arm answers spent a preamble or paragraph on the unwritable state file. | §3: one line at the end, no retry, no separate message |
| 5 | Not reproducible — every baseline answer names the domain skill it loaded. Pilot-only. | No change |

## Skill follow-ups (as found by the baseline eval)

1. **Scope rule not holding.** Case 02 failed `no-scope-creep` 3/3: every with-arm run added a
   tweened bar animation; runs 1–2 also added `heal()` and a `died` signal. Base model stayed in
   scope. Case 05 failed it once. `godot-mentor` §2 "Explanation, not scope" is not strong enough.
   → Expect case 02 Δ to move most when fixed.
2. **Intermediate calibration ignored.** Case 03 failed `signal-concept` 2/3 (and in every pilot):
   multi-paragraph Concept beat for a self-described intermediate user, where §4 says "one or two
   sentences on the trade-off only".
3. **Beat 5 swallows the requested feature.** Case 01 run 2 shipped a dash with no cooldown/limit
   (spammable), then offered the cooldown as the "next step" plus a second bracketed idea. The
   "put the rest in Beat 5" guidance invites deferring part of what was asked.
4. **State-file write has no graceful fallback.** When no Write/Bash tool is available, the agent
   still tries to write `~/.godot-prompter/state/`, then posts a separate housekeeping message.
   Pilot 3 case 01: 174 s / $1.33 (vs ~$0.60), and the lesson ended up in a non-final message.
   The skill should say: if you cannot write state, mention it in one line inside the answer and
   move on.
5. **Domain skill not always loaded.** Pilot 1 case 05 loaded only `godot-mentor`, not `save-load`,
   despite §1's wrapping rule. That answer also claimed sibling `_ready()` order is bottom-to-top
   (wrong — siblings are ready in tree order; children before parents).

## Known grader caveats

- `no-menu-paths` changed from a regex to an `llm` grader on 2026-10-05 (v1.15.0), when the
  Editor beat was relaxed to allow click-paths taken from `godot-mentor`'s editor references.
  The regex failed any `Project → X` path; the new grader fails only positions, coordinates,
  and menu items that do not exist. It cannot read the reference files, so it judges against
  the menu, dock, and panel names listed in its own prompt, not against the references
  themselves; a wrong item under a real menu can pass. Positions pass when attached to a named control, because the editor references themselves give such positions. Figures for this grader before and after
  are not comparable. Re-baselined and loosened again on 2026-10-08 — see the v1.15.0 re-baseline entry.
- Graders read `last_message`; if the answer is split across messages (follow-up 4) the run scores
  low even though the user saw the lesson. Do NOT switch to `trace` — regexes would match the
  SKILL.md text itself.
- `no-scope-creep` on case 03 can split votes (noisy).
- `beat-why` (case 01) was reworded to accept a technique contrast, not only a node/resource/API
  one — see the Post-grill regression run entry above. Figures from before the reword are not
  comparable to figures after it.
- `evals/results/` holds run output and is gitignored; record baselines in this file.
