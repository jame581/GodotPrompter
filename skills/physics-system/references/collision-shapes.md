> ← Back to [SKILL.md](../SKILL.md)

# Collision Shapes — Convex/Concave, Performance, One-Way Direction

## Convex vs Concave

| Type | Usable with | Cost | Notes |
|---|---|---|---|
| Primitive | All bodies | Cheapest | Always prefer for dynamic bodies |
| `ConvexPolygonShape` | All bodies | Fast | No holes or inward curves |
| `ConcavePolygonShape` | **StaticBody only** | Slowest | Accurate for level geometry; no volume |

**Generate shapes:** for 3D, `MeshInstance3D` → **Mesh** menu → Create Single Convex / Multiple Convex (V-HACD) / Trimesh (ConcavePolygonShape). For 2D, `Sprite2D` → **Sprite2D** menu → Create CollisionPolygon2D Sibling (adjust Simplification / Shrink / Grow).

## Performance Rules

Favor primitives for dynamic bodies; minimize shape count per body (each costs narrow-phase checks); never translate/rotate/scale CollisionShape nodes — a non-transformed shape enables broad-phase optimization; concave shapes only on StaticBodies (O(n) triangle checks); multiple shapes on one body don't collide with each other (expected, not a bug); shapes must be direct children — indirect children are ignored.

## One-Way Collision Direction (Godot 4.7+)

`CollisionShape2D.one_way_collision_direction: Vector2` (default `Vector2(0, 1)`) sets a custom pass-through direction for 2D one-way platforms. `PhysicsServer2D.body_set_shape_as_one_way_collision()` gains a matching optional `direction: Vector2 = Vector2(0, 1)` parameter.

```gdscript
var shape: CollisionShape2D = $CollisionShape2D
shape.one_way_collision = true
shape.one_way_collision_direction = Vector2(1, 0)  # Sideways one-way wall (default: Vector2(0, 1))
```

```csharp
var shape = GetNode<CollisionShape2D>("CollisionShape2D");
shape.OneWayCollision = true;
shape.OneWayCollisionDirection = new Vector2(1, 0); // Sideways one-way wall (default: Vector2(0, 1))
```
