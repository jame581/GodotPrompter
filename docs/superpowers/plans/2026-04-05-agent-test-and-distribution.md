# Agent Integration Test & Distribution Implementation Plan

**Status:** shipped in v1.0.0 (2026-04-06)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate GodotPrompter works end-to-end with AI agents, then publish v1.0.0 with polished docs and marketplace presence.

**Architecture:** Two sequential phases — agent test first (produces findings), then distribution (incorporates findings). Test plan is a markdown doc with structured prompts. Distribution is README update, CHANGELOG, CONTRIBUTING, git tag, and marketplace listings.

**Tech Stack:** Markdown, Git, GitHub CLI (`gh`).

---

## File Map

| File | Responsibility |
|------|---------------|
| `tests/agent-integration/TEST_PLAN.md` | Structured test prompts with expected outcomes |
| `tests/agent-integration/RESULTS.md` | Pass/fail per test with friction notes |
| `README.md` | Updated with full skill table, validation, quick start |
| `CHANGELOG.md` | Version history starting at v1.0.0 |
| `CONTRIBUTING.md` | How to add skills, conventions, testing |

---

## Phase A: Agent Integration Test

### Task 1: Write Test Plan

**Files:**
- Create: `tests/agent-integration/TEST_PLAN.md`
- Create: `tests/agent-integration/RESULTS.md`

- [ ] **Step 1: Create test plan document**

Create `tests/agent-integration/TEST_PLAN.md`:

```markdown
# GodotPrompter Agent Integration Test Plan

Run these tests in a **fresh Claude Code session** with GodotPrompter installed.
Record results in `RESULTS.md` after each test.

---

## Category 1: Cold Start (Installation & Discovery)

### Test 1.1: Plugin loads

**Setup:** Fresh Claude Code session with GodotPrompter installed.

**Prompt:** "What Godot skills are available from GodotPrompter?"

**Expected:**
- Agent loads `using-godot-prompter` skill (or reads it)
- Lists skill categories: Core/Process, Architecture, Gameplay, UI, Multiplayer, Build, C#
- Mentions at least 10 specific skill names

**Pass criteria:** Agent shows awareness of the skill catalog, not generic Godot advice.

---

### Test 1.2: Skill content access

**Prompt:** "What does the state-machine skill cover? Show me the approaches."

**Expected:**
- Agent reads `skills/state-machine/SKILL.md`
- Describes 3 approaches: enum-based, node-based, resource-based
- Shows the comparison table from the skill

**Pass criteria:** Response matches skill content, not generic FSM knowledge.

---

### Test 1.3: Cross-reference navigation

**Prompt:** "The state-machine skill mentions related skills. What are they?"

**Expected:**
- Agent finds the Related Skills line: player-controller, ai-navigation, resource-pattern
- Can describe what each related skill covers

**Pass criteria:** Agent navigates cross-references correctly.

---

## Category 2: Skill Discovery (Open-Ended Prompts)

### Test 2.1: State machine request

**Prompt:** "I need to add a state machine to my player character in Godot 4."

**Expected skill:** `state-machine`

**Expected behavior:**
- Loads the skill (not generic advice)
- Asks about complexity to recommend enum vs node vs resource approach
- Shows GDScript example from the skill
- Mentions C# equivalent

**Pass criteria:** Uses skill content, not generic FSM tutorial.

---

### Test 2.2: Project setup request

**Prompt:** "I'm starting a new Godot 4.3 project. How should I organize it?"

**Expected skill:** `godot-project-setup`

**Expected behavior:**
- Shows the split layout directory structure from the skill
- Recommends autoloads (GameManager, EventBus)
- Shows .gitignore template

**Pass criteria:** Directory structure matches skill exactly.

---

### Test 2.3: Enemy AI request

**Prompt:** "I want enemies that patrol waypoints and chase the player when they get close."

**Expected skill:** `ai-navigation`

**Expected behavior:**
- Shows NavigationAgent2D setup
- Provides patrol pattern with waypoints
- Shows chase behavior with state transitions
- References state-machine skill for FSM integration

**Pass criteria:** Uses NavigationAgent2D (not custom pathfinding), shows patrol code from skill.

---

### Test 2.4: Save/load request

**Prompt:** "Help me set up a save/load system for my Godot game."

**Expected skill:** `save-load`

**Expected behavior:**
- Shows strategy comparison table (ConfigFile, JSON, Resource)
- Recommends JSON for game saves
- Shows SaveManager autoload pattern
- Mentions version migration

**Pass criteria:** Shows the comparison table, recommends JSON with reasoning.

---

### Test 2.5: Code review request

**Prompt:** "Review this GDScript for common Godot issues." (paste a sample script with intentional anti-patterns)

**Sample script to paste:**
```gdscript
extends CharacterBody2D

