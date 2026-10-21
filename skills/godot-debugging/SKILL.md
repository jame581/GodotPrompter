---
name: godot-debugging
description: Use when debugging Godot projects — remote debugger, print techniques, signal tracing, common error patterns and fixes
---

# Godot Debugging

This skill covers systematic debugging for Godot 4.3+ projects in both GDScript and C#. It covers print techniques, breakpoints, signal tracing, the built-in profiler, scene tree inspection, common error patterns, and a step-by-step debugging checklist.

> **Related skills:** **godot-optimization** for performance profiling, **godot-testing** for regression tests after fixes, **csharp-signals** for C# signal debugging patterns.

---

## 1. Print Debugging

### GDScript

Godot provides several print functions with different purposes. Choose based on the severity and context of what you are logging.

```gdscript
# print() — general output, space-separated values
print("Player position: ", position)
print("Health: ", health, " / ", max_health)

# print_rich() — BBCode-formatted output in the Output panel
print_rich("[color=yellow]WARNING:[/color] Enemy count exceeded limit: ", enemy_count)
print_rich("[b]State:[/b] [color=green]", current_state, "[/color]")

# push_error() — logs an error with a full stack trace; does NOT stop execution
push_error("save_game: file path is empty")

# push_warning() — logs a warning with stack trace; use for recoverable issues
push_warning("AudioStreamPlayer: bus '%s' not found, using Master" % bus_name)

# print_debug() — print() plus the calling file:line when the debugger is attached;
# it still prints in release exports (guard with OS.is_debug_build() to silence it)
print_debug("Frame delta: ", delta, " | FPS: ", Engine.get_frames_per_second())

# printerr() — prints to stderr; visible in external terminals and CI logs
printerr("Critical: physics state corrupted at frame ", Engine.get_process_frames())
```

**Formatted output patterns:**

```gdscript
# String formatting with % operator
print("Actor [%s] dealt %d damage to [%s]" % [name, damage, target.name])

# String.format() with named placeholders
var msg := "Position: ({x}, {y}) at speed {spd}"
print(msg.format({"x": position.x, "y": position.y, "spd": velocity.length()}))

# Printing arrays and dictionaries — use str() for clean output
var inventory := {"sword": 1, "potion": 3}
print("Inventory: ", str(inventory))

# Conditional verbose logging using a project-level constant or autoload flag
if DebugConfig.verbose_ai:
    print_rich("[color=cyan][AI][/color] ", agent.name, " chose action: ", chosen_action)
```

```csharp
// String interpolation
GD.Print($"Actor [{Name}] dealt {damage} damage to [{target.Name}]");

// Printing collections
var inventory = new Godot.Collections.Dictionary { { "sword", 1 }, { "potion", 3 } };
GD.Print("Inventory: ", inventory);

// Conditional verbose logging
if (DebugConfig.VerboseAi)
    GD.PrintRich($"[color=cyan][AI][/color] {agent.Name} chose action: {chosenAction}");
```

**When to use each function:**

| Function | Visible in Release | Stack Trace | Use For |
|---|---|---|---|
| `print()` | Yes (if not stripped) | No | General value inspection |
| `print_rich()` | Yes | No | Categorised, colour-coded logs |
| `push_error()` | Yes | Yes | Invalid state, programmer errors |
| `push_warning()` | Yes | Yes | Recoverable problems |
| `print_debug()` | Yes | Calling line (debugger attached) | Locating where a value was printed |
| `printerr()` | Yes | No | External terminal / CI output |

### C\#

```csharp
using Godot;

public partial class Player : CharacterBody3D
{
    public override void _Ready()
    {
        // GD.Print — equivalent to GDScript print()
        GD.Print("Player position: ", Position);

        // GD.PrintRich — BBCode formatted
        GD.PrintRich("[color=yellow]Ready called on[/color] ", Name);

        // GD.PushError — logs error with stack trace
        GD.PushError("_Ready: required child node missing");

        // GD.PushWarning — logs warning with stack trace
        GD.PushWarning("AudioBus not found, falling back to Master");

        // GD.PrintErr — writes to stderr
        GD.PrintErr("Critical failure in _Ready");
    }

    private void HandleDamage(int amount)
    {
        // Formatted string output
        GD.Print($"[{Name}] took {amount} damage. HP: {_health}/{_maxHealth}");
    }
}
```

