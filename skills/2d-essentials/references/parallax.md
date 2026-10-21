# Parallax Scrolling

Reference for `skills/2d-essentials/SKILL.md` — `Parallax2D` node setup, side-scroller layer example, infinite repeat, split-screen parallax, common mistakes.

> ← Back to [SKILL.md](../SKILL.md)

---
## 3. Parallax Scrolling

### Parallax2D Node (Recommended)

`Parallax2D` is the modern replacement for the deprecated `ParallaxBackground`/`ParallaxLayer` nodes.

**Core Properties:**

| Property | Purpose |
|----------|---------|
| `scroll_scale` | Scroll speed multiplier per axis. `1` = camera speed, `<1` = farther, `>1` = closer, `0` = static |
| `repeat_size` | Image size for infinite repeat. Set to texture dimensions for seamless tiling |
| `repeat_times` | Extra repeats behind/in front (increase when zooming out) |
| `scroll_offset` | Offset for the repeat canvas starting point |

### Layer Setup Example (Side-Scroller)

```
Main
├── Camera2D
├── Parallax2D (scroll_scale = 0.1, 0)   ← Sky (slowest)
│   └── Sprite2D (sky texture)
├── Parallax2D (scroll_scale = 0.2, 0)   ← Clouds
│   └── Sprite2D (clouds texture)
├── Parallax2D (scroll_scale = 0.5, 0)   ← Hills
│   └── Sprite2D (hills texture)
├── Parallax2D (scroll_scale = 0.7, 0)   ← Trees
│   └── Sprite2D (trees texture)
└── World (scroll_scale = 1.0 — default)
    ├── TileMapLayer
    └── Player
```

### Infinite Repeat Setup

1. Texture top-left should be at position `(0, 0)` — the repeat canvas starts there and expands down-right
2. Set `repeat_size` to match the texture dimensions
3. Ensure the texture is the same size as or larger than the viewport

```gdscript
extends Parallax2D

func _ready() -> void:
    scroll_scale = Vector2(0.3, 0.0)
    repeat_size = Vector2(1920, 0)  # Match texture width for horizontal repeat
    repeat_times = 3                # Extra repeats for zoom-out safety
```

```csharp
public partial class CloudLayer : Parallax2D
{
    public override void _Ready()
    {
        ScrollScale = new Vector2(0.3f, 0.0f);
        RepeatSize = new Vector2(1920, 0);
        RepeatTimes = 3;
    }
}
```

### Common Mistakes

| Problem | Fix |
|---------|-----|
| Texture centered at (0,0) | Keep top-left at (0,0) — centering breaks infinite repeat |
| Gaps when zooming out | Increase `repeat_times` (e.g. 3) |
| repeat_size doesn't match | Set to actual texture/region size, not viewport size |
| Texture smaller than viewport | Scale the Parallax2D node, or use `texture_repeat = ENABLED` with `region_enabled = true` on Sprite2D |

### Split Screen Parallax

For split-screen games, clone parallax nodes into each `SubViewport`. Use `visibility_layer` on parent nodes and `canvas_cull_mask` on SubViewports to isolate parallax per viewport.

---

