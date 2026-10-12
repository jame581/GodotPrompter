---
name: gdscript-advanced
description: Use when writing production-grade GDScript — performance idioms, metaprogramming, @tool lifecycle, async pitfalls, signal/Callable trade-offs, profiler-driven idioms, and common pitfalls
---

# GDScript Advanced

Production-grade GDScript depth — for shipping games, not for learning the language. Pair with **gdscript-patterns** for fundamentals.

> **Related skills:** **gdscript-patterns** for language fundamentals, **godot-optimization** for engine-side perf work, **godot-debugging** for runtime diagnosis, **csharp-godot** for the C# alternative.

> **Intent:** This skill is GDScript-only by design (allowlisted). C# users should read `csharp-godot`. Adding C# parity here would undermine the audience split.

## 1. When to reach for advanced GDScript

You're past `gdscript-patterns` when:

- You're hitting a profiler bottleneck and need to know which idioms are fast
- You're writing editor tools and need `@tool` lifecycle correctness
- You're seeing coroutines that never resume or `Callable` lifetime bugs
- You need metaprogramming (calling functions by name, dynamic dispatch) without footguns
- You're shipping a real game and want to avoid the patterns that look fine but break under load

This skill assumes you already know typed parameters, `@onready`, `await`, `match`, and lambdas (covered in `gdscript-patterns`).

## 2. Performance idioms

**Static vars and methods** (static vars since Godot 4.1) avoid per-instance overhead:

```gdscript
class_name Tally extends Node

static var _global_score: int = 0

static func add_score(amount: int) -> void:
    _global_score += amount

static func get_score() -> int:
    return _global_score
```

Avoid singletons-as-autoloads when a static method on a class would do.

**Vector2i vs Vector2 / Vector3i vs Vector3** — integer vectors are 30-40% faster on hot paths (tile coords, grid math). Convert to float only at the rendering boundary:

```gdscript
var grid_pos: Vector2i = Vector2i(8, 12)              # cheap
var world_pos: Vector2 = Vector2(grid_pos) * TILE_SIZE  # convert at boundary
```

**PackedArray\* over generic Array** — `PackedInt32Array`, `PackedFloat32Array`, `PackedVector2Array`, etc. allocate contiguous memory and skip Variant boxing. Use them for buffers, vertex arrays, hot-loop accumulators.

```gdscript
var positions: PackedVector3Array = PackedVector3Array()
positions.resize(1000)  # one allocation
for i in 1000:
    positions[i] = Vector3(i, 0, 0)
```

**Typed Dictionary access** — typed dicts (Godot 4.4+) validate key and value types on write and give the analyzer static types for reads (values are still stored as Variant):

```gdscript
var stats: Dictionary[String, int] = {}
stats["hp"] = 100  # type-checked; stats["hp"] is statically an int
```

**`is_instance_valid` vs `null` check** — `is_instance_valid()` does an engine-side lookup; `!= null` is a pointer compare. Prefer `!= null` after `@onready` assignment; reserve `is_instance_valid()` for nodes that may be `queue_free`'d while a reference is held.

> Common pitfall: `_process` doing `if is_instance_valid(target)` once per frame burns ~1µs per call — tiny per-call but multiplies fast.

## 3. Metaprogramming

`Callable.bind`, `Callable.call`, `Callable.call_deferred` give you dynamic dispatch without `Object.call(name)` security risks.

**Binding arguments:**

```gdscript
var greeter: Callable = print_named.bind("Player")
greeter.call()                    # prints "Hello, Player"

func print_named(name: String) -> void:
    print("Hello, %s" % name)
```

**Deferred calls** — run on the next frame's idle phase, useful for cross-thread or signal-storm safety:

```gdscript
heavy_recompute.call_deferred()
```

**`Object.set` / `Object.get` / `Object.has_method`** — for truly dynamic code (script reloading, modding):

```gdscript
if obj.has_method("on_damaged"):
    obj.call("on_damaged", 25)
```

> **Security gotcha:** Never pass `obj.call(user_string, ...)` where `user_string` comes from save files, network, or mod content without an allowlist. `call("queue_free")` is a free crash. Match against a known set:

```gdscript
const ALLOWED_RPCS: PackedStringArray = ["take_damage", "apply_buff", "set_position"]
if user_method in ALLOWED_RPCS and obj.has_method(user_method):
    obj.call(user_method, args)
```

