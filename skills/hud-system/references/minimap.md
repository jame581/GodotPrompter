# Minimap

Reference for `skills/hud-system/SKILL.md` — minimap via SubViewport + dedicated Camera2D, with circular mask option. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Minimap Concept

A minimap renders a simplified view of the world using a second `Camera2D` inside a `SubViewport`. The `SubViewportContainer` displays the result as a texture anywhere in the HUD.

### Scene Tree

```
HUD (CanvasLayer)
└── MinimapContainer (SubViewportContainer — custom_minimum_size: 128x128)
    └── MinimapViewport (SubViewport — size: 256x256, disable_3d: true)
        ├── MinimapCamera (Camera2D — zoom: Vector2(0.15, 0.15))
        └── (world nodes are rendered via visibility layers — see below)
```

### How it Works

The `SubViewport` renders a completely separate view of the world. Rather than duplicating nodes, use Godot's **visibility layers** to control what each camera sees:

1. Assign your world `TileMapLayer`, environment, and entities to a **world layer** (e.g. layer 1).
2. Assign minimap-specific indicator sprites (player dot, enemy dots) to a **minimap layer** (e.g. layer 2).
3. Set the main `Camera2D`'s `cull_mask` to show only layer 1.
4. Set the `MinimapCamera`'s `cull_mask` to show layers 1 + 2, or only layer 2 if you want an abstract minimap.

### GDScript — MinimapCamera

```gdscript
## minimap_camera.gd — attach to the Camera2D inside the SubViewport
extends Camera2D

## The target node the minimap camera tracks (usually the player).
@export var follow_target: Node2D

## How tightly the minimap tracks the target (0 = no follow, 1 = instant snap).
@export var follow_speed: float = 10.0


func _process(delta: float) -> void:
    if not follow_target:
        return
    global_position = global_position.lerp(follow_target.global_position, follow_speed * delta)
```

### C# — MinimapCamera

```csharp
// MinimapCamera.cs — attach to the Camera2D inside the SubViewport
using Godot;

public partial class MinimapCamera : Camera2D
{
    /// <summary>The target node the minimap camera tracks (usually the player).</summary>
    [Export] public Node2D FollowTarget { get; set; }

    /// <summary>How tightly the minimap tracks the target (0 = no follow, 1 = instant snap).</summary>
    [Export] public float FollowSpeed { get; set; } = 10.0f;

    public override void _Process(double delta)
    {
        if (FollowTarget == null)
            return;
        GlobalPosition = GlobalPosition.Lerp(FollowTarget.GlobalPosition, FollowSpeed * (float)delta);
    }
}
```

### SubViewport Settings

| Property | Recommended value | Reason |
|---|---|---|
| `size` | `Vector2i(256, 256)` | Internal render resolution; `SubViewportContainer` scales to display size |
| `render_target_update_mode` | `UPDATE_ALWAYS` | Keeps the minimap live every frame |
| `disable_3d` | `true` | Skip 3D rendering overhead for a 2D minimap |
| `canvas_item_default_texture_filter` | `TEXTURE_FILTER_NEAREST` | Preserves pixel art crispness |

### Circular Mask (Optional)

To clip the minimap to a circle, wrap the `SubViewportContainer` in a `TextureRect` using a circular mask texture, or apply a shader to the `SubViewportContainer`:

```gdscript
# Assign a circular mask shader to the SubViewportContainer's material
# Shader (res://shaders/circle_mask.gdshader):
# shader_type canvas_item;
# void fragment() {
#     vec2 uv = UV - 0.5;
#     float dist = length(uv);
#     COLOR = texture(TEXTURE, UV);
#     COLOR.a *= step(dist, 0.5);
# }
```

---

