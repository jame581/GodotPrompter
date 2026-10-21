# Security Policy

## Supported versions

Only the latest release receives fixes. Update to it before reporting.

| Version        | Supported |
| -------------- | --------- |
| Latest release | Yes       |
| Older releases | No        |

## Scope

GodotPrompter is mostly Markdown, but some of it runs on your machine or shapes what your agent
does:

- `hooks/` — the SessionStart hook (`session-start`, `run-hook.cmd`, wired in `hooks/hooks.json`).
  It runs when a session starts, resumes, is cleared, or is compacted, and does nothing outside a
  Godot project. It writes no files. It reads:
  - `project.godot`, searched from the working directory up four levels and from the session root
    down three, for its `config/features` line (engine version, C#);
  - the project's agent instructions files (`CLAUDE.md`, `CLAUDE.local.md`, `.claude/CLAUDE.md`,
    `AGENTS.md`, `GEMINI.md`, `.github/copilot-instructions.md`, and the `.claude/rules/` and
    `.cursor/rules/` directories), only to check for a `## GodotPrompter` heading;
  - a per-project state file under `~/.godot-prompter/state/`.

  Its output is injected into the agent's context. Besides skill routing, it can tell the agent to
  offer, and only with your agreement, to add a `## GodotPrompter` section to an instructions
  file, and gives the agent the state file path so it can record a declined offer. The
  `godot-mentor` skill writes mentor mode to the same file.
- `.opencode/plugins/godot-prompter.js` — the OpenCode plugin. It adds the `skills/` directory to
  OpenCode's skill paths and prepends the `using-godot-prompter` skill to the first user message.
- Agent definitions and manifests (`agents/`, `.codex/`, `.claude-plugin/`, `.cursor-plugin/`,
  `plugin.json`) that configure how host agents load the skills.

Report a vulnerability if one of these can execute unintended commands, read or write outside
its intended paths, leak data, or weaken the host agent's approval or sandbox settings. The
same goes for a skill that instructs an agent to do something unsafe, such as disabling
safeguards or running untrusted code.

An inaccurate or outdated Godot example is not a security issue; open a regular
[issue](https://github.com/jame581/GodotPrompter/issues) instead.

## Reporting a vulnerability

Please do not open a public issue. Report privately through GitHub:
[Report a vulnerability](https://github.com/jame581/GodotPrompter/security/advisories/new).

Include the affected version, the platform and agent host, reproduction steps, and the impact.
GodotPrompter is maintained by one person, so responses are best-effort. Confirmed issues are
fixed in a patch release and credited in `CHANGELOG.md` unless you prefer otherwise.
