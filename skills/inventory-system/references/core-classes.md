# Inventory Core Classes

Reference for `skills/inventory-system/SKILL.md` — the `ItemData` Resource, the `Inventory` node, and the `InventorySlot` container, in GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 2. ItemData Resource

Define items as Resources so they live in `.tres` files, are shareable across scenes, and benefit from full editor integration.

### GDScript

```gdscript
# item_data.gd
class_name ItemData
extends Resource

enum ItemType {
    CONSUMABLE,
    EQUIPMENT,
    MATERIAL,
    KEY_ITEM,
}

@export var id: String = ""
@export var name: String = ""
@export var description: String = ""
@export var icon: Texture2D
@export var max_stack_size: int = 99
@export var item_type: ItemType = ItemType.MATERIAL
```

Create item assets: **res://items/potion_health.tres**, set `id = "potion_health"`, etc.

### C#

```csharp
// ItemData.cs
using Godot;

[GlobalClass]
public partial class ItemData : Resource
{
    public enum ItemType
    {
        Consumable,
        Equipment,
        Material,
        KeyItem,
    }

    [Export] public string Id          { get; set; } = "";
    [Export] public string Name        { get; set; } = "";
    [Export] public string Description { get; set; } = "";
    [Export] public Texture2D Icon     { get; set; }
    [Export] public int MaxStackSize   { get; set; } = 99;
    [Export] public ItemType Type      { get; set; } = ItemType.Material;
}
```

> Use `[GlobalClass]` so the Inspector dropdown shows `ItemData` as a resource type when creating `.tres` files.

---

## 3. Inventory Class

### GDScript

```gdscript
# inventory.gd
class_name Inventory
extends Node

signal inventory_changed
signal item_added(item: ItemData, quantity: int)
signal item_removed(item: ItemData, quantity: int)

@export var capacity: int = 20

var slots: Array[InventorySlot] = []


func _ready() -> void:
    slots.resize(capacity)
    for i in capacity:
        slots[i] = InventorySlot.new()


# Returns the number of items that could NOT be added (leftover).
func add_item(item: ItemData, quantity: int = 1) -> int:
    var remaining := quantity

    # Fill existing stacks first
    for slot in slots:
        if remaining <= 0:
            break
        if not slot.is_empty() and slot.item == item:
            remaining = slot.add_to_stack(remaining)

    # Open empty slots next
    for slot in slots:
        if remaining <= 0:
            break
        if slot.is_empty():
            slot.item = item
            remaining = slot.add_to_stack(remaining)

    var added := quantity - remaining
    if added > 0:
        item_added.emit(item, added)
        inventory_changed.emit()

    return remaining


func remove_item(item: ItemData, quantity: int = 1) -> void:
    var remaining := quantity

    for slot in slots:
        if remaining <= 0:
            break
        if not slot.is_empty() and slot.item == item:
            var removed := mini(slot.quantity, remaining)
            slot.remove_from_stack(removed)
            remaining -= removed

    var actually_removed := quantity - remaining
    if actually_removed > 0:
        item_removed.emit(item, actually_removed)
        inventory_changed.emit()


func has_item(item: ItemData, quantity: int = 1) -> bool:
    return get_item_count(item) >= quantity


func get_item_count(item: ItemData) -> int:
    var total := 0
    for slot in slots:
        if not slot.is_empty() and slot.item == item:
            total += slot.quantity
    return total
```

### C#

