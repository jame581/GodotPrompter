> ← Back to [SKILL.md](../SKILL.md)

# Event Bus Anti-patterns

## Using the event bus for everything (over-decoupling)

```gdscript
# BAD — a parent querying its own child through the event bus
# is unnecessarily indirect and hard to follow.
func _ready() -> void:
    EventBus.request_player_position.connect(_on_request_player_position)

func _on_request_player_position() -> void:
    EventBus.player_position_response.emit(global_position)

# GOOD — a parent can access its child directly.
var player_pos: Vector2 = $Player.global_position
```

```csharp
// BAD — a request/response round-trip through the bus to reach your own child.
public override void _Ready()
{
    _eventBus.RequestPlayerPosition += OnRequestPlayerPosition;
}

private void OnRequestPlayerPosition()
{
    _eventBus.EmitSignal(EventBus.SignalName.PlayerPositionResponse, GlobalPosition);
}

// GOOD — a parent can access its child directly. Read it in _Ready() or later; as a field
// initializer it would run before the node is in the tree.
public override void _Ready()
{
    Vector2 playerPos = GetNode<Node2D>("Player").GlobalPosition;
}
```

## Side effects in handlers that emit further signals

```gdscript
# BAD — handler emits another signal, which triggers another handler,
# which emits another signal. Tracing the flow requires reading all handlers.
func _on_player_died() -> void:
    _save_high_score()          # side effect
    EventBus.high_score_saved.emit()  # triggers yet another chain

# GOOD — each handler does one thing; orchestration lives in one place.
func _on_player_died() -> void:
    _show_death_screen()

# A dedicated GameManager handles multi-step reactions:
func _on_player_died() -> void:
    _save_high_score()
    get_tree().reload_current_scene()
```

```csharp
// BAD — the handler emits another signal, which triggers another handler, and so on.
// (One handler per class in real code; named apart here so the block compiles as written.)
private void OnPlayerDied_Bad()
{
    SaveHighScore();                                              // side effect
    _eventBus.EmitSignal(EventBus.SignalName.HighScoreSaved);     // triggers yet another chain
}

// GOOD — each handler does one thing.
private void OnPlayerDied() => ShowDeathScreen();

// A dedicated GameManager owns the multi-step reaction instead:
private void OnPlayerDied_InGameManager()
{
    SaveHighScore();
    GetTree().ReloadCurrentScene();
}
```

## Circular event chains

```gdscript
# BAD — PlayerHealth connects to health_changed and re-emits it.
func _on_health_changed(current: int, maximum: int) -> void:
    _current = current
    EventBus.health_changed.emit(_current, maximum)  # infinite loop

# GOOD — update internal state only; let the original emitter own the signal.
func _on_health_changed(current: int, maximum: int) -> void:
    _current = current
    _update_display()
```

```csharp
// BAD — the handler re-emits the very signal it handles: unbounded recursion until
// the stack overflows. Easier to write in C#, because `+=` gives no hint that the
// handler and the emitter are the same object.
private void OnHealthChanged(int current, int maximum)
{
    _current = current;
    _eventBus.EmitSignal(EventBus.SignalName.HealthChanged, _current, maximum); // infinite loop
}

// GOOD — update internal state only; the original emitter owns the signal.
private void OnHealthChanged(int current, int maximum)
{
    _current = current;
    UpdateDisplay();
}
```

## Connecting without disconnecting in C#

```csharp
// BAD — node is freed but EventBus still holds a reference to the delegate.
// The next emission raises an InvalidOperationException or silently leaks memory.
public override void _Ready()
{
    GetNode<EventBus>("/root/EventBus").PlayerDied += OnPlayerDied;
    // No _ExitTree() override — memory leak.
}

// GOOD — always pair Connect with Disconnect in C#.
public override void _ExitTree()
{
    GetNode<EventBus>("/root/EventBus").PlayerDied -= OnPlayerDied;
}
```
