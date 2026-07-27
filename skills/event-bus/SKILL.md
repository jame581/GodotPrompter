---
name: event-bus
description: Use when implementing decoupled communication between nodes — global EventBus autoload with typed signals
---

# Event Bus in Godot 4.3+

A global signal hub that lets unrelated nodes communicate without holding references to each other. All examples target Godot 4.3+ with no deprecated APIs.

> **Related skills:** **component-system** for direct signal communication between components, **csharp-signals** for C#-specific signal patterns, **dependency-injection** for alternative decoupling approaches, **ability-system** for an EventBus usage example with ability events.

---

## 1. What is an Event Bus

An EventBus is a singleton autoload that acts as a central registry for signals. Instead of nodes connecting directly to each other, every node connects to (or emits on) the shared EventBus. This removes the need for one node to hold a reference to another.

```
Without EventBus             With EventBus
──────────────               ──────────────────────────
NodeA ──signal──► NodeB      NodeA ──emit──► EventBus ──signal──► NodeB
                                                       ──signal──► NodeC
                                                       ──signal──► NodeD
```

**Flow diagram**

```
┌─────────┐   emit(player_died)   ┌───────────┐   player_died   ┌──────────┐
│  NodeA  │ ────────────────────► │ EventBus  │ ───────────────► │  NodeB   │
│(Player) │                       │(Autoload) │                  │   (UI)   │
└─────────┘                       └───────────┘ ───────────────► └──────────┘
                                                  player_died    ┌──────────┐
                                                                 │  NodeC   │
                                                                 │(AudioMgr)│
                                                                 └──────────┘
```

NodeA emits the signal. NodeB and NodeC each connected to EventBus independently. Neither knows the other exists.

---

## 2. When to Use vs Direct Signals

| Scenario | Recommended approach |
|--------------------------------------------|-------------------------------|
| Parent notifying its own child | Direct signal or method call |
| Child notifying its parent | Direct signal (bubble up) |
| Two nodes with the same parent | Direct signal via parent |
| Completely unrelated nodes in the tree | Event bus |
| UI reacting to gameplay state changes | Event bus |
| Audio manager reacting to game events | Event bus |
| Data manager / save system reacting | Event bus |
| Tight, performance-sensitive inner loop | Direct method call |

**Rule of thumb:** if you would otherwise need `get_node("../../SomeDistantNode")` or a hard-coded NodePath, the event bus is a better fit.

---

## 3. Basic EventBus

Create `res://autoloads/event_bus.gd` (or `EventBus.cs`), then register it in **Project → Project Settings → Autoload** with the name `EventBus`.

### GDScript (`autoloads/event_bus.gd`)

```gdscript
extends Node

## Emitted when the player character has died.
signal player_died

## Emitted whenever the score changes.
signal score_changed(new_score: int)

## Emitted when a level finishes successfully.
signal level_completed(level_id: int)

## Emitted when the player picks up a collectible.
signal item_collected(item_name: String)

## Emitted when the player's health changes.
signal health_changed(current: int, maximum: int)
```

### C# (`Autoloads/EventBus.cs`)

```csharp
using Godot;

/// <summary>
/// Global signal hub. Register as an autoload named "EventBus".
/// </summary>
public partial class EventBus : Node
{
    /// <summary>Emitted when the player character has died.</summary>
    [Signal] public delegate void PlayerDiedEventHandler();

    /// <summary>Emitted whenever the score changes.</summary>
    [Signal] public delegate void ScoreChangedEventHandler(int newScore);

    /// <summary>Emitted when a level finishes successfully.</summary>
    [Signal] public delegate void LevelCompletedEventHandler(int levelId);

    /// <summary>Emitted when the player picks up a collectible.</summary>
    [Signal] public delegate void ItemCollectedEventHandler(string itemName);

    /// <summary>Emitted when the player's health changes.</summary>
    [Signal] public delegate void HealthChangedEventHandler(int current, int maximum);
}
```

---

## 4. Connecting to Events

Consumers connect in `_ready()`. In C#, always disconnect in `_ExitTree()` to avoid dangling delegates and memory leaks.

### GDScript

```gdscript
extends CanvasLayer

# GDScript connections are reference-counted and cleaned up automatically
# when the node is freed, but explicit disconnection is still good practice
# for long-lived nodes that reconnect frequently.

func _ready() -> void:
    EventBus.player_died.connect(_on_player_died)
    EventBus.score_changed.connect(_on_score_changed)
    EventBus.health_changed.connect(_on_health_changed)


func _exit_tree() -> void:
    EventBus.player_died.disconnect(_on_player_died)
    EventBus.score_changed.disconnect(_on_score_changed)
    EventBus.health_changed.disconnect(_on_health_changed)


func _on_player_died() -> void:
    $DeathScreen.show()


func _on_score_changed(new_score: int) -> void:
    $ScoreLabel.text = "Score: %d" % new_score


func _on_health_changed(current: int, maximum: int) -> void:
    $HealthBar.value = float(current) / float(maximum) * 100.0
```

### C#

