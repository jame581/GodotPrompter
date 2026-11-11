---
name: using-godot-prompter
description: Bootstrap skill — establishes how to find and use GodotPrompter skills, with platform-specific tool mapping
---

# Using GodotPrompter

> **Related skills:** **godot-project-setup** for scaffolding a new project, **godot-grill** for settling open design decisions first, **godot-brainstorming** for design exploration, **godot-code-review** for reviewing finished code, **godot-debugging** for diagnosing runtime issues.

GodotPrompter provides Godot 4.x domain-specific skills for AI coding agents. Skills cover project setup, architecture patterns, gameplay systems, UI, multiplayer, testing, and deployment — for both GDScript and C#.

## How to Access Skills

**In Claude Code:** Use the `Skill` tool with the skill name (e.g., `Skill: "godot-prompter:state-machine"`).

**In Copilot CLI:** Use the `skill` tool. Skills are auto-discovered from installed plugins.

**In Gemini CLI:** Deprecated (succeeded by Antigravity CLI).

**In Grok Build:** Skills are discovered from the installed plugin (`grok plugin install jame581/GodotPrompter --trust`); invoke them by name.

**In Cursor:** Skills are loaded via custom instructions / rules system.

**In Codex:** Skills load natively via the AGENTS.md re-export. Follow skill instructions directly; see `references/codex-tools.md` for tool mapping.

**In OpenCode:** Skills are discovered from the installed plugin. Use the `/skills` command to browse or invoke skills directly. See `.opencode/INSTALL.md` for setup.

**In Antigravity (2.0, IDE, CLI):** Skills activate automatically when your prompt matches a skill's `description` — no tool call. Install with `agy plugin install https://github.com/jame581/GodotPrompter`; manual, workspace and global paths: [`references/installation.md`](references/installation.md). Tool mapping: `references/antigravity-tools.md`.

Install commands for every host: `README.md`, [`references/installation.md`](references/installation.md).

## Coexistence with Other Plugins (e.g., Superpowers)

<!-- SESSION-CARD-START -->
**GodotPrompter is active in this Godot project.**

Workflow plugins decide *how you work*; GodotPrompter decides *what you build*. Both apply.

**RULE: before implementing any Godot system, invoke the matching `godot-prompter:*` skill.**
Applies to subagents writing Godot code too.

| Situation | Start with |
|---|---|
| New system, or the requirements are unclear | `godot-grill` — settle decisions, then design and build |
| Known change, explicit ask, bug fix | the domain skill below — build |

**Then report before you build:** name the pattern you picked, the alternative you rejected, and why. The choice is the developer's. A report states; it never ends on your own questions. A design decision needs the developer's answer or go-ahead first? Invoke `godot-grill`.

| Building… | Start with |
|---|---|
| Movement, input, cameras | `player-controller`, `input-handling`, `camera-system` |
| Architecture | `state-machine`, `event-bus`, `scene-organization`, `component-system`, `resource-pattern`, `dependency-injection` |
| Gameplay systems | `inventory-system`, `dialogue-system`, `ability-system`, `save-load` |
| Enemy AI | `ai-navigation` |
| UI, HUD, i18n | `godot-ui`, `hud-system`, `responsive-ui`, `localization` |
| Animation, tweens, audio | `animation-system`, `tween-animation`, `audio-system` |
| Physics, 2D, 3D | `physics-system`, `2d-essentials`, `3d-essentials` |
| Shaders, rendering, VFX, procgen, math | `shader-basics`, `rendering-pipeline`, `particles-vfx`, `procedural-generation`, `math-essentials` |
| Networking | `multiplayer-basics`, `multiplayer-sync`, `dedicated-server`, `web-services` |
| Mobile, XR, native, threads | `mobile-development`, `xr-development`, `gdextension`, `multithreading` |
| Editor tools, assets | `addon-development`, `assets-pipeline` |
| GDScript / C# idioms | `gdscript-patterns`, `gdscript-advanced`, `csharp-godot`, `csharp-signals` |
| Test, debug, profile, review | `godot-testing`, `godot-debugging`, `godot-optimization`, `godot-code-review` |
| Setup, design, export | `godot-project-setup`, `godot-grill`, `godot-brainstorming`, `export-pipeline`, `web-export` |
| Teaching while building | `godot-mentor` |
| Addons (if installed) | `limboai`, `beehave`, `popochiu`, `dialogue-manager`, `phantom-camera` |

