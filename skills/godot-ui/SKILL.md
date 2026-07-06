---
name: godot-ui
description: Use when building user interfaces — Control nodes, themes, anchors, containers, and layout patterns
---

# Godot UI — Control Nodes, Themes & Layout

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **responsive-ui** for multi-resolution scaling, **hud-system** for in-game HUD patterns, **dialogue-system** for dialogue UI presentation, **tween-animation** for UI transition and animation effects.

---

## 1. Control Node Hierarchy

### How Control Differs from Node2D

`Control` is the base class for all UI nodes. It lives in a separate branch of the scene tree from `Node2D`/`Node3D` and has a fundamentally different layout model.

| Feature | `Node2D` | `Control` |
|---|---|---|
| Position model | World-space `position` (pixels from parent) | Anchor + offset relative to parent rect |
| Size | No intrinsic size | Has `size`, `minimum_size`, `custom_minimum_size` |
| Theme | None | Inherits and overrides `Theme` resources |
| Focus | Not applicable | Built-in focus system (`focus_mode`, `grab_focus()`) |
| Mouse events | Manual via `_input` | `gui_input`, `mouse_entered`, `mouse_exited` |
| Layout helpers | None | `Container` subclasses auto-arrange children |

### Control as Base Class

Every UI widget (`Button`, `Label`, `LineEdit`, etc.) extends `Control`. The key properties defined on `Control` itself are:

- `anchor_left`, `anchor_top`, `anchor_right`, `anchor_bottom` — fractional values (0.0–1.0) relative to the parent's rect
- `offset_left`, `offset_top`, `offset_right`, `offset_bottom` — pixel offsets applied after the anchor is resolved
- `size_flags_horizontal`, `size_flags_vertical` — how the node participates in `Container` layout
- `theme` — a `Theme` resource; if `null` the node walks up the tree to find the nearest ancestor with one
- `focus_mode` — controls whether the node can receive keyboard/gamepad focus

