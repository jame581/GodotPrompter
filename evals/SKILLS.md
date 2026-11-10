# Domain-skill eval — pilot

Suite: `skill-*` cases, one domain skill each, adapted from `tests/agent-integration/TEST_PLAN.md`
Category 2. They run in an empty workspace like the mentor cases (no `--scaffold`): inside a
project the card routes an open feature request to `godot-grill` first, which is not what these
measure.

```
claude plugin eval . --case "skill-*" -j 3 --ablation with-without --judge-model sonnet --no-publish
```

Roughly $1.30-$3.40 a case (runs: 3), so a case per skill across the whole plugin would cost
over $100 a run. Cases carry a tag. `--tag discriminating` selects the cases whose graders
separate the arms (11 of the 17 `skill-*` cases at v1.17.0; the number moves as cases are added or
retagged, so check `tags:` in each `prompt.md`), `--tag ceiling` the ones both arms pass, kept as
routing checks. A full `--case "skill-*"` run is about $22-$58 at those per-case figures; a
`discriminating`-only run is about $14-$37.

`--case` takes an exact case name or a `*` glob. It has no bracket or brace support
(`skill-1[678]-*` and `skill-1{6,7,8}-*` match nothing), so run several cases as separate
invocations, one per exact name. That is a limitation of the `claude plugin eval` tool, not of the suite.

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

## Dialogue Manager 4 — v1.17.0, 2026-11-10 (`results/2026-11-10T00-31-57-887Z`)

`dialogue-manager` was rewritten from v3.10.4 to v4.2.0, so skill-08 now asks for version 4 on
Godot 4.7: a sample `.dialogue` with one key-gated choice, the walker (first *allowed* choice, the
per-line voice key), the HUD notification, and what to configure for PO translations. Three graders
were added — `dm-response-condition` (self-closing `[if cond /]`), `dm-allowed-response`
(`is_allowed`), `dm-4x-api` (`static_id`, no `translation_source`, no title-era names) — and the
case is retagged `discriminating`. Clean run, $2.81, 145 s.

| Case | Skill | With | Without | Δ | Skill fired | Tag | What separated the arms |
|---|---|---|---|---|---|---|---|
| skill-08-dialogue-manager | `dialogue-manager` | 1.00 | 0.78 | **+0.22** | 3/3 | discriminating | `dm-response-condition` 3/3 vs **0/3**, `dm-4x-api` 3/3 vs **0/3** |

- The bare model writes Dialogue Manager 3 on autopilot even when told "version 4": every
  without-arm answer gated the choice with `[if GameState.has_key]` (which 4.x compiles without
  error and never applies — checked headless against v4.2.0), read `translation_key` /
  `TranslationKey`; `translation_source` also appears in the without-arm transcripts.
- `dm-allowed-response` passed 3/3 in both arms: `is_allowed` predates 4.x.

## Popochiu 2.2.1 — v1.17.0, 2026-11-10 (`results/2026-11-10T00-39-35-055Z`)

`popochiu` moved from v2.1.1 to v2.2.1 (breaking: `say()` no longer takes an emotion, `E.play_transition()`
and item `discard()` removed). The case prompt now says "Popochiu addon (2.2) on Godot 4.7". No grader
measures a changed API, so no grader changed. Clean run, $1.14, 199 s.

| Case | Skill | With | Without | Δ | Skill fired | Tag | What separated the arms |
|---|---|---|---|---|---|---|---|
| skill-07-popochiu | `popochiu` | 1.00 | 1.00 | 0.00 | 3/3 | ceiling | nothing: the bare model scripts the door and dialog correctly |

- An answer that writes `say("…", "emotion")` would still pass every grader while being broken in 2.2;
  the prompt asks for no emotion, so none was added.

## LimboAI 1.8.1 — v1.17.0, 2026-11-10 (`results/2026-11-10T00-50-20-981Z`)

`limboai` moved to v1.8.1, the version line now names the 4.4 to 4.5 lines (1.4.x to 1.6.x), the
tree-finished wording says what the reader decides, and `references/hsm.md` gained a nested-HSM
section. The `limbo-tree-finished` grader passed only answers that call `restart()`, which
contradicts the skill (a tree that returned SUCCESS/FAILURE re-enters from the root on the next update
by itself, `bt/bt_player.cpp`, `bt/tasks/bt_task.cpp:219-245`). It now accepts the automatic restart,
an explicit `restart()`, and a pause that sets `active = false` then back to true.

| Case | Skill | With | Without | Δ | Skill fired | Tag | What separated the arms |
|---|---|---|---|---|---|---|---|
| skill-05-limboai | `limboai` | 1.00 | 1.00 | 0.00 | 3/3 | ceiling | nothing, as in the last audit run |

