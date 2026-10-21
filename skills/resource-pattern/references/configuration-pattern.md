# Resource as Configuration

Reference for `skills/resource-pattern/SKILL.md` — Resources for game data (loot tables, enemy stats, item catalogs). GDScript + C# implementation.

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. Resource as Configuration

Use Resources to define enemy tuning parameters. Designers can tweak values in the Inspector without touching code. The `@export_range` annotation enforces bounds and surfaces sliders.

### GDScript

```gdscript
# enemy_stats.gd
class_name EnemyStats
extends Resource

@export_group("Combat")
@export_range(1,    5000, 1)    var health:          int   = 100
@export_range(0.0,  500.0, 0.1) var speed:           float = 80.0
@export_range(0,    999,   1)   var damage:          int   = 10
@export_range(0.0,  1.0,  0.01) var crit_chance:     float = 0.05
@export_range(0.1, 10.0,  0.1)  var attack_interval: float = 1.5

@export_group("Drops")
## Each entry must be a Resource subclass that describes a drop (e.g. DropEntry).
@export var drop_table: Array[Resource] = []
@export_range(0.0,  1.0,  0.01) var drop_chance: float = 0.3
```

```gdscript
# enemy.gd — consumes EnemyStats
class_name Enemy
extends CharacterBody2D

@export var stats: EnemyStats

var _current_health: int


func _ready() -> void:
    # make_unique() so this instance has its own mutable copy
    stats = stats.duplicate()
    _current_health = stats.health


func take_damage(amount: int) -> void:
    _current_health -= amount
    if _current_health <= 0:
        _die()


func _die() -> void:
    _roll_drops()
    queue_free()


func _roll_drops() -> void:
    if randf() > stats.drop_chance:
        return
    for drop: Resource in stats.drop_table:
        # Spawn drop — implementation depends on project drop system
        pass
```

### C#

```csharp
// EnemyStats.cs
using Godot;
using Godot.Collections;

[GlobalClass]
public partial class EnemyStats : Resource
{
    [ExportGroup("Combat")]
    [Export(PropertyHint.Range, "1,5000,1")]     public int   Health         { get; set; } = 100;
    [Export(PropertyHint.Range, "0,500,0.1")]    public float Speed          { get; set; } = 80.0f;
    [Export(PropertyHint.Range, "0,999,1")]      public int   Damage         { get; set; } = 10;
    [Export(PropertyHint.Range, "0,1,0.01")]     public float CritChance     { get; set; } = 0.05f;
    [Export(PropertyHint.Range, "0.1,10,0.1")]   public float AttackInterval { get; set; } = 1.5f;

    [ExportGroup("Drops")]
    [Export] public Array<Resource> DropTable  { get; set; } = new();
    [Export(PropertyHint.Range, "0,1,0.01")]
    public float DropChance { get; set; } = 0.3f;
}
```

```csharp
// Enemy.cs — consumes EnemyStats
using Godot;

public partial class Enemy : CharacterBody2D
{
    [Export] public EnemyStats Stats { get; set; }

    private int _currentHealth;

    public override void _Ready()
    {
        // Duplicate so this instance has its own mutable copy
        Stats = (EnemyStats)Stats.Duplicate();
        _currentHealth = Stats.Health;
    }

    public void TakeDamage(int amount)
    {
        _currentHealth -= amount;
        if (_currentHealth <= 0)
            Die();
    }

    private void Die()
    {
        RollDrops();
        QueueFree();
    }

    private void RollDrops()
    {
        if (GD.Randf() > Stats.DropChance) return;
        foreach (var drop in Stats.DropTable)
        {
            // Spawn drop — implementation depends on project drop system
        }
    }
}
```

---