Full index: invoke `godot-prompter:using-godot-prompter`.

**Red flags — you are rationalizing:**

| Thought | Reality |
|---|---|
| "I know how CharacterBody2D works" | Knowing the class ≠ knowing the pattern. Invoke. |
| "It's a two-line script" | Two-line scripts still pick node types. Invoke. |
| "The plan says what to build" | The plan says what. The skill says how. Invoke. |
| "I loaded a Godot skill already" | Different system, different skill. |
| "The user wants a quick fix" | Quick fixes set architecture. Invoke — then say what you picked. |
| "The skill shows one pattern, so it's settled" | Skills carry trade-offs. Surface them; don't decide alone. |
| "I'll explain it once it works" | A choice reported after the code is a fait accompli, not a choice. |
<!-- SESSION-CARD-END -->

## Workflow: From Idea to Working Game

GodotPrompter handles the full development workflow. No other plugins required.

### 1. Design Phase
Load `godot-prompter:godot-grill` first when design decisions are open — it settles them in rounds and records them. Then `godot-prompter:godot-brainstorming` guides you through:
- Proposing architectural approaches with trade-offs
- Designing scene trees, signal maps, and data flow
- Creating an implementation plan with ordered tasks

### 2. Implementation Phase
For each task in the plan, load the relevant domain skill:
- Building a player? Load `godot-prompter:player-controller` and `godot-prompter:state-machine`
- Adding inventory? Load `godot-prompter:inventory-system`
- Need save/load? Load `godot-prompter:save-load`

Each skill provides complete code examples, Godot best practices, and a checklist.

### 3. Review Phase
Load `godot-prompter:godot-code-review` to review the code against Godot-specific checklists.

### Plan Storage
GodotPrompter has no plans folder of its own. Save implementation plans where this project keeps them, checking in order: the user's instructions or the project's agent instructions file (`CLAUDE.md`, `AGENTS.md`, …); then the planning skill's convention; then an existing plans directory. If none applies, ask the user, suggesting `docs/plans/`, or use `docs/plans/` when you cannot ask (a subagent or non-interactive run). Per-scene designs from `godot-brainstorming` stay next to the scene, in the root script's comment block or a `DESIGN.md`.

## Platform Adaptation

Skills use Claude Code tool names as the canonical reference. Non-Claude platforms: see the appropriate tool mapping file in `references/` for your platform's equivalents:

- [`references/copilot-tools.md`](references/copilot-tools.md) — GitHub Copilot CLI
- [`references/codex-tools.md`](references/codex-tools.md) — Codex
- [`references/cursor-tools.md`](references/cursor-tools.md) — Cursor
- [`references/gemini-tools.md`](references/gemini-tools.md) — Legacy Gemini CLI (deprecated)
- [`references/antigravity-tools.md`](references/antigravity-tools.md) — Antigravity (2.0 desktop, IDE, CLI)

## Skill and Agent Index

Every skill by category with a one-line description, and the nine agents (`godot-game-architect`, `godot-game-dev`, `godot-code-reviewer`, and six specialists): [`references/skill-index.md`](references/skill-index.md). Read it when the table above does not name the skill you need.

---

## Implementation Checklist

- [ ] Identified the matching domain skill via the table above before writing any system code
- [ ] Invoked the identified skill with the `Skill` tool (or platform equivalent) before implementation
- [ ] When a workflow plugin is also active (Superpowers, etc.), still invoked the relevant godot-prompter domain skill during implementation — they are complementary, not exclusive
- [ ] After implementation, ran `godot-prompter:godot-code-review` to validate against Godot best practices
- [ ] Logged any newly-discovered domain gap that no current skill covers, so it can become a future skill
