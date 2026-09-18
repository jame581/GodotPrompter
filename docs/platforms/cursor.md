# Installing GodotPrompter for Cursor

Cursor ships a plugin manifest and hook registration in this repository, but the README still
marks end-to-end confirmation as pending. This guide gives contributors and users one place for
setup, verification, and the current caveats.

## Install

Primary install path:

```
/add-plugin godot-prompter
```

Repository-based path:

- clone the repository into your project or plugin location
- make sure `.cursor-plugin/plugin.json` is visible to Cursor

## Verify the install

1. Start a fresh Cursor session in a Godot project.
2. Ask: `What Godot skills are available from GodotPrompter?`
3. Confirm the response reflects the skill catalog.
4. Record whether the routing card appeared automatically.

## Current status

- Cursor hook registration ships in `hooks/hooks-cursor.json`
- The repo has automated tests for Cursor-shaped hook output
- End-to-end installed-plugin confirmation is still pending

## Hook behavior

- Cursor uses the `additional_context` output shape
- The hook should inject only inside real Godot projects
- The same nested-project and silence-outside-Godot rules apply as Claude/Copilot

## Project instructions

Cursor does not use the same subagent tool model as Claude Code, so the main concern is keeping
project rules discoverable in fresh sessions and rules files. The hook recognizes:

- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- `.github/copilot-instructions.md`
- `.claude/rules/`
- `.cursor/rules/`

For Cursor-native repos, `.cursor/rules/` is the cleanest long-term home for a `## GodotPrompter`
section, but `AGENTS.md` also works for cross-host repos.

## Recommended smoke checks

1. **Registration check** — verify the plugin loads without manual file reads
2. **Routing check** — `I want enemies that patrol waypoints and chase the player when they get close.`
3. **Hook check** — confirm the routing card appears in a Godot project and stays silent elsewhere
4. **Post-release discoverability** — after a release, prompt for a newly-added skill by use case

## Troubleshooting

### Cursor sees the repo but not the plugin

- Re-open the workspace after adding the plugin
- Confirm `.cursor-plugin/plugin.json` is present and valid JSON
- Confirm the skill files are present under `skills/`

### Routing works only when you name a skill directly

- Re-run the open-ended routing checks from
  `tests/agent-integration/host-smoke-matrix.json`
- Record failures in `tests/agent-integration/RESULTS.md`

### A nested Godot project is missed

- Open the repo root, not only a docs/tooling subdirectory
- Confirm the actual game project has `project.godot` within the tested search depth
