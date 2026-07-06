---
name: gdscript-patterns
description: Use when writing GDScript — static typing, await/coroutines, lambdas, match patterns, export annotations, inner classes, and common idioms
---

# GDScript Patterns in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs.

> **Related skills:** **gdscript-advanced** for production-grade depth (performance idioms, metaprogramming, @tool lifecycle, profiler-driven idioms), **godot-code-review** for style rules and anti-patterns, **csharp-godot** for GDScript-to-C# translation, **state-machine** for state patterns, **event-bus** for signal architecture.

> **Note:** This skill is GDScript-specific by design. For C# patterns, see **csharp-godot** and **csharp-signals**.

---

## 1. Static Typing

### Type Hints

Always add type hints — they catch bugs at parse time, improve autocomplete, and boost performance.

```gdscript
# Variables
var health: int = 100
var speed: float = 200.0
var player_name: String = "Hero"
var direction: Vector2 = Vector2.ZERO

# Constants
const MAX_HEALTH: int = 100
const GRAVITY: float = 980.0

# Functions — parameters and return type
func take_damage(amount: int) -> void:
    health -= amount

func get_direction() -> Vector2:
    return Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")

# Inferred typing with :=
var pos := Vector2(100, 200)     # inferred as Vector2
var items := []                  # inferred as Array (untyped)
var count := 0                   # inferred as int
```

### Typed Collections

```gdscript
# Typed arrays — only accepts the specified type
var enemies: Array[Enemy] = []
var scores: Array[int] = [10, 20, 30]
var names: Array[String] = ["Alice", "Bob"]

# Typed dictionaries (Godot 4.4+)
var inventory: Dictionary[String, int] = {"sword": 1, "potion": 5}

# Typed loop variable
for enemy: Enemy in enemies:
    enemy.take_damage(10)

# Typed array methods work with type safety
var filtered: Array[Enemy] = enemies.filter(func(e: Enemy) -> bool: return e.health > 0)
```

### Casting with `as` and `is`

```gdscript
# 'is' — type check (returns bool)
func _on_body_entered(body: Node2D) -> void:
    if body is Player:
        var player: Player = body as Player
        player.take_damage(10)

# 'as' — cast (returns null on failure, no error)
var sprite := get_node("Sprite") as Sprite2D
if sprite:
    sprite.modulate = Color.RED

# Prefer 'is' check + cast over bare 'as' to avoid null surprises
```

### Enabling Strict Typing Warnings

In **Project > Project Settings > Debug > GDScript**:

| Warning                 | Effect                                      |
|-------------------------|---------------------------------------------|
| `UNTYPED_DECLARATION`   | Warns on any untyped variable/parameter     |
| `INFERRED_DECLARATION`  | Warns on `:=` (prefers explicit types)      |
| `UNSAFE_CAST`           | Warns on unsafe `as` casts                  |
| `UNSAFE_CALL_ARGUMENT`  | Warns when passing wrong type to a function |

> Set warnings to **Error** for strict enforcement in team projects.

### Typed Return Inheritance in Overrides

> ⚠️ **Changed in Godot 4.7:** Methods that override a method with a typed return now inherit the return type, so an override without an explicit `return` statement becomes an error. Add `return null` (or a typed return value) at the end of the override. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

```gdscript
class Enemy:
    var weapon: Node
    func get_weapon() -> Node:
        return weapon

class UnarmedEnemy extends Enemy:
    func get_weapon():  # 4.7+: inherits -> Node from Enemy
        return null     # explicit return now required — omitting it is an error
```

---

## 2. Await & Coroutines

### Awaiting Signals

`await` pauses the function until a signal fires, then resumes. The function becomes a coroutine.

```gdscript
func death_sequence() -> void:
    $AnimationPlayer.play("death")
    await $AnimationPlayer.animation_finished  # pauses here

    $Sprite2D.visible = false
    await get_tree().create_timer(1.0).timeout  # wait 1 second

    queue_free()
```

### Awaiting with Return Values

```gdscript
# Signal that passes data
signal dialogue_choice_made(choice: int)

func show_dialogue(options: Array[String]) -> int:
    # ... display UI ...
    var choice: int = await dialogue_choice_made
    return choice

# Caller:
func _on_npc_interact() -> void:
    var result := await show_dialogue(["Yes", "No"])
    if result == 0:
        print("Player said yes")
```

### Timer Patterns

```gdscript
# One-shot delay
await get_tree().create_timer(0.5).timeout

# Repeating with await (simple but blocks the function)
for i in 5:
    do_something()
    await get_tree().create_timer(0.2).timeout

# Non-blocking timer — use SceneTreeTimer or Tween instead
get_tree().create_timer(2.0).timeout.connect(_on_delayed_action)
```

### Coroutine Safety

```gdscript
# DANGER: node may be freed while awaiting
func unsafe_coroutine() -> void:
    await get_tree().create_timer(5.0).timeout
    position = Vector2.ZERO  # crash if node was freed during wait!

# SAFE: check validity after await
func safe_coroutine() -> void:
    await get_tree().create_timer(5.0).timeout
    if not is_instance_valid(self):
        return
    position = Vector2.ZERO
```

