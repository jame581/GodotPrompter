# `@tool` Script Recipes

Reference for `skills/gdscript-advanced/SKILL.md` — production-grade `@tool` script patterns.

> ← Back to [SKILL.md](../SKILL.md)

---

## 1. Editor preview for a procedural node

A `@tool` script that previews a procedural mesh in the editor without running the game.

```gdscript
@tool
class_name CircleVisualizer extends MeshInstance3D

@export var radius: float = 1.0:
    set(value):
        radius = value
        if Engine.is_editor_hint():
            _rebuild_mesh()

@export var segments: int = 32:
    set(value):
        segments = max(3, value)
        if Engine.is_editor_hint():
            _rebuild_mesh()

func _ready() -> void:
    if Engine.is_editor_hint():
        _rebuild_mesh()

func _rebuild_mesh() -> void:
    var arrays: Array = []
    arrays.resize(Mesh.ARRAY_MAX)
    var verts: PackedVector3Array = PackedVector3Array()
    # Godot 4 has no line-loop primitive: emit segments + 1 vertices so the strip closes.
    for i in segments + 1:
        var angle := i * TAU / segments
        verts.append(Vector3(cos(angle) * radius, 0, sin(angle) * radius))
    arrays[Mesh.ARRAY_VERTEX] = verts
    var array_mesh := ArrayMesh.new()
    array_mesh.add_surface_from_arrays(Mesh.PRIMITIVE_LINE_STRIP, arrays)
    mesh = array_mesh
```

## 2. Baking a value at editor save time

```gdscript
@tool
extends Node

@export var bake_button: bool = false:
    set(value):
        if value and Engine.is_editor_hint():
            _bake_now()

func _notification(what: int) -> void:
    if what == NOTIFICATION_EDITOR_PRE_SAVE:
        _bake_now()

func _bake_now() -> void:
    # ... compute and write a baked Resource
    pass
```

## 3. Editor-only debug visualization

```gdscript
@tool
extends Node3D

func _process(_delta: float) -> void:
    if not Engine.is_editor_hint():
        return
    # Draw debug primitives that only show in the editor
    DebugDraw.draw_sphere(global_position, 1.0, Color.RED)  # addon (e.g. Debug Draw 3D) — Godot has no built-in debug-draw API
```

## 4. Common `@tool` bugs

- **Editor freeze on script reload** — usually an expensive rebuild in a setter: it runs for every property as the scene loads and on every Inspector drag. Assigning the property inside its own setter does not recurse, but two setters that set each other do. Guard with an `if value == current: return` check.
- **Errors on add to scene** — touching `get_tree()` or `get_viewport()` before the node is in the tree (exported setters run first); they return `null` with an error. Use `if is_inside_tree():` guards.
- **Settings lost on reload** — using `@onready` for tool state. `@onready` values are set only when `_ready()` runs, and after a tool script is reloaded in the editor `_ready()` may not run again — fetch nodes on demand, or use `_ready` with `is_editor_hint()` checks.
