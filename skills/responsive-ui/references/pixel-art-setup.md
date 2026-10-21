# Pixel Art Setup

Reference for `skills/responsive-ui/SKILL.md` — project settings for pixel art, integer scaling via script, nearest-neighbour filter overrides.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Pixel Art Setup

### Project Settings

In `Project > Project Settings`:

- `Display > Window > Stretch > Mode` → `viewport`
- `Display > Window > Stretch > Scale` → `2` (or `3`, `4` — any integer)
- `Rendering > Textures > Canvas Textures > Default Texture Filter` → `Nearest`

Setting the texture filter to `Nearest` globally avoids blurry pixels without per-sprite configuration.

### Integer Scaling via Script

**GDScript:**

```gdscript
# res://autoload/display_manager.gd
extends Node

const BASE_SIZE := Vector2i(320, 180)  # pixel art design resolution

func _ready() -> void:
    get_window().content_scale_size = BASE_SIZE
    get_window().content_scale_mode = Window.CONTENT_SCALE_MODE_VIEWPORT
    get_window().content_scale_aspect = Window.CONTENT_SCALE_ASPECT_KEEP
    _apply_integer_scale()
    get_viewport().size_changed.connect(_apply_integer_scale)


func _apply_integer_scale() -> void:
    var screen_size := DisplayServer.screen_get_size()
    var scale_x := screen_size.x / BASE_SIZE.x
    var scale_y := screen_size.y / BASE_SIZE.y
    var integer_scale := maxi(1, mini(scale_x, scale_y))
    get_window().content_scale_factor = float(integer_scale)
```

**C#:**

```csharp
// autoload/DisplayManager.cs
using Godot;

public partial class DisplayManager : Node
{
    private static readonly Vector2I BaseSize = new(320, 180);

    public override void _Ready()
    {
        var window = GetWindow();
        window.ContentScaleSize   = BaseSize;
        window.ContentScaleMode   = Window.ContentScaleModeEnum.Viewport;
        window.ContentScaleAspect = Window.ContentScaleAspectEnum.Keep;
        ApplyIntegerScale();
        GetViewport().SizeChanged += ApplyIntegerScale;
    }

    private void ApplyIntegerScale()
    {
        var screenSize  = DisplayServer.ScreenGetSize();
        int scaleX      = screenSize.X / BaseSize.X;
        int scaleY      = screenSize.Y / BaseSize.Y;
        int intScale    = Mathf.Max(1, Mathf.Min(scaleX, scaleY));
        GetWindow().ContentScaleFactor = intScale;
    }
}
```

### Nearest-Neighbour Filter per Node (Override)

If the global filter is `Linear` and you only want `Nearest` on specific sprites:

**GDScript:**

```gdscript
# On a Sprite2D or TextureRect node
$Sprite2D.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
```

**C#:**

```csharp
GetNode<Sprite2D>("Sprite2D").TextureFilter = CanvasItem.TextureFilterEnum.Nearest;
```

---