---

## 3. Lambda Functions

Lambdas are inline anonymous functions, useful for callbacks, sorting, filtering.

### Basic Syntax

```gdscript
# Single-expression lambda
var double := func(x: int) -> int: return x * 2

# Multi-line lambda
var greet := func(name: String) -> void:
    print("Hello, %s!" % name)
    print("Welcome!")

# Calling a lambda
double.call(5)  # returns 10
greet.call("Player")
```

### With Signals

```gdscript
# Inline signal connection (one-off use)
$Button.pressed.connect(func(): print("Button pressed!"))

# With arguments
$Timer.timeout.connect(func():
    health -= 1
    if health <= 0:
        die()
)

# One-shot connection (auto-disconnects after first call)
$Timer.timeout.connect(func(): print("Once!"), CONNECT_ONE_SHOT)
```

### With Array Methods

```gdscript
var numbers: Array[int] = [1, 2, 3, 4, 5, 6, 7, 8]

# Filter — keep elements where lambda returns true
var evens: Array[int] = numbers.filter(func(n: int) -> bool: return n % 2 == 0)
# [2, 4, 6, 8]

# Map — transform each element
var doubled: Array[int] = numbers.map(func(n: int) -> int: return n * 2)
# [2, 4, 6, 8, 10, 12, 14, 16]

# Reduce — accumulate into single value
var total: int = numbers.reduce(func(acc: int, n: int) -> int: return acc + n, 0)
# 36

# Any / All
var has_negative: bool = numbers.any(func(n: int) -> bool: return n < 0)
var all_positive: bool = numbers.all(func(n: int) -> bool: return n > 0)

# Sort with custom comparison
var items: Array[Dictionary] = [{"name": "B", "value": 2}, {"name": "A", "value": 1}]
items.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return a["value"] < b["value"])
```

### Closures (Capturing Variables)

```gdscript
func create_counter(start: int) -> Callable:
    var count := start
    return func() -> int:
        count += 1
        return count

var counter := create_counter(0)
print(counter.call())  # 1
print(counter.call())  # 2
```

---

## 4. Match / Pattern Matching

GDScript's `match` is like `switch` but with pattern support.

### Basic Match

```gdscript
match state:
    State.IDLE:
        play_idle()
    State.RUNNING:
        play_run()
    State.JUMPING, State.FALLING:  # multiple patterns
        play_air()
    _:  # default (wildcard)
        push_warning("Unknown state: %s" % state)
```

### Pattern Types

```gdscript
# Literal patterns
match value:
    42:
        print("The answer")
    "hello":
        print("Greeting")
    true:
        print("Boolean true")

# Binding pattern — captures value into a variable
match command:
    ["move", var direction]:
        move(direction)
    ["attack", var target, var damage]:
        attack(target, damage)

# Array pattern
match input:
    [1, 2, 3]:
        print("Exact match")
    [1, ..]:
        print("Starts with 1")
    [var first, _, var last]:
        print("First: %s, Last: %s" % [first, last])

# Dictionary pattern
match event:
    {"type": "damage", "amount": var amt}:
        take_damage(amt)
    {"type": "heal", "amount": var amt}:
        heal(amt)

# Nested condition inside a branch
match enemy_type:
    "boss":
        if health < 50:
            enter_rage_mode()
        else:
            normal_attack()
```

---

## 5. Export Annotations

`@export` exposes a variable to the Inspector. Hint variants (`@export_range`, `@export_enum`, `@export_file`) constrain editor input. Use `@export_group` and `@export_subgroup` to organize. Node and Resource exports use NodePath / typed Resource references.

> See [references/export-annotations.md](references/export-annotations.md) for the full export annotation catalog (basic exports, range/hint variants, groups, node and Resource exports).

---

## 6. Inner Classes & class_name

### class_name

Register a script as a global class name — available everywhere without `preload`.

```gdscript
# item_data.gd
class_name ItemData
extends Resource

@export var name: String
@export var icon: Texture2D
@export var value: int

# Now usable anywhere:
# var item: ItemData = ItemData.new()
# var items: Array[ItemData] = []
```

### Inner Classes

```gdscript
# Define a class inside another script
class HitResult:
    var damage: int
    var critical: bool
    var knockback: Vector2

    func _init(dmg: int, crit: bool, kb: Vector2 = Vector2.ZERO) -> void:
        damage = dmg
        critical = crit
        knockback = kb

# Usage
func calculate_hit() -> HitResult:
    var crit := randf() < 0.2
    var dmg := 10 * (2 if crit else 1)
    return HitResult.new(dmg, crit, Vector2.RIGHT * 50)
```

---

## 7. super() in Virtual Methods

When you override a virtual method that the engine calls (`_ready`, `_process`, `_input`, etc.) and your parent class also implements it, call `super()` to chain the parent's behavior. Forgetting to call `super._ready()` is the most common cause of "my base class init didn't run" bugs.

