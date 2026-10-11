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
arms (about $12 a run), `--tag ceiling` the ones both arms pass, kept as routing checks.

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
