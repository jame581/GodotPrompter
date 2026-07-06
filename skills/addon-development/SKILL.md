---
name: addon-development
description: Use when creating Godot editor plugins — EditorPlugin, @tool scripts, custom inspectors, and dock panels
---

# Addon Development in Godot 4.3+

Editor plugins extend the Godot editor itself: custom node types, inspector panels, dock widgets, 3D gizmos, and toolbar buttons. All examples target Godot 4.3+ with no deprecated APIs.

> **Related skills:** **resource-pattern** for custom Resource editors, **godot-ui** for editor panel UI, **csharp-godot** for C# plugin development.

---

## 1. Plugin Structure

Every plugin lives inside `addons/` at the project root. Godot discovers plugins by scanning for `plugin.cfg` files.

```
res://
└── addons/
    └── my_plugin/
        ├── plugin.cfg          # required — plugin metadata
        ├── plugin.gd           # main EditorPlugin script (named in plugin.cfg)
        ├── my_inspector.gd     # optional — EditorInspectorPlugin
        ├── my_dock.tscn        # optional — dock panel scene
        └── icons/
            └── my_node.svg     # optional — custom node icons
```

`plugin.cfg` is a plain INI file. Godot reads it when scanning `addons/`. The `script` key must point to the main plugin script relative to the plugin folder.

Enable the plugin: **Project → Project Settings → Plugins** → tick the checkbox next to your plugin name.

---

## 2. @tool Annotation

