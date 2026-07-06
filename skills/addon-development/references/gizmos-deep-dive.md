# Gizmos Deep Dive

Reference for `skills/addon-development/SKILL.md` — `EditorNode3DGizmoPlugin` subclass with `_init`, `_get_gizmo_name`, `_has_gizmo`, `_redraw`, `_get_handle_value`, `_set_handle`, `_commit_handle`. GDScript first; **C# parity added in v1.7.0 Task 19**.

> ← Back to [SKILL.md](../SKILL.md)

---

## 7. Gizmos

`EditorNode3DGizmoPlugin` adds interactive handles and visual overlays to 3D nodes in the viewport. Register the plugin from your `EditorPlugin`.

### GDScript

```gdscript
# my_gizmo_plugin.gd
@tool
extends EditorNode3DGizmoPlugin

const HANDLE_RADIUS := 0.15


func _init() -> void:
    # Create a named material for the gizmo lines/handles.
    create_material("main", Color(0.5, 1.0, 0.0))
    create_handle_material("handles")


# Displayed in the View menu under "Show Gizmos".
func _get_gizmo_name() -> String:
    return "MyNode3DGizmo"


# Return true if this plugin should draw a gizmo for the given node.
func _has_gizmo(node: Node3D) -> bool:
    return node is MyNode3D


# Called whenever the node changes or the viewport is redrawn.
# Re-add all lines and handles here — do not cache between calls.
func _redraw(gizmo: EditorNode3DGizmo) -> void:
    gizmo.clear()

    var node := gizmo.get_node_3d() as MyNode3D
    if node == null:
        return

    # Draw a line from the node origin to a target point.
    var lines := PackedVector3Array([Vector3.ZERO, node.target_offset])
    gizmo.add_lines(lines, get_material("main", gizmo), false)

    # Add a draggable handle at the target offset position.
    var handles := PackedVector3Array([node.target_offset])
    gizmo.add_handles(handles, get_material("handles", gizmo), [])


# Return the current value of a handle as a Transform3D or Vector3
# so the editor can restore it on undo.
func _get_handle_value(gizmo: EditorNode3DGizmo, handle_id: int, secondary: bool) -> Variant:
    return (gizmo.get_node_3d() as MyNode3D).target_offset


# Called while dragging a handle. camera is the current viewport camera.
# point is the screen-space cursor position.
func _set_handle(
    gizmo: EditorNode3DGizmo,
    handle_id: int,
    secondary: bool,
    camera: Camera3D,
    point: Vector2
) -> void:
    var node := gizmo.get_node_3d() as MyNode3D
    # Project the screen point onto the XZ plane at the node's Y position.
    var from := camera.project_ray_origin(point)
    var dir  := camera.project_ray_normal(point)
    var dist := (node.global_position.y - from.y) / dir.y
    node.target_offset = from + dir * dist - node.global_position
    # Redraw after every drag update.
    _redraw(gizmo)


# Restore the handle to the value saved by _get_handle_value (for undo/redo).
func _commit_handle(
    gizmo: EditorNode3DGizmo,
    handle_id: int,
    secondary: bool,
    restore: Variant,
    cancel: bool
) -> void:
    var node := gizmo.get_node_3d() as MyNode3D
    if cancel:
        node.target_offset = restore
    else:
        # Register with undo/redo so Ctrl+Z works.
        get_undo_redo().create_action("Move MyNode3D Handle")
        get_undo_redo().add_do_property(node, "target_offset", node.target_offset)
        get_undo_redo().add_undo_property(node, "target_offset", restore)
        get_undo_redo().commit_action()
```

Register from `EditorPlugin`:

```gdscript
# plugin.gd
var _gizmo_plugin: EditorNode3DGizmoPlugin

func _enter_tree() -> void:
    _gizmo_plugin = preload("res://addons/my_plugin/my_gizmo_plugin.gd").new()
    add_node_3d_gizmo_plugin(_gizmo_plugin)

func _exit_tree() -> void:
    remove_node_3d_gizmo_plugin(_gizmo_plugin)
```

### C#

