# Installing GodotPrompter per Host

Reference for `skills/using-godot-prompter/SKILL.md` — Antigravity install paths (workspace, global, legacy and nesting notes) and pointers to the install guide for every other host.

> ← Back to [SKILL.md](../SKILL.md)

Canonical install commands for every host are in the repository `README.md` (Quick Start) and the per-host guides: `.codex/INSTALL.md`, `.opencode/INSTALL.md`, `docs/platforms/`. Only the Antigravity manual paths live here, because no other file carries them.

## Antigravity (2.0 desktop, IDE, CLI)

Skills activate automatically when your prompt matches a skill's `description` frontmatter — no tool call needed. Plugin install:

```bash
agy plugin install https://github.com/jame581/GodotPrompter
```

### Workspace (project-scoped) — recommended for active development

```bash
# Linux / macOS — from your Godot project root:
mkdir -p .agents
ln -s /path/to/GodotPrompter/skills .agents/skills

# Windows (PowerShell, Developer Mode or run as admin):
New-Item -ItemType Directory -Force .agents | Out-Null   # junction won't create the parent
New-Item -ItemType Junction -Path .agents\skills -Target D:\Godot\GodotPrompter\skills
```

> **Legacy path note:** `.agent/skills/` (singular) was the early CLI convention and may still work for backward compatibility; `.agents/skills/` (plural) is the current standard for all Antigravity products. `.antigravity/skills/` appears in some community write-ups but is not a recognized skills path — do not use it.

### Global (cross-project)

```bash
# Official path (Google Codelabs): ~/.gemini/config/skills/
# Symlink individual skill folders so each is a direct child (recommended):
mkdir -p ~/.gemini/config/skills/
ln -s /path/to/GodotPrompter/skills/* ~/.gemini/config/skills/
# Result: ~/.gemini/config/skills/player-controller/SKILL.md  etc.
```

> `~/.gemini/skills/` is a community-verified alias but not the path the official Codelabs docs name. Prefer `~/.gemini/config/skills/` for new installs.

> **Nesting caveat:** Prefer `ln -s skills/*` over cloning the repo directly into the skills dir (`git clone https://github.com/jame581/GodotPrompter ~/.gemini/config/skills/godot-prompter`), so each skill is an immediate child (`<skills-dir>/<skill-name>/SKILL.md`). A clone lands skills one level deeper; confirm nested discovery works before relying on it.

### SKILL.md frontmatter and references

Antigravity reads `name` (defaults to the directory name) and `description` (the semantic trigger, the most important field) from each `SKILL.md`. GodotPrompter's frontmatter is already compatible. An optional `tools:` field can restrict MCP servers for a skill; GodotPrompter does not use it. Antigravity does **not** auto-load `references/` files — the SKILL.md body must tell the agent to read them, which is how GodotPrompter's Pattern X already works.

## Other hosts

| Host | Where |
|---|---|
| Claude Code, Copilot CLI, Cursor, Grok Build | `README.md` Quick Start; `docs/platforms/` |
| Codex | `.codex/INSTALL.md` |
| OpenCode | `.opencode/INSTALL.md` |

## Using fewer skills

To turn off or not install individual skills on any host, see [Using fewer skills](../../../README.md#using-fewer-skills) in the repository `README.md` (a per-host table of mechanisms, with what was tested).
