# Domain-skill eval — pilot

Suite: `skill-*` cases, one domain skill each, adapted from `tests/agent-integration/TEST_PLAN.md`
Category 2. They run in an empty workspace like the mentor cases (no `--scaffold`): inside a
project the card routes an open feature request to `godot-grill` first, which is not what these
measure.

```
claude plugin eval . --case "skill-*" -j 3 --ablation with-without --judge-model sonnet --no-publish
```

Roughly $1.30-$3.40 a case (runs: 3), so a case per skill across the whole plugin would cost
over $100 a run. Cases carry a tag: `--tag discriminating` selects the ones that separate the
arms (the count changes — see the latest section), `--tag ceiling` the ones both arms pass, kept as routing checks.

## Pilot — v1.15.0 + branch fixes, 2026-10-09 (`results/2026-10-09T18-30-04-722Z`)

Clean run (0 errors/timeouts), mean **Δ +0.07**.

| Case | Skill | With | Without | Δ | Skill fired | Notes |
|---|---|---|---|---|---|---|
| skill-01-state-machine | `state-machine` | 0.80 | 0.67 | +0.13 | 3/3 | `fsm-choice` 1/3 vs 0/3; `fsm-correct` 2/3 vs 1/3 |
| skill-02-save-load | `save-load` | 1.00 | 0.83 | +0.17 | 3/3 | `save-format` 3/3 vs 1/3; `save-versioned` 3/3 vs 2/3 |
| skill-03-enemy-patrol-chase | `ai-navigation` | 1.00 | 1.00 | 0.00 | 2/3 | every grader 3/3 in both arms — at ceiling |
| skill-04-code-review | `godot-code-review` | 1.00 | 1.00 | 0.00 | 1/3 | every grader 3/3 in both arms — at ceiling |

- The base model is already strong on mainstream Godot 4, so the gain is smaller than mentor's
  or grill's and shows only where the skill carries a judgement: why this save format, the
  Resource-loading warning, versioned saves, which FSM structure for seven states.
- skill-03 and skill-04 cannot distinguish the arms as written. Their graders check what the base
  model already does; they need harder criteria or should be dropped.
- skill-01 `fsm-choice` with-arm failures are real: the answers pick a node-based machine for the
  right reason (seven states) but never name the alternative they rejected. `fsm-correct` is a
  three-clause "ALL hold" rubric over 20 KB answers and flipped on re-ask — treat it as noisy.
- `godot-code-review` fired in 1 of 3 runs for "Review this GDScript for common Godot 4 issues":
  description-only routing (no card in an empty workspace) does not reliably pick it.

## Targeted cases — 2026-10-10

After the pilot, `skill-03-enemy-patrol-chase` was dropped (ceiling) and seven cases were aimed at
where the bare model might be wrong or out of date: five addon skills, one Godot 4.7 change, and
C# signals. Runs `results/2026-10-10T23-37-23-189Z` to `results/2026-10-10T23-51-27-756Z`, all
clean, about $14 together.

| Case | Skill | With | Without | Δ | Tag | What separated the arms |
|---|---|---|---|---|---|---|
| skill-10-godot-47-changes | `audio-system` | 1.00 | 0.76 | **+0.24** | discriminating | `audio-47-default-change` 3/3 vs **0/3**; `audio-area-mask-fix` 3/3 vs 2/3 |
| skill-05-limboai | `limboai` | 1.00 | 0.89 | +0.11 | discriminating | `limbo-tree-finished` 3/3 vs 1/3 (deprecated `behavior_tree_finished`) |
| skill-09-phantom-camera | `phantom-camera` | 1.00 | 0.89 | +0.11 | discriminating | `pcam-csharp-wrapper` 3/3 vs 2/3 |
| skill-06-beehave | `beehave` | 1.00 | 1.00 | 0.00 | ceiling | nothing |
| skill-07-popochiu | `popochiu` | 1.00 | 1.00 | 0.00 | ceiling | nothing — the bare model knows the Popochiu 2 API |
| skill-08-dialogue-manager | `dialogue-manager` | 0.83 | 0.83 | 0.00 | ceiling | nothing; see grader note |
| skill-11-csharp-signals | `csharp-signals` | 1.00 | 1.00 | 0.00 | ceiling | nothing; skill fired 1/3 |

