---
name: godot-optimization
description: Use when optimizing Godot games — profiler, draw calls, physics tuning, memory management, and common bottlenecks
---

# Godot Optimization

This skill covers performance optimization for Godot 4.3+ projects in both GDScript and C#. It covers the built-in profiler, draw call reduction, physics tuning, GDScript performance patterns, memory management, object pooling, and a reference table of common bottlenecks.

> **Related skills:** **godot-debugging** for systematic debugging and profiling, **godot-code-review** for performance review checklist, **export-pipeline** for release build optimization, **physics-system** for collision shapes, layers, and physics body types, **2d-essentials** for 2D mesh optimization, particle performance, and draw order tuning, **multithreading** for moving work off the main thread, **mobile-development** for mobile performance budgets.

---

## 1. Using the Profiler

### Frame Time Budget

At 60 fps, the entire frame (update, physics, rendering) must complete in **16.6 ms**. At 30 fps the budget is 33.3 ms. Any single system that consumes the majority of that budget is a bottleneck.

| Target FPS | Frame budget |
|---|---|
| 120 | 8.3 ms |
| 60 | 16.6 ms |
| 30 | 33.3 ms |

### Reading Profiler Output

Open **Debugger > Profiler**, click **Start**, play through the scenario you want to measure, then click **Stop**.

- **Frame Time** — total wall-clock time for that frame in milliseconds.
- **Self** — time spent inside that function *excluding* callees. This is the primary hotspot indicator. A function with a high Self time is doing expensive work directly.
- **Total** — time including all callees. Useful for identifying expensive subtrees.
- **Calls** — call count per frame. A function called thousands of times per frame (even if each call is cheap) can dominate the frame.
- Click any function name to jump to its source in the script editor.

```gdscript
# Manual micro-benchmark for a specific block
var start := Time.get_ticks_usec()
_run_expensive_operation()
var elapsed := Time.get_ticks_usec() - start
print("_run_expensive_operation: %d µs" % elapsed)
```

**C#:**

```csharp
// Manual micro-benchmark using Stopwatch (high-resolution timer)
using System.Diagnostics;

var sw = Stopwatch.StartNew();
RunExpensiveOperation();
sw.Stop();
GD.Print($"RunExpensiveOperation: {sw.Elapsed.TotalMilliseconds:F3} ms");

// Alternative using Godot's built-in timer (microsecond precision)
long start = (long)Time.GetTicksUsec();
RunExpensiveOperation();
long elapsed = (long)Time.GetTicksUsec() - start;
GD.Print($"RunExpensiveOperation: {elapsed} µs");
```

### Monitors Tab

**Debugger > Monitors** shows real-time engine metrics while the game is running. Click a monitor name to open a live graph. Key monitors to watch:

| Monitor | What to watch for |
|---|---|
| `Time > FPS` | Below target — frame budget overrun |
| `Time > Process` | High — `_process()` callbacks are expensive |
| `Time > Physics Process` | High — `_physics_process()` or physics sim is expensive |
| `Render > Total Draw Calls` | Above ~500 (mobile) or ~2 000 (desktop) — needs batching |
| `Render > Video RAM` | Steadily growing — unfreed textures or meshes (memory leak) |
| `Object > Object Count` | Growing across scene reloads — nodes are not being freed |
| `Physics 3D > Active Bodies` | Large count in simple scenes — bodies not sleeping |

```gdscript
# Query any monitor at runtime from code
var fps := Performance.get_monitor(Performance.TIME_FPS)
var draw_calls := Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)
var video_ram := Performance.get_monitor(Performance.RENDER_VIDEO_MEM_USED)
print("FPS: %d | Draw calls: %d | VRAM: %.1f MB" % [fps, draw_calls, video_ram / 1_048_576.0])
```

**C#:**

