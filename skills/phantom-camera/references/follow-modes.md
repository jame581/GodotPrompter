# Follow modes

Reference for `skills/phantom-camera/SKILL.md` — the `FollowMode` enum, per-mode properties, GDScript and C# setup, group auto-reframe, and shared follow options.

> ← Back to [SKILL.md](../SKILL.md)

---

`FollowMode` enum (2D and 3D share the first six; 3D adds `THIRD_PERSON`):

```gdscript
enum FollowMode {
    NONE = 0, GLUED = 1, SIMPLE = 2, GROUP = 3, PATH = 4, FRAMED = 5,
    THIRD_PERSON = 6,  # PhantomCamera3D only
}
```

| Mode | Behavior | Key properties |
|---|---|---|
| `GLUED` | Sticks exactly to `follow_target`. | `follow_target` |
| `SIMPLE` | Follows `follow_target` with an offset and optional damping. | `follow_offset`, `follow_damping`, `follow_damping_value` |
| `GROUP` | Follows the centroid of `follow_targets`, can auto-reframe. | `follow_targets: Array[Node2D/3D]` |
| `PATH` | Follows `follow_target` while confined to the closest point on `follow_path`. | `follow_path` (`Path2D`/`Path3D`) |
| `FRAMED` | Dead-zone follow — only moves once the target nears the frame edge. | `dead_zone_width`, `dead_zone_height`; emits `dead_zone_reached(side)` |
| `THIRD_PERSON` (3D) | Drives a `SpringArm3D` at the target, allowing orbit. | `follow_distance`, `collision_mask`, `shape`, `vertical_rotation_offset`, `horizontal_rotation_offset` |

```gdscript
# Player-follow with damping — PhantomCamera2D inspector or code
extends PhantomCamera2D

func _ready() -> void:
    follow_mode = FollowMode.SIMPLE
    follow_target = get_node("../Player")
    follow_damping = true
    follow_damping_value = Vector2(0.15, 0.15)  # lower = snappier
```

```gdscript
# Boss-fight group shot that auto-zooms to keep both combatants framed
extends PhantomCamera2D

func _ready() -> void:
    follow_mode = FollowMode.GROUP
    follow_targets = [get_node("../Player"), get_node("../Boss")]
    auto_zoom = true
    auto_zoom_min = 1.0
    auto_zoom_max = 2.5
```

```csharp
using PhantomCamera;

public partial class PlayerFollowSetup : Node
{
    [Export] private Node2D _pCamNode; // has a PhantomCamera2D node/script attached
    [Export] private Node2D _player;

    public override void _Ready()
    {
        // FollowMode has no wrapper setter (getter-only) — set it on the underlying node.
        _pCamNode.Set("follow_mode", (int)FollowMode2D.Simple);

        var pCam = _pCamNode.AsPhantomCamera2D();
        pCam.FollowTarget = _player;
        pCam.FollowDamping = true;
        pCam.FollowDampingValue = new Vector2(0.15f, 0.15f); // lower = snappier
    }
}
```

`GROUP` follows the same pattern: `_pCamNode.Set("follow_mode", (int)FollowMode2D.Group)`, then
`pCam.FollowTargets`, `pCam.AutoZoom`, `pCam.AutoZoomMin`/`AutoZoomMax` — identical PascalCase names.

`GROUP` auto-reframe uses `auto_zoom`/`auto_zoom_min`/`auto_zoom_max`/`auto_zoom_margin` in 2D (adjusts
`Camera2D.zoom`), and `auto_follow_distance`/`auto_follow_distance_min`/`auto_follow_distance_max` in 3D
(adjusts distance along local `-z`).

Shared follow options: `follow_axis_lock` (`FollowLockAxis` — 2D: `NONE, X, Y, XY`; 3D adds `Z, XZ, YZ,
XYZ`), `rotate_with_target: bool` (2D-only; requires `Camera2D.ignore_rotation = false`), `lookahead:
bool` + `lookahead_time`/`lookahead_acceleration`/`lookahead_deceleration` (velocity-based look-ahead;
2D also exposes a `lookahead_max`/`lookahead_max_value` velocity clamp that 3D does not).

Query state with `is_following() -> bool`; snap instantly (bypassing damping) with
`teleport_position()`.
