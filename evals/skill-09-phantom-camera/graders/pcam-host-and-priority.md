---
type: llm
focus: last_message
---
Pass only if BOTH hold: (1) the scene tree has a single real `Camera2D` with a `PhantomCameraHost` node as its child, and the player shot and boss shot are two `PhantomCamera2D` nodes elsewhere in the tree; (2) the switch is done by raising and lowering the boss `PhantomCamera2D`'s `priority` (`set_priority(...)`, assigning `priority`, or C# `Priority` / `Set("priority", ...)`). Fail if the `PhantomCameraHost` is missing, is the parent of the camera or is placed under a `PhantomCamera2D`, or if switching is done with `make_current()`, by enabling/disabling `Camera2D` nodes, or with methods such as `set_active()` / `activate()`.
