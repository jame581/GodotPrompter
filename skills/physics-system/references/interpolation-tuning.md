# Physics Interpolation — Teleport Reset & Tuning

Reference for `skills/physics-system/SKILL.md` — teleport-reset recipe, per-node interpolation control, and tick-rate guidance.

> ← Back to [SKILL.md](../SKILL.md)

---

## Teleport Reset

Call `reset_physics_interpolation()` after teleporting or initial placement to prevent "streaking":

```gdscript
func teleport_to(pos: Vector2) -> void:
    global_position = pos
    reset_physics_interpolation()
```

```csharp
public void TeleportTo(Vector2 pos)
{
    GlobalPosition = pos;
    ResetPhysicsInterpolation();
}
```

## Per-Node Control & Tick Rate

`node.physics_interpolation_mode` accepts `PHYSICS_INTERPOLATION_MODE_INHERIT` (default), `_ON`, or `_OFF`. Tick rate (Project Settings → Physics → Common → Physics Ticks per Second): 10–30 TPS for slow/turn-based, 30–60 (60 default) for most games, 60+ for fast-paced/racing/precision platformers. Temporarily set 10 TPS during dev to surface interpolation problems.
