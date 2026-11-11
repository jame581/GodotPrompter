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

Antigravity indexes skill frontmatter at startup, then loads the matching skill body on demand when the prompt matches a skill's `description`. Install paths (workspace `.agents/skills/`, global `~/.gemini/config/skills/`, legacy and nesting notes), frontmatter fields and the `references/` rule: [`installation.md`](installation.md).

## Project Instructions

Antigravity does not read `AGENTS.md` as project-level instructions (that file is for Codex). For project-wide Antigravity instructions, create `.gemini/GEMINI.md` at your project root. A user-level config file also lives at `~/.gemini/GEMINI.md`.