---

## 2. Breakpoints and the Remote Debugger

### Setting Breakpoints

- Click the gutter (left of line numbers) in the Script editor to toggle a breakpoint. A red dot appears.
- Use `F9` to toggle a breakpoint on the current line.
- Use `breakpoint` as a statement in GDScript to trigger a programmatic breakpoint:

```gdscript
func _physics_process(delta: float) -> void:
    if velocity.length() > MAX_SPEED:
        breakpoint  # execution pauses here during debug runs
    move_and_slide()
```

- In C#, use `System.Diagnostics.Debugger.Break()` or attach a .NET debugger (e.g. JetBrains Rider or VS Code with the Godot extension).

```csharp
public override void _PhysicsProcess(double delta)
{
    if (Velocity.Length() > MaxSpeed)
    {
        System.Diagnostics.Debugger.Break(); // pause if .NET debugger is attached
    }
    MoveAndSlide();
}
```

### Using the Built-in Debugger Panel

When execution pauses at a breakpoint, the **Debugger** panel (bottom of the editor) provides:

- **Stack Frames** — the full call stack; click a frame to inspect its local variables.
- **Locals / Members / Globals** — inspect and modify variable values live.
- **Step Into (F11)** / **Step Over (F10)** — navigate execution line by line (**Step Out**, Alt+F11, from Godot 4.6).
- **Continue (F12)** — resume execution until the next breakpoint.

### Remote Scene Inspector

While a running game is paused or mid-session:

1. Open **Debugger > Remote** tab in the editor.
2. Click **Remote** in the Scene panel (top-left toggle next to "Scene") to switch the scene tree to the live view.
3. Click any live node to inspect its current properties in the Inspector.
4. Property changes made here are applied immediately for testing.

### Monitors Tab

**Debugger > Monitors** displays real-time engine metrics:

- **FPS / Process time / Physics time** — spot performance regressions.
- **Video RAM / Object count / Node count** — track memory growth.
- **Physics 2D/3D collision pairs** — identify expensive physics scenes.
- **Audio latency** — catch audio callback overruns.

Click any monitor name to open its graph. Use the **Add** button to build custom monitor dashboards.

---

## 3. Signal Debugging

Inspect at runtime via `node.get_signal_connection_list("signal_name")` (returns Array of Dictionary with `callable`, `flags`, `signal`). The most common signal bugs: connecting twice (handler fires twice), forgetting to disconnect on free (warnings + dangling refs), wrong handler signature (`Error calling from signal …` on every emit).

> See [references/signal-tracing.md](references/signal-tracing.md) for the full GDScript and C# inspection helpers and the common-signal-issues catalog (double connect, deferred-free races, lambda capture lifecycle, signal-vs-Callable choice).

---

## 4. Common Error Patterns