- First run after the grader change (`results/2026-11-10T00-40-33-629Z`): with 0.94, without 1.00.
  One with-arm answer paused the restart with `active = false` and then `active = true`; my first
  wording failed any `active = false`. The second wording above fixed it; the re-run is the table.
- The fail clause was tightened after that last run (it also fails an answer claiming the tree must be
  re-instantiated or reloaded to run again). Wording only, not re-run.

## Phantom Camera 0.11.0.4 — v1.17.0, 2026-11-10

`phantom-camera` moved to v0.11.0.4 (enabling the plugin no longer restarts the editor; the "shared
follow options" blurb now says which options are 2D only). No eval re-run: no grader of
`skill-09-phantom-camera` measures the editor restart or the follow-option wording (grepped). The
last measured baseline stands (with 0.89, without 0.56, Δ +0.33).

## Beehave 2.9.3 — v1.17.0, 2026-11-10

`beehave` moved to v2.9.3 (autoloads added on enable and removed on disable; a wrong
`actor_node_path` leaves `actor` null). No eval re-run: no grader of `skill-06-beehave` measures
autoloads or `actor_node_path` (grepped). The last measured baseline stands (with 1.00, without 1.00).

## web-services routing — v1.17.0, 2026-11-10 (`results/2026-11-10T01-09-25-639Z`)

Follow-ups §4: skill-16 fired 1/3 twice. The `web-services` description now names the concrete
triggers (HTTPRequest, downloading a file or content pack, REST/JSON API, backend endpoints, auth
tokens and headers, uploading, leaderboard/analytics calls, WebSocketPeer clients, timeouts) and
points game networking to `multiplayer-basics` and browser export to `web-export`. The session card
was not touched. One rewrite, one run, no second iteration needed.

```
claude plugin eval . --case "skill-16-web-services" -j 3 --ablation with-without --judge-model sonnet --no-publish
```

| Case | Skill | With | Without | Δ | Skill fired | Tag | What separated the arms |
|---|---|---|---|---|---|---|---|
| skill-16-web-services | `web-services` | 1.00 | 1.00 | 0.00 | **3/3** | ceiling | nothing: routing check only; fired 1/3 → 3/3 |

"Skill fired" is the `trigger-skill` grader (`tool_used` Skill, `input_match: web-services`) passing
in each with-arm run (3 of 3 in `aggregate-result.json`). Clean run, $1.70.

## web-services routing, fix round 1 — v1.17.0, 2026-11-10 (`results/2026-11-10T01-13-33-867Z`)

The 3/3 row above used the sentence "Triggers on any HTTPRequest question, including a download that
times out", which review judged eval-specific (it mirrors the skill-16 prompt) and unbounded. It was
replaced with general wording: "over HTTP or WebSocket", plus "Not for real-time game networking and
RPCs (`multiplayer-basics`) or browser export limits (`web-export`)". No phrase comes from the prompt.
Same command as above.

| Case | Skill | With | Without | Δ | Skill fired | Tag | What separated the arms |
|---|---|---|---|---|---|---|---|
| skill-16-web-services | `web-services` | 0.92 | 1.00 | -0.08 | **3/3** | ceiling | nothing: one with-arm run scored 0.75 on a grader vote split (noise, a ceiling case) |

`trigger-skill` passed in all three with-arm runs (`aggregate-result.json`), with the general wording.

## Grader wording changes after the last run — v1.17.0

Three graders were edited in v1.17.0 and **not re-run**; the recorded results above were scored with
the earlier wording.

- `skill-17-rendering-pipeline/graders/upscaling-code-correct.md` now also accepts
  `SCALING_3D_MODE_METALFX_SPATIAL` / `SCALING_3D_MODE_METALFX_TEMPORAL` (Godot 4.4+, `Viewport.xml`
  at `4.4-stable`), which the old wording would have called invented.
- `skill-18-web-export/graders/web-code-correct.md`: the garbled "HTML5 export preset naming only"
  clause now reads "the `HTML5` platform or preset name". The platform is `Web` in Godot 4
  (`OS_Web::get_name()` returns `"Web"` at `4.3-stable` and `4.7.2-stable`).
- `skill-16-web-services/graders/names-download-file-or-part.md`: the regex gained word boundaries so
  `.part` no longer matches `.particles` or `.partition`.
- `skill-17-rendering-pipeline/graders/names-forward-plus.md` is unchanged and stays near-trivial by
  design: it only checks that "Forward+" is mentioned at all, and the real check is
  `fsr-forward-plus-only`. Read a pass on it as a routing signal, not as correctness.
