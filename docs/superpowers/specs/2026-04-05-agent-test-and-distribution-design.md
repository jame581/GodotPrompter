# Agent Integration Test & Distribution Design

**Status:** shipped in v1.0.0 (2026-04-06)

**Goal:** Validate GodotPrompter works end-to-end when an AI agent loads and uses skills, then publish with polished docs and marketplace presence.

**Order:** Agent test → incorporate findings → README polish → release package → marketplace listings.

---

## Part 1: Agent Integration Test

### Location

- Test plan: `tests/agent-integration/TEST_PLAN.md`
- Results: `tests/agent-integration/RESULTS.md`

### Test Categories

#### Category 1: Cold Start (Installation)

Test that GodotPrompter installs correctly and the bootstrap skill loads.

| # | Action | Expected | Pass Criteria |
|---|--------|----------|---------------|
| 1.1 | Install GodotPrompter in a fresh Claude Code session | Plugin installs without errors | No errors |
| 1.2 | Ask "What Godot skills are available?" | Agent loads `using-godot-prompter` and lists skill categories | Correct skill loaded, lists all categories |
| 1.3 | Ask "What does the state-machine skill cover?" | Agent reads the skill and summarizes its content | Summary matches actual skill content |

#### Category 2: Skill Discovery (5 open-ended prompts)

Test that the agent finds and uses the correct skill without being told which one.

| # | Prompt | Expected Skill | Pass Criteria |
|---|--------|---------------|---------------|
| 2.1 | "I need to add a state machine to my player character" | state-machine | Loads skill, shows enum/node/resource FSM options |
| 2.2 | "How should I organize my Godot project files?" | godot-project-setup | Shows directory structure, autoloads |
| 2.3 | "I want enemies that patrol and chase the player" | ai-navigation | Shows NavigationAgent2D, patrol patterns |
| 2.4 | "Help me set up a save/load system" | save-load | Shows ConfigFile/JSON/Resource strategies |
| 2.5 | "Review my GDScript for common issues" | godot-code-review | Shows checklist, anti-patterns |

#### Category 3: Full Workflow (end-to-end build)

Test that skills chain correctly across a multi-step build.

| # | Prompt | Expected Skills | Pass Criteria |
|---|--------|----------------|---------------|
| 3.1 | "Create a new Godot 4.3 project with a player that can move and attack" | godot-project-setup, player-controller, state-machine | Project scaffolded, player moves with FSM |
| 3.2 | "Add an enemy with patrol AI that chases the player" | ai-navigation, state-machine, component-system | Enemy uses NavigationAgent2D, FSM, hitbox/hurtbox |
| 3.3 | "Add a health bar HUD" | hud-system, event-bus | CanvasLayer HUD, health bar connected via EventBus |
| 3.4 | "Review the code for Godot best practices" | godot-code-review | Structured review following skill checklist |
| 3.5 | "Set up save/load for player position and health" | save-load | JSON save/load with version migration |

### Result Tracking

For each test, record:
- **PASS** — Agent loaded correct skill, followed its guidance, output was correct
- **PARTIAL** — Agent found the skill but deviated or missed key guidance
- **FAIL** — Agent didn't load the skill, used generic knowledge, or produced incorrect output
- **FRICTION** — Worked but user experience was poor (too many steps, confusing output, etc.)

Note specific friction points for distribution fixes.

---

## Part 2: Distribution

### Phase 1 — README Polish

Update `README.md` with:
- Full skill list table (all 29 skills, one-line description each, grouped by category)
- Validation results section (13/15 PASS from trial project)
- "Quick Start" section with a real usage example from agent test results
- Updated installation instructions per platform (verify each works)
- Agent test results summary (what works well, known limitations)

### Phase 2 — Release Package

- `CHANGELOG.md` — v1.0.0 entry documenting all 29 skills, validation, supported platforms
- `CONTRIBUTING.md` — How to add skills (directory structure, frontmatter, conventions, testing against real projects)
- Git tag `v1.0.0`
- GitHub Release with release notes (summary + link to CHANGELOG)
- README badges: version, license, Godot 4.x, skill count (29)

### Phase 3 — Marketplace Listings

- GitHub: repo description, topics (`godot`, `godot-4`, `gdscript`, `csharp`, `ai-skills`, `claude-code`, `copilot`, `game-development`)
- Godot Asset Library: submit if format is compatible (skills plugin, not a traditional addon — may need to package differently or skip)
- itch.io: free page with description, feature list, installation instructions, link to GitHub

---

## Success Criteria

- Agent test: 10+ of 13 tests PASS
- README: a new user can install and use their first skill in under 5 minutes
- Release: `v1.0.0` tag exists, GitHub release published
- At least one marketplace listing live (GitHub topics at minimum, itch.io if feasible)

---

## Out of Scope

- Automated CI for skill validation (future)
- Platform-specific test suites for Copilot/Gemini/Cursor (future)
- Documentation site / GitHub Pages (future)
- Package manager distribution (npm, pip — not applicable)