```csharp
// res://addons/my_plugin/SpawnerGizmoPlugin.cs
#if TOOLS
using Godot;

[Tool]
public partial class SpawnerGizmoPlugin : EditorNode3DGizmoPlugin
{
    public SpawnerGizmoPlugin()
    {
        CreateMaterial("main", new Color(1, 0.5f, 0));
        CreateHandleMaterial("handles");
    }

    public override string _GetGizmoName() => "Spawner3D";
    public override bool _HasGizmo(Node3D forNode3D) => forNode3D is Spawner3D;

    public override void _Redraw(EditorNode3DGizmo gizmo)
    {
        gizmo.Clear();
        var spawner = (Spawner3D)gizmo.GetNode3D();

        // Wireframe sphere for the spawn radius.
        var lines = new Vector3[2 * 32];
        float r = spawner.SpawnRadius;
        for (int i = 0; i < 32; i++)
        {
            float a0 = i * Mathf.Tau / 32f;
            float a1 = (i + 1) * Mathf.Tau / 32f;
            lines[i * 2 + 0] = new Vector3(Mathf.Cos(a0) * r, 0, Mathf.Sin(a0) * r);
            lines[i * 2 + 1] = new Vector3(Mathf.Cos(a1) * r, 0, Mathf.Sin(a1) * r);
        }
        gizmo.AddLines(lines, GetMaterial("main", gizmo));

        // Single drag handle for the radius.
        gizmo.AddHandles(
            new[] { new Vector3(spawner.SpawnRadius, 0, 0) },
            GetMaterial("handles", gizmo),
            new[] { 0 });
    }

    public override Variant _GetHandleValue(EditorNode3DGizmo gizmo, int handleId, bool secondary)
    {
        return ((Spawner3D)gizmo.GetNode3D()).SpawnRadius;
    }

    public override void _SetHandle(EditorNode3DGizmo gizmo, int handleId, bool secondary, Camera3D camera, Vector2 screenPos)
    {
        var spawner = (Spawner3D)gizmo.GetNode3D();
        var ray = camera.ProjectRayNormal(screenPos);
        var origin = camera.ProjectRayOrigin(screenPos);
        var plane = new Plane(spawner.GlobalTransform.Basis.Y, spawner.GlobalPosition);
        var hit = plane.IntersectsRay(origin, ray);
        if (hit.HasValue)
        {
            spawner.SpawnRadius = (hit.Value - spawner.GlobalPosition).Length();
            gizmo.GetNode3D().UpdateGizmos();
        }
    }

    public override void _CommitHandle(EditorNode3DGizmo gizmo, int handleId, bool secondary, Variant restore, bool cancel)
    {
        var spawner = (Spawner3D)gizmo.GetNode3D();
        if (cancel) { spawner.SpawnRadius = (float)restore; return; }

        // Wire to UndoRedo so the change is undoable.
        // Get the editor's undo/redo manager via EditorInterface (Godot 4.x pattern).
        var undoRedo = EditorInterface.Singleton.GetEditorUndoRedoManager();
        undoRedo.CreateAction("Set Spawner Radius");
        undoRedo.AddDoProperty(spawner, "spawn_radius", spawner.SpawnRadius);
        undoRedo.AddUndoProperty(spawner, "spawn_radius", restore);
        undoRedo.CommitAction();
    }
}
#endif

// Register in your main EditorPlugin (Plugin.cs):
//
// #if TOOLS
// public override void _EnterTree()
// {
//     _gizmoPlugin = new SpawnerGizmoPlugin();
//     AddNode3DGizmoPlugin(_gizmoPlugin);
// }
// public override void _ExitTree()
// {
//     RemoveNode3DGizmoPlugin(_gizmoPlugin);
// }
// #endif
```

### Committing on a Plain Click (Godot 4.7+)

By default, `_commit_handle` only fires when the handle actually moved. Override `_can_commit_handle_on_click()` to define whether the gizmo should commit when the final handle position is the same as the initial one — i.e. a plain click on the handle. Returns `false` if not overridden. Useful for click-to-toggle handles.

```gdscript
func _can_commit_handle_on_click() -> bool:
    return true  # commit even when the handle did not move
```

```csharp
// Add inside the SpawnerGizmoPlugin class above.
#if TOOLS
public override bool _CanCommitHandleOnClick()
{
    return true; // commit even when the handle did not move
}
#endif
```

---

