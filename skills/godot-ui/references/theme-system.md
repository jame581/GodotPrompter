# Theme System

Reference for `skills/godot-ui/SKILL.md` — Theme resources, StyleBoxFlat, font overrides, theme inheritance, per-node `theme_override_*` methods.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Theme System

### Creating a Theme Resource

Create a `Theme` resource once (`resources/themes/main_theme.tres`) and assign it to the root `Control` of each screen. All descendant nodes inherit it automatically.

### StyleBoxFlat

`StyleBoxFlat` draws a solid-colour, rounded rectangle with optional borders and shadows — no textures needed.

**GDScript:**

```gdscript
# Create and configure a StyleBoxFlat in code
var stylebox := StyleBoxFlat.new()
stylebox.bg_color = Color(0.1, 0.1, 0.15, 0.95)
stylebox.corner_radius_top_left     = 8
stylebox.corner_radius_top_right    = 8
stylebox.corner_radius_bottom_left  = 8
stylebox.corner_radius_bottom_right = 8
stylebox.border_width_left   = 2
stylebox.border_width_top    = 2
stylebox.border_width_right  = 2
stylebox.border_width_bottom = 2
stylebox.border_color = Color(0.4, 0.6, 1.0, 1.0)

# Apply to a PanelContainer's "panel" draw type
$DialogPanel.add_theme_stylebox_override("panel", stylebox)
```

**C#:**

```csharp
var stylebox = new StyleBoxFlat
{
    BgColor = new Color(0.1f, 0.1f, 0.15f, 0.95f),
    CornerRadiusTopLeft     = 8,
    CornerRadiusTopRight    = 8,
    CornerRadiusBottomLeft  = 8,
    CornerRadiusBottomRight = 8,
    BorderWidthLeft   = 2,
    BorderWidthTop    = 2,
    BorderWidthRight  = 2,
    BorderWidthBottom = 2,
    BorderColor = new Color(0.4f, 0.6f, 1.0f, 1.0f),
};

GetNode<PanelContainer>("DialogPanel").AddThemeStyleboxOverride("panel", stylebox);
```

### Font Overrides

**GDScript:**

```gdscript
# Load a font and apply it to a single Label
var font := preload("res://assets/fonts/Roboto-Regular.ttf") as FontFile
$TitleLabel.add_theme_font_override("font", font)
$TitleLabel.add_theme_font_size_override("font_size", 32)
```

**C#:**

```csharp
var font = GD.Load<FontFile>("res://assets/fonts/Roboto-Regular.ttf");
var label = GetNode<Label>("TitleLabel");
label.AddThemeFontOverride("font", font);
label.AddThemeFontSizeOverride("font_size", 32);
```

### Theme Inheritance

Godot resolves theme properties by walking up the scene tree:

1. Node's own `theme_override_*` properties (highest priority).
2. The nearest ancestor `Control` that has a `theme` resource assigned.
3. The project default theme (`Project > Project Settings > GUI > Theme > Custom`).
4. Godot's built-in fallback theme (lowest priority).

Assign one `Theme` resource at the root `CanvasLayer` or root `Control` of each screen. Avoid assigning themes deep in the tree unless you intentionally want to override a sub-section.

### theme_override_ Methods for Per-Node Styling

| Method | What it overrides | Example key |
|---|---|---|
| `add_theme_stylebox_override(name, stylebox)` | Background / border style | `"panel"`, `"normal"`, `"hover"`, `"pressed"` |
| `add_theme_font_override(name, font)` | Font resource | `"font"` |
| `add_theme_font_size_override(name, size)` | Font size (px) | `"font_size"` |
| `add_theme_color_override(name, color)` | Text / icon colour | `"font_color"`, `"icon_normal_color"` |
| `add_theme_constant_override(name, value)` | Integer constant | `"separation"`, `"margin_left"` |
| `add_theme_icon_override(name, texture)` | Icon texture | `"checked"`, `"unchecked"` |

Remove an override to fall back to the inherited theme:

```gdscript
$Button.remove_theme_stylebox_override("normal")
```

```csharp
GetNode<Button>("Button").RemoveThemeStyleboxOverride("normal");
```

---

