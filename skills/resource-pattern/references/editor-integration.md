# Editor Integration

Reference for `skills/resource-pattern/SKILL.md` — `@tool` annotations, `class_name`, `@icon`, `@export_group` for full Inspector experience. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Editor Integration

Export annotations control how properties appear in the Inspector.

### GDScript

```gdscript
class_name AbilityData
extends Resource

# Groups collapse related fields under a named header
@export_group("Identity")
@export var ability_name: String = ""
@export var description:  String = ""
@export var icon:         Texture2D

# Category draws a bold separator (not collapsible)
@export_category("Tuning")

# Range clamps the value and shows a slider in the Inspector
@export_range(0.0, 60.0, 0.1, "suffix:s") var cooldown:   float = 1.0
@export_range(1,   999,   1)               var mana_cost:  int   = 10
@export_range(0.0, 1.0,  0.01)             var crit_chance: float = 0.05

# Enum shows a dropdown in the Inspector
enum DamageType { PHYSICAL, FIRE, ICE, LIGHTNING }
@export var damage_type: DamageType = DamageType.PHYSICAL

@export_group("Flags")
@export var is_passive:     bool = false
@export var requires_target: bool = true
```

| Annotation | Effect |
|---|---|
| `@export` | Exposes any typed property in the Inspector |
| `@export_range(min, max, step)` | Adds a slider, clamps input |
| `@export_enum("A","B","C")` | Dropdown for `int` when no enum type available |
| `@export_group("Label")` | Collapsible header grouping following properties |
| `@export_category("Label")` | Bold non-collapsible separator |

### C#

```csharp
[GlobalClass]
public partial class AbilityData : Resource
{
    public enum DamageType { Physical, Fire, Ice, Lightning }

    [ExportGroup("Identity")]
    [Export] public string    AbilityName { get; set; } = "";
    [Export] public string    Description { get; set; } = "";
    [Export] public Texture2D Icon        { get; set; }

    [ExportCategory("Tuning")]
    [Export(PropertyHint.Range, "0,60,0.1,suffix:s")]
    public float Cooldown    { get; set; } = 1.0f;

    [Export(PropertyHint.Range, "1,999,1")]
    public int   ManaCost    { get; set; } = 10;

    [Export(PropertyHint.Range, "0,1,0.01")]
    public float CritChance  { get; set; } = 0.05f;

    [Export] public DamageType Damage { get; set; } = DamageType.Physical;

    [ExportGroup("Flags")]
    [Export] public bool IsPassive      { get; set; } = false;
    [Export] public bool RequiresTarget { get; set; } = true;
}
```

---

