# Awaiting Signals (C#)

Reference for `skills/csharp-signals/SKILL.md` — basic await, await with return values, timeout patterns (`Task.WhenAny`, `CancellationTokenSource`).

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. Awaiting Signals

`ToSignal(source, SignalName.SignalName)` returns a `SignalAwaiter` that integrates with C#'s `async`/`await`. The method must be `async` and return `Task` (or `void` for fire-and-forget).

### Basic await

```csharp
public async void StartCutscene()
{
    // Pause normal gameplay.
    GetTree().Paused = true;

    // Wait until the animation finishes.
    await ToSignal(GetNode<AnimationPlayer>("AnimationPlayer"), AnimationPlayer.SignalName.AnimationFinished);

    GetTree().Paused = false;
    EmitSignal(SignalName.CutsceneCompleted);
}
```

### Await with returned values

`SignalAwaiter` resolves to a `Variant[]` containing the signal's parameter values.

```csharp
public async void WaitForPlayerInput()
{
    var result = await ToSignal(this, SignalName.ItemCollected);
    string collectedName = result[0].AsString();
    GD.Print($"Player collected: {collectedName}");
}
```

### Timeout pattern with `Task.WhenAny`

`SignalAwaiter` is awaitable but is not a `Task` and has no `AsTask()`. To race it with `Task.WhenAny`, wrap the await in an `async` method that returns a `Task`:

```csharp
using System.Threading.Tasks;
using Godot;

private async Task<Variant[]> SignalAsTask(GodotObject source, StringName signal)
{
    return await ToSignal(source, signal);
}

public async Task<bool> WaitForSignalWithTimeout(float timeoutSeconds)
{
    // Build a timeout task using Godot's SceneTreeTimer.
    var timer = GetTree().CreateTimer(timeoutSeconds);
    var timeoutTask = SignalAsTask(timer, SceneTreeTimer.SignalName.Timeout);
    var signalTask  = SignalAsTask(this, SignalName.Died);

    var completed = await Task.WhenAny(signalTask, timeoutTask);

    if (completed == signalTask)
    {
        GD.Print("Signal fired before timeout.");
        return true;
    }

    GD.Print("Timed out waiting for signal.");
    return false;
}
```

### Timeout pattern with `CancellationTokenSource`

```csharp
using System.Threading;
using System.Threading.Tasks;
using Godot;

public async Task ListenUntilCancelled(CancellationToken token)
{
    while (!token.IsCancellationRequested)
    {
        // ToSignal does not accept a CancellationToken directly;
        // wrap it in a task-race pattern (SignalAsTask is defined above).
        var signalTask  = SignalAsTask(this, SignalName.ItemCollected);
        var cancelTask  = Task.Delay(Timeout.Infinite, token);

        var completed = await Task.WhenAny(signalTask, cancelTask);
        if (completed == cancelTask) break;

        var result = await signalTask;
        HandleItemCollected(result[0].AsString());
    }
}
```

---

