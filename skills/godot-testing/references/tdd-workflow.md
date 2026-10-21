# TDD Workflow — RED / GREEN / REFACTOR

Reference for `skills/godot-testing/SKILL.md` — full RED/GREEN/REFACTOR walkthrough with worked example. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## TDD Workflow: RED-GREEN-REFACTOR

### Step 1 — RED: Write a failing test

Write the test before the implementation exists. The test must fail for the right reason (missing class or wrong behavior — not a syntax error).

#### GDScript — GUT

```gdscript
# tests/unit/test_health_component.gd
extends GutTest

var _health: HealthComponent

func before_each() -> void:
    _health = HealthComponent.new()
    _health.max_health = 100
    add_child_autofree(_health)

func test_starts_at_max_health() -> void:
    assert_eq(_health.current_health, 100)

func test_take_damage_reduces_health() -> void:
    _health.take_damage(30)
    assert_eq(_health.current_health, 70)

func test_cannot_go_below_zero() -> void:
    _health.take_damage(200)
    assert_eq(_health.current_health, 0)

func test_heal_restores_health() -> void:
    _health.take_damage(50)
    _health.heal(20)
    assert_eq(_health.current_health, 70)

func test_heal_cannot_exceed_max() -> void:
    _health.heal(50)
    assert_eq(_health.current_health, 100)

func test_death_signal_emitted_at_zero() -> void:
    watch_signals(_health)
    _health.take_damage(100)
    assert_signal_emitted(_health, "died")
```

#### C# — gdUnit4

```csharp
// tests/unit/HealthComponentTest.cs
using Godot;
using GdUnit4;
using static GdUnit4.Assertions;

[TestSuite]
public partial class HealthComponentTest : GdUnit4.GdUnitTestSuite
{
    private HealthComponent _health = default!;

    [Before]
    public void Setup() { }

    [BeforeTest]
    public void BeforeTest()
    {
        _health = AutoFree(new HealthComponent());
        _health.MaxHealth = 100;
        AddChild(_health);
    }

    [TestCase]
    public void StartsAtMaxHealth()
        => AssertThat(_health.CurrentHealth).IsEqual(100);

    [TestCase]
    public void TakeDamageReducesHealth()
    {
        _health.TakeDamage(30);
        AssertThat(_health.CurrentHealth).IsEqual(70);
    }

    [TestCase]
    public void CannotGoBelowZero()
    {
        _health.TakeDamage(200);
        AssertThat(_health.CurrentHealth).IsEqual(0);
    }

    [TestCase]
    public void HealRestoresHealth()
    {
        _health.TakeDamage(50);
        _health.Heal(20);
        AssertThat(_health.CurrentHealth).IsEqual(70);
    }

    [TestCase]
    public void HealCannotExceedMax()
    {
        _health.Heal(50);
        AssertThat(_health.CurrentHealth).IsEqual(100);
    }

    [TestCase]
    public async GdUnitAwaiter DeathSignalEmittedAtZero()
    {
        var monitor = MonitorSignals(_health);
        _health.TakeDamage(100);
        await monitor.AwaitSignal("died").WithTimeout(500);
        AssertSignal(monitor).IsEmitted("died");
    }
}
```

---

### Step 2 — GREEN: Minimal implementation

Write only enough code to make the tests pass. Do not add features that have no test yet.

#### GDScript

```gdscript
# src/components/health_component.gd
class_name HealthComponent
extends Node

signal died
signal health_changed(old_value: int, new_value: int)

@export var max_health: int = 100
var current_health: int

func _ready() -> void:
    current_health = max_health

func take_damage(amount: int) -> void:
    var old := current_health
    current_health = maxi(0, current_health - amount)
    health_changed.emit(old, current_health)
    if current_health == 0:
        died.emit()

func heal(amount: int) -> void:
    var old := current_health
    current_health = mini(max_health, current_health + amount)
    health_changed.emit(old, current_health)
```

#### C#

```csharp
// src/components/HealthComponent.cs
using Godot;

public partial class HealthComponent : Node
{
    [Signal] public delegate void DiedEventHandler();
    [Signal] public delegate void HealthChangedEventHandler(int oldValue, int newValue);

    [Export] public int MaxHealth { get; set; } = 100;
    public int CurrentHealth { get; private set; }

    public override void _Ready()
    {
        CurrentHealth = MaxHealth;
    }

    public void TakeDamage(int amount)
    {
        int old = CurrentHealth;
        CurrentHealth = Mathf.Max(0, CurrentHealth - amount);
        EmitSignal(SignalName.HealthChanged, old, CurrentHealth);
        if (CurrentHealth == 0)
            EmitSignal(SignalName.Died);
    }

    public void Heal(int amount)
    {
        int old = CurrentHealth;
        CurrentHealth = Mathf.Min(MaxHealth, CurrentHealth + amount);
        EmitSignal(SignalName.HealthChanged, old, CurrentHealth);
    }
}
```

---

### Step 3 — REFACTOR: Improve without changing behavior

All tests must still pass after refactoring. Common refactors:

- Extract a `_set_health()` helper to remove duplication between `take_damage` and `heal`
- Add `@export_range(0, 9999)` to `max_health` for editor clamping
- Add `is_dead` computed property
- Validate negative inputs with `assert(amount >= 0)`

```gdscript
# Refactored GDScript — tests still pass unchanged
class_name HealthComponent
extends Node

signal died
signal health_changed(old_value: int, new_value: int)

@export_range(0, 9999) var max_health: int = 100
var current_health: int

var is_dead: bool:
    get: return current_health == 0

func _ready() -> void:
    current_health = max_health

func take_damage(amount: int) -> void:
    assert(amount >= 0, "Damage amount must be non-negative")
    _set_health(current_health - amount)

func heal(amount: int) -> void:
    assert(amount >= 0, "Heal amount must be non-negative")
    _set_health(current_health + amount)

func _set_health(new_value: int) -> void:
    var old := current_health
    current_health = clamp(new_value, 0, max_health)
    if current_health != old:
        health_changed.emit(old, current_health)
    if current_health == 0:
        died.emit()
```

---

