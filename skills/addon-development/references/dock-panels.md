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

    # DOCK_SLOT_LEFT_UL = upper slot of the far-left column (empty by default;
    # Scene/Import sit in DOCK_SLOT_LEFT_UR). See the slot table below.
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

### Godot 4.6+: `EditorDock` and `add_dock`

`add_control_to_dock` is deprecated in Godot 4.6 (the class reference marks it "Use `add_dock` instead"). The replacement, `EditorPlugin.add_dock(dock: EditorDock)`, does not exist in 4.3 to 4.5, so the example above stays the right code for those versions. `EditorDock` is a container (marked experimental in 4.6 and 4.7) with `title`, `dock_icon`, `default_slot`, `available_layouts` and `closable`; remove it with `remove_dock(dock)`.

To support 4.3 and 4.6+ from one plugin, branch on the engine version. The GDScript below is untyped on purpose: it must still parse on 4.3, where `EditorDock` and `add_dock` are unknown identifiers.

```gdscript
# plugin.gd
@tool
extends EditorPlugin

var _dock: Control
var _use_editor_dock := false


func _enter_tree() -> void:
    var content: Control = preload("res://addons/my_plugin/my_dock.tscn").instantiate()
    _use_editor_dock = Engine.get_version_info().hex >= 0x040600
    if _use_editor_dock:
        var dock = ClassDB.instantiate("EditorDock")
        dock.title = "My Dock"
        dock.default_slot = DOCK_SLOT_LEFT_UL  # EditorPlugin's constant, same value (0) as EditorDock.DOCK_SLOT_LEFT_UL;
        # a literal `EditorDock.` reference would not parse on 4.3
        dock.add_child(content)
        call("add_dock", dock)
        _dock = dock
    else:
        _dock = content
        add_control_to_dock(DOCK_SLOT_LEFT_UL, _dock)


func _exit_tree() -> void:
    if _dock:
        if _use_editor_dock:
            call("remove_dock", _dock)
        else:
            remove_control_from_docks(_dock)
        _dock.queue_free()
        _dock = null
```

In C# the bindings you compile against decide: a project on `Godot.NET.Sdk` 4.6 or newer has `EditorDock`, an older one does not. On 4.3 to 4.5 bindings keep the `AddControlToDock` example above; ship the typed 4.6+ variant below only when the plugin's minimum is 4.6. To support both from one assembly, use the untyped cross-version variant after it.

```csharp
#if TOOLS
using Godot;

[Tool]
public partial class MyPlugin : EditorPlugin
{
    private EditorDock _dock;

    public override void _EnterTree()
    {
        _dock = new EditorDock
        {
            Title = "My Dock",
            DefaultSlot = EditorDock.DockSlot.LeftUl,
        };
        _dock.AddChild(GD.Load<PackedScene>("res://addons/my_plugin/MyDock.tscn").Instantiate<Control>());
        AddDock(_dock);
    }

    public override void _ExitTree()
    {
        if (_dock != null)
        {
            RemoveDock(_dock);
            _dock.QueueFree();
            _dock = null;
        }
    }
}
#endif
```

Cross-version C# (compiles against any bindings; `EditorDock` and `add_dock` are reached by name at runtime):

```csharp
#if TOOLS
using Godot;

[Tool]
public partial class MyPlugin : EditorPlugin
{
    private Control _dock;
    private bool _useEditorDock;

    public override void _EnterTree()
    {
        var content = GD.Load<PackedScene>("res://addons/my_plugin/MyDock.tscn").Instantiate<Control>();
        var v = Engine.GetVersionInfo();
        _useEditorDock = (int)v["hex"] >= 0x040600;
        if (_useEditorDock)
        {
            _dock = (Control)ClassDB.Instantiate("EditorDock").AsGodotObject();
            _dock.Set("title", "My Dock");
            _dock.Set("default_slot", 0); // EditorDock.DOCK_SLOT_LEFT_UL
            _dock.AddChild(content);
            Call("add_dock", _dock);
        }
        else
        {
            _dock = content;
            AddControlToDock(DockSlot.LeftUl, _dock);
        }
    }

    public override void _ExitTree()
    {
        if (_dock != null)
        {
            if (_useEditorDock) Call("remove_dock", _dock);
            else RemoveControlFromDocks(_dock);
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
| `DOCK_SLOT_LEFT_UL` / `DOCK_SLOT_LEFT_BL` | Far-left column, upper / lower (empty by default) |
| `DOCK_SLOT_LEFT_UR` / `DOCK_SLOT_LEFT_BR` | Second-left column, upper (Scene / Import) / lower (FileSystem) |
| `DOCK_SLOT_RIGHT_UL` / `DOCK_SLOT_RIGHT_BL` | First right column, upper (Inspector / Node) / lower |
| `DOCK_SLOT_RIGHT_UR` / `DOCK_SLOT_RIGHT_BR` | Far-right column, upper / lower (empty by default) |

---

