# Physics Interpolation — Camera Recipe

Reference for `skills/physics-system/SKILL.md` — smooth follow-camera that uses physics-interpolated target position.

> ← Back to [SKILL.md](../SKILL.md)

---

Cameras often need special handling under physics interpolation. For a smooth follow camera:

1. Make camera independent (not a child of the followed node) or set `top_level = true`
2. Update camera in `_process()` (not `_physics_process()`)
3. Use `get_global_transform_interpolated()` to read the target's smooth position

```gdscript
extends Camera3D

@onready var _target: Node3D = $"../Player"
var _smooth_pos: Vector3

func _ready() -> void:
    physics_interpolation_mode = Node.PHYSICS_INTERPOLATION_MODE_OFF

func _process(delta: float) -> void:
    var target_transform: Transform3D = _target.get_global_transform_interpolated()
    _smooth_pos = _smooth_pos.lerp(target_transform.origin, minf(delta * 5.0, 1.0))
    look_at(_smooth_pos, Vector3.UP)
```

```csharp
public partial class FollowCamera : Camera3D
{
    private Node3D _target;
    private Vector3 _smoothPos;

    public override void _Ready()
    {
        _target = GetNode<Node3D>("../Player");
        PhysicsInterpolationMode = PhysicsInterpolationModeEnum.Off;
    }

    public override void _Process(double delta)
    {
        var targetTransform = _target.GetGlobalTransformInterpolated();
        _smoothPos = _smoothPos.Lerp(targetTransform.Origin, Mathf.Min((float)delta * 5f, 1f));
        LookAt(_smoothPos, Vector3.Up);
    }
}
```

> **Note:** `get_global_transform_interpolated()` should only be used for special cases like cameras (1–2 calls per frame). Regular game logic should use `global_transform` inside `_physics_process()`.
