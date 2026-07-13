# Agent Integration Test Results

**Date:** YYYY-MM-DD
**Platform:** Claude Code
**Model:** [model used]
**GodotPrompter version:** v1.0.0-rc

## Category 1: Cold Start

| Test | Status | Notes |
|------|--------|-------|
| 1.1 Plugin loads | | |
| 1.2 Skill content access | | |
| 1.3 Cross-reference navigation | | |

## Category 2: Skill Discovery

| Test | Status | Notes |
|------|--------|-------|
| 2.1 State machine request | | |
| 2.2 Project setup request | | |
| 2.3 Enemy AI request | | |
| 2.4 Save/load request | | |
| 2.5 Code review request | | |

## Category 3: Full Workflow

| Test | Status | Notes |
|------|--------|-------|
| 3.1 Project + Player | | |
| 3.2 Add Enemy | | |
| 3.3 Add HUD | | |
| 3.4 Code Review | | |
| 3.5 Save/Load | | |

## Summary

- **Total tests:** 13
- **PASS:**
- **PARTIAL:**
- **FAIL:**
- **FRICTION:**

## Friction Points

(List specific UX issues found during testing)

## Recommendations for README/Docs

(List improvements needed based on test findings)

---

# Run: Category 4 — Third-Party Addon Skills (v1.12.0 pre-release)

**Date:** 2026-07-14
**Platform:** Claude Code (subagent harness)
**Model:** Sonnet 4.5
**GodotPrompter version:** v1.12.0-rc (branch `feature/v1.12.0`)

**Method:** three fresh subagents, no prior context, each given only the user prompt and the path to
`skills/`, instructed to pick a skill by frontmatter `description` and answer from it. This tests
description-based discoverability and content sufficiency. It does **not** test installed-plugin routing —
the three skills are new in the working tree and not yet in the plugin cache (see TEST_PLAN Category 4
note); re-run against the installed plugin after release.

| Test | Status | Notes |
|------|--------|-------|
| 4.1 Popochiu cutscene | **PASS** | Picked `popochiu` from description alone. Used `C.player.walk_to_clicked()` / `walk_to()` then `R.goto_room()`, and explicitly stated "there is no `E.goto_room()`" — the exact trap the skill was written to prevent. Correctly kept `queue_*` twins inside `E.queue()`/`E.cutscene()` only. Read `references/pipeline.md` unprompted for the `T` transition API. |
| 4.2 Dialogue Manager + C# | **PASS** | Picked `dialogue-manager` immediately; did not fall back to the generic `dialogue-system`. Valid `.dialogue` syntax (`~ title`, `- response`, `[if …]` before the trailing `=> jump`, `set` mutation). C# used `DialogueManagerRuntime`, `ShowDialogueBalloon`, `await GetNextDialogueLine`, `Resource` (not a nonexistent `DialogueResource` C# type), `response.IsAllowed`, and the **`null`** end-of-dialogue check. |
| 4.3 Phantom Camera switching | **PASS** | Picked `phantom-camera` ("priority-based switching" in the description matched the question near-verbatim). Answered with priority switching (not `Camera2D.make_current()`), `PhantomCameraHost` as a child of the real camera, `host_layers` eligibility, and both GDScript (`set_priority()`) and C# (`AsPhantomCamera2D()` → `.Priority`). |

**Result: 3/3 PASS.**

## Findings (content gaps surfaced by the runs — none blocking)

1. **`popochiu`** — the skill does not say whether `E.queue()`/`E.cutscene()` can be awaited by the
   caller, and does not state whether a `queue_`-twin exists for `R.goto_room()`. The tester correctly
   declined to invent one and used the awaited sequential form instead. Worth documenting explicitly.
2. **`dialogue-manager`** — the skill's state examples are all GDScript autoloads; it does not say how a
   **C#** autoload's members are named when `.dialogue` expressions resolve them (PascalCase vs
   snake_case). The tester flagged the uncertainty rather than asserting. Worth a sentence.
3. **`phantom-camera`** — §4's trigger example uses `area_entered`/`area_exited` (area-vs-area, mirroring
   the addon's own example script) where "player enters an area" more commonly means
   `body_entered`/`body_exited` with a `CharacterBody2D`. Not wrong (it is the addon's own idiom, and the
   guard checks `area.get_parent() is CharacterBody2D`), but a reader could take it as a requirement to
   wrap the player in an `Area2D`. Left as-is for this release — the file has only ~160 bytes of budget
   headroom and the example is source-faithful.
4. **Discoverability (expected, not a defect)** — the new skills are not in the installed plugin's skill
   list until the release ships. Post-release, re-run Category 4 to confirm the `Skill` tool routes to
   them by description.
