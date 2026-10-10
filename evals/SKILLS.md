# Domain-skill eval — pilot

Suite: `skill-*` cases, one domain skill each, adapted from `tests/agent-integration/TEST_PLAN.md`
Category 2. They run in an empty workspace like the mentor cases (no `--scaffold`): inside a
project the card routes an open feature request to `godot-grill` first, which is not what these
measure.

```
claude plugin eval . --case "skill-*" -j 3 --ablation with-without --judge-model sonnet --no-publish
```

About 15 min and $9.50 for the four cases (runs: 3) — roughly $2.40 a case, so a case per skill
across the whole plugin would cost over $100 a run.

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
