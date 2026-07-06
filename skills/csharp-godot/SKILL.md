---
name: csharp-godot
description: Use when working with C# in Godot — conventions, GodotSharp API differences from GDScript, project setup, and interop
---

# C# in Godot 4.3+

This skill covers C#-specific conventions, API differences from GDScript, project setup, and interop patterns. All examples are C# only. Target Godot 4.3+ with the GodotSharp NuGet package.

> **Related skills:** **csharp-signals** for C# signal patterns, **godot-project-setup** for C# project scaffolding, **godot-testing** for C# testing with gdUnit4, **gdextension** for native C++ when C# is not enough, **multithreading** for C# concurrency.

---

## 1. C# vs GDScript Syntax Comparison

| GDScript | C# Equivalent | Notes |
|---|---|---|
| `var x = 5` | `var x = 5;` or typed `int x = 5;` | C# `var` infers type at compile time |
| `func MyMethod() -> void:` | `public void MyMethod() { }` | Methods are PascalCase in C# |
| `signal health_changed(amount: int)` | `[Signal] delegate void HealthChangedEventHandler(int amount);` | Must use `EventHandler` suffix |
| `@export var speed: float = 100.0` | `[Export] public float Speed { get; set; } = 100f;` | PascalCase, property syntax |
| `@onready var label = $Label` | `private Label _label;` + `_label = GetNode<Label>("Label");` in `_Ready()` | No `@onready` equivalent; use `_Ready()` |
| `match value:` | `switch (value) { case X: break; }` | C# switch also supports pattern matching |
| `class_name MyClass` | `[GlobalClass] public partial class MyClass : GodotObject { }` | Requires `[GlobalClass]` attribute |
| `extends Node` | `public partial class MyScript : Node { }` | Inheritance via `:` |
| `preload("res://scene.tscn")` | `GD.Load<PackedScene>("res://scene.tscn")` | Loaded at runtime, not compile time |
| `push_error("msg")` | `GD.PushError("msg");` | Prints to Godot error log |
| `print("msg")` | `GD.Print("msg");` | Also: `GD.PrintS()`, `GD.PrintT()` |
| `node is CharacterBody2D` | `node is CharacterBody2D` | Same keyword, same semantics |
| `node as CharacterBody2D` | `node as CharacterBody2D` | Returns `null` on failure in both |
| `await signal_name` | `await ToSignal(source, SignalName.X);` | Must use `ToSignal()` wrapper |
| `Array` | `Godot.Collections.Array` | Not `System.Collections.Generic.List<T>` |
| `Dictionary` | `Godot.Collections.Dictionary` | Not `System.Collections.Generic.Dictionary<K,V>` |

---

## 2. Project Setup

### .csproj and Solution

Godot auto-generates the `.csproj` when you create the first C# script via **Script > New Script > C#**. Do not edit the generated file structure manually — let the editor manage it.

```
MyProject/
├── MyProject.csproj          # Auto-generated, edit only for NuGet packages
├── MyProject.sln             # Auto-generated solution file
├── project.godot
└── scripts/
    └── Player.cs
```

### NuGet Packages

Add packages in `MyProject.csproj` inside `<ItemGroup>`:

```xml
<Project Sdk="Godot.NET.Sdk/4.3.0">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
  </PropertyGroup>
  <ItemGroup>
    <!-- Example: add a third-party NuGet package -->
    <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
  </ItemGroup>
</Project>
```

Run `dotnet restore` or let the IDE restore automatically after editing.

### Godot.NET Preview Bindings (Godot 4.7+)

Godot 4.7's `Godot.NET.Sdk` accepts an opt-in MSBuild property that switches the project from the classic GodotSharp bindings to the preview Godot.NET bindings (the `Godot.Bindings` assembly instead of `GodotSharp`):

```xml
<PropertyGroup>
  <EnableGodotDotNetPreview>true</EnableGodotDotNetPreview>
</PropertyGroup>
```