> See [references/metaprogramming-recipes.md](references/metaprogramming-recipes.md) for full Callable patterns and the modding security model.

## 4. `@tool` lifecycle

`@tool` scripts run in the editor as well as in-game. Two failure modes dominate:
1. Editor-only logic accidentally runs at play time
2. In-game logic accidentally runs in the editor and crashes the editor

**The guard:**

```gdscript
@tool
extends Node

func _ready() -> void:
    if Engine.is_editor_hint():
        _setup_editor_preview()
    else:
        _setup_game_runtime()
```

**Editor notifications** — use `_notification` for editor lifecycle events (`NOTIFICATION_EDITOR_PRE_SAVE`, `NOTIFICATION_EDITOR_POST_SAVE`, `NOTIFICATION_PARENTED`):

```gdscript
func _notification(what: int) -> void:
    if what == NOTIFICATION_EDITOR_PRE_SAVE:
        _bake_preview()
```

> Common pitfall: a `@tool` script that calls `get_tree().create_timer()` at editor time. Editor has no main loop in some contexts — guard with `is_editor_hint()`.

> See [references/tool-script-recipes.md](references/tool-script-recipes.md) for full `@tool` patterns including editor preview, baking, and procedural mesh generation.

## 5. Async pitfalls

`await` suspends the function and hands control back to its caller until the signal fires. It has three trap shapes:

**Trap 1 — `await` in `_ready`** returns early, so the node reports ready before it is initialized:

```gdscript
# BAD: the first await returns control, so `ready` is emitted and the parent's
# _ready() runs while `inventory` is still empty
func _ready() -> void:
    await get_tree().create_timer(1.0).timeout
    inventory = load_inventory()
```

Fix: finish everything other nodes read at ready time before the first `await`. If part of setup genuinely has to wait, set an `is_initialized` flag and emit an `initialized` signal when it completes. Dependents check the flag before awaiting, because awaiting a signal that already fired never resumes (Trap 2).

**Trap 2 — Awaiting a signal that never fires** suspends the coroutine forever:

```gdscript
# BAD if `health_changed` never fires (e.g., entity already at full HP)
await health.health_changed
```

