# Camera Zones / Rooms

Reference for `skills/camera-system/SKILL.md` — Area2D-based room cameras with limit tweens, GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Camera Zones / Rooms

For Metroidvania or Zelda-style games, `Area2D` regions define camera bounds per room. When the player enters a zone, the camera limits tween smoothly to the new room boundaries.

### GDScript

**CameraZone node** — place one per room, sized to fit the room:

```gdscript
## CameraZone.gd — attach to an Area2D
## Set collision layer so only the player can trigger it.
extends Area2D

## Room bounds in world pixels (set via CollisionShape2D or exported values)
@export var limit_left: int = 0
@export var limit_right: int = 320
@export var limit_top: int = 0
@export var limit_bottom: int = 180

## Seconds to tween the camera limits when entering this room
@export var transition_time: float = 0.4

func _ready() -> void:
    body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
    # Only react to the player (adjust group name to match your project)
    if not body.is_in_group("player"):
        return

    var cam := body.get_viewport().get_camera_2d()
    if not cam:
        return

    var tween: Tween = create_tween()
    tween.set_parallel(true)
    tween.set_ease(Tween.EASE_IN_OUT)
    tween.set_trans(Tween.TRANS_SINE)

    tween.tween_property(cam, "limit_left",   limit_left,   transition_time)
    tween.tween_property(cam, "limit_right",  limit_right,  transition_time)
    tween.tween_property(cam, "limit_top",    limit_top,    transition_time)
    tween.tween_property(cam, "limit_bottom", limit_bottom, transition_time)
```

### C#

```csharp
// CameraZone.cs — attach to an Area2D
using Godot;

public partial class CameraZone : Area2D
{
    [Export] public int LimitLeft   { get; set; } = 0;
    [Export] public int LimitRight  { get; set; } = 320;
    [Export] public int LimitTop    { get; set; } = 0;
    [Export] public int LimitBottom { get; set; } = 180;
    [Export] public float TransitionTime { get; set; } = 0.4f;

    public override void _Ready()
    {
        BodyEntered += OnBodyEntered;
    }

    private void OnBodyEntered(Node2D body)
    {
        if (!body.IsInGroup("player")) return;
        var cam = body.GetViewport().GetCamera2D();
        if (cam == null) return;

        var tween = CreateTween();
        tween.SetParallel(true);
        tween.SetEase(Tween.EaseType.InOut);
        tween.SetTrans(Tween.TransitionType.Sine);

        tween.TweenProperty(cam, "limit_left",   LimitLeft,   TransitionTime);
        tween.TweenProperty(cam, "limit_right",  LimitRight,  TransitionTime);
        tween.TweenProperty(cam, "limit_top",    LimitTop,    TransitionTime);
        tween.TweenProperty(cam, "limit_bottom", LimitBottom, TransitionTime);
    }
}
```

**Scene setup:**

```
World
├── TileMapLayer
├── Player (CharacterBody2D) — group: "player"
├── Camera2D          ← child of Player or a separate autosnapped node
└── RoomZones
    ├── RoomA (Area2D + CameraZone + CollisionShape2D)
    ├── RoomB (Area2D + CameraZone + CollisionShape2D)
    └── RoomC (Area2D + CameraZone + CollisionShape2D)
```

**Tip:** Size each `CollisionShape2D` to the visible room rectangle. For pixel-art games, align shapes to tile boundaries so there is no overlap between adjacent rooms. If rooms share a wall, a thin 1-pixel gap between shapes avoids double-triggers.

---

