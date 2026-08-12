# Node Selection and 2D vs. 3D

Reference for `skills/godot-brainstorming/SKILL.md` — the need-to-node lookup table, the 2D/3D choice, hybrid 2.5D techniques, and dimension-related performance notes.

> ← Back to [SKILL.md](../SKILL.md)

---
## 3. Node Type Selection Guide

| Need | Node (2D) | Node (3D) | Notes |
|---|---|---|---|
| Player / NPC movement | `CharacterBody2D` | `CharacterBody3D` | Use `move_and_slide()` for collision response |
| Physics objects (crates, balls) | `RigidBody2D` | `RigidBody3D` | Engine controls movement; apply forces/impulses |
| Static world geometry | `StaticBody2D` | `StaticBody3D` | Walls, floors, platforms that never move |
| Detect overlap without physics | `Area2D` | `Area3D` | Triggers, pickups, interaction zones |
| UI elements | `Control` subclasses | `Control` subclasses | `Label`, `Button`, `TextureRect`, `VBoxContainer` |
| World-space UI / labels | `Label` | `Label3D` | `Label3D` floats in 3D world space |
| Sprite / image | `Sprite2D` | `MeshInstance3D` | Use `StandardMaterial3D` for 3D surfaces |
| Timed events | `Timer` | `Timer` | Call `start()`, connect `timeout` signal |
| Keyframe animation | `AnimationPlayer` | `AnimationPlayer` | Animates any property on any node |
| Blend-tree / locomotion animation | `AnimationTree` | `AnimationTree` | Pairs with `AnimationPlayer` |
| Audio (non-positional) | `AudioStreamPlayer` | `AudioStreamPlayer` | Music, UI sounds |
| Audio (positional) | `AudioStreamPlayer2D` | `AudioStreamPlayer3D` | Footsteps, explosions in world space |
| Pathfinding | `NavigationAgent2D` | `NavigationAgent3D` | Requires a `NavigationRegion` in the scene |
| Tile-based levels | `TileMapLayer` | — | Godot 4.3+: one layer per `TileMapLayer` node |
| Particle effects | `GPUParticles2D` | `GPUParticles3D` | Use `CPUParticles` for low-end targets |
| Camera | `Camera2D` | `Camera3D` | Only one active camera per viewport |
| Canvas / screen overlay | `CanvasLayer` | `CanvasLayer` | HUDs, pause menus, always-on-top UI |
| Spawn point / empty transform | `Marker2D` | `Marker3D` | No visual; just a named position |

---

## 4. 2D vs. 3D Decision

### Choose 2D when

- The game is a platformer, top-down RPG, puzzle game, or visual novel
- Pixel art or hand-drawn assets are the intended aesthetic
- The team has limited 3D art / modeling capacity
- Performance targets include low-end mobile hardware
- Collision and navigation are simpler in screen space

### Choose 3D when

- The game requires first/third-person perspective or free camera rotation
- Lighting and shadow depth are central to the visual design
- Levels are navigated in all three axes (not just X/Y)
- You are building a racing game, FPS, open-world game, or 3D platformer

### Hybrid 2.5D Approaches

| Technique | How | Use Case |
|---|---|---|
| 3D world + 2D sprites | `Sprite3D` or `MeshInstance3D` with billboard material | Classic RPG look in 3D world |
| 2D world + 3D UI elements | `SubViewport` with 3D scene rendered into a `TextureRect` | Item previews, character portraits |
| Orthographic 3D | `Camera3D` with `projection = ORTHOGONAL` | Isometric or flat-shaded 3D that reads as 2D |
| 3D with 2D HUD | `CanvasLayer` overlaid on a 3D viewport | Any 3D game with screen-space UI |

### Performance Considerations

- 2D scenes are cheaper to render; use 2D unless 3D is required by design
- `TileMapLayer` is highly optimized — prefer it over manually placing hundreds of `Sprite2D` nodes
- In 3D, use `LOD` (Level of Detail) on `MeshInstance3D` for distant objects
- `GPUParticles` runs on the GPU and is fast; use `CPUParticles` only when GPU access is restricted (some mobile targets)
- Minimize `_process` overrides — use signals and timers to trigger behavior instead of polling every frame
