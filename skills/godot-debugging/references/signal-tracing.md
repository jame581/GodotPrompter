# Signal Tracing

Reference for `skills/godot-debugging/SKILL.md` — inspecting signal connections at runtime, common signal issues catalog. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 3. Signal Debugging

### Inspecting Connections at Runtime

```gdscript
# List all connections on a signal
func _ready() -> void:
    var connections := health_component.get_signal_connection_list("health_changed")
    for conn in connections:
        print("Signal 'health_changed' connected to: ", conn["callable"])

# Check whether a specific callable is connected
if health_component.is_connected("health_changed", _on_health_changed):
    print("Connected")
else:
    push_warning("health_changed signal not connected — UI will not update")

# List all signals a node has emitted connections for
for sig in get_signal_list():
    var conns := get_signal_connection_list(sig["name"])
    if conns.size() > 0:
        print("Signal '%s': %d connection(s)" % [sig["name"], conns.size()])
```

### C\#

```csharp
// List all connections on a signal
var connections = healthComponent.GetSignalConnectionList("HealthChanged");
foreach (var conn in connections)
{
    GD.Print("HealthChanged connected to: ", conn["callable"]);
}

// Check whether a specific callable is connected
bool isConnected = healthComponent.IsConnected(
    HealthComponent.SignalName.HealthChanged,
    new Callable(this, MethodName.OnHealthChanged)
);
GD.Print("Connected: ", isConnected);

// List all signals a node has emitted connections for
foreach (var sig in GetSignalList())
{
    var conns = GetSignalConnectionList(sig["name"].AsStringName());
    if (conns.Count > 0)
        GD.Print($"Signal '{sig["name"]}': {conns.Count} connection(s)");
}
```

### Common Signal Issues

**Signal connected but not firing**

```gdscript
# WRONG — connecting to a signal that does not exist on the node
enemy.connect("dead", _on_enemy_dead)   # typo or wrong node type

# RIGHT — verify signal exists before connecting, or use typed references
assert("dead" in enemy.get_signal_list().map(func(s): return s["name"]),
    "Signal 'dead' not found on %s" % enemy.name)
enemy.dead.connect(_on_enemy_dead)
```

```csharp
// WRONG — connecting to a signal that does not exist (typo or wrong node type)
enemy.Connect("Dead", new Callable(this, MethodName.OnEnemyDead)); // silent failure

// RIGHT — verify signal exists before connecting
System.Diagnostics.Debug.Assert(
    enemy.HasSignal("Dead"),
    $"Signal 'Dead' not found on {enemy.Name}");
enemy.Connect(Enemy.SignalName.Dead, new Callable(this, MethodName.OnEnemyDead));
```

**Wrong argument count or types**

```gdscript
# Signal declared with one argument
signal item_picked_up(item: Item)

# WRONG receiver — missing argument causes "Expected 1 arguments" error
func _on_item_picked_up() -> void:
    print("picked up something")

# RIGHT — signature must match
func _on_item_picked_up(item: Item) -> void:
    print("picked up: ", item.display_name)
```

```csharp
// Signal declared with one argument
[Signal] public delegate void ItemPickedUpEventHandler(Item item);

// WRONG receiver — missing parameter causes argument count error
private void OnItemPickedUp() { GD.Print("picked up something"); }

// RIGHT — signature must match the delegate
private void OnItemPickedUp(Item item) { GD.Print("picked up: ", item.DisplayName); }
```

**Signal connected to a freed node**

```gdscript
# Use CONNECT_ONE_SHOT for single-fire connections to avoid stale connections
enemy.died.connect(_on_enemy_died, CONNECT_ONE_SHOT)

# Or disconnect explicitly before freeing
func _exit_tree() -> void:
    if health_component.is_connected("health_changed", _on_health_changed):
        health_component.disconnect("health_changed", _on_health_changed)

# A lambda's connection is removed when the object that created it is freed, so it
# never runs on a freed `self`. The risk is a captured node freed first: every emit
# logs "Lambda capture at index 0 was freed". Connect the target's own method instead;
# that connection is removed when the target is freed.
some_node.some_signal.connect(target.do_work)
```

```csharp
// Use CONNECT_ONE_SHOT for single-fire connections to avoid stale connections
enemy.Connect(Enemy.SignalName.Died,
    new Callable(this, MethodName.OnEnemyDied),
    (uint)GodotObject.ConnectFlags.OneShot);

// Or disconnect explicitly before freeing
public override void _ExitTree()
{
    if (healthComponent.IsConnected(
        HealthComponent.SignalName.HealthChanged,
        new Callable(this, MethodName.OnHealthChanged)))
    {
        healthComponent.Disconnect(
            HealthComponent.SignalName.HealthChanged,
            new Callable(this, MethodName.OnHealthChanged));
    }
}

// Guard lambda captures with IsInstanceValid
someNode.Connect(SomeNode.SignalName.SomeSignal,
    Callable.From(() =>
    {
        if (GodotObject.IsInstanceValid(this))
            DoWork();
    }));
```

**Signal emitted before receiver is ready**

```gdscript
# Autoload emits a signal during _ready before the main scene is fully loaded
# FIX — defer emission to the next frame
func _ready() -> void:
    call_deferred("_emit_ready_signal")

func _emit_ready_signal() -> void:
    game_ready.emit()
```

```csharp
// Autoload emits a signal during _Ready before the main scene is fully loaded
// FIX — defer emission to the next frame
public override void _Ready()
{
    CallDeferred(MethodName.EmitReadySignal);
}

private void EmitReadySignal()
{
    EmitSignal(SignalName.GameReady);
}
```

---