var health = 100
var speed = 200

func _process(delta):
    var player = get_node("/root/Main/Player")
    if player:
        var dir = (player.position - position).normalized()
        position += dir * speed * delta

func take_damage(amount):
    health -= amount
    if health <= 0:
        get_parent().remove_child(self)
        queue_free()
```

**Expected skill:** `godot-code-review`

**Expected behavior:**
- Flags: untyped variables, using `_process` instead of `_physics_process` for movement
- Flags: hardcoded node path `/root/Main/Player` (use groups instead)
- Flags: `position +=` instead of `move_and_slide()` on CharacterBody2D
- Flags: `remove_child` before `queue_free` (unnecessary)
- Uses the checklist structure from the skill

**Pass criteria:** Finds at least 3 of the 4 issues, uses skill checklist format.

---

## Category 3: Full Workflow (End-to-End Build)

### Test 3.1: Project + Player

**Setup:** Empty directory, no existing Godot project.

**Prompt:** "Create a new Godot 4.3 project with a player that can move with WASD and attack with Space."

**Expected skills:** `godot-project-setup`, `player-controller`, `state-machine`

**Expected behavior:**
- Scaffolds project with directory structure from godot-project-setup
- Creates player with CharacterBody2D top-down movement from player-controller
- Adds FSM (idle/move/attack) from state-machine
- Sets up input actions

**Pass criteria:** All 3 skills used, project structure matches skill patterns.

---

### Test 3.2: Add Enemy

**Prompt:** "Add an enemy with patrol AI that chases the player and attacks."

**Expected skills:** `ai-navigation`, `state-machine`, `component-system`

**Expected behavior:**
- Creates enemy with NavigationAgent2D
- Uses patrol pattern from ai-navigation
- Adds FSM (idle/patrol/chase/attack) from state-machine
- Uses HitboxComponent/HurtboxComponent/HealthComponent from component-system

**Pass criteria:** Navigation-based patrol, component-based damage.

---

### Test 3.3: Add HUD

**Prompt:** "Add a health bar HUD that shows the player's health."

**Expected skills:** `hud-system`, `event-bus`

**Expected behavior:**
- Creates CanvasLayer HUD from hud-system
- Uses EventBus pattern from event-bus for health updates
- Health bar uses tween animation from hud-system

**Pass criteria:** CanvasLayer HUD, EventBus-driven updates.

---

### Test 3.4: Code Review

**Prompt:** "Review all the code we just wrote for Godot best practices."

**Expected skill:** `godot-code-review`

**Expected behavior:**
- Works through the skill's checklist sections
- Checks node architecture, style, performance, input, signals, resources
- Produces structured review output

**Pass criteria:** Uses checklist format from skill, not ad-hoc review.

---

### Test 3.5: Save/Load

**Prompt:** "Set up save/load for player position and health. F5 to save, F9 to load."

**Expected skill:** `save-load`

**Expected behavior:**
- Creates SaveManager autoload with JSON serialization
- Implements save_game/load_game functions
- Wires to input actions
- Includes version migration pattern

**Pass criteria:** JSON save with version field, matches skill's SaveManager pattern.

---

## How to Run

1. Start a fresh Claude Code session
2. Install GodotPrompter: `claude plugins add ./GodotPrompter`
3. Navigate to an empty test directory
4. Run each test sequentially, recording results in RESULTS.md
5. For Category 3, keep the same session (tests build on each other)
```

- [ ] **Step 2: Create results template**

Create `tests/agent-integration/RESULTS.md`:

```markdown
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
```

