---
type: llm
focus: last_message
weight: 2
---
Judge the GDScript HUD code that connects to the C# Player's health signal. Pass only if it refers to the signal by the delegate's name minus the `EventHandler` suffix, in PascalCase exactly as declared in C#: for a delegate `HealthChangedEventHandler`, `player.HealthChanged.connect(...)` or `player.connect("HealthChanged", ...)`. Fail if the GDScript uses a snake_case name such as `health_changed`, includes the suffix (`HealthChangedEventHandler`), or if no GDScript connection code is shown.
