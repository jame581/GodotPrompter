---
name: physics-system
description: Use when working with physics bodies, collision shapes, raycasting, areas, rigid bodies, ragdolls, soft bodies, Jolt physics, and physics interpolation in Godot 4.3+
---

# Physics System in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **player-controller** for CharacterBody2D/3D movement patterns, **component-system** for hitbox/hurtbox composition, **godot-optimization** for physics performance tuning, **camera-system** for camera follow and interpolation, **multiplayer-sync** for networked physics, **2d-essentials** for tile collision setup and 2D canvas layers.

---

## 1. Physics Body Types

Four collision-object types (the last three extend `PhysicsBody2D`/`3D`):

| Type | Moved by | Use for |
|------|----------|---------|
| `Area2D/3D` | Code | Overlap detection, gravity zones, audio zones |
| `StaticBody2D/3D` | Not moved (or `constant_linear_velocity`) | Walls, floors, conveyor belts |
| `RigidBody2D/3D` | Physics engine | Crates, projectiles, debris, ragdolls |
| `CharacterBody2D/3D` | Code | Players, enemies, NPCs (see **player-controller**) |

Every collision object needs at least one `CollisionShape2D`/`3D` (or `CollisionPolygon2D`/`3D`) child. **Jolt Physics is the default 3D engine since 4.4** (non-experimental from 4.6) — see Section 8. 2D always uses GodotPhysics.

> **Critical rule:** NEVER scale collision shapes or physics bodies via `scale`. Use the shape's own size parameters (radius, extents, height) — scaled shapes produce incorrect collision results.

---

## 2. RigidBody2D/3D

### Forces vs Impulses

| Method | Effect | When to use |
|---|---|---|
| `apply_force(force, position)` | Continuous accel at point | Thrusters, wind, magnets |
| `apply_central_force(force)` | Continuous accel at center | Gravity, constant push |
| `apply_impulse(impulse, position)` | Instant velocity change at point | Bullet hit, explosion |
| `apply_central_impulse(impulse)` | Instant velocity change at center | Jump, knockback |
| `apply_torque(torque)` | Continuous angular accel | Steering, spinning |
| `apply_torque_impulse(impulse)` | Instant angular velocity change | Impact spin |

