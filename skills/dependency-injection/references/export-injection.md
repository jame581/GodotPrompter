# @export Node Injection

Reference for `skills/dependency-injection/SKILL.md` — exposing dependencies as `@export` properties for Inspector wiring. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. @export Node Injection

The most Godot-idiomatic DI pattern. Declare a dependency as `@export` and wire it in the editor Inspector — or assign it from a parent in code. The node never needs to know *where* its dependency lives in the tree.

This is preferred over `get_node("../../SomeNode")` hard-coded paths, which break silently when the scene tree is reorganised.

### GDScript

```gdscript
# health_component.gd — receives its audio dependency via @export
class_name HealthComponent
extends Node

@export var audio: AudioManager          ## Set in the Inspector or by parent
@export var max_health: int = 100

var current_health: int


func _ready() -> void:
    current_health = max_health


func take_damage(amount: int) -> void:
    current_health = clampi(current_health - amount, 0, max_health)
    # Uses the injected reference — no direct autoload access
    if audio != null:
        audio.play_sfx("hurt")
    health_changed.emit(current_health, max_health)
    if current_health == 0:
        died.emit()


signal health_changed(current: int, maximum: int)
signal died
```

```gdscript
# player.gd — wires the component in the editor or in _ready()
extends CharacterBody2D

@export var health: HealthComponent      ## Drag HealthComponent node here in Inspector
```

### C#

```csharp
using Godot;

/// <summary>
/// Reusable health component. Wire dependencies via the Inspector.
/// </summary>
public partial class HealthComponent : Node
{
    [Export] public AudioManager Audio { get; set; }   // Set in Inspector or by parent
    [Export] public int MaxHealth { get; set; } = 100;

    [Signal] public delegate void HealthChangedEventHandler(int current, int maximum);
    [Signal] public delegate void DiedEventHandler();

    private int _currentHealth;

    public override void _Ready()
    {
        _currentHealth = MaxHealth;
    }

    public void TakeDamage(int amount)
    {
        _currentHealth = Mathf.Clamp(_currentHealth - amount, 0, MaxHealth);
        Audio?.PlaySfx("hurt");
        EmitSignal(SignalName.HealthChanged, _currentHealth, MaxHealth);
        if (_currentHealth == 0)
            EmitSignal(SignalName.Died);
    }
}
```

```csharp
using Godot;

public partial class Player : CharacterBody2D
{
    // Drag HealthComponent node here in the Inspector
    [Export] public HealthComponent Health { get; set; }
}
```

---

