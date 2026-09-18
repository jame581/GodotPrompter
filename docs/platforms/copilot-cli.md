# Installing GodotPrompter for GitHub Copilot CLI

GitHub Copilot CLI supports GodotPrompter's plugin install flow and SessionStart hook output.
Use this guide when you want a verified install path, a quick smoke test, and the rules for
project instructions that fresh agent contexts rely on.

## Install

```bash
copilot plugin marketplace add jame581/skillsmith
copilot plugin install godot-prompter@skillsmith
```

To update later:

```bash
copilot plugin update godot-prompter
```

## Verify the install

1. Start a fresh Copilot CLI session in any Godot project.
2. Ask: `What Godot skills are available from GodotPrompter?`
3. Confirm the answer is grounded in the skill catalog, not generic Godot advice.

## Hook behavior

- The SessionStart hook is supported.
- It injects the routing card only inside a real Godot project.
- In non-Godot repositories it stays silent.
- The hook output uses the SDK-standard `additionalContext` shape for Copilot CLI.

## Project instructions and fresh agent contexts

The SessionStart hook covers the current session only. If your workflow dispatches a fresh agent
context, it needs the `## GodotPrompter` section in a project instructions file.

Files the hook recognizes include:

- `CLAUDE.md`
- `AGENTS.md`
- `GEMINI.md`
- `.github/copilot-instructions.md`
- `.claude/rules/`
- `.cursor/rules/`

For Copilot-first repositories, `.github/copilot-instructions.md` is the most natural target.
If your repo already keeps shared instructions in `AGENTS.md`, that works too.

## Recommended smoke checks

Run these after install or after a release that adds new skills:

1. **Catalog check** — `What Godot skills are available from GodotPrompter?`
2. **Open-ended routing** — `I need to add a state machine to my player character in Godot 4.`
3. **Installed-plugin discoverability** — ask for one newly-added skill by problem description,
   not by file name, after `copilot plugin update godot-prompter`
4. **Outside-Godot silence** — confirm a non-Godot repo gets no unprompted routing card

## Troubleshooting

### The hook does not seem to fire

- Restart the session after installation or update.
- Confirm you opened the session in a real Godot project with a `project.godot` file.
- If the engine project is nested, start at the repo root and let the hook detect it.

### Fresh agent contexts ignore GodotPrompter

- Add a `## GodotPrompter` section to `.github/copilot-instructions.md` or `AGENTS.md`.
- Do not rely on SessionStart alone; fresh contexts do not receive that card.

### A new skill exists in the repo but is not routed by install

- Update the installed plugin: `copilot plugin update godot-prompter`
- Re-run the post-release discoverability smoke check from
  `tests/agent-integration/host-smoke-matrix.json`
