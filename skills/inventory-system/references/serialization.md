# Inventory Serialization

Reference for `skills/inventory-system/SKILL.md` — save/load via Resource → JSON or ConfigFile, with versioning. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 7. Serialization

Save inventories as `item_id + quantity` pairs. Never serialize the full `ItemData` Resource — instead, look up items at load time from a preloaded registry. This keeps save files small and decoupled from resource paths.

### GDScript

```gdscript
# item_registry.gd — add as autoload named ItemRegistry
extends Node

# Populate by scanning a folder, or assign manually in _ready().
var _items: Dictionary = {}  # id → ItemData


func _ready() -> void:
    _load_all("res://items/")


func _load_all(folder: String) -> void:
    var dir := DirAccess.open(folder)
    if dir == null:
        return
    dir.list_dir_begin()
    var file_name := dir.get_next()
    while file_name != "":
        if file_name.ends_with(".tres"):
            var item: ItemData = load(folder + file_name)
            if item and item.id != "":
                _items[item.id] = item
        file_name = dir.get_next()


func get_item(id: String) -> ItemData:
    return _items.get(id, null)


# ── Serialize ────────────────────────────────────────────────────────────────

func serialize_inventory(inventory: Inventory) -> Array:
    var data: Array = []
    for slot in inventory.slots:
        if slot.is_empty():
            data.append(null)
        else:
            data.append({"id": slot.item.id, "qty": slot.quantity})
    return data


# ── Deserialize ──────────────────────────────────────────────────────────────

func deserialize_inventory(inventory: Inventory, data: Array) -> void:
    for i in mini(data.size(), inventory.slots.size()):
        var entry = data[i]
        if entry == null:
            inventory.slots[i] = InventorySlot.new()
        else:
            var item: ItemData = get_item(entry["id"])
            if item == null:
                push_error("ItemRegistry: unknown item id '%s'" % entry["id"])
                inventory.slots[i] = InventorySlot.new()
                continue
            var slot          := InventorySlot.new()
            slot.item         = item
            slot.quantity     = entry["qty"]
            inventory.slots[i] = slot
    inventory.inventory_changed.emit()
```

**Usage inside a save system:**

```gdscript
# In SaveManager.save_game():
data["inventory"] = ItemRegistry.serialize_inventory(player.inventory)

# In SaveManager.load_game():
ItemRegistry.deserialize_inventory(player.inventory, data["inventory"])
```

### C#

```csharp
// ItemRegistry.cs — add as autoload named ItemRegistry
using System.Collections.Generic;
using Godot;

public partial class ItemRegistry : Node
{
    private readonly Dictionary<string, ItemData> _items = new();

    public override void _Ready() => LoadAll("res://items/");

    private void LoadAll(string folder)
    {
        using var dir = DirAccess.Open(folder);
        if (dir == null) return;

        dir.ListDirBegin();
        string fileName = dir.GetNext();
        while (fileName != "")
        {
            if (fileName.EndsWith(".tres"))
            {
                var item = GD.Load<ItemData>(folder + fileName);
                if (item != null && item.Id != "")
                    _items[item.Id] = item;
            }
            fileName = dir.GetNext();
        }
    }

    public ItemData GetItem(string id)
        => _items.TryGetValue(id, out var item) ? item : null;

    // ── Serialize ─────────────────────────────────────────────────────────────

    public Godot.Collections.Array SerializeInventory(Inventory inventory)
    {
        var data = new Godot.Collections.Array();
        foreach (var slot in inventory.Slots)
        {
            if (slot.IsEmpty())
                data.Add(default(Variant));
            else
                data.Add(new Godot.Collections.Dictionary
                {
                    ["id"]  = slot.Item.Id,
                    ["qty"] = slot.Quantity,
                });
        }
        return data;
    }

    // ── Deserialize ───────────────────────────────────────────────────────────

    public void DeserializeInventory(Inventory inventory, Godot.Collections.Array data)
    {
        int count = Mathf.Min(data.Count, inventory.Slots.Count);
        for (int i = 0; i < count; i++)
        {
            if (data[i].VariantType == Variant.Type.Nil)
            {
                inventory.Slots[i] = new InventorySlot();
                continue;
            }

            var entry = data[i].AsGodotDictionary();
            var item  = GetItem(entry["id"].As<string>());
            if (item == null)
            {
                GD.PushError($"ItemRegistry: unknown item id '{entry["id"]}'");
                inventory.Slots[i] = new InventorySlot();
                continue;
            }

            inventory.Slots[i] = new InventorySlot
            {
                Item     = item,
                Quantity = entry["qty"].As<int>(),
            };
        }
        inventory.EmitSignal(Inventory.SignalName.InventoryChanged);
    }
}
```

---