- [ ] **Step 3: Commit**

```bash
git add tests/agent-integration/
git commit -m "docs: add agent integration test plan and results template"
```

---

### Task 2: Run Agent Integration Tests

This task is **manual** — the user runs the tests in a fresh Claude Code session.

- [ ] **Step 1: Run all 13 tests following TEST_PLAN.md**

Open a fresh Claude Code session, install GodotPrompter, and run each test. Record results in `tests/agent-integration/RESULTS.md`.

- [ ] **Step 2: Commit results**

```bash
git add tests/agent-integration/RESULTS.md
git commit -m "docs: record agent integration test results"
```

---

### CHECKPOINT: Review test results before proceeding to distribution.

---

## Phase B: Distribution

### Task 3: README Polish

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Rewrite README.md with full content**

Update `README.md` with the following structure (adapt quick start section based on agent test findings):

```markdown
# GodotPrompter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Godot 4.x](https://img.shields.io/badge/Godot-4.x-blue.svg)](https://godotengine.org)
[![Skills: 29](https://img.shields.io/badge/Skills-29-green.svg)](#available-skills)

Agentic skills framework for Godot 4.x game development. Gives AI coding agents domain-specific expertise for GDScript and C# projects.

## What is this?

GodotPrompter is a plugin that provides **skills** — structured domain knowledge that AI agents load on demand. When you ask your agent to "add a state machine" or "set up multiplayer", it loads the relevant GodotPrompter skill and follows Godot-specific best practices instead of relying on generic knowledge.

**29 skills** covering project setup, architecture, gameplay systems, UI, multiplayer, optimization, and C# patterns. All targeting Godot 4.3+ with both GDScript and C# examples.

## Quick Start

Install and use in under a minute:

**Claude Code:**
```bash
git clone https://github.com/jame581/GodotPrompter.git
claude plugins add ./GodotPrompter
```

Then ask your agent:
```
"I'm starting a new Godot 4.3 project. How should I organize it?"
```

The agent loads the `godot-project-setup` skill and provides a complete directory structure, autoload setup, and .gitignore — not generic advice.

## Supported Platforms

| Platform | Status | Install |
|----------|--------|---------|
| Claude Code | Primary | `claude plugins add ./GodotPrompter` |
| GitHub Copilot CLI | Supported | Clone repo, reads `AGENTS.md` |
| Gemini CLI | Supported | Clone repo, reads `GEMINI.md` |
| Codex | Supported | See `.codex/INSTALL.md` |
| Cursor | Supported | Add to `.cursorrules` |
| OpenCode | Community | See `.opencode/INSTALL.md` |

## Available Skills

### Core / Process (6 skills)

| Skill | Description |
|-------|-------------|
| `using-godot-prompter` | Bootstrap — skill catalog and platform setup |
| `godot-project-setup` | Scaffold directory structure, autoloads, .gitignore, input maps |
| `godot-brainstorming` | Scene tree planning, node selection, architectural decisions |
| `godot-code-review` | Review checklist — best practices, anti-patterns, Godot pitfalls |
| `godot-debugging` | Remote debugger, print techniques, signal tracing, error patterns |
| `godot-testing` | TDD with GUT and gdUnit4 — test structure, mocking, CI |

### Architecture & Patterns (6 skills)

| Skill | Description |
|-------|-------------|
| `scene-organization` | Scene tree composition, when to split scenes, node hierarchy |
| `state-machine` | Enum-based, node-based, resource-based FSM with trade-offs |
| `event-bus` | Global EventBus autoload with typed signals, decoupled communication |
| `component-system` | Hitbox/Hurtbox/Health components, composition over inheritance |
| `resource-pattern` | Custom Resources for items, stats, config, editor integration |
| `dependency-injection` | Autoloads, service locators, @export injection, scene injection |

### Gameplay Systems (6 skills)

| Skill | Description |
|-------|-------------|
| `player-controller` | CharacterBody2D/3D movement — top-down, platformer, first-person |
| `inventory-system` | Resource-based items, slot management, stacking, UI binding |
| `dialogue-system` | Branching dialogue trees, conditions, UI presentation |
| `save-load` | ConfigFile, JSON, Resource serialization, version migration |
| `ai-navigation` | NavigationAgent2D/3D, steering behaviors, patrol patterns |
| `camera-system` | Smooth follow, screen shake, camera zones, transitions |

### UI/UX (3 skills)

| Skill | Description |
|-------|-------------|
| `godot-ui` | Control nodes, themes, anchors, containers, layout patterns |
| `responsive-ui` | Multi-resolution scaling, aspect ratios, DPI, mobile adaptation |
| `hud-system` | Health bars, score displays, minimap, damage numbers, notifications |

### Multiplayer (3 skills)

| Skill | Description |
|-------|-------------|
| `multiplayer-basics` | MultiplayerAPI, ENet/WebSocket, RPCs, authority model |
| `multiplayer-sync` | MultiplayerSynchronizer, interpolation, prediction, lag compensation |
| `dedicated-server` | Headless export, server architecture, lobby management |

### Build & Deploy (3 skills)

| Skill | Description |
|-------|-------------|
| `export-pipeline` | Platform exports, CI/CD with GitHub Actions, itch.io/Steam deploy |
| `godot-optimization` | Profiler, draw calls, physics tuning, object pooling, bottlenecks |
| `addon-development` | EditorPlugin, @tool scripts, custom inspectors, dock panels |

### C# Specific (2 skills)

| Skill | Description |
|-------|-------------|
| `csharp-godot` | C# conventions, GodotSharp API, project setup, GDScript interop |
| `csharp-signals` | [Signal] delegates, EmitSignal, async awaiting, event architecture |

## Validation

Skills were validated against a real Godot 4.3+ trial project (top-down 2D action RPG):

- **13/15 skills PASS** — guidance worked as documented
- **2/15 skills PARTIAL** — minor gotchas documented and fixed
- **0/15 skills FAIL**

See `tests/trial-project/VALIDATION.md` for detailed results.

## Contributing

See `CONTRIBUTING.md` for how to add new skills, conventions, and testing requirements.

## License

[MIT](LICENSE)
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: polish README with full skill table, validation, quick start"
```

