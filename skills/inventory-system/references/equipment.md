# Equipment Extension

Reference for `skills/inventory-system/SKILL.md` — equipment slot system (paperdoll), `EquipmentSlotType` enum, GDScript + C# implementations.

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. Equipment Extension

Extend `Inventory` with a dedicated equipment layer. Equipment slots are keyed by a `SlotType` enum, and stat bonuses are aggregated on demand.

### GDScript

```gdscript
# equipment.gd
class_name Equipment
extends Node

signal equipment_changed(slot: SlotType, item: ItemData)

enum SlotType {
    HEAD,
    CHEST,
    LEGS,
    HANDS,
    FEET,
    WEAPON,
    OFF_HAND,
    ACCESSORY,
}

# Maps SlotType → the ItemData currently equipped in that slot (null = empty)
var equipment_slots: Dictionary = {}


func _ready() -> void:
    for slot_type in SlotType.values():
        equipment_slots[slot_type] = null


func equip(item: ItemData, slot: SlotType) -> ItemData:
    assert(item.item_type == ItemData.ItemType.EQUIPMENT,
        "equip: '%s' is not an EQUIPMENT item" % item.name)
    var previous: ItemData = equipment_slots[slot]
    equipment_slots[slot] = item
    equipment_changed.emit(slot, item)
    return previous  # caller can return this to the inventory


func unequip(slot: SlotType) -> ItemData:
    var item: ItemData = equipment_slots[slot]
    equipment_slots[slot] = null
    if item != null:
        equipment_changed.emit(slot, null)
    return item


func get_equipped(slot: SlotType) -> ItemData:
    return equipment_slots.get(slot, null)


# Aggregate a named numeric stat from all equipped items.
# Each ItemData can expose stat bonuses via a Dictionary property named "stats".
# e.g. item.stats = { "attack": 10, "defense": 5 }
func get_total_stat(stat_name: String) -> float:
    var total := 0.0
    for item: ItemData in equipment_slots.values():
        if item == null:
            continue
        if item.get("stats") is Dictionary:
            total += float(item.stats.get(stat_name, 0))
    return total
```

### C#

```csharp
// Equipment.cs
using Godot;
using Godot.Collections;

public partial class Equipment : Node
{
    [Signal] public delegate void EquipmentChangedEventHandler(int slot, ItemData item);

    public enum SlotType
    {
        Head,
        Chest,
        Legs,
        Hands,
        Feet,
        Weapon,
        OffHand,
        Accessory,
    }

    // Maps SlotType → ItemData (null = empty)
    private readonly Dictionary<SlotType, ItemData> _equipmentSlots = new();

    public override void _Ready()
    {
        foreach (SlotType slot in System.Enum.GetValues<SlotType>())
            _equipmentSlots[slot] = null;
    }

    /// <summary>Equips item into slot. Returns the previously equipped item (may be null).</summary>
    public ItemData Equip(ItemData item, SlotType slot)
    {
        if (item.Type != ItemData.ItemType.Equipment)
        {
            GD.PushWarning($"Equip: '{item.Name}' is not an Equipment item");
            return null;
        }

        var previous          = _equipmentSlots[slot];
        _equipmentSlots[slot] = item;
        EmitSignal(SignalName.EquipmentChanged, (int)slot, item);
        return previous;
    }

    /// <summary>Unequips the item in slot. Returns the removed item (may be null).</summary>
    public ItemData Unequip(SlotType slot)
    {
        var item              = _equipmentSlots[slot];
        _equipmentSlots[slot] = null;
        if (item != null)
            EmitSignal(SignalName.EquipmentChanged, (int)slot, default(Variant));
        return item;
    }

    public ItemData GetEquipped(SlotType slot) => _equipmentSlots[slot];

    /// <summary>Aggregate a numeric stat from all currently equipped items.</summary>
    public float GetTotalStat(string statName)
    {
        float total = 0f;
        foreach (var item in _equipmentSlots.Values)
        {
            if (item == null) continue;
            // Expects ItemData to expose a Stats Dictionary property
            if (item.Get("stats").Obj is Godot.Collections.Dictionary stats
                && stats.ContainsKey(statName))
                total += stats[statName].As<float>();
        }
        return total;
    }
}
```

---

