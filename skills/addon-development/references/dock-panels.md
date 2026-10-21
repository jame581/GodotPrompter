# Custom Dock Panels

Reference for `skills/addon-development/SKILL.md` — adding a custom dock to the editor (GDScript and C#).

> ← Back to [SKILL.md](../SKILL.md)

---

## 5. Custom Dock Panel

Docks are `Control`-based scenes added to one of the editor's dock slots. Add the control in `_enter_tree()` and remove it in `_exit_tree()`.

### GDScript

```gdscript
# plugin.gd
@tool
extends EditorPlugin

var _dock: Control


func _enter_tree() -> void:
    # Load a scene or instantiate a Control directly.
    _dock = preload("res://addons/my_plugin/my_dock.tscn").instantiate()

    # DOCK_SLOT_LEFT_UL = upper-left dock area (same as Scene/Import panel).
    # Other slots: DOCK_SLOT_LEFT_BL, DOCK_SLOT_RIGHT_UL, DOCK_SLOT_RIGHT_BL
    add_control_to_dock(DOCK_SLOT_LEFT_UL, _dock)


func _exit_tree() -> void:
    if _dock:
        remove_control_from_docks(_dock)
        _dock.queue_free()
        _dock = null
```

### C#

```csharp
#if TOOLS
using Godot;

[Tool]
public partial class MyPlugin : EditorPlugin
{
    private Control _dock;

    public override void _EnterTree()
    {
        _dock = GD.Load<PackedScene>("res://addons/my_plugin/MyDock.tscn").Instantiate<Control>();
        AddControlToDock(DockSlot.LeftUl, _dock);
    }

    public override void _ExitTree()
    {
        if (_dock != null)
        {
            RemoveControlFromDocks(_dock);
            _dock.QueueFree();
            _dock = null;
        }
    }
}
#endif
```

**Creating the dock scene:**

1. Create a new scene with a `Control` (or `VBoxContainer`, `PanelContainer`, etc.) as root.
2. Set the scene root's `Custom Minimum Size` so the dock has a sensible default size.
3. Add any UI controls (buttons, labels, trees) as children.
4. Save as `my_dock.tscn` inside your plugin folder.

**Available dock slots:**

| Constant | Location |
|---|---|
| `DOCK_SLOT_LEFT_UL` | Left column, upper (Scene / Import) |
| `DOCK_SLOT_LEFT_BL` | Left column, lower (FileSystem) |
| `DOCK_SLOT_RIGHT_UL` | Right column, upper (Inspector / Node) |
| `DOCK_SLOT_RIGHT_BL` | Right column, lower |

---

