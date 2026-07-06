---
name: responsive-ui
description: Use when handling multiple resolutions — stretch modes, aspect ratios, DPI scaling, and mobile/desktop adaptation
---

# Responsive UI in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **godot-ui** for Control node layout and themes, **export-pipeline** for platform-specific export settings, **godot-project-setup** for initial project resolution settings, **input-handling** for touch vs desktop input adaptation, **localization** for layout adjustments per locale, **mobile-development** for safe-area and notch handling.

---

## 1. Project Settings for Resolution

Configure base resolution and stretch behaviour in `Project > Project Settings > Display > Window`.

Key settings and their `.godot/project.godot` keys:

| Setting | project.godot key | Recommended value |
|---|---|---|
| Viewport width | `window/size/viewport_width` | `1920` (or your base design width) |
| Viewport height | `window/size/viewport_height` | `1080` (or your base design height) |
| Stretch mode | `window/stretch/mode` | `canvas_items` (most games) |
| Stretch aspect | `window/stretch/aspect` | `expand` (fill screen) or `keep` (letterbox) |
| Scale factor | `window/stretch/scale` | `1` (adjust for pixel art integer scaling) |

> **Godot 4.7+:** Projects **newly created** in Godot 4.7 already default `display/window/stretch/mode` to `canvas_items` and `display/window/stretch/aspect` to `expand` (previously `disabled` / `keep`) — the recommendations above are now the out-of-the-box values. Projects created on older versions are unchanged (the property default is still `disabled`), so set both explicitly when upgrading. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

These can also be set at runtime:

**GDScript:**

```gdscript
# Read current viewport size
var viewport_size: Vector2 = get_viewport().get_visible_rect().size

# Change stretch mode at runtime
ProjectSettings.set_setting("display/window/stretch/mode", "canvas_items")
```

**C#:**

```csharp
// Read current viewport size
Vector2I viewportSize = GetViewport().GetVisibleRect().Size;

// Change a project setting at runtime (takes effect next frame)
ProjectSettings.SetSetting("display/window/stretch/mode", "canvas_items");
```

---

## 2. Stretch Mode Comparison

| Mode | `project.godot` value | Rendering | Best For |
|---|---|---|---|
| `canvas_items` | `"canvas_items"` | Viewport rendered at design resolution, then upscaled — UI and 2D nodes scale smoothly | Most 2D and UI-heavy games |
| `viewport` | `"viewport"` | Entire viewport is rendered at design resolution and stretched; no sub-pixel blending | Pixel art games needing pixel-perfect output |
| `disabled` | `"disabled"` | No automatic scaling; every Control node must handle its own layout | Complex custom scaling, 3D games with a Control HUD |

**When to choose each:**

- **`canvas_items`** — Default recommendation. Smooth scaling at any resolution. UI built with `Control` nodes and anchors responds naturally. Text and icons stay crisp at high DPI when combined with `content_scale_factor`.
- **`viewport`** — Locks rendering to the design resolution. Combined with integer scaling and nearest-neighbour filtering it gives a classic pixel-perfect look. Avoid for high-DPI displays unless you intentionally want chunky pixels.
- **`disabled`** — Use when you need full manual control, e.g. a 3D game where the UI must adapt to safe areas or unusual aspect ratios without Godot scaling it.

---

## 3. Aspect Ratio Handling

Set via `Project > Project Settings > Display > Window > Stretch > Aspect` or the `window/stretch/aspect` key.

| Mode | Visual Result | When to Use |
|---|---|---|
| `keep` | Letterbox (black bars top/bottom) or pillarbox (bars left/right) — design rect is preserved exactly | Games with a fixed layout that must not be cropped (e.g. score-based arcade, puzzle) |
| `expand` | Screen is fully filled; the visible game area grows on wider or taller displays | Action games, platformers — more visible play area is a bonus, not a problem |
| `keep_width` | Width is fixed; height expands on taller screens (mobile portrait) | Portrait mobile games where horizontal alignment is strict |
| `keep_height` | Height is fixed; width expands on wider screens (landscape) | Landscape games where vertical alignment is strict (e.g. side-scroller HUD) |

**`expand` with adaptive UI** is the most versatile choice for games targeting both desktop and mobile. Anchor your HUD elements to screen edges so they follow the expanded visible area.

---

## 4. Pixel Art Setup

For crisp pixel-art games: `Project Settings → Display → Window → Stretch → Mode = viewport`, base resolution at native pixel size (e.g., 320×180), `Window Size Override = 4×` for editor preview. Use integer scaling to avoid sub-pixel blur.