```csharp
// Inventory.cs
using Godot;
using Godot.Collections;

public partial class Inventory : Node
{
    [Signal] public delegate void InventoryChangedEventHandler();
    [Signal] public delegate void ItemAddedEventHandler(ItemData item, int quantity);
    [Signal] public delegate void ItemRemovedEventHandler(ItemData item, int quantity);

    [Export] public int Capacity { get; set; } = 20;

    public Array<InventorySlot> Slots { get; private set; } = new();

    public override void _Ready()
    {
        for (int i = 0; i < Capacity; i++)
            Slots.Add(new InventorySlot());
    }

    /// <summary>Returns the number of items that could NOT be added (leftover).</summary>
    public int AddItem(ItemData item, int quantity = 1)
    {
        int remaining = quantity;

        // Fill existing stacks first
        foreach (var slot in Slots)
        {
            if (remaining <= 0) break;
            if (!slot.IsEmpty() && slot.Item == item)
                remaining = slot.AddToStack(remaining);
        }

        // Open empty slots next
        foreach (var slot in Slots)
        {
            if (remaining <= 0) break;
            if (slot.IsEmpty())
            {
                slot.Item = item;
                remaining = slot.AddToStack(remaining);
            }
        }

        int added = quantity - remaining;
        if (added > 0)
        {
            EmitSignal(SignalName.ItemAdded, item, added);
            EmitSignal(SignalName.InventoryChanged);
        }

        return remaining;
    }

    public void RemoveItem(ItemData item, int quantity = 1)
    {
        int remaining = quantity;

        foreach (var slot in Slots)
        {
            if (remaining <= 0) break;
            if (!slot.IsEmpty() && slot.Item == item)
            {
                int removed = Mathf.Min(slot.Quantity, remaining);
                slot.RemoveFromStack(removed);
                remaining -= removed;
            }
        }

        int actuallyRemoved = quantity - remaining;
        if (actuallyRemoved > 0)
        {
            EmitSignal(SignalName.ItemRemoved, item, actuallyRemoved);
            EmitSignal(SignalName.InventoryChanged);
        }
    }

    public bool HasItem(ItemData item, int quantity = 1)
        => GetItemCount(item) >= quantity;

    public int GetItemCount(ItemData item)
    {
        int total = 0;
        foreach (var slot in Slots)
            if (!slot.IsEmpty() && slot.Item == item)
                total += slot.Quantity;
        return total;
    }
}
```

---

## 4. InventorySlot

`InventorySlot` is a lightweight object tracking an item reference and its quantity. Define it as an inner class on `Inventory` (GDScript) or as a standalone `RefCounted` subclass (C#).

### GDScript

```gdscript
# inventory_slot.gd  — or nest as inner class inside inventory.gd
class_name InventorySlot
extends RefCounted

var item: ItemData = null
var quantity: int   = 0


func is_empty() -> bool:
    return item == null or quantity <= 0


func can_stack(new_item: ItemData) -> bool:
    return not is_empty() and item == new_item and quantity < item.max_stack_size


# Adds amount to this slot, capped at max_stack_size.
# Returns the leftover that did not fit.
func add_to_stack(amount: int) -> int:
    if item == null:
        push_error("InventorySlot.add_to_stack: slot has no item assigned")
        return amount
    var space    := item.max_stack_size - quantity
    var to_add   := mini(amount, space)
    quantity     += to_add
    return amount - to_add


# Removes amount from this slot. Clears the slot when quantity reaches zero.
func remove_from_stack(amount: int) -> void:
    quantity -= amount
    if quantity <= 0:
        quantity = 0
        item     = null
```

### C#

```csharp
// InventorySlot.cs
using Godot;

public partial class InventorySlot : RefCounted
{
    public ItemData Item     { get; set; }
    public int      Quantity { get; set; }

    public bool IsEmpty() => Item == null || Quantity <= 0;

    public bool CanStack(ItemData newItem)
        => !IsEmpty() && Item == newItem && Quantity < Item.MaxStackSize;

    /// <summary>Adds amount to this slot. Returns leftover that did not fit.</summary>
    public int AddToStack(int amount)
    {
        if (Item == null)
        {
            GD.PushError("InventorySlot.AddToStack: slot has no item assigned");
            return amount;
        }
        int space  = Item.MaxStackSize - Quantity;
        int toAdd  = Mathf.Min(amount, space);
        Quantity  += toAdd;
        return amount - toAdd;
    }

    /// <summary>Removes amount from this slot. Clears when quantity reaches zero.</summary>
    public void RemoveFromStack(int amount)
    {
        Quantity -= amount;
        if (Quantity <= 0)
        {
            Quantity = 0;
            Item     = null;
        }
    }
}
```

---
