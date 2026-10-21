# Split Screen (Local Multiplayer)

Reference for `skills/camera-system/SKILL.md` — SubViewport-based split-screen with multiple Camera3D nodes.

> ← Back to [SKILL.md](../SKILL.md)

---
## 7. Split Screen (Local Multiplayer)

Each player gets their own `SubViewport` with a dedicated `Camera2D`/`Camera3D`. A `SubViewportContainer` renders the viewport into the 2D canvas.

### Scene Tree

```
HBoxContainer  (fills the screen — add two children for vertical split)
├── SubViewportContainer  (player 1 side — stretch_shrink = 1)
│   └── SubViewport
│       ├── Player1  (CharacterBody2D)
│       └── Camera2D  (child of Player1)
└── SubViewportContainer  (player 2 side)
    └── SubViewport
        ├── Player2  (CharacterBody2D)
        └── Camera2D  (child of Player2)
```

### GDScript

```gdscript
## SplitScreenSetup.gd — attach to the root node of your split-screen scene
extends Node

@export var player_scene: PackedScene

func _ready() -> void:
    _setup_viewport($HBoxContainer/P1Container/P1Viewport, Vector2i(0, 0))
    _setup_viewport($HBoxContainer/P2Container/P2Viewport, Vector2i(1, 0))

func _setup_viewport(viewport: SubViewport, player_index: Vector2i) -> void:
    # Match viewport size to half the window
    var half_size := Vector2i(
        DisplayServer.window_get_size().x / 2,
        DisplayServer.window_get_size().y
    )
    viewport.size = half_size

    var player: Node = player_scene.instantiate()
    viewport.add_child(player)

    # Each player uses a separate input device (gamepad index via player_index.x)
    # Wire up device index through an exported property on your player script
    if player.has_method("set_device"):
        player.set_device(player_index.x)
```

```csharp
// SplitScreenSetup.cs — attach to the root node of your split-screen scene
using Godot;

public partial class SplitScreenSetup : Node
{
    [Export] public PackedScene PlayerScene;

    public override void _Ready()
    {
        SetupViewport(GetNode<SubViewport>("HBoxContainer/P1Container/P1Viewport"), new Vector2I(0, 0));
        SetupViewport(GetNode<SubViewport>("HBoxContainer/P2Container/P2Viewport"), new Vector2I(1, 0));
    }

    private void SetupViewport(SubViewport viewport, Vector2I playerIndex)
    {
        // Match viewport size to half the window
        var windowSize = DisplayServer.WindowGetSize();
        viewport.Size = new Vector2I(windowSize.X / 2, windowSize.Y);

        var player = PlayerScene.Instantiate<Node>();
        viewport.AddChild(player);

        // Each player uses a separate input device (gamepad index via playerIndex.X)
        // Wire up device index through an exported property on your player script
        if (player.HasMethod("SetDevice"))
            player.Call("SetDevice", playerIndex.X);
    }
}
```

**Key settings for each `SubViewport`:**

| Property | Value | Reason |
|---|---|---|
| `own_world_3d` | `true` (3D only) | Separate physics world per viewport |
| `audio_listener_enable_2d/3d` | `true` on primary | Only one viewport drives audio |
| `transparent_bg` | `false` | Avoid alpha blending overhead |
| `handle_input_locally` | `false` | Let the root scene handle input routing |

---

