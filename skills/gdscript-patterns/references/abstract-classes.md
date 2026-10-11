# Abstract Classes and Methods (Godot 4.5+)

Reference for `skills/gdscript-patterns/SKILL.md` — `@abstract` annotation, abstract base class patterns, when subclasses must implement.

> ← Back to [SKILL.md](../SKILL.md)

---
## 12. Abstract Classes and Methods (Godot 4.5+)

The `@abstract` annotation prevents a class from being instantiated directly and forces subclasses to implement any method annotated with `@abstract`. This is the GDScript equivalent of C#'s `abstract` keyword.

> **Note:** This skill is GDScript-specific by design. For C# patterns, see **csharp-godot** and **csharp-signals**.

```gdscript
# base_enemy.gd — abstract base class; cannot be instantiated directly.
# The class-level @abstract goes before class_name / extends.
@abstract
class_name BaseEnemy
extends CharacterBody2D

## Subclasses must implement this to define their attack behavior.
@abstract func perform_attack() -> void

## Subclasses must implement this to return their display name.
@abstract func get_display_name() -> String

# Non-abstract methods are fine — they provide shared behavior.
func take_damage(amount: int) -> void:
    health -= amount
    if health <= 0:
        die()

func die() -> void:
    print(get_display_name(), " has died")
    queue_free()

var health: int = 100
```

```gdscript
# melee_enemy.gd — concrete subclass
class_name MeleeEnemy
extends BaseEnemy

func perform_attack() -> void:
    $HitboxArea.monitoring = true
    await get_tree().create_timer(0.2).timeout
    $HitboxArea.monitoring = false

func get_display_name() -> String:
    return "Melee Enemy"
```

```gdscript
# ranged_enemy.gd — another concrete subclass
class_name RangedEnemy
extends BaseEnemy

@export var projectile_scene: PackedScene

func perform_attack() -> void:
    var proj: Node2D = projectile_scene.instantiate()
    proj.global_position = global_position
    get_tree().root.add_child(proj)

func get_display_name() -> String:
    return "Ranged Enemy"
```

> **Instantiation guard:** GDScript raises an error at runtime if you call `BaseEnemy.new()` directly. The `@abstract` annotation on the class is the guard — no constructor override needed.

> **Partial abstraction:** Only the methods annotated `@abstract` are required by subclasses. A class can be `@abstract` without any abstract methods (to signal "don't instantiate this directly") or can have abstract methods without the class-level annotation (each method still enforces implementation).

---

