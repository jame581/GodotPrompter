# Installing GodotPrompter for Codex

Enable GodotPrompter skills in Codex via native skill discovery. Just clone and symlink.

## Prerequisites

- Git

## Installation

1. **Clone the GodotPrompter repository:**
   ```bash
   git clone https://github.com/jame581/GodotPrompter.git ~/.codex/godot-prompter
   ```

   **Windows (PowerShell):**
   ```powershell
   git clone https://github.com/jame581/GodotPrompter.git "$env:USERPROFILE\.codex\godot-prompter"
   ```

2. **Create the skills symlink:**
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/godot-prompter/skills ~/.agents/skills/godot-prompter
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   cmd /c mklink /J "$env:USERPROFILE\.agents\skills\godot-prompter" "$env:USERPROFILE\.codex\godot-prompter\skills"
   ```
3. **Create the subagents symlink (Optional)**
   ```bash
   mkdir -p ~/.codex/agents
   ln -s ~/.codex/godot-prompter/.codex/agents/godot-prompter ~/.codex/agents/godot-prompter
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codex\agents"
   cmd /c mklink /J "$env:USERPROFILE\.codex\agents\godot-prompter" "$env:USERPROFILE\.codex\godot-prompter\.codex\agents\godot-prompter"
   ```

4. **Restart Codex** (quit and relaunch the CLI) to discover the skills.

## Verify

```bash
ls -la ~/.agents/skills/godot-prompter
```

You should see a symlink (or junction on Windows) pointing to your GodotPrompter skills directory.

## Updating

```bash
cd ~/.codex/godot-prompter && git pull
```

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.agents/skills/godot-prompter
```

Optionally delete the clone: `rm -rf ~/.codex/godot-prompter`.
