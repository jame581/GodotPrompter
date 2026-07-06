---
name: gdextension
description: Use when building native extensions for Godot — godot-cpp (C++) or gdext (Rust), binding classes, building, and GDScript/C# interop
---

# GDExtension

Run native C++ (or Rust) in Godot as a shared library **without recompiling the engine**. Use it for performance-critical code, wrapping existing C/C++ libraries, or language bindings.

> **Related skills:** **csharp-godot** for when C# is enough, **gdscript-advanced** for GDScript performance idioms first, **godot-optimization** for profiling before going native, **addon-development** for distributing the result, **export-pipeline** for shipping the binaries.

---

## 1. When to reach for GDExtension

Reach for GDScript or C# for almost all game logic. Choose GDExtension only when you genuinely need it:

- **Native speed** in a hot loop that GDScript/C# can't keep up with (profile first — see **godot-optimization**).
- **Wrapping a C/C++ library** you must call directly.
- **Building a language binding**.

Contrast with **C++ modules**, which are compiled *into* the engine and therefore require shipping a custom engine binary. GDExtension's key advantage is that it runs against a **stock** Godot — you distribute just a shared library. It is "more complicated to use than GDScript and C#," so don't reach for it by default.

> ⚠️ **Changed in Godot 4.7:** Custom text servers are no longer a GDExtension use case — TextServer GDExtension build support was removed, so a custom `TextServer` must be compiled into the engine as a C++ module. See [GH-117056](https://github.com/godotengine/godot/pull/117056).

---

## 2. Project & build setup

```bash
mkdir gdextension_example && cd gdextension_example
git init
# IMPORTANT: use the godot-cpp branch matching your target engine version (e.g. 4.3),
# not the literal "4.x".
git submodule add -b 4.3 https://github.com/godotengine/godot-cpp
cd godot-cpp && git submodule update --init && cd ..
```

Directory layout:

```
gdextension_example/
├── project/                # demo project to test the extension
│   └── bin/example.gdextension
├── godot-cpp/              # C++ bindings (submodule)
└── src/
    ├── register_types.{h,cpp}
    └── gdexample.{h,cpp}
```

Build with `scons platform=<platform>` (omit the platform to target the current one; default build is **debug**). The official `SConstruct` is a downloadable file from the C++ tutorial rather than hand-rolled here — follow godot-cpp's build docs. SCons is the official path; godot-cpp also supports CMake.

> **Godot 4.7+:** Upstream's reference GDExtension interface files (e.g. `gdextension_interface.h`) now live in the godot-headers repository instead of godot-cpp ([GH-115401](https://github.com/godotengine/godot/pull/115401)). godot-cpp consumes them from there, so the submodule workflow above is unchanged — this only matters if you vendor the raw interface headers directly (e.g. for a custom language binding).

---

## 3. Binding a class (C++)

Header (`gdexample.h`):

```cpp
#pragma once
#include <godot_cpp/classes/sprite2d.hpp>

namespace godot {
class GDExample : public Sprite2D {
    GDCLASS(GDExample, Sprite2D)
private:
    double time_passed = 0.0;
    double amplitude = 10.0;
    double speed = 1.0;
protected:
    static void _bind_methods();
public:
    void _process(double delta) override;
    void set_amplitude(double p_amplitude);
    double get_amplitude() const;
    void set_speed(double p_speed);
    double get_speed() const;
};
}
```

Bindings (`gdexample.cpp` — `_bind_methods`):

```cpp
void GDExample::_bind_methods() {
    ClassDB::bind_method(D_METHOD("get_amplitude"), &GDExample::get_amplitude);
    ClassDB::bind_method(D_METHOD("set_amplitude", "p_amplitude"), &GDExample::set_amplitude);
    ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "amplitude"), "set_amplitude", "get_amplitude");

    ClassDB::bind_method(D_METHOD("get_speed"), &GDExample::get_speed);
    ClassDB::bind_method(D_METHOD("set_speed", "p_speed"), &GDExample::set_speed);
    ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "speed", PROPERTY_HINT_RANGE, "0,20,0.01"),
                 "set_speed", "get_speed");

    ADD_SIGNAL(MethodInfo("position_changed",
               PropertyInfo(Variant::OBJECT, "node"),
               PropertyInfo(Variant::VECTOR2, "new_pos")));
}
```

The patterns:

- **`GDCLASS(Class, Parent)`** — first line of every native class body; wires up the type into Godot's `ClassDB`.
- **`ClassDB::bind_method(D_METHOD("name", "arg"), &Class::method)`** — exposes a method (and names its arguments) so GDScript/C#/the editor can call it.
- **`ADD_PROPERTY(PropertyInfo(...), setter, getter)`** — registers an Inspector property; bind the getter and setter *first*, then reference them here by name.
- **`PROPERTY_HINT_RANGE`** with `"0,20,0.01"` turns the Inspector field into a slider (min, max, step).
- **`ADD_SIGNAL(MethodInfo("name", PropertyInfo(...), ...))`** — declares a signal with typed arguments; emit it from code with `emit_signal("position_changed", this, new_pos)`.

> ⚠️ **Changed in Godot 4.7:** The GDExtension interface functions `object_cast_to` and `classdb_get_class_tag` are deprecated in favor of `is_class`-based casts. Binding libraries (godot-cpp, gdext) handle this internally — but native code that calls these interface functions directly should migrate its cast paths. See [GH-119254](https://github.com/godotengine/godot/pull/119254).

---

## 4. Entry point & the .gdextension file

Entry point (`register_types.cpp`):

```cpp
void initialize_example_module(ModuleInitializationLevel p_level) {
    if (p_level != MODULE_INITIALIZATION_LEVEL_SCENE) return;
    GDREGISTER_CLASS(GDExample);
}
void uninitialize_example_module(ModuleInitializationLevel p_level) {
    if (p_level != MODULE_INITIALIZATION_LEVEL_SCENE) return;
}
extern "C" {
GDExtensionBool GDE_EXPORT example_library_init(
    GDExtensionInterfaceGetProcAddress p_get_proc_address,
    const GDExtensionClassLibraryPtr p_library,
    GDExtensionInitialization *r_initialization) {
    godot::GDExtensionBinding::InitObject init_obj(p_get_proc_address, p_library, r_initialization);
    init_obj.register_initializer(initialize_example_module);
    init_obj.register_terminator(uninitialize_example_module);
    init_obj.set_minimum_library_initialization_level(MODULE_INITIALIZATION_LEVEL_SCENE);
    return init_obj.init();
}
}
```

The `.gdextension` file (`project/bin/example.gdextension`):

```ini
[configuration]
entry_symbol = "example_library_init"
compatibility_minimum = "4.3"
reloadable = true

[libraries]
macos.debug = "res://bin/libgdexample.macos.template_debug.dylib"
macos.release = "res://bin/libgdexample.macos.template_release.dylib"
windows.debug.x86_64 = "res://bin/gdexample.windows.template_debug.x86_64.dll"
windows.release.x86_64 = "res://bin/gdexample.windows.template_release.x86_64.dll"
linux.debug.x86_64 = "res://bin/libgdexample.linux.template_debug.x86_64.so"
linux.release.x86_64 = "res://bin/libgdexample.linux.template_release.x86_64.so"
```

The exported `extern "C"` symbol name **must equal** `entry_symbol`, or the extension won't load. Register classes with `GDREGISTER_CLASS`, gated on `MODULE_INITIALIZATION_LEVEL_SCENE`. The `[libraries]` keys are `platform.feature.arch` tags; `template_debug` / `template_release` distinguish build configs. Optional sections: `[icons]` (per-node editor icon) and `[dependencies]` (extra libs copied on export).

> **Godot 4.7+:** The raw GDExtension interface adds refcount-aware construction and registration entry points — `classdb_construct_object3` and `classdb_register_extension_class6` ([GH-118214](https://github.com/godotengine/godot/pull/118214)). Binding libraries built against 4.7 headers use them automatically; they only concern code that calls the interface directly.

---

## 5. Compatibility rules

**Forward-but-not-backward.** An extension targeting 4.2 works in 4.3, but one targeting 4.3 will **not** load in 4.2. **Exception:** extensions targeting 4.0 do not work in 4.1+.

- The **godot-cpp branch must match** the engine version you build against.
- `reloadable = true` hot reload works in **debug builds only**.
- Set `compatibility_minimum` to the lowest engine version you actually support — too low and the extension fails to load at runtime.
- Exported games need the matching `template_release` binaries present, or the native node type simply won't exist at runtime.

> ⚠️ **Changed in Godot 4.7:** `Object.is_class()` changed its `class` parameter type from `String` to `StringName` for performance. GDScript is unaffected and C# gained a compatibility method, but GDExtension binaries compiled against the old signature rely on the engine's compatibility mapping — rebuild against bindings matching your target version when updating to 4.7. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

---

## 6. Using it from GDScript and C#

After building and placing the `.gdextension` file, the native class appears as a normal node type: bound properties show up in the Inspector (range hints become sliders) and signals appear in the Node dock.

### GDScript

```gdscript
extends Node

func _ready():
    var node := GDExample.new()
    node.speed = 2.0
    node.position_changed.connect(_on_position_changed)
    add_child(node)

func _on_position_changed(node, new_pos):
    print("%s is now at %s" % [node.get_class(), new_pos])
```

### C# Equivalent

```csharp
using Godot;

public partial class Demo : Node
{
    public override void _Ready()
    {
        var node = new GDExample(); // The native class is available like any Godot type.
        node.Set("speed", 2.0);
        node.Connect("position_changed", Callable.From<Node, Vector2>(OnPositionChanged));
        AddChild(node);
    }

    private void OnPositionChanged(Node node, Vector2 newPos)
        => GD.Print($"{node.GetClass()} is now at {newPos}");
}
```

To get a strongly-typed C# wrapper you can ship a C# glue class, but the extension is fully usable via the dynamic `Set` / `Connect` / `Call` API shown above.

> **Other languages & debugging:** [Rust (gdext)](references/rust-gdext.md) · [Debugging native code](references/debugging-native.md)

---

## Implementation Checklist

- [ ] Confirmed native is actually needed (profiled; GDScript/C# insufficient — see **godot-optimization**)
- [ ] godot-cpp submodule on the branch matching the target engine version
- [ ] `_bind_methods` binds every exposed method/property/signal
- [ ] `entry_symbol` in `.gdextension` matches the exported `extern "C"` symbol
- [ ] `compatibility_minimum` set to the lowest engine version you support
- [ ] `[libraries]` has correct paths for every shipped platform/arch (debug + release)
- [ ] Release export includes the `template_release` binaries
