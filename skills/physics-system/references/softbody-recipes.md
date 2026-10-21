# SoftBody3D Recipes

Reference for `skills/physics-system/SKILL.md` — SoftBody3D setup, cloth/cape, physics interpolation note, and the 4.5+ apply_central_force / apply_central_impulse API.

> ← Back to [SKILL.md](../SKILL.md)

---
## 11. SoftBody3D

SoftBody3D simulates deformable objects like cloth, capes, and jelly. Jolt Physics is recommended for soft bodies.

### Basic Setup

1. Add `SoftBody3D` node (no CollisionShape child needed — collision is derived from mesh)
2. Assign a mesh with sufficient subdivision (e.g. `PlaneMesh` with subdivide 5×5 for cloth)
3. Set **Simulation Precision** ≥ 5 (prevents collapse)

> **Warning:** `Pressure` > 0.0 on non-closed meshes causes flying behavior. Only use pressure on closed shapes like spheres.

### Cloth / Cape Example

1. Add `SoftBody3D` with `PlaneMesh` (size 0.5×1.0, subdivide width/depth = 5)
2. Position behind character
3. Add `BoneAttachment3D` under Skeleton3D → select Neck bone
4. In SoftBody3D → **Attachments** section: pin top-row vertices → set **Spatial Attachment Path** to the BoneAttachment3D
5. Add character's CollisionShape to **Parent Collision Ignore**
6. Disable backface culling on the mesh material

### Physics Interpolation Note

Physics interpolation does NOT affect SoftBody3D rendering. If soft bodies look choppy, increase **Physics Ticks per Second** instead.

---

## 12. SoftBody3D Forces and Impulses (Godot 4.5+)

Godot 4.5 adds `apply_central_impulse()` and `apply_central_force()` to `SoftBody3D`, making it possible to push or propel soft bodies from code in the same style as `RigidBody3D`. Forces distribute across all simulation points automatically, so a single call produces a convincing whole-body response.

```gdscript
extends SoftBody3D

func _ready() -> void:
    # Jolt Physics is recommended for SoftBody3D simulation.
    pass

# Apply a one-time impulse (e.g. explosion knockback).
func explode_outward(force_magnitude: float, source_position: Vector3) -> void:
    var direction: Vector3 = (global_position - source_position).normalized()
    apply_central_impulse(direction * force_magnitude)

# Apply a continuous force while called from _physics_process (e.g. wind).
func apply_wind(wind_direction: Vector3, wind_strength: float) -> void:
    apply_central_force(wind_direction * wind_strength)
```

```csharp
public partial class ClothBody : SoftBody3D
{
    // Apply a one-time impulse (e.g. explosion knockback).
    public void ExplodeOutward(float forceMagnitude, Vector3 sourcePosition)
    {
        Vector3 direction = (GlobalPosition - sourcePosition).Normalized();
        ApplyCentralImpulse(direction * forceMagnitude);
    }

    // Apply a continuous force while called from _PhysicsProcess (e.g. wind).
    public void ApplyWind(Vector3 windDirection, float windStrength)
    {
        ApplyCentralForce(windDirection * windStrength);
    }
}
```

| Method | Effect |
|--------|--------|
| `apply_central_impulse(impulse: Vector3)` | Instant velocity change distributed across all soft body points |
| `apply_central_force(force: Vector3)` | Continuous force distributed each physics step (call from `_physics_process`) |

> **Note:** `apply_central_force()` must be called every `_physics_process()` frame where the force should be active — it does not persist between frames, matching the `RigidBody3D` API contract.

---