- **The plugin's measurable edge is recency, not addon knowledge.** The bare model never
  attributed the broken area bus override to 4.7's `area_mask` default change. The skills carry
  32 "Changed in Godot 4.7" callouts across 21 files — the best source of further cases.
- skill-08 `dm-ended-signal` failed 0/3 in both arms because it demanded the addon's
  `dialogue_ended` signal; all six answers walked the conversation by hand and emitted their own
  signal, naming `dialogue_ended` correctly as the alternative. The grader now accepts either.
  Not re-run; expect 1.00 in both arms.

## Fixes found by these cases — 2026-10-10 (`results/2026-10-10T23-37-23-189Z`, `…T23-42-59-030Z`)

| Finding | Change | Re-run |
|---|---|---|
| `state-machine` picked a structure without naming the one it rejected | §1 and the checklist ask for the rejected approach and the deciding factor | `fsm-choice` with 1/3 → **3/3** (without 1/3) |
| `godot-code-review` fired 1/3 on "Review this GDScript…" | description lists trigger phrases and says a pasted snippet counts | `trigger-skill` 1/3 → **3/3** |
| skill-04 at ceiling | harder script, five planted issues, must include the dropped coroutine after `queue_free()` | still 3/3 in both arms — a routing check only |
| skill-01 `fsm-correct` flipped on whether an inherited hook counts | one condition; inherited hooks count | re-judged 11/12 pass across both arms — stable, no longer separates them |

## Godot 4.7 change cases — 2026-10-11 (`results/2026-10-11T00-16-31-153Z`)

Four more cases built on "Changed in Godot 4.7" callouts, each fact checked against the engine
source and the 4.6 / 4.7 migration guides before running. Clean run, $4.50, 270 s, mean **Δ +0.69**.

| Case | Skill | With | Without | Δ | What the bare model missed (0/3 each) |
|---|---|---|---|---|---|
| skill-12-input-device-ids | `input-handling` | 1.00 | 0.60 | +0.40 | keyboard/mouse device IDs are 16 and 32, no longer 0 |
| skill-13-blendspace-sync-mode | `animation-system` | 1.00 | 0.33 | +0.67 | bool `sync` replaced by the `sync_mode` enum; `SYNC_MODE_INDEPENDENT` |
| skill-14-richtext-image-unit | `godot-ui` | 1.00 | 0.33 | +0.67 | `width_unit` / `height_unit` and `IMAGE_UNIT_EM` |
| skill-15-volumetric-fog-blending | `3d-essentials` | 1.00 | 0.00 | +1.00 | the blending change and `use_legacy_blending` |

Every skill fired 3/3. With skill-10 (+0.24) that is five version-change cases, all positive; the
five mainstream and addon cases average about +0.05. Recency is what this plugin measurably adds.

Skill corrections made while checking facts for these cases and the C# one:

| Skill | Was | Is |
|---|---|---|
| `3d-essentials` (and `references/fog-recipes.md`) | fog blending "changed in 4.7" | the blending changed in **4.6** (GH-112494); 4.7 added `use_legacy_blending` (GH-119414) |
| `csharp-signals` | omitting `EventHandler` "compiles without error" | compile error GD0201 |
| `csharp-signals` `references/awaiting-signals.md` | `ToSignal(...).AsTask()`; resolves to `Godot.Collections.Array` | no `AsTask()` exists — wrap the await in an `async Task` method; resolves to `Variant[]` |
| `csharp-signals`, `event-bus` | "C# must disconnect explicitly", causes a memory leak | Godot disconnects on free except custom `[Signal]`s and capturing lambdas; the failure is `ObjectDisposedException` |
| `csharp-signals` description | fired 1/3 on a C#/GDScript signal question | trigger phrases added; 3/3 (`results/2026-10-11` re-run of skill-11) |

`docs/superpowers/notes/2026-07-05-godot-4.7-deltas.md` still carries the fog mistake; it is a
dated research note and was left as written. The corrected C# examples were later compiled against
`Godot.NET.Sdk` 4.3.0 and 4.7.2 (see the audit note); nothing was run inside a game.

