> ← Back to [SKILL.md](../SKILL.md)

# Typed Signal Parameters

For signals that need to pass multiple related values, prefer a dedicated `Resource` (strongly typed, Inspector-friendly) over a plain `Dictionary` (flexible but untyped).

## Option A — Resource payload (recommended for structured data)

```gdscript
# combat_event_data.gd
class_name CombatEventData
extends Resource

@export var attacker_id: int = 0
@export var target_id: int = 0
@export var damage_amount: int = 0
@export var damage_type: String = "physical"
@export var is_critical: bool = false
```

```gdscript
# In event_bus.gd — add the signal:
signal combat_hit(data: CombatEventData)
```

```gdscript
# Producer
var data := CombatEventData.new()
data.attacker_id   = get_instance_id()
data.target_id     = target.get_instance_id()
data.damage_amount = 25
data.damage_type   = "fire"
data.is_critical   = true
EventBus.combat_hit.emit(data)
```

```gdscript
# Consumer
func _on_combat_hit(data: CombatEventData) -> void:
    if data.is_critical:
        _show_critical_text(data.target_id, data.damage_amount)
```

```csharp
// CombatEventData.cs — Resource-based payload (Inspector-friendly, fully typed)
using Godot;

public partial class CombatEventData : Resource
{
    [Export] public int AttackerId   { get; set; }
    [Export] public int TargetId     { get; set; }
    [Export] public int DamageAmount { get; set; }
    [Export] public string DamageType { get; set; } = "physical";
    [Export] public bool IsCritical  { get; set; }
}

// In EventBus.cs — add the signal:
// [Signal] public delegate void CombatHitEventHandler(CombatEventData data);

// Producer
public void FireCombatHit(Node target, int damageAmount, string damageType, bool isCritical)
{
    var data = new CombatEventData
    {
        AttackerId   = (int)GetInstanceId(),
        TargetId     = (int)target.GetInstanceId(),
        DamageAmount = damageAmount,
        DamageType   = damageType,
        IsCritical   = isCritical,
    };
    _eventBus.EmitSignal(EventBus.SignalName.CombatHit, data);
}

// Consumer
private void OnCombatHit(CombatEventData data)
{
    if (data.IsCritical)
        ShowCriticalText(data.TargetId, data.DamageAmount);
}
```

## Option B — Dictionary payload (acceptable for prototyping)

```gdscript
# In event_bus.gd:
signal combat_hit(data: Dictionary)

# Producer
EventBus.combat_hit.emit({
    "attacker_id":   get_instance_id(),
    "target_id":     target.get_instance_id(),
    "damage_amount": 25,
    "is_critical":   true,
})

# Consumer — note: no compile-time safety
func _on_combat_hit(data: Dictionary) -> void:
    if data.get("is_critical", false):
        _show_critical_text(data["target_id"], data["damage_amount"])
```

The C# equivalent uses `Godot.Collections.Dictionary` in place of the Resource type and `data["key"].AsInt32()` / `.AsString()` to read values — no compile-time safety.

**Prefer Resources** for structured, reusable payloads with more than 2–3 fields. **Use Dictionary** only when prototyping or the shape changes frequently.
