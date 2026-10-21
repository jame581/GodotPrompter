# GDScript Interop

Reference for `skills/csharp-godot/SKILL.md` — calling GDScript from C#, calling C# from GDScript, and `Variant` marshalling gotchas.

> ← Back to [SKILL.md](../SKILL.md)

---

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
