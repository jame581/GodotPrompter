# Sharing vs Unique Resources

Reference for `skills/resource-pattern/SKILL.md` — when Resources share state vs `.duplicate()` for unique copies (v1.6.0 C# parity preserved).

> ← Back to [SKILL.md](../SKILL.md)

---
## 8. Sharing vs Unique

Resources loaded from the same path are **shared**. Every node that loads `res://data/enemies/goblin.tres` gets the exact same object in memory.

```gdscript
# Both variables point to the same object — modifying one modifies the other.
var a: EnemyStats = load("res://data/enemies/goblin.tres")
var b: EnemyStats = load("res://data/enemies/goblin.tres")
print(a == b)  # true
```

**For per-instance mutable state, call `duplicate()`:**

```gdscript
func _ready() -> void:
    # Shallow duplicate — nested Resources are still shared
    stats = stats.duplicate()

    # Deep duplicate — nested sub-resources are copied too, with limits (below)
    stats = stats.duplicate(true)
```

```csharp
public partial class Enemy : CharacterBody3D
{
    [Export] public EnemyStats StatsTemplate { get; set; }
    private EnemyStats _stats;

    public override void _Ready()
    {
        // Shallow duplicate — referenced sub-resources still point at the original.
        _stats = (EnemyStats)StatsTemplate.Duplicate();

        // Deep duplicate — sub-resources are also duplicated. Use only when needed (cost scales).
        // _stats = (EnemyStats)StatsTemplate.Duplicate(true);

        _stats.CurrentHealth = _stats.MaxHealth;
    }
}
```

`duplicate()` (`Duplicate()` in C#) returns a new Resource with the same property values. The original `.tres` file is untouched.

**Deep-copy limits differ by version.** On Godot 4.3, `duplicate(true)` never copies Resources held inside `Array` or `Dictionary` properties. On 4.7, it copies only embedded (built-in) sub-resources; ones saved to their own file stay shared unless you call `duplicate_deep(Resource.DEEP_DUPLICATE_ALL)`.

**Make Unique in the editor:** In the Inspector, any sub-resource slot shows a **Make Unique** button. Clicking it embeds a private copy of the sub-resource into the parent scene instead of referencing the shared file. Use this when one scene needs different values than the shared default.

**Guideline:**
- Read-only data (item definitions, level config) — share freely, no duplication needed.
- Mutable runtime state (current health, active buffs) — always `duplicate()` in `_ready()`.

---

