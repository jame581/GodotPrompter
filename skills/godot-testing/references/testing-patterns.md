# Testing Patterns

Reference for `skills/godot-testing/SKILL.md` — testing scenes with nodes, signal testing, mocking/doubling, awaiting async operations.

> ← Back to [SKILL.md](../SKILL.md)

---
## Testing Patterns

### Scenes with Nodes

Always use `add_child_autofree` (GUT) or `auto_free` (gdUnit4) so nodes are freed after each test. Never call `queue_free()` manually inside tests — it causes race conditions.

#### GUT

```gdscript
func before_each() -> void:
    # add_child_autofree: adds to scene tree AND frees after test
    var scene := preload("res://scenes/player.tscn")
    _player = add_child_autofree(scene.instantiate())

    # autofree: frees after test but does NOT add to scene tree
    _resource = autofree(MyResource.new())
```

#### gdUnit4 (GDScript)

```gdscript
func before_test() -> void:
    var scene := preload("res://scenes/player.tscn")
    _player = auto_free(scene.instantiate())
    add_child(_player)
```

#### gdUnit4 (C#)

```csharp
[BeforeTest]
public void BeforeTest()
{
    var scene = GD.Load<PackedScene>("res://scenes/player.tscn");
    _player = AutoFree(scene.Instantiate<Player>());
    ((SceneTree)Engine.GetMainLoop()).Root.AddChild(_player); // suites are not Nodes
}
```

### Signal Testing

#### GUT

```gdscript
func test_health_emits_signal() -> void:
    watch_signals(_health)
    _health.take_damage(10)

    # Assert signal was emitted
    assert_signal_emitted(_health, "health_changed")

    # Assert signal was emitted with specific arguments
    assert_signal_emitted_with_parameters(_health, "health_changed", [100, 90])

    # Assert signal was NOT emitted
    assert_signal_not_emitted(_health, "died")
```

#### gdUnit4 (GDScript)

```gdscript
func test_health_emits_signal() -> void:
    var monitor := monitor_signals(_health)
    _health.take_damage(10)

    # is_emitted() waits for the signal, so it must be awaited.
    await assert_signal(monitor).is_emitted("health_changed")
    await assert_signal(monitor).is_emitted("health_changed", [100, 90])
    await assert_signal(monitor).is_not_emitted("died")
```

#### gdUnit4 (C#)

```csharp
[TestCase]
public async Task HealthEmitsSignal()
{
    AssertSignal(_health).StartMonitoring();
    _health.TakeDamage(10);

    await AssertSignal(_health).IsEmitted(HealthComponent.SignalName.HealthChanged).WithTimeout(100);
    await AssertSignal(_health).IsEmitted(HealthComponent.SignalName.HealthChanged, 100, 90).WithTimeout(100);
    await AssertSignal(_health).IsNotEmitted(HealthComponent.SignalName.Died).WithTimeout(100);
}
```

### Mocking / Doubling

Use doubles/mocks to isolate the unit under test from dependencies.

#### GUT — `double()` and `stub()`

```gdscript
func test_player_uses_health_component() -> void:
    # double() returns a doubled class; .new() makes the instance.
    # Methods of a full double do nothing and return null.
    var mock_health = double(HealthComponent).new()
    stub(mock_health, "take_damage")  # no-op stub
    # Only methods can be stubbed — current_health is a property.

    _player.health_component = mock_health
    _player.take_hit(25)

    # Verify the method was called
    assert_called(mock_health, "take_damage")
    assert_called(mock_health, "take_damage", [25])  # with these arguments
```

#### gdUnit4 (GDScript) — `mock()`

```gdscript
func test_player_uses_health_component() -> void:
    var mock_health = mock(HealthComponent)
    # do_return(x).on(mock).method() stubs methods only — current_health is a property.

    _player.health_component = mock_health
    _player.take_hit(25)

    verify(mock_health).take_damage(25)
```

#### gdUnit4 (C#) — hand-rolled fake

gdUnit4Net has no `mock()`, `spy()` or `verify()`; those are GDScript-only. Subclass the dependency (its methods must be `virtual`) or inject an interface:

```csharp
public partial class FakeHealth : HealthComponent
{
    public int LastDamage { get; private set; } = -1;
    public override void TakeDamage(int amount) => LastDamage = amount;
}

[TestCase]
public void PlayerUsesHealthComponent()
{
    var fakeHealth = AutoFree(new FakeHealth());

    _player.HealthComponent = fakeHealth;
    _player.TakeHit(25);

    AssertThat(fakeHealth.LastDamage).IsEqual(25);
}
```

### Waiting for Async Operations

#### GUT

```gdscript
func test_tween_completes() -> void:
    _player.start_move_tween()

    # Wait a fixed duration
    await wait_seconds(0.5)
    assert_eq(_player.position, Vector2(100, 0))

    # Wait a number of frames
    await wait_frames(10)
    assert_true(_player.tween_finished)
```

#### gdUnit4 (GDScript)

```gdscript
func test_tween_completes() -> void:
    _player.start_move_tween()
    await await_millis(500)
    assert_that(_player.position).is_equal(Vector2(100, 0))
```

#### gdUnit4 (C#)

```csharp
[TestCase(Timeout = 1000)]
public async Task TweenCompletes()
{
    _player.StartMoveTween();
    await _player.ToSignal(_player.GetTree().CreateTimer(0.5), SceneTreeTimer.SignalName.Timeout);
    AssertThat(_player.Position).IsEqual(new Vector2(100, 0));
}
```

---