```csharp
using Godot;

public partial class HudLayer : CanvasLayer
{
    private EventBus _eventBus;

    public override void _Ready()
    {
        _eventBus = GetNode<EventBus>("/root/EventBus");

        // Connect using strongly-typed delegate handlers
        _eventBus.PlayerDied      += OnPlayerDied;
        _eventBus.ScoreChanged    += OnScoreChanged;
        _eventBus.HealthChanged   += OnHealthChanged;
    }

    // IMPORTANT: Always disconnect in _ExitTree() in C#.
    // C# delegates are not automatically cleaned up when a node is freed.
    // Failing to disconnect causes the EventBus to hold a reference to the
    // freed node, leading to memory leaks and InvalidOperationExceptions.
    public override void _ExitTree()
    {
        _eventBus.PlayerDied    -= OnPlayerDied;
        _eventBus.ScoreChanged  -= OnScoreChanged;
        _eventBus.HealthChanged -= OnHealthChanged;
    }

    private void OnPlayerDied()
    {
        GetNode<Control>("DeathScreen").Show();
    }

    private void OnScoreChanged(int newScore)
    {
        GetNode<Label>("ScoreLabel").Text = $"Score: {newScore}";
    }

    private void OnHealthChanged(int current, int maximum)
    {
        GetNode<ProgressBar>("HealthBar").Value = (double)current / maximum * 100.0;
    }
}
```

---

## 5. Emitting Events

Producers call `EventBus.<signal_name>.emit(...)` (GDScript) or `EmitSignal(SignalName.*)` (C#). The producer does not know which nodes are listening.

### GDScript

```gdscript
extends CharacterBody2D

@export var max_health: int = 100
var current_health: int = max_health
var score: int = 0


func take_damage(amount: int) -> void:
    current_health = clampi(current_health - amount, 0, max_health)
    EventBus.health_changed.emit(current_health, max_health)

    if current_health == 0:
        EventBus.player_died.emit()


func add_score(points: int) -> void:
    score += points
    EventBus.score_changed.emit(score)


func collect_item(item_name: String) -> void:
    EventBus.item_collected.emit(item_name)


func complete_level(level_id: int) -> void:
    EventBus.level_completed.emit(level_id)
```

### C#

```csharp
using Godot;

public partial class Player : CharacterBody2D
{
    [Export] public int MaxHealth { get; set; } = 100;

    private int _currentHealth;
    private int _score;
    private EventBus _eventBus;

    public override void _Ready()
    {
        _currentHealth = MaxHealth;
        _eventBus = GetNode<EventBus>("/root/EventBus");
    }

    public void TakeDamage(int amount)
    {
        _currentHealth = Mathf.Clamp(_currentHealth - amount, 0, MaxHealth);
        _eventBus.EmitSignal(EventBus.SignalName.HealthChanged, _currentHealth, MaxHealth);

        if (_currentHealth == 0)
            _eventBus.EmitSignal(EventBus.SignalName.PlayerDied);
    }

    public void AddScore(int points)
    {
        _score += points;
        _eventBus.EmitSignal(EventBus.SignalName.ScoreChanged, _score);
    }

    public void CollectItem(string itemName)
    {
        _eventBus.EmitSignal(EventBus.SignalName.ItemCollected, itemName);
    }

    public void CompleteLevel(int levelId)
    {
        _eventBus.EmitSignal(EventBus.SignalName.LevelCompleted, levelId);
    }
}
```

---

## 6. Typed Signal Parameters

Type every signal parameter. An untyped bus degrades into "what shape is this payload?" archaeology at every call site, and typos in parameter counts only surface at runtime. For anything richer than two or three primitives, pass a small `Resource` or a `class_name`'d data object rather than growing the parameter list.

Typed signal declarations, payload-object patterns, and the C# `[Signal]` delegate equivalents: [references/typed-signals.md](references/typed-signals.md)

---

## 7. Anti-patterns

Four recurring failures: routing **everything** through the bus when a parent could just reach its own child (over-decoupling); handlers whose side effects emit further signals, so tracing one event means reading every handler; **circular chains**, where a listener re-emits the signal it just received and loops forever; and connecting without disconnecting in C#, which leaks the handler for the bus's lifetime.

Each anti-pattern with the failing code, why it hurts, and the fix, in GDScript and C#: [references/anti-patterns.md](references/anti-patterns.md)

---

## 8. Testing

Use [GUT](https://github.com/bitwes/Gut) to verify both producer-side emission (`watch_signals(event_bus)` then `assert_signal_emitted_with_parameters(...)`) and consumer-side reactions (emit on the bus, then assert on the consumer's state). Always test against the real autoload EventBus retrieved via `get_tree().root.get_node("EventBus")`, not a fresh instance.

See [references/testing.md](references/testing.md) for full producer-side and consumer-side test files plus a GUT-helper reference table.

---

## 9. Checklist

- [ ] `EventBus` autoload is registered in **Project → Project Settings → Autoload**
- [ ] All signals use typed parameters (`signal foo(bar: int)`) — no untyped signals
- [ ] Every consumer connects in `_ready()` and disconnects in `_exit_tree()` (mandatory in C#)
- [ ] Producers emit through `EventBus`, not by calling consumer methods directly
- [ ] No node holds a direct reference to another unrelated node just to emit or receive signals
- [ ] Complex payloads use a `Resource` subclass, not a raw `Dictionary`
- [ ] No handler re-emits the same signal it just received (prevents infinite loops)
- [ ] No event bus signal used where a direct parent-child call or signal is simpler
- [ ] GUT tests cover both emission (producer) and reception (consumer) for critical signals
- [ ] C# handlers verified to disconnect in `_ExitTree()` before merging