> See [references/super-in-virtual-methods.md](references/super-in-virtual-methods.md) for the full pattern (problem / fix), the C# `base.X()` equivalent, and a catalog of bugs from missing super calls.

---

## 8. Common Idioms

The recurring small patterns: ternary expressions (`value if cond else other`), printf-style string formatting (`"%s %d" % [a, b]`), null/empty checks (`is_instance_valid` vs `!= null`, empty Array/String checks), Dictionary access (`get(key, default)`), Array operations (`Array.has`, `Array.find`, `Array.has_all`), setget via `set` and `get` accessors.

> See [references/common-idioms.md](references/common-idioms.md) for full code examples of each idiom.

---

## 9. Annotations Reference

| Annotation            | Purpose                                    |
|-----------------------|--------------------------------------------|
| `@export`             | Expose variable in Inspector               |
| `@export_range`       | Numeric with slider                        |
| `@export_enum`        | Dropdown from string list                  |
| `@export_file`        | File path picker                           |
| `@export_dir`         | Directory picker                           |
| `@export_multiline`   | Multi-line text box                        |
| `@export_group`       | Group heading in Inspector                 |
| `@export_subgroup`    | Subgroup heading                           |
| `@export_category`    | Category divider                           |
| `@onready`            | Initialize when node enters tree, just before `_ready()` body runs |
| `@tool`               | Run script in editor                       |
| `@icon`               | Custom icon for the script                 |
| `@warning_ignore`     | Suppress specific warning on next line     |
| `@static_unload`      | Allow static variables to be freed         |

---

## 10. Common Pitfalls

| Symptom                               | Cause                                       | Fix                                                              |
|---------------------------------------|----------------------------------------------|------------------------------------------------------------------|
| `as` cast silently returns `null`     | Type mismatch — `as` doesn't error          | Use `is` check first, then cast                                  |
| Await never resumes                   | Signal never emitted, or node freed          | Check `is_instance_valid(self)` after await; ensure signal fires |
| Lambda captures stale variable        | Loop variable captured by reference          | Copy to local var before lambda: `var local := i`                |
| `UNTYPED_DECLARATION` warnings flood  | Warning enabled but codebase isn't typed     | Type incrementally; use `@warning_ignore` for legacy code        |
| Typed array rejects valid items       | Item type doesn't match exactly              | Ensure items match the declared type (no implicit upcasting)     |
| `@onready` is `null`                  | Accessed before `_ready()` runs              | Never access `@onready` vars in `_init()` or variable declarations |
| Match doesn't enter any branch        | No matching pattern and no `_:` wildcard     | Always add `_:` default branch                                   |
| `class_name` conflict                 | Two scripts with same `class_name`           | Use unique names; check for duplicates in Project                |
| Export group applies to wrong vars     | Group scope continues until next group       | Add a new `@export_group("")` to end the group scope             |
| Parent `_ready()` logic doesn't run in child | Missing `super()` call in child's `_ready()` | Add `super()` as first line; see Section 7 |
| `type_exists()` flagged as deprecated | Deprecated in Godot 4.7                      | Use `ClassDB.class_exists()` instead                             |

> ⚠️ **Changed in Godot 4.7:** The global `type_exists()` function is deprecated — replace `type_exists("Sprite2D")` with `ClassDB.class_exists("Sprite2D")`. See [GH-116899](https://github.com/godotengine/godot/pull/116899).

---

## 12. Variadic Functions (Godot 4.5+)

Godot 4.5 added trailing-argument arrays via `...args`. The args are collected into an `Array`. Useful for printf-style helpers and flexible APIs without overloads.

> See [references/variadic-functions.md](references/variadic-functions.md) for the full syntax, common patterns, and notes on when to prefer overloads.

---

## 13. Abstract Classes and Methods (Godot 4.5+)

The `@abstract` annotation prevents direct instantiation of a class and forces subclasses to implement any `@abstract`-annotated method (similar to C#'s `abstract` keyword).

> See [references/abstract-classes.md](references/abstract-classes.md) for full base-class patterns and subclass implementation rules.

---

## 11. Implementation Checklist

- [ ] All variables, parameters, and return types have explicit type hints
- [ ] Typed arrays (`Array[Type]`) are used instead of untyped `Array` where possible
- [ ] `await` calls are followed by `is_instance_valid(self)` checks when the node could be freed
- [ ] Lambdas connected to signals are simple — complex logic goes in named methods
- [ ] `match` statements include a `_:` default branch
- [ ] `@export` variables use appropriate hints (`@export_range`, `@export_enum`, etc.)
- [ ] `@export_group` organizes Inspector properties into logical sections
- [ ] `class_name` is only used for scripts that need global visibility
- [ ] `is` type check precedes `as` cast when the type isn't guaranteed
- [ ] Properties with setters validate and clamp values
- [ ] Overridden virtual methods call `super()` when extending non-built-in base classes
- [ ] Variadic functions (`...args`) used when the number of trailing arguments is open-ended (Godot 4.5+)
- [ ] Base classes that must not be instantiated use `@abstract`; required methods use `@abstract func` (Godot 4.5+)
