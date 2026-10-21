# Testing with Dependency Injection

Reference for `skills/dependency-injection/SKILL.md` — testing nodes in isolation by injecting test doubles. Uses GUT for GDScript.

> ← Back to [SKILL.md](../SKILL.md)

---
## 7. Testing with Dependency Injection

Injectable dependencies make tests trivial: swap the real service for a stub or mock. Because the node declares what it needs (via `@export` or a property), tests can provide a controlled stand-in without touching autoloads.

### GDScript (using GUT)

```gdscript
# stub_audio.gd — a lightweight stand-in for AudioManager
class_name StubAudio
extends Node

var last_sfx: String = ""
var play_count: int = 0

func play_sfx(key: String) -> void:
    last_sfx = key
    play_count += 1
```

```gdscript
# test_health_component.gd
extends GutTest

var health: HealthComponent
var audio_stub: StubAudio


func before_each() -> void:
    audio_stub = StubAudio.new()
    add_child_autofree(audio_stub)

    health = preload("res://components/health_component.tscn").instantiate()
    health.audio = audio_stub   # inject the stub — no real AudioManager needed
    health.max_health = 100
    add_child_autofree(health)


func test_take_damage_plays_hurt_sfx() -> void:
    health.take_damage(10)

    assert_eq(audio_stub.last_sfx, "hurt")
    assert_eq(audio_stub.play_count, 1)


func test_no_sfx_when_audio_is_null() -> void:
    health.audio = null   # also valid — null is handled gracefully
    health.take_damage(10)
    pass  # should not crash


func test_died_signal_emitted_at_zero_health() -> void:
    watch_signals(health)
    health.take_damage(100)
    assert_signal_emitted(health, "died")
```

### C# (using GdUnit4)

GdUnit4 supports C# since v4.4. Note: GdUnit4 signal assertions use `AssertSignal` rather than GUT's `watch_signals` / `assert_signal_emitted`. If a node emits a Godot signal from a C# `async Task` method, GDScript callers cannot `await` that task directly — emit a Godot signal at completion and `await` the signal instead.

```csharp
using GdUnit4;
using static GdUnit4.Assertions;

// StubAudio.cs — a lightweight stand-in for AudioManager
public partial class StubAudio : Node
{
    public string LastSfx { get; private set; } = "";
    public int PlayCount { get; private set; } = 0;

    public void PlaySfx(string key)
    {
        LastSfx = key;
        PlayCount++;
    }
}
```

```csharp
using GdUnit4;
using static GdUnit4.Assertions;

[TestSuite]
public partial class HealthComponentTest
{
    private HealthComponent _health = null!;
    private StubAudio _audioStub = null!;

    [BeforeTest]
    public void Setup()
    {
        _audioStub = new StubAudio();
        _health = new HealthComponent
        {
            Audio = _audioStub,   // inject the stub — no real AudioManager needed
            MaxHealth = 100
        };
    }

    [TestCase]
    public void TakeDamage_PlaysHurtSfx()
    {
        _health.TakeDamage(10);

        AssertThat(_audioStub.LastSfx).IsEqual("hurt");
        AssertThat(_audioStub.PlayCount).IsEqual(1);
    }

    [TestCase]
    public void TakeDamage_WhenAudioIsNull_DoesNotCrash()
    {
        _health.Audio = null;   // also valid — null is handled gracefully
        _health.TakeDamage(10);
        // should not throw
    }

    [TestCase]
    public void TakeDamage_AtZeroHealth_EmitsDiedSignal()
    {
        var signalAssert = AssertSignal(_health).IsEmitted(nameof(HealthComponent.SignalName.Died));

        _health.TakeDamage(100);

        signalAssert.WithTimeout(100);
    }
}
```

---

