# Pixel Art Setup

Reference for `skills/responsive-ui/SKILL.md` — project settings for pixel art, integer scaling via script, nearest-neighbour filter overrides.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Pixel Art Setup

### Project Settings

In `Project > Project Settings`:

- `Display > Window > Stretch > Mode` → `viewport`
- `Display > Window > Stretch > Scale Mode` → `integer` (leave `Scale` at `1` — in `viewport` mode a scale of 2 halves the internal resolution)
- `Rendering > Textures > Canvas Textures > Default Texture Filter` → `Nearest`

Setting the texture filter to `Nearest` globally avoids blurry pixels without per-sprite configuration.

### Integer Scaling via Script

**GDScript:**

```gdscript
# res://autoload/display_manager.gd
extends Node

const BASE_SIZE := Vector2i(320, 180)  # pixel art design resolution

func _ready() -> void:
    var window := get_window()
    window.content_scale_size = BASE_SIZE
    window.content_scale_mode = Window.CONTENT_SCALE_MODE_VIEWPORT
    window.content_scale_aspect = Window.CONTENT_SCALE_ASPECT_KEEP
    # Scale by the largest whole multiple that fits the window; the rest is letterboxed.
    # Recomputed by the engine on every resize. Do not use content_scale_factor for this:
    # in viewport mode it divides the render resolution (a factor of 4 renders 80x45).
    window.content_scale_stretch = Window.CONTENT_SCALE_STRETCH_INTEGER
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
        window.ContentScaleSize    = BaseSize;
        window.ContentScaleMode    = Window.ContentScaleModeEnum.Viewport;
        window.ContentScaleAspect  = Window.ContentScaleAspectEnum.Keep;
        // Largest whole multiple that fits; recomputed by the engine on every resize.
        window.ContentScaleStretch = Window.ContentScaleStretchEnum.Integer;
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

