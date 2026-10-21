> ← Back to [SKILL.md](../SKILL.md)

# Setting Anchors in Code

**GDScript:**

```gdscript
# Fill parent completely ("Full Rect" preset)
$Panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

# Anchor to top-right corner, fixed 200x60 size
$HUDLabel.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
$HUDLabel.size = Vector2(200.0, 60.0)
# 16 px margin from the right and top edges
$HUDLabel.offset_right  = -16.0
$HUDLabel.offset_top    =  16.0

# Custom anchor: right half of screen, full height
$SidePanel.anchor_left   = 0.5
$SidePanel.anchor_top    = 0.0
$SidePanel.anchor_right  = 1.0
$SidePanel.anchor_bottom = 1.0
$SidePanel.offset_left   = 0.0
$SidePanel.offset_top    = 0.0
$SidePanel.offset_right  = 0.0
$SidePanel.offset_bottom = 0.0
```

**C#:**

```csharp
// Fill parent completely
GetNode<Control>("Panel").SetAnchorsAndOffsetsPreset(Control.LayoutPreset.FullRect);

// Anchor to top-right corner
var label = GetNode<Control>("HUDLabel");
label.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.TopRight);
label.Size = new Vector2(200f, 60f);
label.OffsetRight = -16f;
label.OffsetTop   =  16f;

// Custom anchor: right half of screen
var panel = GetNode<Control>("SidePanel");
panel.AnchorLeft   = 0.5f;
panel.AnchorTop    = 0.0f;
panel.AnchorRight  = 1.0f;
panel.AnchorBottom = 1.0f;
panel.OffsetLeft   = 0f;
panel.OffsetTop    = 0f;
panel.OffsetRight  = 0f;
panel.OffsetBottom = 0f;
```

## Anchor vs Offset

- **Anchor** determines *where on the parent* the node's edges track — resolution-independent.
- **Offset** is a *fixed pixel value* added after the anchor — doesn't scale with the parent.

For fully responsive layout, keep offsets at 0 and let anchors do the work; add small fixed offsets only for cosmetic margins (e.g., a 16 px gutter from an edge).
