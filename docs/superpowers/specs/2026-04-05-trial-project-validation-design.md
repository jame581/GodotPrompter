# Trial Project Validation Design

**Status:** shipped in v1.0.0 (2026-04-06)

**Goal:** Validate GodotPrompter skills by building a minimal top-down 2D action RPG that exercises 13+ skills end-to-end, then porting 3 systems to C#.

**Location:** `tests/trial-project/` — a standalone Godot 4.3+ project inside this repo.

---

## Scene Description

One top-down 2D room containing:

- **Player** — CharacterBody2D with 8-directional movement and attack action
- **Enemy** — CharacterBody2D with patrol/chase/attack AI using NavigationAgent2D
- **NPC** — StaticBody2D with dialogue interaction
- **Pickups** — collectible item nodes on the ground
- **HUD** — health bar, score display, interaction prompt
- **Camera** — smooth follow with screen shake on damage

---

## Skills Exercised

| Skill | What it validates |
|-------|-------------------|
| godot-project-setup | Directory structure, autoloads, .gitignore |
| scene-organization | Scene tree composition, split scenes |
| player-controller | CharacterBody2D top-down movement |
| state-machine | Player states (idle, move, attack), enemy states (patrol, chase, attack) |
| component-system | HealthComponent, HitboxComponent, HurtboxComponent |
| event-bus | EventBus autoload for score, damage, dialogue events |
| resource-pattern | ItemData resources, EnemyStats resource |
| inventory-system | Pick up items, store in inventory, basic UI |
| dialogue-system | Talk to NPC, branching dialogue |
| ai-navigation | Enemy patrol with NavigationAgent2D, chase behavior |
| camera-system | Smooth follow, screen shake on damage |
| hud-system | Health bar, score display, interaction prompt |
| save-load | Save/load game state (player position, inventory, score) |

**C# validation (3 systems):** EventBus, PlayerController, InventorySystem ported following csharp-godot and csharp-signals skill guidance.

---

## Implementation Order

Build order follows the dependency chain:

1. **Scaffold** (godot-project-setup) — directory structure, project.godot, autoloads, .gitignore
2. **EventBus** (event-bus) — global signal hub, needed by most systems
3. **Resources** (resource-pattern) — ItemData, EnemyStats resource definitions
4. **Player** (player-controller, state-machine, component-system) — movement, states, health/hitbox/hurtbox
5. **Camera** (camera-system) — smooth follow attached to player, screen shake
6. **Enemy** (ai-navigation, state-machine, component-system) — patrol waypoints, chase player, attack with NavigationAgent2D
7. **HUD** (hud-system) — health bar, score label, interaction prompt
8. **Inventory** (inventory-system) — pickup items from ground, inventory data + basic UI
9. **NPC + Dialogue** (dialogue-system) — interactable NPC, branching dialogue with choices
10. **Save/Load** (save-load) — persist player position, inventory contents, score
11. **Scene wiring** (scene-organization) — final composition, verify scene tree structure
12. **C# port** (csharp-godot, csharp-signals) — port EventBus, PlayerController, InventorySystem to C#

Each step: follow the corresponding skill's guidance literally. Note where it works as documented and where it's unclear, incorrect, or missing information.

---

## Validation Tracking

A `tests/trial-project/VALIDATION.md` file tracks results:

```markdown
# Skill Validation Results

| Skill | Status | Notes |
|-------|--------|-------|
| godot-project-setup | PASS/FAIL | specific issues... |
| ... | ... | ... |
```

For each skill, record:
- **PASS** — skill guidance worked as documented, code ran without modification
- **PARTIAL** — skill guidance mostly worked but required minor adjustments (document what)
- **FAIL** — skill guidance was incorrect or missing critical information (document what and fix the skill)

---

## Success Criteria

- Project runs in Godot 4.3+ without errors
- Player can move, attack enemy, take damage, pick up items, talk to NPC, save/load
- Each skill's core patterns are used as documented (not improvised)
- C# ports of 3 systems compile and behave identically to GDScript versions
- VALIDATION.md documents results per skill with specific issues
- Any skill issues found are fixed in the skill files themselves

---

## Out of Scope

- Art/sprites (use colored rectangles or Godot icon)
- Audio
- Multiple rooms/levels
- Polish, juice, or game feel beyond what skills document
- Multiplayer skills (separate validation needed)
- Addon development skill (editor plugin, separate validation)
- Export pipeline skill (CI/CD, separate validation)