| Error Message | Cause | Fix |
|---|---|---|
| `Node not found: "Player" (relative to "...")` | Wrong node path, node renamed, or accessed before it is added to the tree | Use `$NodeName` only in/after `_ready()`. Verify path with `print(get_node_or_null("Player"))`. Use `@onready`. |
| `Attempt to call function on a null instance` | Node was freed, export not assigned, or `get_node()` returned null | Guard with `is_instance_valid(node)`. Check exports in Inspector. Prefer `@onready var _node := $Node`. |
| `Can't change this state while flushing queries` | Modifying physics state (e.g. disabling a CollisionShape) inside a physics callback such as `body_entered` | Defer the change: `collision_shape.set_deferred("disabled", true)`. |
| `Invalid call. Nonexistent function 'X' in base 'Y'` | Calling a method that does not exist on that type, or accessing a node as the wrong type | Check `class_name`, cast with `as`, or verify the script is attached. Use `has_method("X")` to guard. |
| `Converting circular structure to JSON.` / `Circular reference to resource being saved found` | A Resource or Dictionary references itself, directly or indirectly | Break the cycle. Use node references instead of resource references where possible, or mark sub-resources as local only. |
| `Cannot call non-static function "x()" from the static function "y()".` | Calling an instance method from a `static func` | Move the call to an instance context or refactor to a proper static helper that takes data as arguments. |
| `Stack overflow. Check for infinite recursion in your script.` | Infinite recursion — often a signal that triggers itself, or a setter that sets itself | Add a guard variable (`_updating := true`) in setters. Trace the call stack in the Debugger. |
| `Signal 'x' is already connected to given callable '…' in that object.` | Calling `connect()` a second time on the same signal/callable pair without `CONNECT_REFERENCE_COUNTED` | Check `is_connected()` before connecting, or disconnect first, or use `CONNECT_REFERENCE_COUNTED`. |
| `Out of bounds get index 'X' (on base: 'Array')` | Accessing an Array or PackedArray beyond its length | Validate index before access: `if index < array.size()`. Use `array.get(index)` where available. |
| Audio crackles or drops out (underrun) | Audio callback missed its deadline; processing too much on the audio thread | Reduce audio bus effects, lower polyphony, or increase audio buffer size in Project Settings. |

---

## 5. Performance Debugging

The Profiler (Debugger → Profiler) shows per-function self-time and call counts. The Monitors tab tracks frame time, FPS, draw-call count, physics tick budget, memory. Open both during the most demanding gameplay scenario; sort the Profiler by **Self time** to find culprits. For draw-call bottlenecks, watch `Raster > Total Draw Calls` in the Monitors tab.

> See [references/performance-debugging.md](references/performance-debugging.md) for Profiler workflow, Monitors tab usage, draw-call bottleneck identification, physics-tick monitoring patterns. See also **godot-optimization** for fixes once a bottleneck is identified.

---

## 6. Scene Tree Debugging

`print_tree_pretty()` dumps the current scene tree to stdout — the fastest way to confirm a node lives where you think. The **Remote** tab in the editor shows the live scene tree while the game runs. For `@tool` nodes, implement `_get_configuration_warnings()` to surface configuration errors in the editor SceneTree dock.

> See [references/scene-tree-debugging.md](references/scene-tree-debugging.md) for full examples (print_tree_pretty patterns, node-group debug helpers, _get_configuration_warnings GDScript + C#).

---

## 7. Systematic Debugging Method

When prints, breakpoints, and remote inspection don't immediately reveal the bug, fall back to a deliberate process: **Reproduce → Isolate → Hypothesis → Trace → Fix → Verify → Add a Test.** Each step gates the next; skipping ahead wastes time.

> See [references/systematic-method.md](references/systematic-method.md) for the full 7-step method with concrete techniques per step (binary search, minimal repro, regression-test patterns).

---

## 8. Implementation Checklist

- [ ] Guard verbose frame-level output with `OS.is_debug_build()` — neither `print()` nor `print_debug()` is stripped from release builds
- [ ] Use `push_error()` / `push_warning()` (not `print()`) for invalid state and recoverable problems — they include stack traces
- [ ] Set a breakpoint with `F9` or the `breakpoint` statement to pause execution rather than sprinkling prints
- [ ] Check signal connections with `get_signal_connection_list()` before assuming a signal is wired correctly
- [ ] Inspect the live scene tree with **Scene → Remote** during a debug session to verify runtime node state
- [ ] Open **Debugger → Profiler** to measure Self time before optimizing — identify the real bottleneck first
- [ ] Watch **Debugger → Monitors** for growing Object Count or Video RAM that indicate a leak
- [ ] Use `is_instance_valid()` to guard any code that runs after an `await` in case the node was freed during the wait
- [ ] Follow the Reproduce → Isolate → Hypothesize → Trace → Fix → Verify → Test order; do not skip ahead to a fix
- [ ] Write a named regression test after fixing a bug so the same failure cannot silently recur
