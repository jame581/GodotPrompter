# Disconnecting Signals (C#)

Reference for `skills/csharp-signals/SKILL.md` — what Godot disconnects for you, the two cases it does not, `-=` operator + `_ExitTree`, SafeDisconnect helper.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Disconnecting Signals

### The `-=` operator and `_ExitTree()` cleanup

`Player`'s signals below are custom `[Signal]`s, one of the two cases Godot does not disconnect when the receiver is freed (see the last section). Without the `-=`, the next emission after the HUD is freed reaches a disposed object and throws `ObjectDisposedException`.

```csharp
using Godot;

public partial class HudLayer : CanvasLayer
{
    private Player _player;

    public override void _Ready()
    {
        _player = GetNode<Player>("../Player");
        _player.HealthChanged += OnHealthChanged;
        _player.Died          += OnDied;
        _player.ItemCollected += OnItemCollected;
    }

    // _ExitTree is called when the node leaves the tree, including when it is freed.
    // If this node can leave and re-enter the tree, connect in _EnterTree instead:
    // _Ready runs only once, so the connections would not come back.
    public override void _ExitTree()
    {
        // Mirror every += from _Ready() with a -=.
        _player.HealthChanged -= OnHealthChanged;
        _player.Died          -= OnDied;
        _player.ItemCollected -= OnItemCollected;
    }

    private void OnHealthChanged(int current, int maximum) { /* ... */ }
    private void OnDied() { /* ... */ }
    private void OnItemCollected(string itemName) { /* ... */ }
}
```

### SafeDisconnect pattern

When the signal source may have already been freed (e.g., it lives in a different scene), guard the disconnection with `IsInstanceValid`.

```csharp
public override void _ExitTree()
{
    if (IsInstanceValid(_player))
    {
        _player.HealthChanged -= OnHealthChanged;
        _player.Died          -= OnDied;
    }
}
```

### What Godot disconnects for you, and what it does not

When any `GodotObject` is freed, Godot disconnects every connection associated with it, for signal emitters and for signal receivers. A built-in signal connected to a method of the receiver (`button.Pressed += OnPressed`) needs no manual cleanup.

Automatic disconnection does **not** happen when the receiver is freed while the emitter is still alive, in two cases:

- **The signal is a custom `[Signal]`** connected with `+=`.
- **The handler is a lambda that captures a variable.** Godot uses `Delegate.Target` to tell which instance a delegate belongs to; a capturing lambda's target is a compiler-generated closure object, not the node. `Callable.From` with `Connect` has the same limit.

In both cases the next emission calls into a disposed object and throws `ObjectDisposedException`. Keep a reference to the delegate and pass it to `-=`.

Automatic disconnection is fully reliable when the emitter is freed before its receivers, so a project that always frees emitters first never meets either case.

**Rule:** every `+=` on a custom `[Signal]`, and every capturing lambda, gets a matching `-=` in `_ExitTree()`. Connect in `_Ready()`, or in `_EnterTree()` for a node that can leave and re-enter the tree.

---
