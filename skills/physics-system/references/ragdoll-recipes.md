# Ragdoll Recipes

Reference for `skills/physics-system/SKILL.md` — 3D ragdoll setup using PhysicalBoneSimulator3D and PhysicalBone3D joints.

> ← Back to [SKILL.md](../SKILL.md)

---
## 10. Ragdoll System

Ragdolls replace animation with physics simulation for procedural death animations, explosions, or limp characters.

### Setup (3D)

1. Select `Skeleton3D` node → **Skeleton** menu → **Create Physical Skeleton**
2. This generates `PhysicalBoneSimulator3D` with `PhysicalBone3D` children, each with a collision shape and pin joint
3. **Clean up:** Remove unnecessary bones (master, waist, neck tracker, etc.) — each PhysicalBone3D has a performance cost

### Joint Types

| Joint | Use | Notes |
|-------|-----|-------|
| `PinJoint` | Default, keeps connected | Can cause crumpling — replace with better types |
| `ConeJoint` | Ball-and-socket (shoulders, hips, neck) | Swing Span 20–90°, Twist Span 20–45° |
| `HingeJoint` | Elbows, knees | Enable Angular Limit, set min/max angles |
| `SliderJoint` | Slides on axis | Mechanical joints, pistons |
| `6DOFJoint` | Full control | Linear + angular limits per axis |

> **Tip:** Adjust joints BEFORE collision shapes. Rotating a joint also rotates its child shape.

### Starting Simulation

```gdscript
@onready var sim: PhysicalBoneSimulator3D = $Skeleton3D/PhysicalBoneSimulator3D

# Full ragdoll
func enable_ragdoll() -> void:
    sim.physical_bones_start_simulation()

# Partial ragdoll (e.g. limp arms only)
func enable_partial_ragdoll() -> void:
    sim.physical_bones_start_simulation(["LeftArm", "RightArm"])

# Stop ragdoll and return to animation
func disable_ragdoll() -> void:
    sim.physical_bones_stop_simulation()
```

```csharp
private PhysicalBoneSimulator3D _sim;

public override void _Ready()
{
    _sim = GetNode<PhysicalBoneSimulator3D>("Skeleton3D/PhysicalBoneSimulator3D");
}

public void EnableRagdoll()
{
    _sim.PhysicalBonesStartSimulation();
}

public void EnablePartialRagdoll()
{
    _sim.PhysicalBonesStartSimulation(new Godot.Collections.Array<StringName> { "LeftArm", "RightArm" });
}
```

### Blending Animation and Ragdoll

`PhysicalBoneSimulator3D.Influence` (0.0 to 1.0) controls blend between animation and physics. At 0.0 animation dominates, at 1.0 physics dominates.

### Collision Setup

Prevent the character's own CollisionShape from fighting the ragdoll:
- Put the character capsule and ragdoll bones on different collision layers
- Or use `physical_bones_add_collision_exception(character_rid)` to exclude the character body

---
