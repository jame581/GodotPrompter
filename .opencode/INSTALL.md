# Installing GodotPrompter for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed

## Installation

Add godot-prompter to the `plugin` array in your `opencode.json` (global or project-level):

See [Opencode Docs](https://opencode.ai/docs/config/) for possible locations.

```json
{
  "plugin": ["godot-prompter@git+https://github.com/jame581/GodotPrompter.git"]
}
```

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
