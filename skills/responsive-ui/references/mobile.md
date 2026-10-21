# Mobile Considerations

Reference for `skills/responsive-ui/SKILL.md` — touch input, safe-area insets (notch / dynamic island), orientation lock, virtual keyboard handling.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Mobile Considerations

### Touch Input

**GDScript:**

```gdscript
extends Node

func _input(event: InputEvent) -> void:
    if event is InputEventScreenTouch:
        if event.pressed:
            _on_touch_begin(event.position, event.index)
        else:
            _on_touch_end(event.position, event.index)
    elif event is InputEventScreenDrag:
        _on_touch_drag(event.position, event.relative, event.index)


func _on_touch_begin(pos: Vector2, finger: int) -> void:
    pass  # handle tap / press

func _on_touch_end(pos: Vector2, finger: int) -> void:
    pass

func _on_touch_drag(pos: Vector2, delta: Vector2, finger: int) -> void:
    pass  # handle swipe / scroll
```

**C#:**

```csharp
using Godot;

public partial class TouchHandler : Node
{
    public override void _Input(InputEvent @event)
    {
        if (@event is InputEventScreenTouch touch)
        {
            if (touch.Pressed) OnTouchBegin(touch.Position, touch.Index);
            else               OnTouchEnd(touch.Position, touch.Index);
        }
        else if (@event is InputEventScreenDrag drag)
        {
            OnTouchDrag(drag.Position, drag.Relative, drag.Index);
        }
    }

    private void OnTouchBegin(Vector2 pos, int finger) { }
    private void OnTouchEnd(Vector2 pos, int finger) { }
    private void OnTouchDrag(Vector2 pos, Vector2 delta, int finger) { }
}
```

### Safe Area Insets

Phones with notches, camera cut-outs, or rounded corners report a safe area rectangle. Place interactive UI elements inside it.

**GDScript:**

```gdscript
func _ready() -> void:
    var safe_area: Rect2i = DisplayServer.get_display_safe_area()
    var screen_size: Vector2i = DisplayServer.screen_get_size()

    # Calculate insets (pixels from each edge)
    var inset_left   := safe_area.position.x
    var inset_top    := safe_area.position.y
    var inset_right  := screen_size.x - (safe_area.position.x + safe_area.size.x)
    var inset_bottom := screen_size.y - (safe_area.position.y + safe_area.size.y)

    # Apply to a MarginContainer wrapping all HUD content
    $SafeAreaMargin.add_theme_constant_override("margin_left",   inset_left)
    $SafeAreaMargin.add_theme_constant_override("margin_top",    inset_top)
    $SafeAreaMargin.add_theme_constant_override("margin_right",  inset_right)
    $SafeAreaMargin.add_theme_constant_override("margin_bottom", inset_bottom)
```

**C#:**

```csharp
public override void _Ready()
{
    Rect2I safeArea  = DisplayServer.GetDisplaySafeArea();
    Vector2I screen  = DisplayServer.ScreenGetSize();

    int insetLeft   = safeArea.Position.X;
    int insetTop    = safeArea.Position.Y;
    int insetRight  = screen.X - (safeArea.Position.X + safeArea.Size.X);
    int insetBottom = screen.Y - (safeArea.Position.Y + safeArea.Size.Y);

    var margin = GetNode<MarginContainer>("SafeAreaMargin");
    margin.AddThemeConstantOverride("margin_left",   insetLeft);
    margin.AddThemeConstantOverride("margin_top",    insetTop);
    margin.AddThemeConstantOverride("margin_right",  insetRight);
    margin.AddThemeConstantOverride("margin_bottom", insetBottom);
}
```

### Orientation Lock

In `Project > Project Settings > Display > Window`:

- `Handheld > Orientation` → `landscape`, `portrait`, `reverse_landscape`, `sensor`, etc.

Or at runtime:

**GDScript:**

```gdscript
# Lock to landscape
DisplayServer.screen_set_orientation(DisplayServer.SCREEN_LANDSCAPE)

# Lock to portrait
DisplayServer.screen_set_orientation(DisplayServer.SCREEN_PORTRAIT)

# Follow device sensor
DisplayServer.screen_set_orientation(DisplayServer.SCREEN_SENSOR)
```

**C#:**

```csharp
DisplayServer.ScreenSetOrientation(DisplayServer.ScreenOrientation.Landscape);
DisplayServer.ScreenSetOrientation(DisplayServer.ScreenOrientation.Portrait);
DisplayServer.ScreenSetOrientation(DisplayServer.ScreenOrientation.Sensor);
```

### Virtual Keyboard

**GDScript:**

```gdscript
# Show keyboard (call after focusing a LineEdit, or manually)
DisplayServer.virtual_keyboard_show("initial text")

# Hide keyboard
DisplayServer.virtual_keyboard_hide()

# Query keyboard height to shift UI above it
var kb_height: int = DisplayServer.virtual_keyboard_get_height()
```

**C#:**

```csharp
DisplayServer.VirtualKeyboardShow("initial text");
DisplayServer.VirtualKeyboardHide();
int kbHeight = DisplayServer.VirtualKeyboardGetHeight();
```

> **Note:** `LineEdit` and `TextEdit` show/hide the virtual keyboard automatically when they gain and lose focus. Call the API manually only when building custom text input widgets.

---