```csharp
// Query any monitor at runtime from code
double fps = Performance.GetMonitor(Performance.Monitor.TimeFps);
double drawCalls = Performance.GetMonitor(Performance.Monitor.RenderTotalDrawCallsInFrame);
double videoRam = Performance.GetMonitor(Performance.Monitor.RenderVideoMemUsed);
GD.Print($"FPS: {fps:F0} | Draw calls: {drawCalls:F0} | VRAM: {videoRam / 1_048_576.0:F1} MB");
```

---

## 2. Draw Call Optimization

Every distinct mesh, sprite, or canvas item that cannot be batched with its neighbours costs one draw call. Reducing draw calls is one of the highest-leverage optimisations, especially on mobile — wrap 2D groups sharing a texture in `CanvasGroup`, keep unique-material count low, atlas sprites, and cull off-screen work.

> See [references/draw-calls.md](references/draw-calls.md) for the full recipes (CanvasGroup batching constraints, shared shader-parameter materials, texture atlases, `VisibleOnScreenNotifier2D/3D` culling, and 3D LOD swapping).

---

## 3. Physics Optimization

Physics tuning hinges on minimising broadphase work and avoiding mesh colliders on moving bodies. Trim collision masks to only the layers each body actually needs, replace `ConcavePolygonShape3D` with primitives on anything that moves, and prefer `Area2D/3D` over per-frame raycasts for overlap detection.

> See [references/physics-tuning.md](references/physics-tuning.md) for the full recipes (layer/mask bit examples, collision-shape cost table, `Engine.physics_ticks_per_second` tuning, Area-vs-raycast patterns).

---

## 4. GDScript Performance

Hot-path GDScript wins come from eliminating per-frame allocations, comparing `StringName` instead of `String`, using typed arrays / `PackedArray`s, and `preload`-ing resources at class scope. The same allocation discipline applies to C# (with `List<T>` in place of typed `Array[T]` and `static readonly StringName` fields).

