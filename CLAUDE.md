# GodotPrompter — Contributor Guidelines

## Project Overview

This is a **documentation/skills repository**. There is no application build/lint, but `node scripts/validate-skills.mjs` checks SKILL.md frontmatter, cross-references, and structure — it runs in CI on every release tag. Otherwise, changes are validated by reading skills, verifying code examples in Godot 4.3+, and running the agent integration tests in `tests/agent-integration/TEST_PLAN.md`.

## Supported Platforms

- Claude Code (primary — tool names are canonical)
- GitHub Copilot CLI
- Antigravity (IDE + `agy` CLI) — succeeds Gemini CLI, which Google retired on 2026-06-18
- Codex
- Cursor
- OpenCode
- Grok Build

## Conventions

- Skills use Claude Code tool names as the canonical reference
- Each platform has a tool mapping file in `skills/using-godot-prompter/references/`
- GDScript follows the [Godot style guide](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_styleguide.html) — snake_case functions/variables, PascalCase classes
- C# follows [Godot C# conventions](https://docs.godotengine.org/en/stable/tutorials/scripting/c_sharp/c_sharp_style_guide.html) — PascalCase methods matching the Godot API
- Target Godot 4.3+ minimum — no deprecated methods

## Skill Authoring

- Skills must be self-contained and independently useful
- Include both GDScript and C# examples where applicable
- Test skills against real Godot projects before merging

## Repository Rules

The layout is self-evident from `ls`; these constraints are not:

- **SKILL.md size:** keep under 16 KB. `validate-skills.mjs` errors at ≥ 16 KB (fails CI) and warns at ≥ 15.5 KB. Overflow goes in `references/` as load-on-demand deep dives (Pattern X).
- **Version lockstep:** `release.yml` verifies **five** files — `package.json`, the root `plugin.json` (Antigravity), `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and `.cursor-plugin/plugin.json`. `scripts/bump-version.mjs <version>` updates all five and syncs the skill-count description.
- **Two hook directories:** `hooks/` (root) ships to plugin users — the SessionStart routing card. `scripts/hooks/` is repo development tooling wired via `.claude/settings.json`, which runs `validate-skill-on-edit.mjs` after every Edit/Write. Never merge them.
- **Card regions:** `using-godot-prompter` (`SESSION-CARD`) and `godot-mentor` (`MENTOR-CARD`) contain marker-delimited regions the hook injects verbatim. `validate-skills.mjs` enforces markers, uniqueness, non-emptiness, and a 3 KB cap. Edit the region, never a copy — and never paste the marker strings into a fenced example, which trips `card-marker-duplicate`.
- **The hook does not reach subagents.** `SessionStart` fires on startup/resume/clear/compact only. A `## GodotPrompter` section in the project's CLAUDE.md is what subagents read.
- **Hook changes require `npm run test:hooks`.** `node --test tests/hooks/` does *not* work on Node 24 — a directory argument is imported as a module.
- **`AGENTS.md` / `GEMINI.md`** are root @-imports that re-export `using-godot-prompter` for Codex and Antigravity — edit the skill, not these.
- **Agents are mirrored, not shared.** Each `agents/<name>.md` has a hand-maintained twin at `.codex/agents/godot-prompter/<name>.toml`. The validator walks `agents/*.md` only, so drift is silent — edit both.
- **`.github/workflows/release.yml`** is tag-triggered: it validates, creates the GitHub release, and opens marketplace PRs.
- **`docs/superpowers/notes/`** holds per-release research notes and the C# parity debt list.

## File formats and releases

- Writing or editing a `SKILL.md` or an agent definition → **authoring-godot-prompter-skills**
- Cutting a release or bumping the version → **releasing-godot-prompter** (full command sequence in `CONTRIBUTING.md`)

## Testing

Before merging skill changes:
1. Verify code examples compile and run in Godot 4.3+
2. Ensure C# parity for every GDScript example (unless language-specific)
3. Run agent integration tests from `tests/agent-integration/TEST_PLAN.md` for significant changes

`node scripts/validate-skills.mjs` already enforces frontmatter, cross-references, and the size budget — run it rather than checking those by hand. It also checks C# parity inside `references/*.md` (`csharp-parity-*-reference`), so Pattern X moves stay enforced. Files that section **by language** (`## C#`, `## Dash (C#)`, `### … — C#`) are checked file-level instead of per-section; a heading that merely mentions C# in prose is not a partition.
