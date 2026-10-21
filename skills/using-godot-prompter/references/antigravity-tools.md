# Antigravity Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Antigravity equivalent |
|-----------------|------------------------|
| `Read` (file reading) | `Read()` |
| `Write` (file creation) | `Create()` |
| `Edit` (file editing) | `Edit()` / `Replace()` (unconfirmed — verify in-app) |
| `Bash` (run commands) | `Bash()` |
| `Grep` (search file content) | No dedicated tool — use `Bash("grep ...")` (unconfirmed — verify in-app) |
| `Glob` (search files by name) | `ListDir()` |
| `WebSearch` | `WebSearch()` |
| `WebFetch` | `ReadURL()` |
| `Task` tool (dispatch subagent) | `Subagent()` / delegate via natural language (unconfirmed — verify in-app) |
| `Skill` tool (invoke a skill) | No tool call — skills activate via `description` frontmatter matching |

## Skill Discovery

Antigravity indexes skill frontmatter at startup, then loads the matching skill body on demand when the
user's prompt semantically matches a skill's `description` field.

### Workspace (project-scoped) skills

Place (or symlink) GodotPrompter skills into `.agents/skills/` inside your Godot project:

```
.agents/
  skills/
    player-controller/
      SKILL.md
    state-machine/
      SKILL.md
    ...
```

Recommended setup (symlink the whole `skills/` directory):

```bash
# Linux / macOS — from your Godot project root:
mkdir -p .agents
ln -s /path/to/GodotPrompter/skills .agents/skills

# Windows (PowerShell, Developer Mode or run as admin):
New-Item -ItemType Directory -Force .agents | Out-Null   # junction won't create the parent
New-Item -ItemType Junction -Path .agents\skills -Target D:\Godot\GodotPrompter\skills
```

> **Legacy path:** `.agent/skills/` (singular) was the early Antigravity CLI convention and may still
> work for backward compatibility, but `.agents/skills/` (plural) is the current standard for all
> Antigravity products (2.0 desktop, IDE, CLI). Use the plural form for new setups.

> **Note:** `.antigravity/skills/` appears in some community write-ups but is not a recognized Antigravity skills path — do not use it.

### Global (cross-project) skills

Official path (Google Codelabs): `~/.gemini/config/skills/`

```bash
# Symlink individual skill folders (recommended — each skill is a direct child):
mkdir -p ~/.gemini/config/skills/
ln -s /path/to/GodotPrompter/skills/* ~/.gemini/config/skills/
# Result: ~/.gemini/config/skills/player-controller/SKILL.md  etc.

# Or clone the repo (mind the nesting caveat below):
git clone https://github.com/jame581/GodotPrompter ~/.gemini/config/skills/godot-prompter
```

> **Community alias:** `~/.gemini/skills/` is reported to work as an alias in practice (verified by
> community sources) but is not the path the official Codelabs documentation names. Prefer
> `~/.gemini/config/skills/` for new installs.

> **Nesting caveat:** If you use the `git clone` approach, skills land at
> `~/.gemini/config/skills/godot-prompter/<skill-name>/SKILL.md`. Confirm that Antigravity discovers
> skills nested one extra level before relying on this path; if not, use `ln -s skills/*` instead so
> each skill is a direct child of the skills directory.

## SKILL.md Frontmatter

Antigravity reads two required fields from each `SKILL.md`:

| Field | Role |
|-------|------|
| `name` | Skill identifier (lowercase, hyphenated). Defaults to the directory name if omitted. |
| `description` | Semantic trigger — Antigravity matches this against the user's prompt to select the skill. Most important field. |

GodotPrompter's existing `name:` and `description:` frontmatter is already compatible. No changes to
skill files are required.

An optional `tools:` field can restrict which MCP servers are available when the skill runs (e.g.,
`tools: mcp_google-developer-knowledge_*`). GodotPrompter skills do not use this field by default.

## references/ Subdirectory

Antigravity does **not** auto-load `references/` files. The SKILL.md body must explicitly instruct the
agent to read a specific file (e.g., "read `references/X.md` for details on Y"). This is the same
behaviour as Claude Code — GodotPrompter's Pattern X (load-on-demand references) works identically.

## Project Instructions

Antigravity does not read `AGENTS.md` as project-level instructions (that file is for Codex). For
project-wide Antigravity instructions, create `.gemini/GEMINI.md` at your project root. A user-level
config file also lives at `~/.gemini/GEMINI.md`.
