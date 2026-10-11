# IK Recipes

Reference for `skills/animation-system/SKILL.md` — full GDScript and C# recipes for IKModifier3D solvers (Godot 4.6+).

> ← Back to [SKILL.md](../SKILL.md)

---

## Recipe: Arm reach with influence blending (CCDIK3D)

A character reaches for a moving target (a pickup, a held weapon's grip, a button) and blends the IK influence in / out based on distance. The IK modifier is added in the scene editor under the `Skeleton3D`; the script just drives `influence`.

**Scene tree:**

```
Character (Node3D)
├── Skeleton3D
│   ├── (bones: Spine, Shoulder, UpperArm, Forearm, Hand)
│   └── CCDIK3D
│       └── Settings > 0
│           ├── root_bone_name = "Shoulder"
│           ├── end_bone_name = "Hand"
│           └── target_node = NodePath("../../Target")
└── Target (Node3D)
```

```gdscript
# arm_ik_controller.gd
extends Node3D

@export var target: Node3D
@export var ccdik: CCDIK3D
@export var blend_speed: float = 4.0
@export var reach_range: float = 2.0

var _blend: float = 0.0

func _process(delta: float) -> void:
    var want_ik := target != null and target.global_position.distance_to(global_position) < reach_range
    _blend = move_toward(_blend, 1.0 if want_ik else 0.0, blend_speed * delta)
    ccdik.influence = _blend
```

```csharp
// ArmIKController.cs
using Godot;

public partial class ArmIKController : Node3D
{
    [Export] public Node3D Target { get; set; }
    [Export] public Ccdik3D Ccdik { get; set; }
    [Export] public float BlendSpeed { get; set; } = 4.0f;
    [Export] public float ReachRange { get; set; } = 2.0f;

    private float _blend;

    public override void _Process(double delta)
    {
        bool wantIk = Target != null && Target.GlobalPosition.DistanceTo(GlobalPosition) < ReachRange;
        _blend = Mathf.MoveToward(_blend, wantIk ? 1.0f : 0.0f, BlendSpeed * (float)delta);
        Ccdik.Influence = _blend;
    }
}
```

**Verification:** Move the `Target` node in the editor while the game runs. The hand should chase the target when within 2 m, and return to the keyframed pose when out of range. Watch `CCDIK3D.influence` ramp 0 → 1.

## Recipe: Foot placement on uneven terrain (FABRIK3D + raycast)

The character's feet plant on the ground regardless of slope. One `FABRIK3D` per leg (or `TwoBoneIK3D` for exactly-2-bone humanoid legs), plus a per-leg raycast to find the ground hit point.

**Scene tree (per leg):**

```
Character (Node3D)
├── Skeleton3D
│   ├── (bones: Hip, ThighL, ShinL, FootL)
│   └── FABRIK3D_L
│       └── Settings > 0
│           ├── root_bone_name = "Hip"
│           ├── end_bone_name = "FootL"
│           └── target_node = NodePath("../../FootTarget_L")
├── FootTarget_L (Node3D)   # IK target driven by raycast
└── RayCast3D_L (RayCast3D) # downward ray from foot bone position
```

```gdscript
# foot_ik.gd
extends Node3D

@export var skeleton: Skeleton3D
@export var foot_bone: String = "FootL"
@export var ray: RayCast3D
@export var foot_target: Node3D
@export var max_offset: float = 0.4  # how high/low the foot can plant

func _process(_delta: float) -> void:
    if skeleton == null or ray == null or foot_target == null:
        return
    var bone_idx := skeleton.find_bone(foot_bone)
    var bone_xform := skeleton.global_transform * skeleton.get_bone_global_pose(bone_idx)
    ray.global_position = bone_xform.origin + Vector3.UP * 0.5
    ray.target_position = Vector3.DOWN * (0.5 + max_offset)
    if ray.is_colliding():
        foot_target.global_position = ray.get_collision_point()
    else:
        foot_target.global_position = bone_xform.origin
```

```csharp
// FootIK.cs
using Godot;

public partial class FootIK : Node3D
{
    [Export] public Skeleton3D Skeleton { get; set; }
    [Export] public string FootBone { get; set; } = "FootL";
    [Export] public RayCast3D Ray { get; set; }
    [Export] public Node3D FootTarget { get; set; }
    [Export] public float MaxOffset { get; set; } = 0.4f;

    public override void _Process(double delta)
    {
        if (Skeleton == null || Ray == null || FootTarget == null)
            return;

        int boneIdx = Skeleton.FindBone(FootBone);
        Transform3D boneXform = Skeleton.GlobalTransform * Skeleton.GetBoneGlobalPose(boneIdx);
        Ray.GlobalPosition = boneXform.Origin + Vector3.Up * 0.5f;
        Ray.TargetPosition = Vector3.Down * (0.5f + MaxOffset);

        if (Ray.IsColliding())
            FootTarget.GlobalPosition = Ray.GetCollisionPoint();
        else
            FootTarget.GlobalPosition = boneXform.Origin;
    }
}
```

**Verification:** Place the character on a slope or staircase. Both feet should plant on the ground polygons rather than floating or clipping. Toggle `FABRIK3D.influence` between 0 and 1 to compare.

**Perf cost:** One raycast and one `FABRIK3D` per leg every frame. Two-leg humanoid → 2 raycasts + 2 IK solves. For background NPCs, gate this behind a distance check or run on `_physics_process` at 30 Hz instead of `_process`. For exactly-2-bone humanoid legs, `TwoBoneIK3D` is a closed-form (non-iterative) solve; it also needs a pole node (`set_pole_node`) to fix the knee direction.

## Basic setup — FABRIK arm IK

```
Character (CharacterBody3D)
└── Skeleton3D
    └── FABRIK3D
        (Settings > 0: root_bone_name = "Shoulder", end_bone_name = "Wrist")
```

```gdscript
@onready var skeleton: Skeleton3D = $Skeleton3D

func _ready() -> void:
    var ik := FABRIK3D.new()
    skeleton.add_child(ik)
    # One setting per chain: name its root and end bone; the bones between are found automatically.
    ik.setting_count = 1
    ik.set_root_bone_name(0, "Shoulder")
    ik.set_end_bone_name(0, "Wrist")
    # The IK target is a NodePath relative to the modifier.
    ik.set_target_node(0, ik.get_path_to($"../IKTarget"))
```

```csharp
public override void _Ready()
{
    var skeleton = GetNode<Skeleton3D>("Skeleton3D");
    var ik = new Fabrik3D();
    skeleton.AddChild(ik);
    ik.SettingCount = 1;
    ik.SetRootBoneName(0, "Shoulder");
    ik.SetEndBoneName(0, "Wrist");
    ik.SetTargetNode(0, ik.GetPathTo(GetNode<Node3D>("../IKTarget")));
}
```

> **Note:** `IKModifier3D` solvers are configured per setting index: set `setting_count`, then `set_root_bone_name(i, …)`, `set_end_bone_name(i, …)` and `set_target_node(i, …)` (`TwoBoneIK3D` also takes `set_middle_bone_name` and `set_pole_node`; `SplineIK3D` has no target node and takes `set_path_3d(i, …)` instead). The C# class names are `Fabrik3D`, `Ccdik3D`, `JacobianIK3D`, `TwoBoneIK3D` and `SplineIK3D`.

> **When to use:** `IKModifier3D` subclasses replace custom IK scripts and third-party IK plugins. Use `TwoBoneIK3D` for leg/arm IK (exact; needs a pole node), `FABRIK3D` for longer unconstrained chains, `CCDIK3D` when joints have limits, `SplineIK3D` for tails that follow a path.
