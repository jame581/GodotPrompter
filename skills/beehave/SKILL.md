---
name: beehave
description: Use when using the Beehave addon — pure-GDScript behavior trees with composites, decorators, leaves, a blackboard, and a visual runtime debugger
---

# Beehave

> **Related skills:** **ai-navigation** for the movement leaves drive, **state-machine** for core-engine FSM, **limboai** for a heavier C++ BT+HSM alternative, **godot-brainstorming** for choosing an AI approach.

> **Addon:** Beehave · version `v2.9.2` · Godot 4.1+ · MIT · source: https://github.com/bitbrain/beehave · written in GDScript (no official C# API — this skill is GDScript-only by design).

---

## 1. When to use Beehave

| Approach | Best for |
|---|---|
| Core-engine FSM (`state-machine` skill) | Simple agents, < 5 states, no addon |
| **Beehave** (GDScript addon) | Lightweight BT, GDScript-only projects, fast iteration |
| **LimboAI** | BT **and** HSM together, visual editor, C++ performance, C# support (module build) |

Choose Beehave when your project is GDScript-only, you want a behavior tree without a custom engine build, and you value a simple node-in-scene-tree authoring workflow. Beehave trees live entirely in the scene tree — every composite, decorator, and leaf is a regular `Node` child. For a heavier C++/C# solution with HSM integration, use the `limboai` skill instead. For plain state machines without a BT, use the built-in `state-machine` skill.

**C# note:** Beehave has no official C# API (zero `.cs` files in `addons/beehave/`). From C# you can call the GDScript API via Godot cross-language interop (`GetNode<Node>(...).Call("tick", actor, blackboard)`), but Beehave provides no typed C# classes.

---

## 2. Install & enable

