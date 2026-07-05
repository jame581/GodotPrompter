# Collision Layers and Masks — Setup Recipes

Reference for `skills/physics-system/SKILL.md` — layer naming, code setters, bitmask shorthand, Inspector export hints.

> ← Back to [SKILL.md](../SKILL.md)

---

## Naming Layers

**Project Settings → Layer Names → 2D Physics** (or 3D Physics). Typical layer set: `Player / Enemy / World / Projectile / Pickup / Trigger`.

## Setting Layers and Masks

Use `set_collision_layer_value(N, true)` / `set_collision_mask_value(N, true)` (1-indexed) for readable code, or shorthand bitmasks `collision_mask = (1 << 2) | (1 << 4)` (layers 3 and 5). Expose layer selection in the Inspector via `@export_flags_2d_physics var scan_layers: int = 0` (GDScript) or `[Export(PropertyHint.Layers2DPhysics)]` (C#).

```gdscript
collision_layer = 0
set_collision_layer_value(1, true)   # Add to layer 1 (Player)
collision_mask = 0
set_collision_mask_value(3, true)    # Scan layer 3 (World)
```

```csharp
CollisionLayer = 0;
SetCollisionLayerValue(1, true);
CollisionMask = 0;
SetCollisionMaskValue(3, true);
```