> See [references/cpu-bottlenecks.md](references/cpu-bottlenecks.md) for the full recipes (cached group queries, reused vector locals, `&"..."` literals, `PackedVector2Array`, static typing, `preload` vs `load`, plus C# parity blocks).

---

## 5. Memory Management

Watch `Performance.MEMORY_STATIC` and `OBJECT_COUNT` across scene reloads — steady growth means leaked references. Resources loaded by path are cached and shared; call `.duplicate()` when you need per-instance mutation. Always prefer `queue_free()` for nodes; `free()` inside a self-emitted signal will crash.

> See [references/memory-management.md](references/memory-management.md) for the full recipes (Performance singleton queries, ResourceLoader cache semantics, `queue_free` vs `free` table, plus the full GDScript and C# **object pool** implementations for bullets/effects/particles).

---

## 6. Common Bottlenecks

| Problem | Diagnosis tool | Fix |
|---|---|---|
| Too many draw calls | Debugger > Monitors `Render > Total Draw Calls`; Viewport > Debug > Draw Calls overlay | Use `CanvasGroup` for 2D batching; merge meshes for 3D; use texture atlases; reduce unique materials |
| Heavy GDScript in `_process` | Profiler > Self column shows script functions at top | Move logic to `_physics_process` (runs less often), cache queries, avoid per-frame allocations, consider C# for tight loops |
| Excessive signal connections | Profiler shows signal dispatch overhead; manually audit `get_signal_connection_list()` | Remove redundant connections; prefer polling over per-frame signals for high-frequency data; use `CONNECT_ONE_SHOT` for fire-and-forget |
| Unoptimised TileMap | Profiler shows `TileMap._process` or high draw call count | Split into fewer layers; use a single atlas texture per layer; disable `use_parent_material` if not needed; use `TileMapLayer` (Godot 4.3+) instead of legacy TileMap |
| Large uncompressed textures | Monitors `Render > Video RAM` is high; check Import dock for texture settings | Enable texture compression (VRAM Compressed) in the Import dock; use mipmaps; halve resolution of assets not viewed up-close |
| Too many active physics bodies | Monitors `Physics 3D > Active Bodies` is high; slow `_physics_process` in Profiler | Enable sleeping on `RigidBody3D` (`can_sleep = true`); lower physics tick rate; replace distant bodies with fake animations; use layers/masks to narrow collision checks |
| String operations in hot paths | Profiler shows `String` allocation functions; high GC pressure | Replace `String` comparisons with `StringName` (`&"..."`); avoid `String` formatting in `_process`; build strings once and cache |
| `instantiate()` in hot paths | Profiler shows `PackedScene.instantiate` with high Self time | Implement object pooling (see `references/memory-management.md`); preload scenes at startup; spawn during loading screens rather than during gameplay |

---

## 7. Top Anti-Patterns

- **Allocating in `_process`** — new Arrays, Dictionaries, Strings, or Vector constructors per frame. Cache the container, mutate fields in place. See [references/cpu-bottlenecks.md](references/cpu-bottlenecks.md).
- **Mesh colliders on moving bodies** — `ConcavePolygonShape3D` on a `CharacterBody3D` or `RigidBody3D`. Use a capsule, box, or convex hull instead. See [references/physics-tuning.md](references/physics-tuning.md).
- **Unique materials per instance** — `material_override = SomeMaterial.new()` in `_ready()` breaks batching. Share one material; vary via shader parameters. See [references/draw-calls.md](references/draw-calls.md).
- **`load()` in hot paths** — calling `load("res://...")` from `_process` or `_physics_process`. Use `const X := preload(...)` at class scope. See [references/cpu-bottlenecks.md](references/cpu-bottlenecks.md).
- **`instantiate()` + `queue_free()` for short-lived objects** — bullets, hit effects, particles. Pool them. See [references/memory-management.md](references/memory-management.md).

---

## 8. Checklist

Work through this list before shipping or when investigating a performance complaint.

**Profiler**
- [ ] Run the Profiler during the most demanding gameplay scenario.
- [ ] Confirm no single function's Self time exceeds 30% of the frame budget.
- [ ] Confirm total frame time stays under budget (16.6 ms at 60 fps).

**Draw Calls**
- [ ] Draw call count is within target (≤500 mobile, ≤2 000 desktop).
- [ ] 2D sprite groups that share a texture are wrapped in `CanvasGroup`.
- [ ] Textures are atlas-packed where possible; duplicate materials are eliminated.
- [ ] Off-screen nodes use `VisibleOnScreenNotifier2D/3D` to pause processing.
- [ ] 3D meshes have LOD enabled via import settings or manual swap logic.

**Physics**
- [ ] Collision layers and masks are minimal — no body checks layers it never needs.
- [ ] No moving body uses `ConcavePolygonShape` — replaced with capsule, box, or convex.
- [ ] Physics tick rate is appropriate for the game type (30 Hz may be fine for turn-based or top-down).
- [ ] `Area2D/3D` is used for overlap detection instead of per-frame raycasts.
- [ ] `RigidBody3D` nodes have `can_sleep = true` where applicable.

**GDScript**
- [ ] No `Array`, `Dictionary`, or `String` is allocated inside `_process` or `_physics_process`.
- [ ] All hot-path string comparisons use `StringName` (`&"..."`).
- [ ] All arrays in hot paths are typed (`Array[T]` or `PackedArray`).
- [ ] All function parameters and return types in hot paths are statically typed.
- [ ] All scene and resource references use `preload` at class scope, not `load` per frame.

**Memory**
- [ ] `Performance.get_monitor(Performance.MEMORY_STATIC)` is stable between scene reloads.
- [ ] Resources that require per-instance mutation are `.duplicate()`d.
- [ ] All node removals use `queue_free()` unless synchronous teardown is explicitly required.

**Object Pooling**
- [ ] Bullets, hit effects, particles, and other frequently spawned objects use a pool.
- [ ] Pool initial size is large enough to avoid runtime growth during normal gameplay.
- [ ] Pooled objects reset all state on reactivation (position, velocity, signals).
