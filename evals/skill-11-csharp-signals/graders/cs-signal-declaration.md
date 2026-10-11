---
type: llm
focus: last_message
---
Pass only if BOTH hold: (1) the Player signal is declared in a `partial` class as a delegate marked `[Signal]` whose name ends in `EventHandler`, for example `[Signal] public delegate void HealthChangedEventHandler(int current, int max);`; (2) it is sent with `EmitSignal(SignalName.HealthChanged, ...)` (the generated `EmitSignalHealthChanged(...)` method also counts). Fail if the delegate name lacks the `EventHandler` suffix, if the signal is a plain C# `event` / `Action` with no `[Signal]` attribute, or if it is emitted with a name that includes the suffix (`"HealthChangedEventHandler"`).