The preview bindings are experimental — leave the property unset for production projects. See [GH-118001](https://github.com/godotengine/godot/pull/118001).

### IDE Setup

| IDE | Setup Required | Notes |
|---|---|---|
| JetBrains Rider | Install Godot plugin (bundled in Rider 2023.3+) | Best Godot C# support; debugger works out of the box |
| VS Code | Install **C# Dev Kit** + **Godot Tools** extensions | Requires `launch.json` for debugger attachment |
| Visual Studio | Install **Godot Visual Studio** extension | Windows only; debugger via `Tools > Attach to Process` |

For all IDEs, open the `.sln` file (not just a folder) to get full solution resolution.

---

## 3. The `partial class` Requirement

Every class that extends a Godot type **must** be declared `partial`. This is not optional.

### Why

Godot uses C# source generators to emit the signal registration, property binding, and RPC code alongside your class. Source generators require `partial` to inject into the same class declaration.

### Error When Forgotten

```
Error CS0260: Missing partial modifier on declaration of type 'Player';
another partial declaration of this type exists.
```

Or the class compiles but signals and `[Export]` properties silently fail to register.

### Rule

```csharp
// CORRECT
public partial class Player : CharacterBody2D { }

// WRONG — will cause source generator errors
public class Player : CharacterBody2D { }
```

This applies to every class in the inheritance chain that extends a Godot type, including intermediate base classes.

---

## 4. Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Methods | PascalCase | `public void TakeDamage(int amount)` |
| Properties | PascalCase | `public float MaxHealth { get; set; }` |
| Signals (delegate) | PascalCase + `EventHandler` suffix | `HealthChangedEventHandler` |
| `[Export]` properties | PascalCase | `[Export] public float Speed { get; set; }` |
| Private fields | `_camelCase` with underscore prefix | `private float _currentSpeed;` |
| Local variables | camelCase | `var newPosition = ...` |
| Parameters | camelCase | `void SetHealth(int newHealth)` |
| Godot API names | Match Godot's PascalCase exactly | `GlobalPosition` not `global_position` |
| Enums | PascalCase type, PascalCase members | `enum State { Idle, Running, Dead }` |
| Constants | PascalCase or SCREAMING_SNAKE per team style | `const float MaxSpeed = 200f;` |

Always match GodotSharp property and method names exactly — they are PascalCase translations of the GDScript snake_case names (e.g. `is_on_floor()` → `IsOnFloor()`).

---

## 5. Signals in C#

Signals require a delegate declaration with the `[Signal]` attribute. The delegate name must end with `EventHandler`.

```csharp
using Godot;

public partial class Player : CharacterBody2D
{
    // Declaration
    [Signal] public delegate void HealthChangedEventHandler(int newHealth);
    [Signal] public delegate void DiedEventHandler();

    private int _health = 100;

    public void TakeDamage(int amount)
    {
        _health -= amount;
        EmitSignal(SignalName.HealthChanged, _health);  // Use SignalName.X, not a string
        if (_health <= 0)
            EmitSignal(SignalName.Died);
    }
}
```

### Connecting and Disconnecting

```csharp
// Connect with +=
player.HealthChanged += OnHealthChanged;
player.Died += OnPlayerDied;

// Disconnect with -=
player.HealthChanged -= OnHealthChanged;
player.Died -= OnPlayerDied;

// Handler signatures must match the delegate
private void OnHealthChanged(int newHealth) { ... }
private void OnPlayerDied() { ... }
```

> For full signal patterns including one-shot connections, static typed signals, and cross-language signal wiring, see the **csharp-signals** skill.

---

## 6. Async / Await

GDScript's `await` maps to C#'s `await ToSignal(...)`. Godot signals return a `SignalAwaiter` that is compatible with C# `await`.

### Awaiting a Godot Signal

```csharp
public async void StartCutscene()
{
    // Wait for a timer to finish
    await ToSignal(GetTree().CreateTimer(2.0), Timer.SignalName.Timeout);

    // Wait for an animation to finish
    var anim = GetNode<AnimationPlayer>("AnimationPlayer");
    anim.Play("intro");
    await ToSignal(anim, AnimationPlayer.SignalName.AnimationFinished);

    GD.Print("Cutscene complete");
}
```

### Task-Based Patterns

For CPU-bound work, use `Task.Run` — but never touch Godot objects from a non-main thread:

```csharp
public async void LoadHeavyData()
{
    // Off main thread: pure C# computation only
    var result = await Task.Run(() => ComputeSomethingExpensive());

    // Back on main thread: safe to use Godot API
    ApplyResult(result);
}

private int ComputeSomethingExpensive()
{
    // No Godot API calls here
    return Enumerable.Range(0, 1_000_000).Sum();
}
```

### GDScript `await` Equivalents

| GDScript | C# |
|---|---|
| `await get_tree().create_timer(1.0).timeout` | `await ToSignal(GetTree().CreateTimer(1.0), Timer.SignalName.Timeout)` |
| `await animation_player.animation_finished` | `await ToSignal(animPlayer, AnimationPlayer.SignalName.AnimationFinished)` |
| `await signal_name` | `await ToSignal(this, SignalName.YourSignal)` |

---

## 7. GDScript Interop

### Calling GDScript from C#

Use `Call`, `Get`, and `Set` on any `GodotObject`. Values are marshalled through `Variant`.

```csharp
// Assume "enemy" is a GodotObject backed by a GDScript with func take_damage(amount)
GodotObject enemy = GetNode("Enemy");

// Call a GDScript method
enemy.Call("take_damage", 25);

// Get a GDScript property
float health = enemy.Get("health").AsSingle();

// Set a GDScript property
enemy.Set("is_stunned", true);
```

### Calling C# from GDScript

If a C# class is registered as a `[GlobalClass]`, GDScript can instantiate and use it directly without any extra wiring:

```csharp
[GlobalClass]
public partial class WeaponData : Resource
{
    [Export] public float Damage { get; set; } = 10f;
    [Export] public float Cooldown { get; set; } = 0.5f;
}
```

```gdscript
# GDScript — works because WeaponData is a [GlobalClass]
var data := WeaponData.new()
data.damage = 50.0
```

Non-`[GlobalClass]` C# types are not visible to GDScript by name but can still be passed as `Variant`/`Object` references.

### Variant Marshalling Gotchas

| Scenario | Issue | Fix |
|---|---|---|
| Passing `null` across boundary | GDScript `null` becomes `default(Variant)`, not C# `null` | Check `variant.VariantType == Variant.Type.Nil` |
| Returning `int[]` from C# | GDScript receives a `PackedInt32Array`, not an `Array` | Return `Godot.Collections.Array<int>` for consistent typing |
| Passing `System.Collections.Generic.List<T>` | Not marshallable — Godot doesn't know this type | Convert to `Godot.Collections.Array<T>` first |
| Godot `Color` struct | Passed by value through Variant correctly | No issue |

---

## 8. Performance

### C# vs GDScript

| Workload | Winner | Reason |
|---|---|---|
| Math-heavy loops (pathfinding, simulation) | C# (significantly faster) | Compiled JIT vs interpreted GDScript |
| Large array/collection processing | C# | Value type arrays avoid boxing |
| Godot API calls (move_and_slide, etc.) | Roughly equal | Both route through the same C++ engine |
| Scene tree operations | Roughly equal | Bottleneck is C++ overhead, not language |
| Rapid prototyping | GDScript | Less boilerplate, hot-reload without recompile |
| Editor tooling (plugins, @tool) | GDScript | C# tool scripts require a full build cycle |

### Guidance

- Use C# for systems with tight loops: physics solvers, procedural generation, AI decision trees, data processing.
- Use GDScript for editor plugins, `@tool` scripts, and rapid iteration on gameplay logic.
- Mixing languages in the same project is supported — interop cost is minimal for occasional cross-language calls.
- Avoid `Godot.Collections.Array` for hot paths; prefer typed arrays (`Array<T>`) or native C# arrays (`T[]`) converted at boundaries.
- `StringName` lookups are O(1) but `StringName` construction is not — cache them if created frequently.

---

## 9. Common Gotchas

| Gotcha | Problem | Fix |
|---|---|---|
| `Variant` to C# type conversion | `(float)someVariant` throws if the underlying type is `int` | Use `.AsSingle()`, `.AsInt32()`, etc. instead of casts |
| `null` vs `default(Variant)` | Godot signals passing no value give `default(Variant)`, not C# `null` | Check `.VariantType == Variant.Type.Nil` |
| `Godot.Collections` vs `System.Collections` | Godot API methods return `Godot.Collections.Array`; passing `List<T>` causes runtime error | Always use `Godot.Collections.Array`/`Dictionary` at Godot API boundaries |
| Disposing native objects | Calling methods on a freed Godot object throws `ObjectDisposedException` | Check `IsInstanceValid(obj)` before use |
| `StringName` construction in hot loops | `new StringName("my_signal")` allocates each call | Cache as `private static readonly StringName _signalName = "my_signal";` |
| Export array types | `[Export] public Array Items;` exports untyped array | Use `[Export] public Godot.Collections.Array<MyResource> Items { get; set; }` |
| Node path strings | `GetNode("../UI/Label")` fails silently if the path changes | Use `GetNode<Label>("%Label")` with unique names or typed `[Export]` node references |
| `partial class` forgotten | Source generators silently fail; `[Export]` and `[Signal]` don't register | Every class extending a Godot type must be `partial` |
| `async void` vs `async Task` | `async void` swallows exceptions | Use `async Task` except for top-level event handlers that Godot calls |

> ⚠️ **Changed in Godot 4.7:** The 4.7 C# assemblies ship several compatibility breaks. Binary-incompatible only (source still compiles — a rebuild suffices): `OptimizedTranslation.Generate()` now returns `bool` instead of `void` (GH-119563). Binary- **and** source-incompatible (code changes required): `Animation.Length` changed type metadata from `float` to `double` (GH-116394) — the C# property is now `double`, so `float len = anim.Length;` no longer compiles — and `Control.AccessibilityLive` changed enum type from `DisplayServer.AccessibilityLiveMode` to `AccessibilityServer.AccessibilityLiveMode` (GH-116839) — update declarations to the `AccessibilityServer` enum. Source-incompatible (existing binaries still load): `RichTextLabel.ImageUpdateMask.UpdateWidthInPercent` was renamed to `UpdateWidthUnit` (GH-112617), and the `EditorSceneFormatImporter` `IMPORT_*` constants moved into the `ImportFlags` enum (GH-115788). Removed: `AudioEffectSpectrumAnalyzer.TapBackPos` (GH-114355). Rebuild against 4.7 and fix the affected symbols. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

---

## 10. Checklist

- [ ] Every class extending a Godot type is declared `partial`
- [ ] Method names match GodotSharp PascalCase (e.g. `_Ready`, `_PhysicsProcess`, `IsOnFloor()`)
- [ ] `[Export]` properties are PascalCase and use property syntax (`{ get; set; }`)
- [ ] Signal delegates end with `EventHandler` and use `EmitSignal(SignalName.X)`
- [ ] Signals connected with `+=` and disconnected with `-=` when no longer needed
- [ ] `await ToSignal(...)` used for Godot signals — not raw `Task.Delay` for game timing
- [ ] `Godot.Collections.Array`/`Dictionary` used at Godot API boundaries, not `System.Collections` types
- [ ] `IsInstanceValid(obj)` checked before using any potentially freed Godot object
- [ ] `StringName` instances cached if constructed in loops or frequently called methods
- [ ] No Godot API calls inside `Task.Run(...)` callbacks — all engine calls happen on the main thread
- [ ] `.csproj` opened via the `.sln` file in the IDE for full solution resolution
- [ ] C# used for computation-heavy systems; GDScript retained for editor tooling and `@tool` scripts