`@tool` makes a GDScript (or its C# equivalent) run inside the editor process as well as at runtime. Without it, the script only runs when the game is playing.

### GDScript

```gdscript
@tool
extends Sprite2D

# Engine.is_editor_hint() is true when running inside the editor,
# false during a running game. Use it to guard editor-only logic.
func _process(delta: float) -> void:
    if Engine.is_editor_hint():
        # This block runs in the editor viewport — safe to call editor APIs.
        update_configuration_warnings()
    else:
        # Normal game logic here.
        pass


# _get_configuration_warnings() returns an array of strings shown as
# yellow warning icons on the node in the Scene panel.
func _get_configuration_warnings() -> PackedStringArray:
    var warnings := PackedStringArray()
    if texture == null:
        warnings.append("Texture is not set. Assign a Texture2D in the Inspector.")
    return warnings
```

### C#

```csharp
#if TOOLS
using Godot;

[Tool]
public partial class MyToolSprite : Sprite2D
{
    public override void _Process(double delta)
    {
        if (Engine.IsEditorHint())
        {
            // Editor-only logic — safe to call editor APIs here.
            UpdateConfigurationWarnings();
        }
        else
        {
            // Normal game logic.
        }
    }

    public override string[] _GetConfigurationWarnings()
    {
        if (Texture == null)
            return new[] { "Texture is not set. Assign a Texture2D in the Inspector." };
        return System.Array.Empty<string>();
    }
}
#endif
```

> Wrap C# tool scripts in `#if TOOLS` / `#endif` to prevent the class from being included in exported builds. GDScript `@tool` scripts are excluded from exports automatically.

**Key rules:**
- Add `@tool` / `[Tool]` at the top of every script that needs editor access.
- Always guard runtime-only code with `Engine.is_editor_hint()` to avoid crashing the editor when processing begins before the scene is fully loaded.
- Call `update_configuration_warnings()` whenever a property changes that might affect the warning state.

---

## 3. EditorPlugin Base

The main plugin script extends `EditorPlugin`. Godot calls `_enter_tree()` when the plugin is enabled and `_exit_tree()` when it is disabled or the project is closed. **Everything added in `_enter_tree()` must be removed in `_exit_tree()`.**

### GDScript

```gdscript
# plugin.gd
@tool
extends EditorPlugin


func _enter_tree() -> void:
    # Register a custom node type. The editor shows MyNode in the
    # "Add Node" dialog under the chosen base class, with a custom icon.
    add_custom_type(
        "MyNode",                              # name shown in editor
        "Node2D",                              # base class to extend
        preload("res://addons/my_plugin/my_node.gd"),
        preload("res://addons/my_plugin/icons/my_node.svg")
    )

    # Add a menu item to the Project menu (top toolbar).
    add_tool_menu_item("My Plugin Action", _on_tool_menu_item)


func _exit_tree() -> void:
    remove_custom_type("MyNode")
    remove_tool_menu_item("My Plugin Action")


func _on_tool_menu_item() -> void:
    print("My Plugin Action triggered")
```

### C#

```csharp
// Plugin.cs
#if TOOLS
using Godot;

[Tool]
public partial class MyPlugin : EditorPlugin
{
    public override void _EnterTree()
    {
        AddCustomType(
            "MyNode",
            "Node2D",
            GD.Load<Script>("res://addons/my_plugin/MyNode.cs"),
            GD.Load<Texture2D>("res://addons/my_plugin/icons/my_node.svg")
        );

        AddToolMenuItem("My Plugin Action", new Callable(this, MethodName.OnToolMenuAction));
    }

    public override void _ExitTree()
    {
        RemoveCustomType("MyNode");
        RemoveToolMenuItem("My Plugin Action");
    }

    private void OnToolMenuAction()
    {
        GD.Print("My Plugin Action triggered");
    }
}
#endif
```

**add_custom_type parameters:**

| Parameter | Description |
|---|---|
| `name` | The name shown in the Add Node dialog |
| `base` | String name of the Godot base class |
| `script` | The GDScript / C# script resource |
| `icon` | A `Texture2D`, typically a 16×16 SVG |

**add_tool_menu_item** adds an entry under **Project** in the top menu bar. Pass a `Callable` that takes no arguments.

### Unsaved-State & Script Editor Control (Godot 4.7+)

Godot 4.7 adds file-management APIs useful for build/export tooling — check for unsaved work before running an action, or refresh scripts changed by an external tool.

```gdscript
func _run_pre_build_check() -> void:
    var unsaved_scenes := EditorInterface.get_unsaved_scenes()  # PackedStringArray of scene paths
    var script_editor := EditorInterface.get_script_editor()
    var unsaved_files := script_editor.get_unsaved_files()      # PackedStringArray of script paths
    if not unsaved_scenes.is_empty() or not unsaved_files.is_empty():
        push_warning("Unsaved work detected — save before building.")

    script_editor.save_all_scripts()   # saves every open script
    script_editor.reload_open_files()  # re-read files changed outside the editor
    # Closes the tab, discarding unsaved changes; OK or ERR_FILE_NOT_FOUND.
    var err := script_editor.close_file("res://addons/my_plugin/generated.gd")
```

```csharp
#if TOOLS
private void RunPreBuildCheck()
{
    string[] unsavedScenes = EditorInterface.Singleton.GetUnsavedScenes();
    var scriptEditor = EditorInterface.Singleton.GetScriptEditor();
    string[] unsavedFiles = scriptEditor.GetUnsavedFiles();
    if (unsavedScenes.Length > 0 || unsavedFiles.Length > 0)
        GD.PushWarning("Unsaved work detected — save before building.");

    scriptEditor.SaveAllScripts();
    scriptEditor.ReloadOpenFiles();
    Error err = scriptEditor.CloseFile("res://addons/my_plugin/Generated.cs");
}
#endif
```

---

## 4. Custom Inspector Plugin

When you want a custom widget for an exported property of a specific type, register an `EditorInspectorPlugin` from your main `EditorPlugin`. The inspector plugin overrides `_can_handle` to opt in and `_parse_property` (or `_parse_begin`) to inject custom widgets. Pair with an `EditorProperty` subclass for the actual UI.

> See [references/inspector-plugins.md](references/inspector-plugins.md) for the full GDScript and C# scaffold (custom inspector + EditorProperty + registration boilerplate).

> **Godot 4.7+:** the static `EditorInspector.create_default_inspector(filter_line_edit: LineEdit = null)` returns an inspector with the same configuration as the editor's Inspector dock, ready to embed in plugin UIs — pass a `LineEdit` for live property filtering (see [references/inspector-plugins.md](references/inspector-plugins.md)). `EditorContextMenuPlugin` also gains `CONTEXT_SLOT_INSPECTOR_PROPERTY` in `ContextMenuSlot`, so context-menu plugins can extend the inspector property right-click menu: `_popup_menu()` receives `[object ID, property name]` and the option callback receives the `EditorProperty` directly.

---

## 5. Custom Dock Panel

Add a custom dock to the editor by calling `add_control_to_dock(slot, control)` from your `EditorPlugin._enter_tree`. Free the control on `_exit_tree`. Useful for project-wide tooling UIs (level browser, asset summary, build dashboard).

> See [references/dock-panels.md](references/dock-panels.md) for the full GDScript and C# dock scaffold.

---

## 6. Custom Resource Editors

`EditorResourcePicker` lets you constrain a property to a specific Resource subclass with a tooltip and base-type filter. `EditorResourcePreviewGenerator` provides custom thumbnails for resources in the FileSystem dock and Inspector.

> See [references/inspector-plugins.md](references/inspector-plugins.md) for the full GDScript and C# `EditorResourcePicker` and `EditorResourcePreviewGenerator` scaffolds.

---

## 7. Gizmos

`EditorNode3DGizmoPlugin` adds visual handles for 3D nodes in the editor — wireframe shapes, draggable handles, rotation rings. Implement `_init` (materials), `_get_gizmo_name`, `_has_gizmo`, `_redraw` (draw lines/handles), and `_get_handle_value` / `_set_handle` / `_commit_handle` for interactive editing.

> See [references/gizmos-deep-dive.md](references/gizmos-deep-dive.md) for the full GDScript and C# gizmo plugin (with undo/redo wiring for handle commits).

> **Godot 4.7+:** override `_can_commit_handle_on_click() -> bool` (returns `false` if not overridden) to commit a handle action even when the final handle position is the same as the initial one — i.e. on a plain click.

---

## 8. Testing Plugins

### Reloading a plugin in the editor

The fastest way to reload plugin code without restarting Godot:

1. **Project → Project Settings → Plugins** → untick the plugin → tick it again.
2. Alternatively, run this from **Editor → Execute Script** or the editor console:

```gdscript
var plugin_name := "my_plugin"
ProjectSettings.set_setting("editor_plugins/enabled", [])
ProjectSettings.save()
# Re-enable via the Plugins dialog.
```

For quicker iteration, save the plugin script — Godot hot-reloads `@tool` scripts automatically. Complex changes (new class registrations, dock changes) require a full disable/enable cycle.

### Debugging with print

`print()` and `push_error()` / `push_warning()` output to the Godot **Output** panel and the OS console when Godot is launched from a terminal.

```gdscript
func _enter_tree() -> void:
    print("[my_plugin] _enter_tree called")   # Output panel
    push_warning("[my_plugin] something unexpected")
    push_error("[my_plugin] something failed")  # also shown as red in Output
```

```csharp
// C# equivalent — same Output panel, same OS console.
#if TOOLS
public override void _EnterTree()
{
    GD.Print("[my_plugin] _EnterTree called");      // Output panel
    GD.PushWarning("[my_plugin] something unexpected");
    GD.PushError("[my_plugin] something failed");   // also shown as red in Output
}
#endif
```

> **C# plugin reload caveat:** Unlike GDScript, C# plugins require recompilation. After editing C# plugin source, the editor must rebuild the assembly before re-enabling. If the plugin fails to load with `Could not find type "Plugin"`, the C# project failed to compile — check the **MSBuild Panel** at the bottom of the editor for compilation errors. Programmatic plugin reload from a `[Tool]` script:

```csharp
#if TOOLS
[Tool]
public partial class PluginReloader : EditorScript
{
    public override void _Run()
    {
        var pluginName = "my_plugin";
        // Disable then re-enable to force a clean reload cycle.
        EditorInterface.Singleton.SetPluginEnabled(pluginName, false);
        EditorInterface.Singleton.SetPluginEnabled(pluginName, true);
        GD.Print($"Plugin {pluginName} reloaded.");
    }
}
#endif
```

To launch with the OS console visible on Windows:

```
godot.exe --editor --path /path/to/project
```

### Plugin lifecycle gotchas

| Situation | What happens | Fix |
|---|---|---|
| Plugin enabled but `_enter_tree` crashes | Plugin remains enabled but broken; editor may be unstable | Disable, fix, re-enable |
| Forgot to remove a dock in `_exit_tree` | Dock orphan survives disable; duplicate docks appear on next enable | Always null-check and `queue_free()` in `_exit_tree` |
| Custom type still listed after removal | Stale entry in the project's `plugin_types` cache | Restart the editor once after `remove_custom_type` |
| `@tool` script crashes on property set | Editor shows the error but the script stops updating | Guard with `if Engine.is_editor_hint()` and validate inputs |
| C# plugin not compiling | Entire plugin silently fails to load | Check the **Mono → Build Project** output and fix C# errors first |
| `add_inspector_plugin` called twice | Inspector plugin fires twice per property | Track and guard with a null-check before `add_inspector_plugin` |

---

## 9. plugin.cfg Format

`plugin.cfg` is a plain INI file placed at the root of the plugin folder. All fields in the `[plugin]` section are required except `dependencies` and `installs`.

```ini
[plugin]

name="My Plugin"
description="Adds MyNode, a custom inspector, and a dock panel to the editor."
author="Your Name"
version="1.0.0"
script="plugin.gd"
```

**Field reference:**

| Key | Type | Description |
|---|---|---|
| `name` | String | Display name shown in Project Settings → Plugins |
| `description` | String | Short summary shown in the Plugins panel |
| `author` | String | Author name or organisation |
| `version` | String | Semantic version string (e.g. `"1.2.0"`) |
| `script` | String | Path to the main `EditorPlugin` script, **relative to the plugin folder** |

**Complete example with all optional fields:**

```ini
[plugin]

name="My Plugin"
description="Adds MyNode, a custom inspector, and a dock panel to the editor."
author="Your Name"
version="1.0.0"
script="plugin.gd"
```

> There are no other standard keys in Godot 4.x `plugin.cfg`. Dependency management is handled externally (e.g., by the Asset Library or manual installation instructions).

---

## 10. Checklist

- [ ] `addons/<plugin_name>/plugin.cfg` exists with `name`, `description`, `author`, `version`, `script`
- [ ] Main script extends `EditorPlugin` and is decorated with `@tool` (GDScript) or `[Tool]` inside `#if TOOLS` (C#)
- [ ] Everything registered in `_enter_tree()` is unregistered in `_exit_tree()`
- [ ] Custom node types use `add_custom_type` / `remove_custom_type` with a matching icon SVG
- [ ] `@tool` scripts guard editor-only code with `Engine.is_editor_hint()`
- [ ] `_get_configuration_warnings()` returns non-empty array when node is misconfigured
- [ ] Inspector plugins implement `_can_handle` to avoid handling unintended types
- [ ] `_parse_property` returns `true` only for properties that need a custom editor
- [ ] Dock scenes have a `Custom Minimum Size` set so the panel is usable at default dock widths
- [ ] Dock `Control` is freed with `queue_free()` in `_exit_tree()`
- [ ] `EditorResourcePreviewGenerator` is both added and removed via `EditorInterface.get_resource_previewer()`
- [ ] Gizmo plugin implements `_commit_handle` with `get_undo_redo()` so handle drags are undoable
- [ ] Plugin tested by full disable/enable cycle after each structural change
- [ ] `push_error()` used instead of silent failures in all `_enter_tree` setup paths
- [ ] C# plugin scripts wrapped in `#if TOOLS` / `#endif`