---

### Task 4: CHANGELOG

**Files:**
- Create: `CHANGELOG.md`

- [ ] **Step 1: Create CHANGELOG.md**

Create `CHANGELOG.md`:

```markdown
# Changelog

All notable changes to GodotPrompter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-04-05

### Added

- 29 skills covering Godot 4.3+ development (GDScript + C#)
- **Core/Process:** godot-project-setup, godot-brainstorming, godot-code-review, godot-debugging, godot-testing, using-godot-prompter
- **Architecture:** scene-organization, state-machine, event-bus, component-system, resource-pattern, dependency-injection
- **Gameplay:** player-controller, inventory-system, dialogue-system, save-load, ai-navigation, camera-system
- **UI/UX:** godot-ui, responsive-ui, hud-system
- **Multiplayer:** multiplayer-basics, multiplayer-sync, dedicated-server
- **Build/Deploy:** export-pipeline, godot-optimization, addon-development
- **C#:** csharp-godot, csharp-signals
- Cross-references between related skills
- Platform support: Claude Code, Copilot CLI, Gemini CLI, Codex, Cursor, OpenCode
- Trial project validation (13/15 PASS, 2/15 PARTIAL)
- Agent integration test plan
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: add CHANGELOG for v1.0.0"
```

---

### Task 5: CONTRIBUTING Guide

**Files:**
- Create: `CONTRIBUTING.md`

- [ ] **Step 1: Create CONTRIBUTING.md**

Create `CONTRIBUTING.md`:

```markdown
# Contributing to GodotPrompter

Thanks for your interest in contributing! GodotPrompter is an open-source skills framework for Godot 4.x. Here's how to add skills and improve existing ones.

## Adding a New Skill

### 1. Create the skill folder

```
skills/<skill-name>/
  SKILL.md          # Required — main skill document
  *.md              # Optional — supporting references