1. **Godot AssetLib** → search "Beehave" → Download → Reload project.  
   Or copy the `addons/beehave/` folder from the [GitHub release](https://github.com/bitbrain/beehave/releases) into `res://addons/beehave/`.
2. Enable the plugin: **Project → Project Settings → Plugins** → tick **Beehave**.  
   Two autoloads are registered: `BeehaveGlobalMetrics` and `BeehaveGlobalDebugger`.
3. Optional — copy `script_templates/` from the addon into the project root for leaf scaffolding templates.

---

## 3. Tree composition

A Beehave tree is built from three kinds of nodes, all placed as regular scene-tree children:

| Role | Node | Behavior |
|---|---|---|
| **Tree root** | `BeehaveTree` | Ticks the child every frame (or physics/manual); extends `Node` (not `BeehaveNode`) |
| **Composites** | `SequenceComposite`, `SelectorComposite`, `SimpleParallelComposite`, … | Flow control — AND / OR / parallel logic |
| **Decorators** | `InverterDecorator`, `CooldownDecorator`, `RepeaterDecorator`, … | Wrap one child to modify its result |
| **Leaves** | `ActionLeaf`, `ConditionLeaf` subclasses | Your custom game logic |

### Composite quick reference

| Class | Logic |
|---|---|
| `SequenceComposite` | AND — all children must succeed; fails on first failure |
| `SequenceReactiveComposite` | AND — re-evaluates from first child every tick while running |
| `SelectorComposite` | OR — succeeds on first success; fails if all fail |
| `SelectorReactiveComposite` | OR — re-evaluates from first child every tick while running |
| `SimpleParallelComposite` | Runs two children simultaneously; result follows primary (child 0) |
| `SequenceRandomComposite` | Shuffled AND — executes children in random order |
| `SelectorRandomComposite` | Shuffled OR — tries children in random order |

### Decorator quick reference

| Class | Effect |
|---|---|
| `InverterDecorator` | Flips `SUCCESS` ↔ `FAILURE`; passes `RUNNING` through |
| `AlwaysSucceedDecorator` | Forces `SUCCESS`; passes `RUNNING` through |
| `AlwaysFailDecorator` | Forces `FAILURE`; passes `RUNNING` through |
| `RepeaterDecorator` | Re-runs child until it succeeds `repetitions` times |
| `LimiterDecorator` | Caps child to `max_count` running ticks, then `FAILURE` |
| `CooldownDecorator` | Blocks re-execution for `wait_time` seconds after child finishes |
| `TimeLimiterDecorator` | Gives child `wait_time` seconds; interrupts if still running |
| `DelayDecorator` | Waits `wait_time` seconds before first executing child |
| `UntilFailDecorator` | Loops child until it returns `FAILURE`, then returns `SUCCESS` |

### Minimal scene-tree example

```gdscript
# Scene tree:
#   Enemy (CharacterBody2D)
#     BeehaveTree               ← tick_rate = 1, process_thread = PHYSICS
#       SelectorComposite
#         SequenceComposite     ← "attack if in range"
#           IsInRangeCondition
#           AttackAction
#         PatrolAction          ← fallback

# BeehaveTree exports:
# @export var enabled: bool = true
# @export var tick_rate: int = 1          (1 = every frame; 3 = every 3 frames)
# @export var process_thread: ProcessThread = PHYSICS
# @export var blackboard: Blackboard      (auto-created if not set)
# @export_node_path var actor_node_path   (defaults to parent node)

# Access the tree from code if you need manual control:
@onready var bt: BeehaveTree = $BeehaveTree

func _ready() -> void:
    # Reduce tick cost: evaluate AI every 3 physics frames
    bt.tick_rate = 3
    # Default process_thread is PHYSICS — switch to IDLE if actor uses _process
    bt.process_thread = BeehaveTree.ProcessThread.IDLE
```

> **tick_rate note:** `tick_rate = 1` evaluates every frame; `tick_rate = 3` every 3 frames. Increase for distant/background NPCs to save CPU. Default process thread is `PHYSICS` — if the actor script uses `_process` instead of `_physics_process`, set `process_thread = IDLE` to keep them in sync.

---

## 4. The leaf contract

Leaves hold your game logic. Subclass `ActionLeaf` for multi-tick work or `ConditionLeaf` for single-frame checks, then override `tick(actor, blackboard)`.

```gdscript
# IsInRangeCondition.gd
class_name IsInRangeCondition
extends ConditionLeaf

@export var detection_range: float = 150.0

func tick(actor: Node, blackboard: Blackboard) -> int:
    # Beehave types `actor` as Node; cast to your concrete type for 2D members.
    var body := actor as Node2D
    var target: Node2D = blackboard.get_value("target")
    if body == null or not is_instance_valid(target):
        return FAILURE
    var in_range := body.global_position.distance_to(target.global_position) <= detection_range
    return SUCCESS if in_range else FAILURE
```

```gdscript
# AttackAction.gd
class_name AttackAction
extends ActionLeaf

@export var attack_duration: float = 0.5

func tick(actor: Node, blackboard: Blackboard) -> int:
    var elapsed: float = blackboard.get_value("attack_elapsed", 0.0)
    elapsed += get_physics_process_delta_time()

    if elapsed >= attack_duration:
        blackboard.erase_value("attack_elapsed")
        # `actor` is typed Node; guard game-specific methods (or cast to your actor type).
        if actor.has_method("play_attack_animation"):
            actor.call("play_attack_animation")
        return SUCCESS

    blackboard.set_value("attack_elapsed", elapsed)
    return RUNNING

func after_run(actor: Node, blackboard: Blackboard) -> void:
    # Clean up any per-run state when the tree interrupts this action
    blackboard.erase_value("attack_elapsed")
```

**Return codes** (defined on `BeehaveNode`):
- `SUCCESS` — action complete / condition met.
- `FAILURE` — action failed / condition not met; parent composite decides what to do next.
- `RUNNING` — action needs more frames; tree will call `tick()` again next frame (`ActionLeaf` only — `ConditionLeaf` should never return `RUNNING`).

**Optional overrides:**
- `before_run(actor, blackboard)` — called once before the first tick of a run.
- `after_run(actor, blackboard)` — called when the child finishes (`SUCCESS`/`FAILURE`) or is interrupted.
- `interrupt(actor, blackboard)` — called when the tree interrupts a running node.

---

## 5. Blackboard

The `Blackboard` node is a shared key/value store passed to every `tick()` call. `BeehaveTree` auto-creates an internal one if you don't assign an external `Blackboard` node.

```gdscript
# Share one Blackboard across multiple BeehaveTrees on the same actor.
# Assign the same exported Blackboard node to each tree in the Inspector.

# Read / write from any leaf's tick():
func tick(actor: Node, blackboard: Blackboard) -> int:
    # Write
    blackboard.set_value("target", actor.get_nearest_enemy())

    # Read with default
    var speed: float = blackboard.get_value("move_speed", 200.0)

    # Conditional check
    if blackboard.has_value("stunned"):
        return FAILURE

    # Erase (sets key to null; has_value returns false after erase)
    blackboard.erase_value("temp_flag")

    return SUCCESS
```

> **Named namespaces:** every method accepts an optional `blackboard_name: String` parameter (default `"default"`). Use this to keep separate namespaces on one `Blackboard` node without name collisions (e.g., per-enemy state vs. shared world state).

> **Built-in expression leaves:** `BlackboardSetAction`, `BlackboardEraseAction`, `BlackboardHasCondition`, and `BlackboardCompareCondition` let you manipulate the Blackboard entirely via Inspector exports (no GDScript required). Expressions run via Godot's `Expression.execute([], blackboard)` — so you can call `get_value("key")` directly in the expression string.

---

## 6. Visual debugger

Beehave ships an `EditorDebuggerPlugin` that adds a **🐝 Beehave** tab to the bottom editor panel while your game is running:

1. Run the project from the Godot editor.
2. Open the **Debugger** panel → click the **🐝 Beehave** tab.
3. Select a tree from the list to activate live visualization — active nodes are highlighted each tick.
4. Optional: click the detach button to float the panel, or set **Project Settings → beehave/debugger/start_detached = true** to always start detached.

To track per-tree CPU cost in the **Performance** panel, set `custom_monitor = true` on the `BeehaveTree` node. This registers `beehave [microseconds]/process_time_<actor_name>-<id>` as a Performance monitor.

For a walkthrough of writing custom decorators and conditions, see [references/custom-nodes.md](references/custom-nodes.md).

---

## Implementation checklist

- [ ] `addons/beehave/` copied into project; plugin enabled in **Project Settings → Plugins**
- [ ] `BeehaveTree` added as a child of the actor; `actor_node_path` set (or left blank to default to parent)
- [ ] `process_thread` matches actor's loop: `PHYSICS` for `_physics_process`, `IDLE` for `_process`
- [ ] `tick_rate` tuned — increase for background NPCs (e.g., `3`) to reduce per-frame cost
- [ ] Every `tick()` override returns `SUCCESS`, `FAILURE`, or `RUNNING` — never `void`/`null`
- [ ] `ConditionLeaf` subclasses never return `RUNNING`
- [ ] Per-run state written to the `Blackboard`, not stored on the leaf node itself (leaf nodes are shared)
- [ ] `after_run` or `interrupt` cleans up any Blackboard keys the action wrote
- [ ] External `Blackboard` node exported and shared when multiple `BeehaveTree` nodes need the same data
- [ ] Visual debugger checked at runtime to verify tick flow before shipping AI logic
