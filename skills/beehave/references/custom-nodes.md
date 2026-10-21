# Beehave — Custom Nodes & Advanced Patterns

Reference for writing custom decorators and conditions, advanced Blackboard patterns, and runtime manual-tick control. Companion to `skills/beehave/SKILL.md`.

---

## Custom decorator

Subclass `Decorator` and override `tick(actor, blackboard)`. A decorator must have **exactly one** BeehaveNode child. Access it via `get_children()[0]` (or call `_safe_tick` on the child directly as Beehave's internal nodes do).

```gdscript
# DebugDecorator.gd — prints the child result each tick (useful during development)
class_name DebugDecorator
extends Decorator

@export var label: String = "debug"

func tick(actor: Node, blackboard: Blackboard) -> int:
    var child := get_children()[0] as BeehaveNode
    var result := child._safe_tick(actor, blackboard)
    var result_name := ["SUCCESS", "FAILURE", "RUNNING"][result]
    print("[%s] %s → %s" % [label, child.name, result_name])
    return result
```

---

## Custom condition

```gdscript
# HasAmmoCondition.gd — checks a property on the actor, no Blackboard needed
class_name HasAmmoCondition
extends ConditionLeaf

func tick(actor: Node, blackboard: Blackboard) -> int:
    return SUCCESS if actor.ammo > 0 else FAILURE
```

---

## Custom action with interrupt cleanup

When a `SequenceReactiveComposite` or `SelectorReactiveComposite` re-evaluates from the first child while an action is RUNNING, it calls `interrupt()` on the running node. Always pair per-run Blackboard writes with cleanup:

```gdscript
# MoveToTargetAction.gd
class_name MoveToTargetAction
extends ActionLeaf

const ARRIVE_DIST := 8.0

func tick(actor: Node, blackboard: Blackboard) -> int:
    # Beehave types `actor` as Node; cast to CharacterBody2D for the movement API.
    var body := actor as CharacterBody2D
    if body == null:
        return FAILURE
    var target_pos: Vector2 = blackboard.get_value("target_pos", Vector2.ZERO)
    if body.global_position.distance_to(target_pos) <= ARRIVE_DIST:
        _clear(blackboard)
        return SUCCESS

    var dir := body.global_position.direction_to(target_pos)
    body.velocity = dir * blackboard.get_value("move_speed", 150.0)
    body.move_and_slide()
    blackboard.set_value("is_moving", true)
    return RUNNING

func interrupt(actor: Node, blackboard: Blackboard) -> void:
    _clear(blackboard)
    var body := actor as CharacterBody2D
    if body != null:
        body.velocity = Vector2.ZERO

func after_run(actor: Node, blackboard: Blackboard) -> void:
    _clear(blackboard)

func _clear(blackboard: Blackboard) -> void:
    blackboard.erase_value("is_moving")
```

---

## Manual tick (MANUAL process thread)

Set `process_thread = MANUAL` to drive the tree yourself — useful for turn-based or time-sliced AI:

```gdscript
# TurnManager.gd — tick all enemy trees once per turn
extends Node

@export var enemies: Array[Node] = []

func execute_enemy_turn() -> void:
    for enemy in enemies:
        var bt: BeehaveTree = enemy.get_node("BeehaveTree")
        var result := bt.tick()
        # result is SUCCESS, FAILURE, or RUNNING (int enum on BeehaveNode)
        if result == BeehaveNode.RUNNING:
            # Enemy needs more turns — re-queue for next call
            pass
```

`bt.tick()` returns the integer status code. In MANUAL mode `BeehaveTree` never calls `tick()` on its own — it only runs when you call it.

---

## Sharing a Blackboard across multiple trees

One common pattern: give the actor a single `Blackboard` node and export it into several `BeehaveTree` nodes (e.g., movement tree + combat tree). All trees read/write the same key space.

```gdscript
# In the actor's _ready(), or wire via Inspector exports:
@onready var shared_bb: Blackboard = $Blackboard
@onready var combat_tree: BeehaveTree = $CombatTree
@onready var movement_tree: BeehaveTree = $MovementTree

func _ready() -> void:
    combat_tree.blackboard = shared_bb
    movement_tree.blackboard = shared_bb
```

Use named namespaces to avoid key collisions between subsystems:

```gdscript
# Combat leaf — writes into "combat" namespace
blackboard.set_value("target", enemy, "combat")

# Movement leaf — reads from default namespace; isolated from combat keys
var speed: float = blackboard.get_value("move_speed", 200.0)
```

---

## Weight-based random composites

`SequenceRandomComposite` and `SelectorRandomComposite` support per-child weights via `RandomizedComposite`. Enable via the Inspector:

1. Select the random composite node.
2. Set **use_weights = true** in the Inspector.
3. Per-child `Weights/<child_name>` integer properties (1–100) appear dynamically in the Inspector.

There is no GDScript API to set weights at runtime — weight configuration is inspector-only in v2.9.2.

---

## Known issues (v2.9.2)

- **`RepeaterDecorator.get_class_name()` bug:** The method returns `&"LimiterDecorator"` instead of `&"RepeaterDecorator"` due to a copy-paste error in the source. The actual GDScript `class_name` is `RepeaterDecorator` (autocomplete and `is` checks work correctly); only `get_class_name()` returns the wrong value. Avoid `get_class_name()` for identity checks on this node.

---

## Built-in expression leaves (no GDScript required)

| Node | Purpose |
|---|---|
| `BlackboardSetAction` | Sets `key` → `value` (GDScript expressions evaluated against Blackboard) |
| `BlackboardEraseAction` | Erases a key from the Blackboard |
| `BlackboardHasCondition` | `SUCCESS` if key exists and is non-null |
| `BlackboardCompareCondition` | Compares two expressions with `==`, `!=`, `>`, `<`, `>=`, `<=` |

Expressions run via `Expression.execute([], blackboard)` — the Blackboard is the base instance, so you can call `get_value("health")` directly in the expression string.
