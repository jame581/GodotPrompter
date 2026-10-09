#!/usr/bin/env bash
# Stages a minimal Godot project in the eval workspace so hooks/session-start finds a
# project.godot and injects the routing card. The instructions file carries a GodotPrompter
# section so the hook does not also offer to add one.
set -euo pipefail

cat > project.godot <<'GODOT'
config_version=5

[application]

config/name="EvalGame"
config/features=PackedStringArray("4.4", "Forward Plus")
GODOT

cat > CLAUDE.md <<'MD'
# EvalGame

## GodotPrompter

Invoke the matching `godot-prompter:*` skill before implementing any Godot system.
MD
