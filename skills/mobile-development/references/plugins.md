# Mobile Plugins (Android v2 / iOS) & JavaClassWrapper

Deep dive on extending a Godot mobile game with native platform code. Back to [Mobile Development](../SKILL.md).

## Android v2 plugins (Godot 4.2+)

The v1 plugin system was deprecated in Godot 4.2. A **v2 plugin** is an Android library (AAR) that depends on `org.godotengine:godot:<version>` (from MavenCentral), with an init class extending `GodotPlugin`. **Requires the custom Gradle build and Godot 4.2+.**

Expose methods to GDScript/C# with the `@UsedByGodot` annotation (the name must match **exactly** — Godot does no case coercion). Access the plugin as a singleton:

```gdscript
if Engine.has_singleton("MyPlugin"):
    var s = Engine.get_singleton("MyPlugin")
    print(s.myPluginFunction("World"))
```

> Not device-tested: this C# was written from the documented API and has not been run on an Android build.

```csharp
if (Engine.HasSingleton("MyPlugin"))
{
    GodotObject plugin = Engine.GetSingleton("MyPlugin");
    // C# has no dynamic member dispatch, so plugin methods go through Call().
    // The name must match the @UsedByGodot method exactly.
    GD.Print(plugin.Call("myPluginFunction", "World"));
}
```

Packaging uses the standard `EditorExportPlugin` format — a `@tool extends EditorPlugin` script plus `plugin.cfg` — implementing `_get_android_libraries`, `_get_android_dependencies`, and manifest-contents hooks:

```gdscript
@tool
extends EditorPlugin

var _export_plugin: EditorExportPlugin

func _enter_tree() -> void:
    _export_plugin = MyAndroidExportPlugin.new()
    add_export_plugin(_export_plugin)

func _exit_tree() -> void:
    remove_export_plugin(_export_plugin)
    _export_plugin = null
```

```gdscript
@tool
class MyAndroidExportPlugin extends EditorExportPlugin:
    func _supports_platform(platform) -> bool:
        return platform is EditorExportPlatformAndroid

    func _get_android_libraries(platform, debug: bool) -> PackedStringArray:
        return PackedStringArray(["MyPlugin/MyPlugin.aar"])

    func _get_android_dependencies(platform, debug: bool) -> PackedStringArray:
        return PackedStringArray([]) # MavenCentral coordinates, if any.

    func _get_name() -> String:
        return "MyPlugin"
```

> Not device-tested: this C# was written from the documented API and has not been run on an Android build.

```csharp
#if TOOLS
using Godot;

// MyAndroidPlugin.cs — Godot C# needs the file name to match the class.
[Tool]
public partial class MyAndroidPlugin : EditorPlugin
{
    private MyAndroidExportPlugin _exportPlugin;

    public override void _EnterTree()
    {
        _exportPlugin = new MyAndroidExportPlugin();
        AddExportPlugin(_exportPlugin);
    }

    public override void _ExitTree()
    {
        RemoveExportPlugin(_exportPlugin);
        _exportPlugin = null;
    }
}

// MyAndroidExportPlugin.cs
[Tool]
public partial class MyAndroidExportPlugin : EditorExportPlugin
{
    public override bool _SupportsPlatform(EditorExportPlatform platform)
        => platform is EditorExportPlatformAndroid;

    public override string[] _GetAndroidLibraries(EditorExportPlatform platform, bool debug)
        => new[] { "MyPlugin/MyPlugin.aar" };

    public override string[] _GetAndroidDependencies(EditorExportPlatform platform, bool debug)
        => System.Array.Empty<string>(); // MavenCentral coordinates, if any.

    public override string _GetName() => "MyPlugin";
}
#endif
```

**GDExtension Android plugin:** a `plugin.gdextension` file with `android_aar_plugin = true` ships native code as an Android plugin.

Starter templates: `m4gr3d/Godot-Android-Plugin-Template`, `m4gr3d/GDExtension-Android-Plugin-Template`.

## JavaClassWrapper & AndroidRuntime (Godot 4.4+)

**Godot 4.4+** — the biggest version gate in mobile development (`AndroidRuntime` is new in 4.4; `JavaClassWrapper.wrap()` existed earlier but is only practical from 4.4). These let you call Android APIs with **no plugin** at all.

`JavaClassWrapper.wrap("<java.class>")` returns a wrapper you call directly:

```gdscript
var LocalDateTime = JavaClassWrapper.wrap("java.time.LocalDateTime")
var datetime = LocalDateTime.now()
```

> Not device-tested: this C# was written from the documented API and has not been run on an Android build.

```csharp
// Java members are resolved at runtime, so every Java call is a string-named Call().
JavaClass localDateTime = JavaClassWrapper.Wrap("java.time.LocalDateTime");
Variant datetime = localDateTime.Call("now");

GodotObject androidRuntime = Engine.GetSingleton("AndroidRuntime");
Variant activity = androidRuntime.Call("getActivity");
```

`AndroidRuntime` singleton (`Engine.get_singleton("AndroidRuntime")`) exposes:

- `getActivity()` — the current `Activity`.
- `getApplicationContext()` — the app `Context`.
- `createRunnableFromGodotCallable(callable)` — wrap a Godot `Callable` as a Java `Runnable`.

Documented recipes:

- **Toast** — wrap `android.widget.Toast`, post via a runnable on the UI thread.
- **Vibrate** — `android.os.VibrationEffect.createOneShot(...)` (see the SKILL.md Section 4 example).
- **Inner classes** — use `$` in the class path: `JavaClassWrapper.wrap("android.os.Build$VERSION")`.
- **Constructors** — call a method with the same name as the class.
- **Intents** — build `android.content.Intent` and `startActivity` via the activity.

Gradle exports auto-include any `.jar`/`.aar` dropped in the project `addons` dir, making those classes usable through `JavaClassWrapper`.

## iOS plugins

(The iOS plugin docs are flagged as outdated.) An iOS plugin is a `.a`/`.xcframework` binary plus a `.gdip` INI descriptor placed in `res://ios/plugins/`; access it via `Engine.get_singleton("MyPlugin")`.

The `.gdip` file sections:

- `[config]` — `name`, `binary`, `initialization`, `deinitialization`.
- `[dependencies]` — `linked`, `embedded`, `system`, `capabilities`, `files`, `linker_flags`.
- `[plist]` — entries injected into the app's `Info.plist`.

Templates: `godotengine/godot-ios-plugins`, `naithar/godot_ios_plugin`.
