# Skeleton Modifiers (3D)

Reference for `skills/animation-system/SKILL.md` — procedural skeleton modifiers (4.4+): `LookAtModifier3D` (including its 4.7 `relative` default change), `SpringBoneSimulator3D`.

> ← Back to [SKILL.md](../SKILL.md)

---

## LookAtModifier3D (Godot 4.4+)

Procedurally rotates a bone to look at a world-space target. Ideal for head tracking and eye contact without extra animation clips.

```
Skeleton3D
└── LookAtModifier3D
    (bone = "Head", target = ../LookTarget)
```

```gdscript
@onready var look_at: LookAtModifier3D = $Skeleton3D/LookAtModifier3D

func _ready() -> void:
    look_at.bone_name = "Head"
    look_at.target_node = $"../LookTarget".get_path()
    look_at.use_angle_limitation = true
    look_at.symmetry_limitation = true                  # same limit on both sides
    look_at.primary_limit_angle = deg_to_rad(70.0)
    look_at.secondary_limit_angle = deg_to_rad(45.0)

func stop_looking() -> void:
    look_at.influence = 0.0  # blend back to animation
```

```csharp
_lookAt = GetNode<LookAtModifier3D>("Skeleton3D/LookAtModifier3D");
_lookAt.BoneName = "Head";
_lookAt.TargetNode = GetNode("../LookTarget").GetPath();
_lookAt.UseAngleLimitation = true;
_lookAt.SymmetryLimitation = true;
_lookAt.PrimaryLimitAngle = Mathf.DegToRad(70f);
_lookAt.SecondaryLimitAngle = Mathf.DegToRad(45f);
```

> ⚠️ **Changed in Godot 4.7:** `LookAtModifier3D.relative` now defaults to `false` — the rotation is applied relative to the rest pose instead of the current pose. The default was `true` only in 4.6.0; the change was also backported to 4.6.1, so projects coming from 4.6.1 or later see no difference. Set `relative = true` to restore the 4.6.0 behavior. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

## SpringBoneSimulator3D (Godot 4.4+)

Simulates spring physics on bones — hair, capes, tails, antennas bounce and sway procedurally. Add `SpringBoneSimulator3D` as child of `Skeleton3D`, configure spring chains in the Inspector (root bone, end bone, radius, stiffness, drag, gravity).

| Setting (`settings/<i>/…`) | Effect |
|---|---|
| `stiffness/value` | How fast the chain recovers its original pose (default 1.0; 0 = never returns) |
| `drag/value`      | Suppresses wiggling — higher = less bouncy (default 0.4) |
| `gravity/value`   | Constant pull along `gravity/direction` (default 0; non-zero keeps the pose offset) |
| `radius/value`    | Joint radius used against `SpringBoneCollision3D` children |

> **Tip:** Defaults are Stiffness 1.0, Drag 0.4, Gravity 0. Raise Stiffness for stiff antennas, raise Drag to calm bouncy hair; each value's `damping_curve` scales it along the chain. From code use the indexed setters: `set_stiffness(i, v)`, `set_drag(i, v)`, `set_gravity(i, v)`.
