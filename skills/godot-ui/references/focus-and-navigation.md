# Focus & Navigation

Reference for `skills/godot-ui/SKILL.md` — focus modes, `focus_neighbor` chains, gamepad/keyboard navigation, `grab_focus()` patterns.

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. Focus & Navigation

### Focus Modes

Set `focus_mode` on any `Control` node:

| Value | Constant | Behaviour |
|---|---|---|
| `0` | `Control.FOCUS_NONE` | Node cannot receive focus (e.g., decorative labels) |
| `1` | `Control.FOCUS_CLICK` | Receives focus only when clicked with the mouse |
| `2` | `Control.FOCUS_ALL` | Receives focus from mouse click, Tab, and gamepad/keyboard |

Interactive widgets (`Button`, `LineEdit`, `Slider`) default to `FOCUS_ALL`. Set `FOCUS_NONE` on `Label` and `TextureRect` nodes so they are skipped during keyboard navigation.

### focus_neighbor Properties

By default Godot infers neighbours geometrically. Override manually for non-linear layouts (e.g., a circular menu or a layout where nodes are not physically adjacent):

**GDScript:**

```gdscript
# Wire focus neighbours explicitly using NodePaths
$StartButton.focus_neighbor_bottom = $OptionsButton.get_path()
$OptionsButton.focus_neighbor_top  = $StartButton.get_path()
$OptionsButton.focus_neighbor_bottom = $QuitButton.get_path()
$QuitButton.focus_neighbor_top     = $OptionsButton.get_path()
# Wrap around: bottom of last → top of first
$QuitButton.focus_neighbor_bottom  = $StartButton.get_path()
$StartButton.focus_neighbor_top    = $QuitButton.get_path()
```

**C#:**

```csharp
var start   = GetNode<Button>("StartButton");
var options = GetNode<Button>("OptionsButton");
var quit    = GetNode<Button>("QuitButton");

start.FocusNeighborBottom   = options.GetPath();
options.FocusNeighborTop    = start.GetPath();
options.FocusNeighborBottom = quit.GetPath();
quit.FocusNeighborTop       = options.GetPath();
quit.FocusNeighborBottom    = start.GetPath();
start.FocusNeighborTop      = quit.GetPath();
```

### UI Navigation with Gamepad/Keyboard

Godot maps controller D-pad and left stick to the built-in `ui_left`, `ui_right`, `ui_up`, `ui_down` actions automatically. Ensure your interactive nodes have `FOCUS_ALL` and neighbours wired so gamepad navigation feels intentional.

- `ui_accept` (Enter / A button) — activates the focused widget.
- `ui_cancel` (Escape / B button) — typically used to go back; handle in `_unhandled_input`.
- Tab / Shift-Tab cycles through `FOCUS_ALL` nodes in tree order.

### grab_focus()

Call `grab_focus()` on the first interactive widget when a screen becomes visible so keyboard/gamepad users do not need to click before navigating.

**GDScript:**

```gdscript
func _ready() -> void:
    # Give focus to the first button when the menu appears
    $StartButton.grab_focus()
```

**C#:**

```csharp
public override void _Ready()
{
    GetNode<Button>("StartButton").GrabFocus();
}
```

---

