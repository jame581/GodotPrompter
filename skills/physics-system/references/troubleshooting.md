# Physics Troubleshooting Table

Reference for `skills/physics-system/SKILL.md` — symptom → causes & fixes for common physics issues.

> ← Back to [SKILL.md](../SKILL.md)

---

| Symptom | Causes & fixes |
|---|---|
| **Tunneling** (fast objects pass through) | `continuous_cd = true` on RigidBody; thicken static colliders; raise tick rate (120–240 TPS) |
| **Stacked objects wobble** | Raise tick rate; switch to Jolt (3D) for much better stacking |
| **Scaled shapes don't collide** | Never use `scale` on bodies/shapes — set shape parameters directly (radius, extents). For shared shapes, `shape.duplicate()` to Make Unique |
| **Tile collision bumps** | 4.5+: `TileMapLayer` auto-merges via Physics Quadrant Size (default 16). Pre-4.5: manual composite colliders |
| **CylinderShape3D unstable** | Use Jolt (fully supported), or substitute CapsuleShape3D/BoxShape3D with GodotPhysics |
| **Physics spiral of death** | Engine can't finish in one frame — raise Max Physics Steps per Frame, reduce TPS, or cut body count |
| **Unreliable far from origin** | Float precision degrades past ~4 km. Use `precision=double` build or origin-shifting for planetary-scale games |
