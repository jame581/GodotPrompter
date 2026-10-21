> ← Back to [SKILL.md](../SKILL.md)

# Testing and Debugging Plugins

## Reloading a plugin in the editor

The fastest way to reload plugin code without restarting Godot:

1. **Project → Project Settings → Plugins** → untick the plugin → tick it again.
2. Alternatively, run this from **Editor → Execute Script** or the editor console:

```gdscript
# EditorScript — run with File → Run in the script editor.
@tool
extends EditorScript

func _run() -> void:
    var plugin_name := "my_plugin"
    # Disable then re-enable to force a clean reload cycle.
    EditorInterface.set_plugin_enabled(plugin_name, false)
    EditorInterface.set_plugin_enabled(plugin_name, true)
    print("Plugin %s reloaded." % plugin_name)
```

> Do **not** reload by writing `editor_plugins/enabled` through `ProjectSettings` — that key holds
> *every* enabled plugin, so overwriting it disables all of them and re-enables none.

For quicker iteration, save the plugin script — Godot hot-reloads `@tool` scripts automatically. Complex changes (new class registrations, dock changes) require a full disable/enable cycle.

**C#** has a dedicated editor API for the same disable/enable cycle, so you do not have to go through `ProjectSettings`:

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

> **C# plugin reload caveat:** unlike GDScript, C# plugins require recompilation. After editing C# plugin source the editor must rebuild the assembly before re-enabling. If the plugin fails to load with `Could not find type "Plugin"`, the C# project failed to compile — check the **MSBuild Panel** at the bottom of the editor for compilation errors.

## Debugging with print

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

To launch with the OS console visible on Windows:

```
godot.exe --editor --path /path/to/project
```

## Plugin lifecycle gotchas

| Situation | What happens | Fix |
|---|---|---|
| Plugin enabled but `_enter_tree` crashes | Plugin remains enabled but broken; editor may be unstable | Disable, fix, re-enable |
| Forgot to remove a dock in `_exit_tree` | Dock orphan survives disable; duplicate docks appear on next enable | Always null-check and `queue_free()` in `_exit_tree` |
| Custom type still listed after removal | Stale entry in the project's `plugin_types` cache | Restart the editor once after `remove_custom_type` |
| `@tool` script crashes on property set | Editor shows the error but the script stops updating | Guard with `if Engine.is_editor_hint()` and validate inputs |
| C# plugin not compiling | Entire plugin silently fails to load | Check the **Mono → Build Project** output and fix C# errors first |
| `add_inspector_plugin` called twice | Inspector plugin fires twice per property | Track and guard with a null-check before `add_inspector_plugin` |
