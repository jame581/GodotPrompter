# BoneConstraint3D Modifiers

Reference for `skills/animation-system/SKILL.md` — Godot 4.5+ `BoneConstraint3D` subclasses (Aim / Copy / Convert) for bone-relative skeleton modifiers.

> ← Back to [SKILL.md](../SKILL.md)

---

## BoneConstraint3D Modifiers (Godot 4.5+)

Godot 4.5 introduces `BoneConstraint3D` — a new base class for skeleton modifiers that operate relative to another bone rather than a world-space target. Three concrete subclasses ship with 4.5:

| Modifier | What it does |
|----------|-------------|
| `AimModifier3D` | Rotates a bone to aim along its primary axis toward a reference bone |
| `CopyTransformModifier3D` | Copies position/rotation/scale from one bone to another (useful for mirroring or binding secondary rigs) |
| `ConvertTransformModifier3D` | Converts between transform spaces — translates, rotates, or scales a bone based on another bone's transform, with remapping |

These complement `LookAtModifier3D` (which targets a world-space `Node3D`). Use `AimModifier3D` when the aim target is itself a bone on the same skeleton.

**Scene structure:**

```
Character (CharacterBody3D)
└── Skeleton3D
    ├── AimModifier3D         ← child of Skeleton3D
    └── CopyTransformModifier3D
```

**AimModifier3D — bone-to-bone aiming:**

```gdscript
@onready var skeleton: Skeleton3D = $Skeleton3D

func _ready() -> void:
    var aim := AimModifier3D.new()
    skeleton.add_child(aim)
    # A constraint holds a list of settings; each one pairs a bone with a reference.
    aim.setting_count = 1
    aim.set_apply_bone_name(0, "RightArm")       # bone that aims
    aim.set_reference_bone_name(0, "RightHand")  # bone it aims toward
    aim.set_forward_axis(0, SkeletonModifier3D.BONE_AXIS_PLUS_Y)  # bone axis pointed at the reference
    aim.set_amount(0, 1.0)                        # 0.0-1.0 blend of this setting
```

```csharp
public override void _Ready()
{
    var skeleton = GetNode<Skeleton3D>("Skeleton3D");
    var aim = new AimModifier3D();
    skeleton.AddChild(aim);
    aim.SettingCount = 1;
    aim.SetApplyBoneName(0, "RightArm");
    aim.SetReferenceBoneName(0, "RightHand");
    aim.SetForwardAxis(0, SkeletonModifier3D.BoneAxis.PlusY);
    aim.SetAmount(0, 1.0f);
}
```

**CopyTransformModifier3D — mirror/bind bones:**

```gdscript
func _ready() -> void:
    var copy := CopyTransformModifier3D.new()
    skeleton.add_child(copy)
    copy.setting_count = 1
    copy.set_apply_bone_name(0, "LeftArm")       # bone receiving the transform
    copy.set_reference_bone_name(0, "RightArm")  # bone being copied
    copy.set_copy_position(0, false)
    copy.set_copy_rotation(0, true)
    copy.set_copy_scale(0, false)
```

```csharp
var copy = new CopyTransformModifier3D();
skeleton.AddChild(copy);
copy.SettingCount = 1;
copy.SetApplyBoneName(0, "LeftArm");
copy.SetReferenceBoneName(0, "RightArm");
copy.SetCopyPosition(0, false);
copy.SetCopyRotation(0, true);
copy.SetCopyScale(0, false);
```

> **Note:** Constraints are configured per setting index, not through flat properties: set `setting_count`, then call `set_apply_bone_name(i, …)`, `set_reference_bone_name(i, …)` and the subclass setters. In the Inspector the same values appear under **Settings > 0**. Angle limits belong to `LookAtModifier3D`, not `AimModifier3D`.

> **When to use:** Prefer `BoneConstraint3D` subclasses over manual bone transform manipulation in `_process()` — they integrate with the modifier pipeline and respect the animation blend stack.
