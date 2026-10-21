# super() in Virtual Methods

Reference for `skills/gdscript-patterns/SKILL.md` — when `super()` is required in `_ready()`, `_process()`, etc.; the C# equivalent (base.X()); common bugs from missing super calls.

> ← Back to [SKILL.md](../SKILL.md)

---
## 7. super() in Virtual Methods

In Godot 4, overridden virtual methods (`_ready()`, `_process()`, `_physics_process()`, `_enter_tree()`, `_exit_tree()`, etc.) do **not** automatically call the parent implementation. You must call `super()` explicitly if the parent class has logic in that method.

### The Problem

```gdscript
# parent.gd
class_name EnemyBase
extends CharacterBody2D

func _ready() -> void:
    add_to_group("enemies")
    $HealthComponent.health_depleted.connect(_on_health_depleted)

# child.gd — BUG: parent _ready() never runs!
extends EnemyBase

func _ready() -> void:
    $NavigationAgent2D.velocity_computed.connect(_on_velocity_computed)
    # Parent's group registration and signal connection are LOST
```

### The Fix

```gdscript
# child.gd — CORRECT: call super() to run parent _ready()
extends EnemyBase

func _ready() -> void:
    super()  # runs EnemyBase._ready() — group add + signal connect
    $NavigationAgent2D.velocity_computed.connect(_on_velocity_computed)
```

### C#

C# uses `base.MethodName()` — same concept:

```csharp
public partial class SpecialEnemy : EnemyBase
{
    public override void _Ready()
    {
        base._Ready(); // runs EnemyBase._Ready()
        GetNode<NavigationAgent2D>("NavigationAgent2D").VelocityComputed += OnVelocityComputed;
    }
}
```

### When super() Is Required

| Scenario | Call super()? |
|----------|---------------|
| Extending a **built-in** Godot class (Node, CharacterBody2D) | Not needed — engine handles internal callbacks |
| Extending **your own** base class with logic in the virtual | **Yes — always** |
| Extending a **third-party** class (addon, plugin) | **Yes — assume it has logic** |
| Multiple inheritance levels (A → B → C) | Each level calls `super()` to chain up |

### Common Bugs from Missing super()

| Symptom | Likely Cause |
|---------|-------------|
| Child node doesn't join a group set in parent `_ready()` | Missing `super()` in child `_ready()` |
| Signals connected in parent `_ready()` never fire | Missing `super()` — connections never made |
| Parent animation logic stops working in child | Missing `super()` in child `_process()` or `_physics_process()` |
| `@onready` vars in parent are null when child accesses them | Parent `_ready()` body never ran — those vars never initialized |

> **Rule of thumb:** If you extend a script that you or someone else wrote (not a bare Godot class), always call `super()` as the first line of any overridden virtual method.

---

