# GodotPrompter — Design Specification

**Date:** 2026-04-03
**Status:** shipped in v1.0.0 (2026-04-06)

## Overview

GodotPrompter is an open-source, multi-platform agentic skills framework for Godot 4.x game development. It provides AI coding agents with domain-specific expertise for both GDScript and C# Godot projects.

## Goals

- Comprehensive Godot 4.x coverage across all skill levels (beginner to production)
- Support both GDScript and C# with examples for each
- Multi-platform: Claude Code, Copilot CLI, Gemini CLI, Codex, Cursor, OpenCode
- Modular — each skill is independent and loads on demand
- Community-driven — easy for contributors to add individual skills

## Architecture: Modular Plugin

Single installable plugin with many independent skills inside. Skills only load when invoked, so there is no bloat penalty.

### Directory Structure

```
godot-prompter/
  package.json              # Plugin manifest
  CLAUDE.md                 # Claude Code conventions
  AGENTS.md                 # → points to CLAUDE.md (Copilot CLI)
  GEMINI.md                 # Gemini CLI entry point + tool mapping
  .codex/INSTALL.md         # Codex setup
  .opencode/INSTALL.md      # OpenCode setup
  README.md                 # Installation & usage
  LICENSE                   # MIT
  skills/
    using-godot-prompter/
      SKILL.md              # Bootstrap skill
      references/
        copilot-tools.md
        gemini-tools.md
        codex-tools.md
        cursor-tools.md
    <skill-name>/
      SKILL.md              # Main skill document (required)
      *.md                  # Supporting files (optional)
  agents/                   # Subagent definitions
  commands/                 # Slash command shortcuts
  docs/                     # Design docs, specs, plans
```

### Multi-Platform Strategy

- Skills written using Claude Code tool names as canonical reference
- Each platform gets a tool mapping file in `skills/using-godot-prompter/references/`
- Platform entry points (`AGENTS.md`, `GEMINI.md`, `.codex/INSTALL.md`) bootstrap the right context
- Bootstrap skill `using-godot-prompter` loads correct tool mapping at session start

### Naming Conventions

- Skill folders: kebab-case (`state-machine`, `player-controller`)
- GDScript examples: snake_case per Godot style guide
- C# examples: PascalCase per Godot C# conventions
- Godot 4.x API only

## Skill Categories & Roadmap

### Phase 1 — Core (MVP)

| Skill | Category | Purpose |
|-------|----------|---------|
| `using-godot-prompter` | Core | Bootstrap, platform detection |
| `godot-project-setup` | Core | Scaffold new projects |
| `godot-testing` | Core | TDD with GUT and gdUnit4 |
| `godot-code-review` | Core | GDScript/C# best practice review |
| `scene-organization` | Architecture | Scene tree patterns |
| `state-machine` | Architecture | FSM patterns |
| `player-controller` | Gameplay | CharacterBody2D/3D movement |
| `save-load` | Gameplay | Serialization strategies |

### Phase 2 — Architecture & Gameplay

| Skill | Category | Purpose |
|-------|----------|---------|
| `godot-brainstorming` | Core | Godot-specific design exploration |
| `godot-debugging` | Core | Debugging techniques |
| `event-bus` | Architecture | Signal-based decoupling |
| `component-system` | Architecture | Composition patterns |
| `resource-pattern` | Architecture | Custom Resources |
| `dependency-injection` | Architecture | Autoloads, service locators |
| `inventory-system` | Gameplay | Resource-based inventory |
| `dialogue-system` | Gameplay | Dialogue trees |
| `ai-navigation` | Gameplay | NavigationAgent, behavior trees |
| `camera-system` | Gameplay | Camera follow, shake, zones |

### Phase 3 — UI, Multiplayer, Deploy

| Skill | Category | Purpose |
|-------|----------|---------|
| `godot-ui` | UI/UX | Control nodes, themes |
| `responsive-ui` | UI/UX | Multi-resolution scaling |
| `hud-system` | UI/UX | In-game HUD patterns |
| `multiplayer-basics` | Multiplayer | MultiplayerAPI, RPCs |
| `multiplayer-sync` | Multiplayer | Synchronization |
| `dedicated-server` | Multiplayer | Headless export |
| `export-pipeline` | Build | CI/CD, platform exports |
| `godot-optimization` | Build | Performance patterns |
| `addon-development` | Build | EditorPlugin, tool scripts |
| `csharp-godot` | C# | C# conventions |
| `csharp-signals` | C# | C# signal patterns |

### v1.4.0 — Godot Source Alignment

| Change | Type | Skill |
|--------|------|-------|
| `super()` requirement section | Update | `gdscript-patterns` |
| Interactive music streams + runtime WAV | Update | `audio-system` |
| Async navigation baking | Update | `ai-navigation` |
| Animation Markers, LookAtModifier3D, SpringBoneSimulator3D | Update | `animation-system` |
| Compositor effects | Update | `shader-basics` |
| Hierarchical/parallel FSM | Update | `state-machine` |
| TileMap deprecation note | Update | `2d-essentials` |
| Jolt-as-default messaging | Update | `physics-system` |
| i18n/l10n, TranslationServer, CSV/PO | New skill | `localization` |
| Noise, BSP, WFC, cellular automata | New skill | `procedural-generation` |
| OpenXR, hand tracking, Meta Quest | New skill | `xr-development` |

## MVP Definition (Phase 1 Complete)

Phase 1 is complete when:
- All 8 Phase 1 skills have SKILL.md files with working content
- Each skill has been tested with at least one pressure scenario (baseline fail → skill-loaded pass)
- Bootstrap skill correctly detects and maps tools for all 6 platforms
- README includes installation instructions verified on Claude Code and at least one other platform
- Design spec status updated to "Complete"

## Language Coverage Rules

- **Dual-language skills** (most skills): Include both GDScript and C# examples. GDScript example comes first.
- **Language-specific skills** (`csharp-godot`, `csharp-signals`): C# only, by definition.
- **Architecture skills** where the pattern is identical in both languages: Show GDScript, add a brief C# note only if the API differs.
- When a Godot API differs between GDScript and C# (e.g., signal connection syntax), always show both.

## Godot Version Target

- **Minimum: Godot 4.3** — this is the oldest 4.x version with a stable, mature API
- Skills should note when a feature requires a newer version (e.g., 4.4+)
- Do not use deprecated APIs even if they still work in 4.3

## Testing Strategy

- Skills tested using TDD approach (pressure scenarios with subagents)
- Baseline: verify agent fails without skill
- Green: verify agent complies with skill loaded
- Both GUT and gdUnit4 supported for Godot-side testing

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Plugin architecture | Modular (single plugin, many skills) | Proven pattern (superpowers), simple install, scales naturally |
| Tool name convention | Claude Code canonical | Largest user base, clean tool names, other platforms map from these |
| Godot version | 4.x only | 3.x is legacy, 4.x is the future |
| Language support | GDScript + C# | Covers both Godot communities |
| License | MIT | Maximum adoption |
| Testing frameworks | GUT + gdUnit4 | User choice, both well-maintained |
