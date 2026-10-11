---
type: llm
focus: last_message
weight: 2
---
Judge the C# code only. Pass if it reaches the Phantom Camera node in one of these two ways: (a) it has `using PhantomCamera;`, keeps the node as a plain `Node2D` / `Node` and gets the wrapper with the extension method `AsPhantomCamera2D()`; or (b) it drives the node dynamically with `Set(...)` / `Get(...)` / `Call(...)` using the snake_case GDScript names. Fail if the C# code treats `PhantomCamera2D` as a C# node type: `GetNode<PhantomCamera2D>(...)`, an `[Export]` field or property of type `PhantomCamera2D`, a cast such as `(PhantomCamera2D)node` or `node as PhantomCamera2D`, `new PhantomCamera2D()`, or a class that inherits from `PhantomCamera2D`.