> See [references/pixel-art-setup.md](references/pixel-art-setup.md) for full project settings, integer-scaling script, nearest-neighbour filter overrides.

---

## 5. DPI Scaling

For retina / high-DPI displays: set `content_scale_factor` to scale the entire UI proportionally. Query `DisplayServer.screen_get_dpi()` at runtime for adaptive scaling per device.

> See [references/dpi-scaling.md](references/dpi-scaling.md) for the `content_scale_factor` recipe and DPI-querying patterns.

---

## 6. Mobile Considerations

Four mobile-specific concerns: **touch input** (tap, swipe, multi-touch), **safe-area insets** (notch / dynamic island avoidance), **orientation lock** (portrait/landscape pinning), **virtual keyboard** (handle show/hide to avoid covering UI).

> See [references/mobile.md](references/mobile.md) for full GDScript on each concern, plus iOS / Android nuances.

---

## 7. Adaptive Layouts

Anchor presets + Container nodes do most of the work. Use `size_flags_horizontal`/`vertical` (`FILL`, `EXPAND`, `SHRINK_CENTER`, `SHRINK_END`) to control how children consume container space. Detect runtime resolution changes via `get_viewport().size_changed`.

> See [references/adaptive-layouts.md](references/adaptive-layouts.md) for the anchor + container strategy, resolution-change detection, and the full `size_flags` reference.

---

## 8. Testing Multiple Resolutions

### Editor Preview Sizes

In the editor viewport, use **Editor > Editor Settings > Run > Window Placement** to start the game at specific sizes, or use the viewport size selector in the 2D editor toolbar.

Add common test sizes under **Project > Project Settings > Display > Window > Size > Test Width/Height** to preview in the editor.

### `--resolution` CLI Flag

Launch from the command line with an override resolution:

```bash
# Windows
godot.exe --path "C:/projects/mygame" --resolution 1280x720

# Linux / macOS
godot --path /projects/mygame --resolution 1280x720

# Run an exported binary at a specific size
./mygame.x86_64 --resolution 375x812
```

### Common Test Resolutions

| Resolution | Aspect | Common Use |
|---|---|---|
| `1920×1080` | 16:9 | Standard 1080p desktop / TV |
| `2560×1440` | 16:9 | 1440p high-DPI desktop |
| `1280×720` | 16:9 | Low-end desktop / minimum target |
| `640×360` | 16:9 | Pixel art base resolution (2× of 320×180) |
| `2732×2048` | 4:3 | iPad Pro — tests non-16:9 aspect ratios |
| `390×844` | ~19.5:9 | iPhone 14 portrait |
| `844×390` | ~19.5:9 | iPhone 14 landscape |
| `1080×2400` | 20:9 | Android tall portrait |
| `360×800` | ~20:9 | Android low-end portrait |

> **Strategy:** Always test at your base design resolution, one resolution wider than 16:9 (e.g. 21:9 ultrawide), and one taller (e.g. mobile portrait). These three cases catch the most layout bugs.

---

## 9. Checklist

- [ ] Base viewport size (`viewport_width` / `viewport_height`) matches the design canvas in the editor
- [ ] Stretch mode chosen deliberately: `canvas_items` for most games, `viewport` for pixel art
- [ ] Aspect ratio mode chosen: `expand` unless fixed-layout content requires `keep`
- [ ] Pixel art games use `viewport` stretch + `Nearest` texture filter + integer `content_scale_factor`
- [ ] All HUD `Control` nodes use anchors anchored to the nearest edge, not fixed `position` values
- [ ] `custom_minimum_size` set on buttons and interactive elements to prevent collapse below tap target size (minimum 44×44 px recommended for mobile)
- [ ] `size_flags_horizontal` / `size_flags_vertical` set to `SIZE_EXPAND_FILL` on elements that should fill space
- [ ] `get_viewport().size_changed` signal connected where layout must respond to window resize
- [ ] Safe area insets read from `DisplayServer.get_display_safe_area()` and applied to a root `MarginContainer`
- [ ] `content_scale_factor` set at startup based on `DisplayServer.screen_get_dpi()` for high-DPI / Retina displays
- [ ] Touch input handled via `InputEventScreenTouch` / `InputEventScreenDrag`, not mouse events alone
- [ ] Orientation locked to the correct mode (`SCREEN_LANDSCAPE` / `SCREEN_PORTRAIT`) or `SCREEN_SENSOR` where rotation is intended
- [ ] Virtual keyboard height queried after show and used to shift UI content upward on mobile
- [ ] Tested at minimum: design resolution, one ultra-wide (21:9), and one mobile portrait resolution
- [ ] `--resolution` flag used in CI or playtest scripts to automate multi-resolution smoke tests
