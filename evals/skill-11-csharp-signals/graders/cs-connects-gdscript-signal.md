---
type: llm
focus: last_message
---
Judge the C# Label script that listens to the GDScript autoload. Pass only if it connects by the signal's GDScript name as a string, `Connect("score_changed", ...)`, with a Callable built by `Callable.From<int>(...)` / `Callable.From(...)` or `new Callable(this, MethodName.X)`. Fail if it uses `+=` on a `ScoreChanged` event of the autoload, a `SignalName.ScoreChanged` constant, the PascalCase string `"ScoreChanged"`, or a C# `event`.
