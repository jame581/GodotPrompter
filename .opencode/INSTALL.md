# Installing GodotPrompter for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed — OpenCode 2.x, or OpenCode 1.x (1.18.20 and later tested)

## Installation

Add godot-prompter to the `plugin` array in your `opencode.json` (global or project-level):

See [Opencode Docs](https://opencode.ai/docs/config/) for possible locations.

```json
{
  "plugin": ["godot-prompter@git+https://github.com/jame581/GodotPrompter.git"]
}
```

OpenCode 2.x calls this key `plugins` and still accepts `plugin`, so the snippet above works on both
major versions. The same entrypoint serves both plugin APIs.

Restart OpenCode. That's it — the plugin auto-installs and registers all skills.

Verify by typing `/skills` into the OpenCode prompt

## Usage

Use OpenCode's `/skills` command:

```
/skills # This will bring-out a menu listing all available skills with short description

/godot-code-review main.gd # Direct use of skill, skips the menu
```

## Updating

GodotPrompter doesn't update automatically when you restart OpenCode.

To pin (or upgrade to) a specific version:

```json
{
  "plugin": ["godot-prompter@git+https://github.com/jame581/GodotPrompter.git#v1.16.0"]
}
```

## Troubleshooting

### "Plugin must export a default definition with an id and an effect or setup function"

OpenCode 2.x reports this for a GodotPrompter checkout older than the fix for
[#38](https://github.com/jame581/GodotPrompter/issues/38), which only exported the OpenCode 1.x
plugin. OpenCode caches git plugins, so restarting does not fetch the fix. Point the entry at a
release newer than `v1.16.0`, or delete the cached copy under
`~/.cache/opencode/npm/` and restart.

### Plugin not loading

1. Check logs in `~/.local/share/opencode/log/` on Unix-like systems, or in `%APPDATA%\opencode\log` / `%LOCALAPPDATA%\opencode\log` on Windows
2. Verify the plugin line in your `opencode.json`
3. Make sure you're running a recent version of OpenCode

### Tool mapping

When skills reference Claude Code tools:
- `TodoWrite` → `todowrite`
- `Task` with subagents → `@mention` syntax
- `Skill` tool → OpenCode's native `skill` tool
- File operations → your native tools

## Getting Help

Report issues: https://github.com/jame581/GodotPrompter/issues