## Pre-release regression — 2026-10-11 (`results/2026-10-11T19-32-54-199Z`)

All 14 `skill-*` cases after the skill audits. Clean, mean Δ +0.24, $21.72, 1591 s at `-j 3`.
Every skill fired 3/3.

| Case | With | Without | Δ |
|---|---|---|---|
| skill-15-volumetric-fog-blending | 1.00 | 0.00 | +1.00 |
| skill-13-blendspace-sync-mode | 1.00 | 0.33 | +0.67 |
| skill-14-richtext-image-unit | 1.00 | 0.33 | +0.67 |
| skill-12-input-device-ids | 1.00 | 0.60 | +0.40 |
| skill-09-phantom-camera | 0.89 | 0.56 | +0.33 |
| skill-10-godot-47-changes | 1.00 | 0.86 | +0.14 |
| skill-01-state-machine | 1.00 | 0.87 | +0.13 |
| skill-02-save-load | 0.89 | 0.83 | +0.06 |
| skill-04-code-review | 0.93 | 1.00 | -0.07 |
| skill-05, -06, -07, -08, -11 | 1.00 | 1.00 | 0.00 |

- skill-02 `save-format` failed 2/3 in the with arm: the answers chose JSON without naming the
  format they rejected. `save-load` §1 now asks for the rejected strategy and the deciding
  factor, as `state-machine` does; re-run (`results/` of 2026-10-11, skill-02 only) 3/3 in both arms.
- skill-05-limboai came out at ceiling this time (the bare model used the `updated` signal in
  all three runs); it was +0.11 before. Treat it as borderline.
- skill-04's -0.07 is one `review-actionable` vote split in one run; the case is a routing check.

## New-skill cases — v1.16.0, 2026-10-21 (`results/2026-10-21T16-26-47-217Z`, `…-122Z`, `…-069Z`; skill-18 re-run `…T16-38-49-218Z`)

Three cases for `web-services`, `rendering-pipeline` and `web-export`, each fact checked against the
`4.3-stable` / `4.7.2-stable` source and the 4.7.2 binary first. The `--case` glob has no bracket
or brace support (`skill-1[678]-*` matches nothing), so the three cases ran as three concurrent
invocations, one per case name. Clean runs, about $3.3 together, no errors or timeouts.

| Case | Skill | With | Without | Δ | Skill fired | Tag | What separated the arms |
|---|---|---|---|---|---|---|---|
| skill-17-rendering-pipeline | `rendering-pipeline` | 0.92 | 0.50 | **+0.42** | 3/3 | discriminating | `fsr-forward-plus-only` 3/3 vs **0/3**: the bare model recommends FSR 1 on the Mobile renderer |
| skill-16-web-services | `web-services` | 1.00 | 1.00 | 0.00 | **1/3** | ceiling | nothing: the bare model knows `timeout` covers the whole transfer |
| skill-18-web-export | `web-export` | 1.00 | 1.00 | 0.00 | 3/3 | ceiling | nothing: the bare model knows the thread/COOP/COEP cause |

- skill-16: the skill fired in 1 of 3 runs for a plain HTTPRequest download question. Description-only routing does not reliably pick it; per the plan the description was left alone this release and the gap is carried to the v1.16.0 follow-ups.
- skill-17 with-arm 0.92: one `upscaling-code-correct` run failed 3/3 votes on an answer that suggested MetalFX Spatial on Mobile (valid on 4.4+); the code grader is the noisy one. The without-arm answers are the real signal.
- skill-18 first run (`…069Z`, with 0.75 / without 1.00) was grader wording, not the model: the key grader demanded the full header names and the regex missed "Thread Support". Both now accept COOP/COEP and the UI label; re-run 1.00 in both arms.

- **Re-run 2026-10-22 (`results/2026-10-21T23-30-37-310Z`):** skill-16 again 1.00 / 1.00, `web-services` fired 1/3. This case runs in an empty workspace, so the SessionStart card is not injected; the v1.16.0 card's new `web-services` row cannot affect it. The routing gap is in the skill's `description`.
