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
- **The hook does not reach subagents.** `SessionStart` fires on startup/resume/clear/compact only. A `## GodotPrompter` section in the project's agent instructions file is what subagents read. The offer to add one probes every file a supported host loads (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.github/copilot-instructions.md`, the rules directories) and is suppressed for good by `"section_offer": "declined"` in the project's `~/.godot-prompter/state/` file — probing one filename nagged agent-agnostic repos forever (#15). The probe is deliberately host-agnostic: a section in *any* of those files silences the offer on *every* host, trading a subagent that may stay uninstructed on a host that does not read that file against nagging a repo that has already documented the rule.
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

When a section genuinely cannot have a C# counterpart, mark that section — never the whole skill:

```markdown
<!-- csharp-parity: n/a — C# is statically typed; there is no untyped alternative to contrast -->
```

It works in both `SKILL.md` and `references/*.md`. The reason is **mandatory**; omitting it is an error (checked on every marker, not only on sections missing C#), because an exemption that cannot say why is indistinguishable from an example nobody wrote. A reason may contain `<` and `>`, and a marker inside a fenced block is ignored, so a file can document the marker without exempting itself.

Do **not** reach for the two blunter tools instead: adding the skill to `GDSCRIPT_ONLY_BY_DESIGN` exempts every section in it, and renaming a heading to `"… (GDScript)"` trips the language-partition check and silently downgrades the *entire file* to a file-level check. Both hide real gaps in neighbouring sections.

Run `npm test` (hooks + validator) after touching `scripts/validate-skills.mjs` — `tests/validator/` covers the marker, including the error path that can fail a release tag.

A fenced ```gdscript block containing only comments is not a code example — it is prose in a fence, and it will be flagged as an unpaired GDScript block. Write it as prose or a bullet list.