> See [references/rigidbody-recipes.md](references/rigidbody-recipes.md) for a worked thrust-and-spin example (GDScript + C#) using `apply_force` + `apply_central_impulse` + `apply_torque`.

### _integrate_forces() — Safe Physics Modification

Use `_integrate_forces(state)` instead of `_physics_process()` when you need to read/modify a RigidBody's transform, velocity, or angular velocity. Setting `position` or `linear_velocity` directly in `_physics_process()` fights the physics engine.

> **Warning:** `_integrate_forces()` is NOT called while the body is sleeping. Set `can_sleep = false` if you need continuous callbacks; otherwise prefer letting bodies sleep for performance.

> See [references/rigidbody-recipes.md](references/rigidbody-recipes.md) for the full thrust + torque example using `state.apply_force` / `state.apply_torque` (GDScript + C#).

### Contact Monitoring, PhysicsMaterial, Freeze, look_at

- **Contact signals** require `contact_monitor = true` + `max_contacts_reported > 0`. Then `body_entered`/`body_exited` fire as expected.
- **`PhysicsMaterial`** resource controls `friction` (0 ice → 1 rubber) and `bounce` (0 → 1).
- **Freeze modes:** `FREEZE_MODE_STATIC` (acts like a StaticBody) or `FREEZE_MODE_KINEMATIC` (code-moved, pushes others).
- **RigidBody3D orientation:** never `look_at()` a RigidBody — use `_integrate_forces` and set `state.angular_velocity` from a cross-product steering term.

> See [references/rigidbody-recipes.md](references/rigidbody-recipes.md) for full GDScript + C# recipes (contact handler with `take_damage`, PhysicsMaterial property table, freeze toggle, RigidBody3D homing-via-angular-velocity).

---

## 3. StaticBody2D/3D

`StaticBody` is not moved by the physics engine but can push other bodies via `constant_linear_velocity` (e.g. conveyor belts). For platforms that move via code AND push CharacterBodies, use **`AnimatableBody2D`/`3D`** — a plain `StaticBody` moved by code will not push CharacterBodies reliably.

> See [references/staticbody-recipes.md](references/staticbody-recipes.md) for the conveyor belt and moving-platform recipes (GDScript + C#, with Tween-driven AnimatableBody2D loop).

---

## 4. Area2D/3D

Areas detect overlaps and override physics properties within their bounds. They do NOT produce collision responses — bodies pass through them. Connect `body_entered` / `body_exited` for body overlaps; use `area_entered` / `area_exited` for Area-to-Area (hitbox vs hurtbox — see **component-system**). Areas can also override gravity (zero-G zones, point gravity / black holes), `linear_damp` / `angular_damp` (water, slow-mo), and redirect audio to a specific `AudioBus`. When multiple areas overlap, `priority` decides order; pick a `space_override` mode (`COMBINE`, `REPLACE`, `COMBINE_REPLACE`, `REPLACE_COMBINE`).

> See [references/area-recipes.md](references/area-recipes.md) for the GDScript + C# overlap-detection canonical example, the space-override mode reference table, and zero-G + point-gravity recipes.

> ⚠️ **Changed in Godot 4.7:** With Jolt Physics, `Area3D` now reports overlaps with `SoftBody3D` from its signals and methods. Configure collision layers/masks so any unwanted `Area3D` ↔ `SoftBody3D` interactions are ignored. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

---

## 5. Collision Shapes

| Shape (2D / 3D) | Use case |
|---|---|
| `Rectangle` / `Box` | Crates, platforms, rooms |
| `Circle` / `Sphere` | Balls, projectiles, simple characters, trigger zones |
| `Capsule` (2D & 3D) | Characters — rounded, slides over edges |
| `Segment2D` / — | Thin walls, laser beams |
| `SeparationRay2D` / — | Character ground snapping |
| `WorldBoundary2D` / — | Infinite floor/wall/ceiling |
| — / `Cylinder3D` | Pillars, barrels (Jolt only — unstable on GodotPhysics) |

### Convex vs Concave

| Type | Usable with | Cost | Notes |
|---|---|---|---|
| Primitive | All bodies | Cheapest | Always prefer for dynamic bodies |
| `ConvexPolygonShape` | All bodies | Fast | No holes or inward curves |
| `ConcavePolygonShape` | **StaticBody only** | Slowest | Accurate for level geometry; no volume |

**Generate shapes:** for 3D, `MeshInstance3D` → **Mesh** menu → Create Single Convex / Multiple Convex (V-HACD) / Trimesh (ConcavePolygonShape). For 2D, `Sprite2D` → **Sprite2D** menu → Create CollisionPolygon2D Sibling (adjust Simplification / Shrink / Grow).

### Performance Rules

Favor primitives for dynamic bodies; minimize shape count per body (each costs narrow-phase checks); never translate/rotate/scale CollisionShape nodes — a single non-transformed shape enables broad-phase optimization; concave shapes only on StaticBodies (O(n) triangle checks); multiple shapes on one body don't collide with each other (this is correct, not a bug); shapes must be direct children — indirect children are ignored.

### One-Way Collision Direction (Godot 4.7+)

`CollisionShape2D.one_way_collision_direction: Vector2` (default `Vector2(0, 1)`) sets the direction used for one-way collision, so 2D one-way platforms can use a custom pass-through direction. `PhysicsServer2D.body_set_shape_as_one_way_collision()` gains a matching optional `direction: Vector2 = Vector2(0, 1)` parameter.

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

---

## 6. Collision Layers and Masks

Godot provides 32 physics layers per dimension (2D and 3D separately).

- **collision_layer** — which layers this object **exists on** (others scan for it here)
- **collision_mask** — which layers this object **scans** (what it detects)

> **Mental model:** Layer = "I am", Mask = "I scan for". A collision happens when object A's mask includes object B's layer, OR vice versa.

Name layers in **Project Settings → Layer Names → 2D Physics** (or 3D Physics); set them in code with `set_collision_layer_value(N, true)` / `set_collision_mask_value(N, true)` (1-indexed).

> See [references/collision-layers.md](references/collision-layers.md) for layer naming conventions, bitmask shorthand, Inspector export flags, and the GDScript + C# examples.

---

## 7. Raycasting and Physics Queries

### RayCast2D/3D Nodes (Simple Per-Frame Rays)

Add a `RayCast2D` / `RayCast3D` as a child node — it casts every physics frame automatically. Read with `is_colliding()` and `get_collider()` / `get_collision_point()` / `get_collision_normal()`.

> See [references/raycasting-recipes.md](references/raycasting-recipes.md) for the GDScript + C# RayCast node example.

### Code-Based Raycasting (PhysicsDirectSpaceState)

For on-demand queries, access the space state via `get_world_2d().direct_space_state` (or `get_world_3d()`) and call `intersect_ray(query)` with `PhysicsRayQueryParameters2D/3D.create(from, to)`. Set `query.exclude = [get_rid()]` to skip self, `query.collision_mask` to filter layers. **Only safe inside `_physics_process()`** — the physics space is locked during rendering.

> See [references/raycasting-recipes.md](references/raycasting-recipes.md) for the full GDScript + C# code-based raycast example with self-exclusion and mask filtering, plus the 3D mouse-picking recipe.

### Ray Result, Other Queries, 3D Mouse Picking

The `intersect_ray` result dictionary contains `position`, `normal`, `collider`, `collider_id`, `rid`, `shape`. `PhysicsDirectSpaceState` also supports `intersect_point` (overlapping shapes at a point), `intersect_shape` (area query), `cast_motion` (shape sweep), `collide_shape` (contact points), `get_rest_info` (resting collision info). For 3D mouse picking, `Camera3D.project_ray_origin(screen_pos)` + `project_ray_normal(screen_pos)` builds the ray.

> See [references/raycasting-recipes.md](references/raycasting-recipes.md) for the full mouse-picking recipe (GDScript + C#).

---

## 8. Jolt Physics

Jolt is a built-in alternative physics engine available since Godot 4.4. It is the **default for new 3D projects** starting in 4.4. **(Godot 4.6+)** Jolt is no longer marked experimental and is the confirmed stable default for all new 3D projects.

### Enabling Jolt

**Project Settings → Physics → 3D → Physics Engine** → `Jolt Physics` → Save → Restart editor. (3D only; 2D always uses GodotPhysics.)

### Why & Differences

**Wins:** better stacking stability, reliable `CylinderShape3D`, better `SoftBody3D`, optional thread-safe mode, active-edge detection (fixes ghost collisions).

> See [references/jolt-differences.md](references/jolt-differences.md) for the behavioral differences from GodotPhysics (stabilization, collision margins, single-body joints, `face_index`, unsupported joint properties).

> ⚠️ **Changed in Godot 4.7:** With Jolt Physics, `WorldBoundaryShape3D.plane.d` now follows the same sign convention as Godot Physics — the plane distance is interpreted with the opposite sign compared to Godot 4.6. Flip the sign yourself to keep the 4.6 behavior. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

---

## 9. Physics Interpolation

Smooths visual motion between physics ticks, eliminating "staircase" jitter when tick rate ≠ frame rate. Enable in **Project Settings → Physics → Common → Physics Interpolation**. **Godot 4.5+** restructured the 3D interpolation pipeline (`RenderingServer` → `SceneTree`) for more accurate results in nested transforms — no API change, automatic improvement on upgrade.

### Core Rules

1. **Move all game logic to `_physics_process()`** — transforms set outside physics ticks cause jitter
2. **Tweens and AnimationPlayer** that move physics objects must use physics tick timing
3. **Call `reset_physics_interpolation()`** after teleporting or initial placement to prevent "streaking"

> See [references/interpolation-tuning.md](references/interpolation-tuning.md) for the teleport-reset example (GDScript + C#), per-node `physics_interpolation_mode` control, and tick-rate guidance.

### Camera Interpolation

Cameras need special handling under physics interpolation. Make the camera independent (or `top_level = true`), update it in `_process()` (not `_physics_process()`), and read the target's smooth position with `get_global_transform_interpolated()`.

> See [references/interpolation-camera.md](references/interpolation-camera.md) for the full smooth-follow Camera3D recipe (GDScript + C#).

---

## 10. Ragdoll System

Ragdolls replace animation with physics for procedural death, explosions, or limp characters. Generate via `Skeleton3D` → **Skeleton** menu → **Create Physical Skeleton**. Use `ConeJoint` for shoulders/hips/neck, `HingeJoint` for elbows/knees — `PinJoint` (default) tends to crumple. Drive via `physical_bones_start_simulation()`, blend with `Influence`.

> See [references/ragdoll-recipes.md](references/ragdoll-recipes.md) for setup, joint guidance, full GDScript + C# control, animation blending, and collision exceptions.

---

## 11. SoftBody3D

`SoftBody3D` simulates deformable objects (cloth, capes, jelly). Mesh subdivision drives the simulation; no `CollisionShape` child needed. **Jolt Physics recommended.** Set `Simulation Precision ≥ 5` to prevent collapse. `Pressure > 0.0` only on closed meshes.

Godot 4.5+ adds `apply_central_impulse()` / `apply_central_force()` for `RigidBody3D`-style force application — distributes across all simulation points.

> See [references/softbody-recipes.md](references/softbody-recipes.md) for the cloth/cape walk-through (PlaneMesh, BoneAttachment3D pinning, Parent Collision Ignore) and the 4.5+ force/impulse API with GDScript and C# (explosion knockback, continuous wind).

> ⚠️ **Changed in Godot 4.7:** With Jolt Physics, `SoftBody3D` mass no longer defaults to `0` (which auto-calculated 1 kg *per point*, giving a very high total mass) — it now defaults to 1 kg for the entire body, matching Godot Physics. `linear_stiffness` is also applied differently, so re-tweak `linear_stiffness` and `damping_coefficient` after upgrading. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

---

## 13. Troubleshooting Physics Issues

Symptom → causes & fixes quick table covering tunneling, wobbly stacks, scaled shapes, tile collision bumps, unstable cylinders, the physics spiral of death, and float-precision issues far from origin.

> See [references/troubleshooting.md](references/troubleshooting.md) for the full table.

---

## 14. Implementation Checklist

- [ ] Dynamic bodies use primitive collision shapes; concave shapes only on StaticBodies
- [ ] Collision layers named in Project Settings; layer/mask set correctly per body
- [ ] No `scale` on collision shapes or bodies — use shape size parameters directly
- [ ] RigidBodies modify state via `_integrate_forces()`, not `_physics_process()`
- [ ] RigidBodies needing contact signals set `contact_monitor = true` + `max_contacts_reported > 0`
- [ ] Moving platforms use `AnimatableBody2D/3D` (not manually moved StaticBody)
- [ ] Code raycasts use `PhysicsDirectSpaceState` inside `_physics_process()` only
- [ ] Physics interpolation enabled; `reset_physics_interpolation()` called after teleport / initial placement
- [ ] Ragdoll bones on a separate collision layer from the character capsule
- [ ] 3D projects use Jolt (non-experimental default in Godot 4.6+)