Fix: check the precondition before awaiting. When you do need to wait, race the signal against a timeout. Released Godot has no `Signal.any()` and no other built-in way to await several signals at once (godot-proposals#13597 proposes global `any()`/`all()`), so funnel both signals into one you own:

```gdscript
signal _health_wait_finished(changed: bool)

func wait_for_health_change(timeout_sec: float) -> bool:
    var timer := get_tree().create_timer(timeout_sec)
    var on_changed := func(_hp: int) -> void: _health_wait_finished.emit(true)
    var on_timeout := func() -> void: _health_wait_finished.emit(false)
    health.health_changed.connect(on_changed)
    timer.timeout.connect(on_timeout)
    var changed: bool = await _health_wait_finished
    if is_instance_valid(health):  # freed while we waited (see Trap 3)
        health.health_changed.disconnect(on_changed)
    timer.timeout.disconnect(on_timeout)  # or a stale timer ends the next wait early
    return changed
```

The lambdas emit a signal rather than set a local flag: GDScript lambdas capture locals **by value**, so `changed = true` inside one never reaches the outer variable. Every awaiter of `_health_wait_finished` resumes on the first emit, so run one wait at a time per node.

**Trap 3 — Objects freed during the wait.** If the node running the coroutine is freed, the coroutine is dropped silently — no error, and nothing after the `await` (cleanup, a `finished` emit) ever runs. If the node survives but something it references is freed, touching that reference after resuming errors with "previously freed". Re-validate after every `await`:

```gdscript
func flash(target: Node2D) -> void:
    target.modulate = Color.RED
    await get_tree().create_timer(0.2).timeout
    if not is_instance_valid(target):  # freed while we waited
        return
    target.modulate = Color.WHITE
```

## 6. Signal vs Callable design choices

**Signal** — many-to-many, decoupled, edge-triggered. Slight per-emit overhead from the connection list lookup.

**Callable** — one-to-one, explicit, level-triggered. Cheaper per call but tighter coupling.

Use signals for:
- Cross-system events (player_died, item_collected, level_complete)
- UI updates from gameplay
- Anything where 0 to N listeners is normal

Use callables for:
- Strategy injection (sort comparators, predicate functions)
- Deferred work scheduling (`call_deferred`)
- Tween methods (`tween_method` takes a Callable)

> Common pitfall: connecting a lambda to a signal stores the lambda's captured environment forever. If the captured object is freed, you get warnings. Disconnect explicitly in `_exit_tree` or use bound methods instead.

## 7. Profiler-driven idioms

Open the **Debugger → Profiler** panel. The patterns that show up most often:

| Profiler hot spot | Likely cause | Fix |
|---|---|---|
| `String` allocation in `_process` | `print()` / `"%s" % var` per frame | Pre-format outside the loop, or batch logs with a circular buffer |
| `Object.get_node` showing high self-time | Repeated `$Path/Sub/Node` per frame | Cache in `@onready var` |
| `Signal.emit` showing high call count | Per-frame signal storms (e.g., position update) | Throttle to 10 Hz, or use a polling pattern |
| `CharacterBody.move_and_slide` self-time | Many character bodies on one frame | Scale by distance from camera; use Area for cheap detection |
| GDScript GC spikes | Allocator churn from temp Arrays/Strings | Pool the arrays; pre-allocate at startup |

> See [references/profiler-recipes.md](references/profiler-recipes.md) for before/after annotated examples for each row.

## 8. Common pitfalls

**Lambdas capture locals by value** — once, when the lambda is created. Loop lambdas therefore each keep their own `i`, and no `bind` is needed. The trap runs the other way: assigning a captured local changes only the lambda's copy, which starts from the captured value again on the next call:

```gdscript
var count := 0
var bump := func() -> int:
    count += 1  # CONFUSABLE_CAPTURE_REASSIGNMENT warning
    return count
bump.call()  # 1
bump.call()  # 1 again, and `count` out here is still 0
```

Fix: keep shared state in a member variable or a reference type — an `Array`, `Dictionary` or object is captured as the same instance:

```gdscript
var state := {"count": 0}
var bump := func() -> int:
    state.count += 1
    return state.count  # 1, then 2
```

**`@onready` ordering** — `@onready` vars are set after `_init` but before `_ready`. Children's `_ready` runs before parent's `_ready`. So:
- Don't reference parent state in a child's `_ready` unless you're sure the parent is initialized
- For cross-node setup, prefer the parent calling `child.setup_with(self)` from its own `_ready`

**Static var lifecycle across scene reload** — static vars on a class persist for the lifetime of the *engine*, not the scene. Reloading a scene does NOT reset them. If you need a per-scene singleton, use an autoload, not a static var.

**Resource sharing surprises** — `@export var item: ItemData` with the same Resource asset in two scenes shares state by reference. Mutating one mutates the other. Use `item.duplicate()` when each instance needs its own state.

**Packed-array property setters skip element writes**

> ⚠️ **Changed in Godot 4.7:** Setting an element of a packed-array property (e.g. `obj.packed_prop[i] = x`) no longer calls the setter for the entire packed array property. Code that relied on the setter firing for per-element writes silently breaks — reassign the whole array to trigger the setter. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

```gdscript
var points: PackedVector2Array:
    set(value):
        points = value
        _rebuild_mesh()

func move_point() -> void:
    points[0] = Vector2.ONE    # 4.6: setter (and _rebuild_mesh) ran; 4.7+: it does NOT
    var updated := points      # fix: modify a copy...
    updated[0] = Vector2.ONE
    points = updated           # ...then reassign — the setter fires
```

> **Godot 4.7+:** the new `CONFUSABLE_TEMPORARY_MODIFICATION` warning flags modifying a temporary (discarded) value — e.g. a built-in `Packed*Array` property changed through a complex assignment chain or a non-`const` method call, where only a temporary copy changes and the property keeps its old value. Controlled by `debug/gdscript/warnings/confusable_temporary_modification` (default `1`, warn).

## Implementation Checklist

- [ ] Identify which performance idiom applies (typed vectors, PackedArray, static methods)
- [ ] If using metaprogramming, allowlist all dynamic method names
- [ ] If `@tool`, guard editor vs runtime branches with `Engine.is_editor_hint()`
- [ ] Audit `await` calls for signals that may never fire, `_ready` returning before setup finishes, and references freed during the wait
- [ ] Pick signal vs Callable per the trade-off table; disconnect lambdas in `_exit_tree`
- [ ] Profile before optimizing; match the hot-spot to the table in section 7
- [ ] Audit lambdas that assign captured locals (the change never escapes the lambda), `@onready` ordering, static var lifecycle, Resource sharing, and packed-array property setters (Godot 4.7) for the listed pitfalls
