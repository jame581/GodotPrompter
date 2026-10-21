> ← Back to [SKILL.md](../SKILL.md)

# Testing the Event Bus

Use [GUT](https://github.com/bitwes/Gut) (Godot Unit Testing) to verify that signals are emitted and received correctly.

## Testing signal emission (producer side)

```gdscript
extends GutTest

var player: Player
var event_bus: Node


func before_each() -> void:
    # Use the real autoload EventBus (registered in project settings)
    event_bus = get_tree().root.get_node("EventBus")
    player = preload("res://player/player.tscn").instantiate()
    add_child_autofree(player)


func test_take_damage_emits_health_changed() -> void:
    watch_signals(event_bus)

    player.take_damage(10)

    assert_signal_emitted(event_bus, "health_changed")
    assert_signal_emitted_with_parameters(
        event_bus, "health_changed", [90, 100]
    )


func test_lethal_damage_emits_player_died() -> void:
    watch_signals(event_bus)

    player.take_damage(999)

    assert_signal_emitted(event_bus, "player_died")


func test_score_increments_correctly() -> void:
    watch_signals(event_bus)

    player.add_score(50)
    player.add_score(25)

    # Only the most recent emission is checked; use get_signal_emit_count for counts.
    assert_eq(event_bus.get_signal_emit_count("score_changed"), 2)
    assert_signal_emitted_with_parameters(event_bus, "score_changed", [75])
```

```csharp
// C# equivalent — gdUnit4 producer-side signal assertions
// Requires: gdUnit4 NuGet package (https://github.com/MikeSchulze/gdUnit4Net)
using GdUnit4;
using static GdUnit4.Assertions;

[TestSuite]
public partial class PlayerSignalTest
{
    private ISceneRunner _runner;
    private Player _player;
    private EventBus _eventBus;

    [BeforeTest]
    public void Setup()
    {
        _runner = ISceneRunner.Load("res://player/player.tscn");
        _player = _runner.Scene() as Player;
        // Use the real autoload EventBus (registered in project settings)
        _eventBus = _runner.Scene().GetTree().Root.GetNode<EventBus>("EventBus");
    }

    [AfterTest]
    public void TearDown() => _runner?.Dispose();

    [TestCase]
    public async Task TakeDamage_EmitsHealthChanged()
    {
        // Assert the signal fires with the expected (current=90, maximum=100) args
        var signalAssert = AssertSignal(_eventBus)
            .IsEmitted(nameof(EventBus.SignalName.HealthChanged))
            .WithArgs(90, 100);

        _player.TakeDamage(10);

        await signalAssert.WithTimeout(100);
    }

    [TestCase]
    public async Task LethalDamage_EmitsPlayerDied()
    {
        var signalAssert = AssertSignal(_eventBus)
            .IsEmitted(nameof(EventBus.SignalName.PlayerDied));

        _player.TakeDamage(999);

        await signalAssert.WithTimeout(100);
    }

    [TestCase]
    public async Task AddScore_EmitsScoreChangedTwice()
    {
        // Capture emissions via a counter helper before firing
        int emitCount = 0;
        _eventBus.ScoreChanged += (_) => emitCount++;

        _player.AddScore(50);
        _player.AddScore(25);

        // Allow one frame for signal processing
        await _runner.AwaitSignal(_runner.Scene().GetTree(), "process_frame").WithTimeout(500);

        AssertThat(emitCount).IsEqual(2);

        // Verify the cumulative value from the last emission
        var signalAssert = AssertSignal(_eventBus)
            .IsEmitted(nameof(EventBus.SignalName.ScoreChanged))
            .WithArgs(75);
        await signalAssert.WithTimeout(100);
    }
}
```

## Testing signal reception (consumer side)

```gdscript
extends GutTest

var hud: HudLayer
var event_bus: Node


func before_each() -> void:
    event_bus = get_tree().root.get_node("EventBus")
    hud = preload("res://ui/hud_layer.tscn").instantiate()
    add_child_autofree(hud)


func test_hud_shows_death_screen_on_player_died() -> void:
    var death_screen: Control = hud.get_node("DeathScreen")
    assert_false(death_screen.visible, "death screen should start hidden")

    event_bus.player_died.emit()

    assert_true(death_screen.visible, "death screen should be visible after player_died")


func test_hud_updates_score_label() -> void:
    event_bus.score_changed.emit(1234)

    assert_eq(hud.get_node("ScoreLabel").text, "Score: 1234")
```

```csharp
// C# equivalent — gdUnit4 consumer-side state assertions
using GdUnit4;
using static GdUnit4.Assertions;

[TestSuite]
public partial class HudLayerTest
{
    private ISceneRunner _runner;
    private HudLayer _hud;
    private EventBus _eventBus;

    [BeforeTest]
    public void Setup()
    {
        _runner = ISceneRunner.Load("res://ui/hud_layer.tscn");
        _hud = _runner.Scene() as HudLayer;
        _eventBus = _runner.Scene().GetTree().Root.GetNode<EventBus>("EventBus");
    }

    [AfterTest]
    public void TearDown() => _runner?.Dispose();

    [TestCase]
    public async Task PlayerDied_ShowsDeathScreen()
    {
        var deathScreen = _hud.GetNode<Control>("DeathScreen");
        AssertThat(deathScreen.Visible).IsFalse("death screen should start hidden");

        // Emit directly on the autoload — HudLayer's handler fires synchronously
        _eventBus.EmitSignal(EventBus.SignalName.PlayerDied);

        // Allow one frame for _Process / deferred calls to settle
        await _runner.AwaitSignal(_runner.Scene().GetTree(), "process_frame").WithTimeout(500);

        AssertThat(deathScreen.Visible).IsTrue("death screen should be visible after PlayerDied");
    }

    [TestCase]
    public async Task ScoreChanged_UpdatesScoreLabel()
    {
        _eventBus.EmitSignal(EventBus.SignalName.ScoreChanged, 1234);

        await _runner.AwaitSignal(_runner.Scene().GetTree(), "process_frame").WithTimeout(500);

        AssertThat(_hud.GetNode<Label>("ScoreLabel").Text).IsEqual("Score: 1234");
    }
}
```

**Key GUT helpers for event bus testing:**

| Helper | Purpose |
|--------|---------|
| `watch_signals(event_bus)` | Start recording signal emissions on the EventBus node |
| `assert_signal_emitted(node, "signal_name")` | Assert the signal fired at least once |
| `assert_signal_emitted_with_parameters(node, "signal_name", [...])` | Assert the signal fired with specific argument values |
| `assert_signal_not_emitted(node, "signal_name")` | Assert the signal was never fired |
| `node.get_signal_emit_count("signal_name")` | Get the total number of times the signal was emitted |
