# GodotPrompter — Contributor Guidelines

## Project Overview

GodotPrompter is an open-source agentic skills framework for Godot 4.x game development, supporting both GDScript and C#. It provides domain-specific skills that AI coding agents load on demand for Godot-specific guidance.

This is a **documentation/skills repository**. There is no application build/lint, but `node scripts/validate-skills.mjs` checks SKILL.md frontmatter, cross-references, and structure — it runs in CI on every release tag. Otherwise, changes are validated by reading skills, verifying code examples in Godot 4.3+, and running the agent integration tests in `tests/agent-integration/TEST_PLAN.md`.

## Supported Platforms

- Claude Code (primary — tool names are canonical)
- GitHub Copilot CLI
- Gemini CLI
- Codex
- Cursor
- OpenCode
- Antigravity

## Conventions

- Skills use Claude Code tool names as the canonical reference
- Each platform has a tool mapping file in `skills/using-godot-prompter/references/`
- Skill files use kebab-case naming: `skills/<skill-name>/SKILL.md`
- YAML frontmatter is required on every SKILL.md: `name`, `description`
- GDScript examples follow Godot style guide (snake_case, PascalCase for classes)
- C# examples follow Godot C# conventions (PascalCase methods, matching Godot API)
- Target Godot 4.x API only

## Skill Authoring

- One skill per folder under `skills/`
- `SKILL.md` is required, supporting `*.md` files are optional
- Skills must be self-contained and independently useful
- Include both GDScript and C# examples where applicable
- Test skills against real Godot projects before merging

## Repository Structure

```
skills/                     # 54 domain-specific skill folders
  <skill-name>/
    SKILL.md                # Main skill document (YAML frontmatter required) — keep < 16 KB (v1.7.0 token-budget rule; validator errors at ≥ 16 KB, CI-failing, plus an advisory warning at ≥ 15.5 KB)
    references/             # Optional load-on-demand deep dives (Pattern X)
    *.md                    # Other supporting docs
agents/                     # 9 specialized agent definitions
  godot-game-architect.md   # System design and architecture planning
  godot-game-dev.md         # Feature implementation guided by skills
  godot-code-reviewer.md    # Code review against Godot best practices
  godot-shader-author.md    # Shader specialist (canvas_item / spatial / particles / sky / fog / Compositor)
  godot-performance-profiler.md  # Profiler-driven bottleneck diagnosis
  godot-animator.md         # Animation graphs, IKModifier3D, BoneConstraint3D, retargeting
  godot-csharp-engineer.md  # C#-first development; parity mode for repo C# debt
  godot-ui-designer.md      # Control-tree UI, themes, responsive layouts, localization
  godot-tools-engineer.md   # Editor plugins, custom inspectors, gizmos, @tool scripts
commands/                   # Slash commands (reserved)
docs/superpowers/           # Design specs and implementation plans
  plans/                    # Phase implementation plans
  specs/                    # Design specification documents
  notes/                    # Per-release research notes and C# parity debt
tests/agent-integration/    # Agent test plan and results
scripts/                    # Release/maintenance helpers
  validate-skills.mjs       # Frontmatter/cross-ref validator (used by CI)
  bump-version.mjs          # Version bumper across plugin.json, package.json, marketplace.json
AGENTS.md, GEMINI.md        # Root @-imports re-exporting using-godot-prompter for Codex/Gemini
.claude-plugin/             # Claude Code plugin manifest
  plugin.json               # Plugin metadata (version must match package.json)
  marketplace.json          # Self-marketplace entry (mirrors plugin.json version)
.cursor-plugin/             # Cursor plugin manifest
.codex/                     # Codex install instructions
.opencode/                  # OpenCode plugin loader + install guide
.github/workflows/release.yml  # Tag-triggered: validates, creates GH release, opens marketplace PRs
```

## SKILL.md Format

Every skill must start with YAML frontmatter:

```yaml
---
name: skill-name
description: Use when [trigger] — [brief scope]
---
```

Followed by:
1. Title and intro
2. Related skills line: `> **Related skills:** **skill-a** for X, **skill-b** for Y.`
3. Numbered sections with patterns and examples
4. GDScript first, then C# equivalent (use `gdscript` and `csharp` language tags)
5. Implementation checklist at the end

## Agent Format

Agent definitions in `agents/<name>.md` use YAML frontmatter:

```yaml
---
name: agent-name
description: |
  When to use, with <example> blocks.
model: inherit
---
```

## Version Management

Current version: check `package.json` and `.claude-plugin/plugin.json` (must match).

When releasing (full command sequence in `CONTRIBUTING.md`):
1. `node scripts/bump-version.mjs <version>` — bumps `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, plus sibling marketplaces if present; also syncs the live skill count into the "N domain-specific skills" text of each manifest description
2. Update `CHANGELOG.md` with the new section
3. Commit, tag (`v<version>`), push with tags — `.github/workflows/release.yml` then validates, creates the GitHub release, and opens marketplace PRs (when `MARKETPLACE_TOKEN` is configured)
4. If the workflow's marketplace step is skipped, manually bump `skillsmith/.claude-plugin/marketplace.json` (primary) and the legacy `godot-prompter-marketplace/.claude-plugin/marketplace.json`

## Code Style

- GDScript: follow [Godot style guide](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_styleguide.html) — snake_case functions/variables, PascalCase classes
- C#: follow [Godot C# conventions](https://docs.godotengine.org/en/stable/tutorials/scripting/c_sharp/c_sharp_style_guide.html) — PascalCase methods matching Godot API
- Target Godot 4.3+ minimum — no deprecated methods
- All code examples must compile and run in Godot 4.3+

## Testing

Before merging skill changes:
1. Read through the skill for clarity
2. Verify code examples compile and run in Godot 4.3+
3. Ensure C# parity for every GDScript example (unless language-specific)
4. Verify cross-referenced skills exist
5. Run agent integration tests from `tests/agent-integration/TEST_PLAN.md` for significant changes
