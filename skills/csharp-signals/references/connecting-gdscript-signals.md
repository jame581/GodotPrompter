# Connecting GDScript Signals from C#

Reference for `skills/csharp-signals/SKILL.md` — bridging C# code to signals declared in GDScript nodes via `Connect` with string names.

> ← Back to [SKILL.md](../SKILL.md)

---
## 7. Connecting GDScript Signals from C#

When a GDScript node emits a signal and a C# node needs to subscribe, use the string-based `Connect()` API with `Callable.From()` to wrap the C# method.

```csharp
using Godot;

public partial class ScoreDisplay : Label
{
    // Assume ScoreManager is a GDScript autoload with signal "score_changed(new_score: int)".
    private Node _scoreManager;

    public override void _Ready()
    {
        _scoreManager = GetNode("/root/ScoreManager");

        // Connect using the GDScript signal name (snake_case, as declared in GDScript).
        _scoreManager.Connect("score_changed", Callable.From<int>(OnScoreChanged));
    }

    public override void _ExitTree()
    {
        if (IsInstanceValid(_scoreManager))
            _scoreManager.Disconnect("score_changed", Callable.From<int>(OnScoreChanged));
    }

    private void OnScoreChanged(int newScore)
    {
        Text = $"Score: {newScore}";
    }
}
```

**Important:** `Callable.From<T>()` must match the signal parameter signature exactly. Use the GDScript snake_case signal name as a plain string — there is no `SignalName` constant for GDScript-declared signals on the C# side.

For signals with multiple parameters, use the overloads:

```csharp
// GDScript signal: signal health_changed(current: int, maximum: int)
_player.Connect("health_changed", Callable.From<int, int>(OnHealthChanged));

// GDScript signal: signal item_collected(item_name: String)
_player.Connect("item_collected", Callable.From<string>(OnItemCollected));
```

---