```

Use **kebab-case** for folder names (e.g., `my-new-skill`).

### 2. Write SKILL.md with frontmatter

Every `SKILL.md` must start with YAML frontmatter:

```yaml
---
name: my-new-skill
description: Use when [specific trigger] — [brief scope]
---
```

- `name` must match the folder name
- `description` should start with "Use when" to help agents decide when to load it

### 3. Structure your content

Follow this general structure:

1. **Title and intro** — What this skill covers, when to use it
2. **Related skills** — `> **Related skills:** **skill-a** for X, **skill-b** for Y.`
3. **Numbered sections** — Each major concept or pattern
4. **Code examples** — GDScript first, then C# equivalent
5. **Checklist** — Implementation checklist at the end

### 4. Code examples

- Include **both GDScript and C#** where applicable
- GDScript comes first, C# follows
- Use ` ```gdscript ` and ` ```csharp ` language tags (never `gd` or `cs`)
- Target **Godot 4.3+** APIs only — no deprecated methods
- Follow Godot style: snake_case for GDScript, PascalCase for C#

### 5. Cross-references

Add a related skills line after the intro paragraph:

```markdown
> **Related skills:** **event-bus** for decoupled communication, **component-system** for composition patterns.
```

Keep to 3-5 references max. Only link genuinely related skills.

## Improving Existing Skills

- Fix incorrect API references or deprecated methods
- Add missing C# examples where GDScript-only
- Add cross-references to related skills
- Expand checklist items
- Fix typos or unclear wording

## Testing Skills

Before submitting:

1. **Read through** — Does the skill make sense for someone new to Godot?
2. **Try the code** — Open Godot 4.3+ and verify examples compile and run
3. **Check C# parity** — Every GDScript example should have a C# equivalent (unless language-specific)
4. **Verify cross-refs** — Referenced skills must exist

## Conventions

- Skills must be self-contained and independently useful
- One skill per folder under `skills/`
- GDScript follows [Godot style guide](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_styleguide.html)
- C# follows [Godot C# conventions](https://docs.godotengine.org/en/stable/tutorials/scripting/c_sharp/c_sharp_style_guide.html)
- Target Godot 4.3+ minimum
- YAML frontmatter is required on every SKILL.md

## Questions?

Open an issue on GitHub or check existing skills for examples of the expected format.
```

- [ ] **Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add CONTRIBUTING guide for skill authors"
```

---

### Task 6: Git Tag and GitHub Release

- [ ] **Step 1: Create v1.0.0 tag**

```bash
git tag -a v1.0.0 -m "v1.0.0 — 29 Godot 4.x skills for AI coding agents"
```

- [ ] **Step 2: Push tag**

```bash
git push origin v1.0.0
```

- [ ] **Step 3: Create GitHub release**

```bash
gh release create v1.0.0 --title "v1.0.0 — GodotPrompter" --notes "$(cat <<'EOF'
# GodotPrompter v1.0.0

Agentic skills framework for Godot 4.x game development. 29 skills covering project setup, architecture, gameplay systems, UI, multiplayer, optimization, and C# patterns.

## Highlights

- **29 skills** for GDScript and C# targeting Godot 4.3+
- **6 platforms supported:** Claude Code, Copilot CLI, Gemini CLI, Codex, Cursor, OpenCode
- **Validated** against a real Godot project (13/15 skills PASS)
- Cross-references between related skills
- Full installation docs per platform

## Install (Claude Code)

```bash
git clone https://github.com/jame581/GodotPrompter.git
claude plugins add ./GodotPrompter
```

## Full skill list

See [README.md](README.md#available-skills) for the complete catalog.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for details.
EOF
)"
```

---

### Task 7: GitHub Repository Polish

- [ ] **Step 1: Set repository topics**

```bash
gh repo edit --add-topic godot --add-topic godot-4 --add-topic gdscript --add-topic csharp --add-topic ai-skills --add-topic claude-code --add-topic copilot --add-topic game-development --add-topic gamedev --add-topic godot-engine
```

- [ ] **Step 2: Set repository description**

```bash
gh repo edit --description "Agentic skills framework for Godot 4.x — 29 domain-specific skills for AI coding agents (Claude Code, Copilot, Gemini, Cursor)"
```

- [ ] **Step 3: Commit any remaining changes**

```bash
git status
# If there are changes:
git add -A
git commit -m "chore: repository polish"
git push
```
