# Custom Signal Patterns (C#)

Reference for `skills/csharp-signals/SKILL.md` — typed event args via wrapper class, C# signal bus (static events), generic signal helper.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Custom Signal Patterns

### Typed event args via wrapper class

Godot signal parameters must be marshallable types. Wrap a group of related values in a `GodotObject`-derived class so the whole payload is passed as a single parameter.

```csharp
using Godot;

// Payload class — must extend GodotObject (or a subclass) to be signal-safe.
public partial class CombatEventData : RefCounted
{
    public int AttackerId  { get; set; }
    public int TargetId    { get; set; }
    public int Damage      { get; set; }
    public bool IsCritical { get; set; }
    public string DamageType { get; set; } = "physical";
}

public partial class CombatSystem : Node
{
    [Signal] public delegate void CombatHitEventHandler(CombatEventData data);

    public void ResolveAttack(int attackerId, int targetId, int damage, bool critical)
    {
        var data = new CombatEventData
        {
            AttackerId = attackerId,
            TargetId   = targetId,
            Damage     = damage,
            IsCritical = critical,
        };
        EmitSignal(SignalName.CombatHit, data);
    }
}

// Consumer
public partial class DamageNumberSpawner : Node
{
    private CombatSystem _combatSystem;

    public override void _Ready()
    {
        _combatSystem = GetNode<CombatSystem>("/root/CombatSystem");
        _combatSystem.CombatHit += OnCombatHit;
    }

    public override void _ExitTree()
    {
        _combatSystem.CombatHit -= OnCombatHit;
    }

    private void OnCombatHit(CombatEventData data)
    {
        SpawnNumber(data.TargetId, data.Damage, data.IsCritical);
    }
}
```

### C# signal bus (static events as alternative to Godot signals for pure-C# communication)

When all subscribers are C# classes that never cross the GDScript boundary, a static event bus is simpler and faster than Godot signals. No `EmitSignal`, no marshalling overhead, no `SignalName` constants needed.

```csharp
using System;

/// <summary>
/// Pure C# event bus. Use only when all producers and consumers are C# classes.
/// Do NOT use if GDScript needs to observe these events.
/// </summary>
public static class GameEvents
{
    public static event Action<int, int> HealthChanged;
    public static event Action           PlayerDied;
    public static event Action<string>   ItemCollected;

    // Helpers so callers don't need null checks.
    public static void RaiseHealthChanged(int current, int max) =>
        HealthChanged?.Invoke(current, max);

    public static void RaisePlayerDied() =>
        PlayerDied?.Invoke();

    public static void RaiseItemCollected(string name) =>
        ItemCollected?.Invoke(name);
}
```

```csharp
// Producer
public partial class Player : CharacterBody2D
{
    public void TakeDamage(int amount)
    {
        _currentHealth = Mathf.Clamp(_currentHealth - amount, 0, MaxHealth);
        GameEvents.RaiseHealthChanged(_currentHealth, MaxHealth);

        if (_currentHealth == 0)
            GameEvents.RaisePlayerDied();
    }
}

// Consumer — must unsubscribe or leak memory.
public partial class HudLayer : CanvasLayer
{
    public override void _Ready()
    {
        GameEvents.HealthChanged += OnHealthChanged;
        GameEvents.PlayerDied    += OnPlayerDied;
    }

    public override void _ExitTree()
    {
        GameEvents.HealthChanged -= OnHealthChanged;
        GameEvents.PlayerDied    -= OnPlayerDied;
    }

    private void OnHealthChanged(int current, int max) { /* ... */ }
    private void OnPlayerDied() { /* ... */ }
}
```

**When to choose static events vs Godot signals:**

| Need                                    | Use                    |
|-----------------------------------------|------------------------|
| GDScript nodes also subscribe           | Godot `[Signal]`       |
| Editor signal connections needed        | Godot `[Signal]`       |
| `ToSignal` / `await` in Godot style     | Godot `[Signal]`       |
| Pure-C# communication, max performance  | Static C# event        |
| Signal needs to appear in the debugger  | Godot `[Signal]`       |

### Generic signal helper

When you repeat the same connect-and-disconnect boilerplate, a helper extension reduces noise.

```csharp
using System;
using Godot;

public static class SignalExtensions
{
    /// <summary>
    /// Connects a signal that automatically disconnects after firing once.
    /// </summary>
    public static void ConnectOnce(this GodotObject source, StringName signal, Action handler)
    {
        Action wrapper = null;
        wrapper = () =>
        {
            handler();
            source.Disconnect(signal, Callable.From(wrapper));
        };
        source.Connect(signal, Callable.From(wrapper));
    }
}

// Usage
_player.ConnectOnce(Player.SignalName.Died, () => GD.Print("Player died (once)."));
```

---