Place UI nodes inside a `CanvasLayer` (or directly under the scene root's built-in canvas) so they always render on top of the 3D/2D world and are not affected by `Camera` transforms.

> ⚠️ **Changed in Godot 4.7:** `Control.accessibility_live` changed type from `DisplayServer.AccessibilityLiveMode` to `AccessibilityServer.AccessibilityLiveMode` (`LIVE_OFF = 0` default, `LIVE_POLITE`, `LIVE_ASSERTIVE`) — the accessibility enums/APIs moved to the new `AccessibilityServer` singleton. GDScript-compatible; breaks C# binary/source compatibility (rebuild against the new enum). See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

---

## 2. Common Container Nodes

| Container | Purpose | When to Use |
|---|---|---|
| `VBoxContainer` | Stacks children vertically, top to bottom | Lists, option rows, vertical menus |
| `HBoxContainer` | Stacks children horizontally, left to right | Toolbars, stat rows, horizontal nav |
| `GridContainer` | Arranges children in a fixed-column grid | Inventory grids, key-binding tables |
| `MarginContainer` | Adds padding around a single child | Wrapping any node to give it breathing room |
| `PanelContainer` | Draws a `StyleBox` background, then lays out children | Card UI, dialog boxes, HUD panels |
| `ScrollContainer` | Makes its single child scrollable; clips overflow | Long lists, logs, scrollable settings |
| `TabContainer` | Stacks children as named tabs; shows one at a time | Settings screens, multi-section panels |

**Sizing tips:**
- Set `size_flags_horizontal = SIZE_EXPAND_FILL` on children that should fill available space.
- Use `custom_minimum_size` to prevent a child from collapsing to zero.
- `MarginContainer` reads margin from the theme property `margin_*`; override at runtime with `add_theme_constant_override("margin_left", 16)`.

> **Godot 4.7+:** `custom_maximum_size` (`Vector2(-1, -1)`) caps size per axis, with priority over `custom_minimum_size`; `propagate_maximum_size` (default `false`) makes a parent's maximum constrain its Control children; the `_get_maximum_size()` virtual computes maximums from code.

> ⚠️ **Changed in Godot 4.7:** `TabContainer.all_tabs_in_front` is deprecated — it no longer does anything, as tabs are always in front. Remove code that sets it. See [GH-118623](https://github.com/godotengine/godot/pull/118623).

---

## 3. Anchors & Margins

### How Anchor Presets Work

An anchor is a point on the **parent** rect expressed as a fraction (0 = top/left edge, 1 = bottom/right edge). Godot resolves the final pixel position of each edge as:

```
final_left   = parent_width  * anchor_left   + offset_left
final_top    = parent_height * anchor_top    + offset_top
final_right  = parent_width  * anchor_right  + offset_right
final_bottom = parent_height * anchor_bottom + offset_bottom
```

The editor exposes built-in presets:

| Preset | Anchor values | Use case |
|---|---|---|
| Full Rect | L=0, T=0, R=1, B=1 | Overlay / fill parent — most common for root UI |
| Center | L=0.5, T=0.5, R=0.5, B=0.5 | Fixed-size widget centred in parent |
| Top Left | L=0, T=0, R=0, B=0 | Fixed-size widget pinned to top-left corner |
| Top Right | L=1, T=0, R=1, B=0 | Fixed-size widget pinned to top-right corner |
| Bottom Center | L=0.5, T=1, R=0.5, B=1 | HUD element anchored to bottom centre |

### Setting Anchors in Code

**GDScript:**

```gdscript
# Fill parent completely (equivalent to "Full Rect" preset)
$Panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

# Anchor to top-right corner, fixed 200x60 size
$HUDLabel.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
$HUDLabel.size = Vector2(200.0, 60.0)
# Fine-tune with a 16 px margin from the right and top edges
$HUDLabel.offset_right  = -16.0
$HUDLabel.offset_top    =  16.0

# Custom responsive anchor: right half of screen, full height
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

### Anchor vs Offset

- **Anchor** determines *where on the parent* the node's edges track. It is resolution-independent.
- **Offset** is a *fixed pixel value* added after the anchor. It does not scale with the parent.

For fully responsive layout, keep offsets at 0 and let anchors do the work. Add small fixed offsets only for cosmetic margins (e.g., a 16 px gutter from an edge).

---

## 4. Theme System

A `Theme` resource centralizes fonts, colors, and `StyleBox`es. Apply at the root and let inheritance do the work; use `theme_override_*` only for one-off tweaks. `StyleBoxFlat` covers most flat-design needs (`bg_color`, `border_color`, `corner_radius`, `border_width`); `StyleBoxTexture` for textured backgrounds.

> See [references/theme-system.md](references/theme-system.md) for the full Theme resource creation walk-through, StyleBoxFlat properties, font overrides, theme inheritance rules, and per-node `theme_override_*` methods.

> **Godot 4.7+:** `GradientTexture2D`'s `Fill` enum gains `FILL_CONIC` — colors interpolated in a cone (angular) pattern; radial progress/cooldown indicators without a shader (C#: `FillEnum.Conic`).

---

## 5. Focus & Navigation

Focus modes (`FOCUS_NONE`, `FOCUS_CLICK`, `FOCUS_ALL`) gate keyboard/gamepad navigation. Use `focus_neighbor_top` / `_bottom` / `_left` / `_right` to wire navigation chains, or rely on automatic spatial detection. Call `grab_focus()` on the first interactive element when a menu opens.

> See [references/focus-and-navigation.md](references/focus-and-navigation.md) for focus mode details, `focus_neighbor` chain examples, gamepad/keyboard input handling, and grab_focus patterns.

---

## 6. Common UI Patterns

Three canonical scenes: a **main menu** (centered VBoxContainer with title + button list), a **settings screen with tabs** (`TabContainer` + child panels per category), and a **pause menu overlay** (full-rect `ColorRect` background + centered options panel, paused via `get_tree().paused = true`).

> See [references/ui-patterns.md](references/ui-patterns.md) for the full scene-tree fragments and GDScript wiring for each pattern.

> **Godot 4.7+:** `offset_transform_*` — visual-only transform for UI juice (shake/pulse) that never re-triggers container layout; `_get_cursor_shape(at_position)` virtual — per-position cursor shapes; `PopupMenu` search bar (`search_bar_enabled`, fuzzy by default) plus `set_item_index()` for reordering; `TextureRect` `STRETCH_TILE` now tiles `AtlasTexture`s (only non-zero `margin` unsupported). Code: [references/ui-patterns.md](references/ui-patterns.md#godot-47-additions).

> ⚠️ **Changed in Godot 4.7:** `RichTextLabel.add_image()` / `update_image()` sizing was reworked — `width`/`height` are now `float`; the `width_in_percent`/`height_in_percent` bools become `width_unit`/`height_unit` taking the new `ImageUnit` enum (`IMAGE_UNIT_PIXEL`, `IMAGE_UNIT_PERCENT`, `IMAGE_UNIT_EM` — em scales with font size). `ImageUpdateMask.UPDATE_WIDTH_IN_PERCENT` is renamed `UPDATE_WIDTH_UNIT`, breaking GDScript that uses the old name. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

---

## 7. Signals

`Button.pressed` for clicks, `Control.gui_input` for raw events on a node, `Control.mouse_entered` / `mouse_exited` for hover. Connect in `_ready()` or via the Inspector's Node panel.

> See [references/signals.md](references/signals.md) for the complete signal catalog and signal-driven UI update patterns.

---

## 8. FoldableContainer (Godot 4.5+)

`FoldableContainer` is a new built-in `Container` node introduced in Godot 4.5. It provides accordion-style collapsible sections with a toggle header, eliminating the boilerplate of manually wiring a `Button` to show/hide a child `VBoxContainer`.

### Basic Usage

```gdscript
# In a script that builds UI dynamically:
func _ready() -> void:
    var foldable := FoldableContainer.new()
    foldable.title = "Advanced Settings"
    foldable.folded = false  # start expanded

    var label := Label.new()
    label.text = "This content can be collapsed."
    foldable.add_child(label)

    var slider := HSlider.new()
    slider.min_value = 0.0
    slider.max_value = 1.0
    slider.value = 0.5
    foldable.add_child(slider)

    add_child(foldable)

# Listen for toggle events:
func _ready() -> void:
    var foldable := $FoldableContainer
    foldable.folding_changed.connect(_on_section_toggled)

func _on_section_toggled(is_folded: bool) -> void:
    print("Section is now: ", "folded" if is_folded else "expanded")
```

```csharp
public override void _Ready()
{
    var foldable = new FoldableContainer
    {
        Title = "Advanced Settings",
        Folded = false
    };

    var label = new Label { Text = "This content can be collapsed." };
    foldable.AddChild(label);

    var slider = new HSlider { MinValue = 0.0, MaxValue = 1.0, Value = 0.5 };
    foldable.AddChild(slider);

    AddChild(foldable);

    // Listen for toggle:
    foldable.FoldingChanged += OnSectionToggled;
}

private void OnSectionToggled(bool isFolded)
{
    GD.Print("Section is now: ", isFolded ? "folded" : "expanded");
}
```

### Key Properties

| Property | Type | Purpose |
|----------|------|---------|
| `title` | `String` | Text shown in the toggle header |
| `folded` | `bool` | `true` = content hidden, `false` = content visible |
| `title_alignment` | `HorizontalAlignment` | Align the title text within the header |

### Signal

| Signal | Signature | When emitted |
|--------|-----------|--------------|
| `folding_changed` | `(folded: bool)` | Emitted whenever the fold state toggles |

> **Replaces boilerplate:** Prior to Godot 4.5, accordion sections required a `Button` + `VBoxContainer` + signal connection. `FoldableContainer` handles all of this in one node.

---

## 9. Stacked Label Effects (Godot 4.5+)

In Godot 4.5, `Label` and `RichTextLabel` support multiple layered text effects simultaneously — for example, stacking two outline effects at different widths and colors, or combining a shadow with a glow. Previously, achieving multiple outline layers required duplicating Label nodes and layering them manually.

```gdscript
# In the inspector: Label → Theme Overrides → Constants
# Add multiple outline layers by stacking VisualShaderNodeTextureParameter entries
# in the Theme, or configure via add_theme_* overrides at runtime.

# Example: thick outer outline + thin inner outline via theme overrides
func apply_stacked_outlines(label: Label) -> void:
    # Outer outline — wide, dark
    label.add_theme_constant_override("outline_size", 6)
    label.add_theme_color_override("font_outline_color", Color(0.0, 0.0, 0.0, 0.9))

    # Shadow (counts as a second layered effect)
    label.add_theme_constant_override("shadow_offset_x", 2)
    label.add_theme_constant_override("shadow_offset_y", 2)
    label.add_theme_color_override("font_shadow_color", Color(0.0, 0.0, 0.0, 0.5))
```

```csharp
public void ApplyStackedOutlines(Label label)
{
    // Outer outline — wide, dark
    label.AddThemeConstantOverride("outline_size", 6);
    label.AddThemeColorOverride("font_outline_color", new Color(0f, 0f, 0f, 0.9f));

    // Shadow (second layered effect)
    label.AddThemeConstantOverride("shadow_offset_x", 2);
    label.AddThemeConstantOverride("shadow_offset_y", 2);
    label.AddThemeColorOverride("font_shadow_color", new Color(0f, 0f, 0f, 0.5f));
}
```

For `RichTextLabel`, stacked effects can also be applied using BBCode in combination with theme overrides:

```gdscript
# RichTextLabel with multiple outline-style effects via BBCode + theme
$RichTextLabel.text = "[outline size=4 color=#000000]Level Up![/outline]"
# Additional layers are set via theme overrides on the node as above.
```

> **Editor workflow:** Stacked effects are most easily configured via **Theme Editor → Label → Constants** or by adding multiple `FontFile`-style outline passes in the Font resource. The runtime API (`add_theme_*_override`) above works for dynamic scenarios.

---

## 10. Checklist

- [ ] Root UI `Control` has anchor preset **Full Rect** (or appropriate preset for the layout)
- [ ] All interactive widgets (`Button`, `LineEdit`, `Slider`) have `focus_mode = FOCUS_ALL`
- [ ] Decorative nodes (`Label`, `TextureRect`) have `focus_mode = FOCUS_NONE`
- [ ] Focus neighbours are wired for non-linear layouts so gamepad navigation wraps correctly
- [ ] `grab_focus()` called on the first interactive widget in `_ready()` for each screen
- [ ] Pause menu root `Control` has `process_mode = PROCESS_MODE_ALWAYS`
- [ ] One `Theme` resource assigned at the screen root — not duplicated on every child
- [ ] `StyleBoxFlat` used instead of image assets for simple solid-colour panels
- [ ] `add_theme_*_override()` used for per-node overrides rather than assigning a whole new `Theme`
- [ ] Containers (`VBoxContainer`, `HBoxContainer`, etc.) used for layout instead of manual `position` values
- [ ] `custom_minimum_size` set on widgets that must not collapse to zero
- [ ] Slider and volume code uses `linear_to_db` / `db_to_linear` — not raw linear values mapped to audio bus
- [ ] Signals connected in `_ready()` (or via the editor); no polling of UI state in `_process`
- [ ] Tab order in `TabContainer` matches logical reading / navigation order
- [ ] Accordion-style collapsible panels use `FoldableContainer` instead of manual Button + VBoxContainer wiring (Godot 4.5+)
- [ ] Multiple outline/shadow layers on `Label`/`RichTextLabel` use stacked theme overrides instead of duplicated nodes (Godot 4.5+)
