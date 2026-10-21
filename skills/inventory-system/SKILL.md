---
name: inventory-system
description: Use when building inventory systems — Resource-based items, slot management, stacking, and UI binding
---

# Inventory Systems in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. This skill carries the decisions; the implementations live in `references/` (GDScript first, then C#) — load the one you need.

> **Related skills:** **resource-pattern** for custom Resource data containers, **save-load** for inventory serialization, **event-bus** for inventory change notifications, **hud-system** for inventory UI display, **popochiu** for adventure-game inventory.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        UI Layer                         │
│   InventoryUI (Control)                                 │
│     └─ GridContainer                                    │
│           └─ SlotUI × N (Button)                        │
│                 └─ TextureRect (icon) + Label (qty)     │
│                                                         │
│   Connects to: inventory_changed signal                 │
│   Drag-and-drop via _get_drag_data / _drop_data         │
└───────────────────────┬─────────────────────────────────┘
                        │ reads / mutates
┌───────────────────────▼─────────────────────────────────┐
│                    Inventory (Node)                      │
│   slots: Array[InventorySlot]                           │
│   add_item(item, qty) → leftover: int                   │
│   remove_item(item, qty)                                │
│   has_item(item, qty) → bool                            │
│   get_item_count(item) → int                            │
│                                                         │
│   signals: inventory_changed                            │
│             item_added(item, quantity)                  │
│             item_removed(item, quantity)                │
└───────────────────────┬─────────────────────────────────┘
                        │ references
┌───────────────────────▼─────────────────────────────────┐
│                   Data Layer (Resources)                 │
│   ItemData (Resource)                                   │
│     id, name, description, icon, max_stack_size,        │
│     item_type enum                                      │
│                                                         │
│   InventorySlot (inner class / Resource)                │
│     item: ItemData, quantity: int                       │
└─────────────────────────────────────────────────────────┘
```

---

## 2. The Decisions That Matter

Three choices shape every inventory. Make them explicitly and state which you picked — the rest is mechanical.

| Decision | Take | Why |
|---|---|---|
| Item identity: `Resource` vs. Dictionary / JSON | **`Resource` in `.tres`** | `@export` slots accept typed items, the Inspector edits them, and shared instances compare by reference |
| Slot container: `Resource` vs. `RefCounted` | **`RefCounted`** | Slots are runtime state, not authored assets. A `Resource` invites saving slots to disk and reloading stale item copies |
| `add_item` return: `bool` vs. leftover count | **leftover `int`** | Partial adds are the common case (stack caps, full bag). A `bool` forces the caller to re-query what actually fit |

If your game needs something else — a weight-based bag with no slots, a grid inventory with shaped items, an infinite stack list — say so before building. The fixed slot array this skill describes is the wrong skeleton for all three.

### Non-obvious specifics

- **Fill existing stacks before empty slots** — two passes, in that order. A single naive pass scatters one item type across several slots and reports the bag full while space remains.
- **Emit `inventory_changed` once per operation**, after both passes complete — not once per slot touched. Per-slot emission re-renders the whole UI N times for one `add_item`.
- **Items compare by reference.** Godot caches loaded resources, so `load()` on the same `.tres` returns the same instance and `slot.item == item` is correct and cheap. If you `duplicate()` items at runtime, that breaks — key off `ItemData.id` instead.
- **Clear `item` to `null` when quantity reaches 0**, or `is_empty()` lies and the slot is never reusable.
- **Prevent stacking with data, not branches** — set `max_stack_size = 1` on `EQUIPMENT` and `KEY_ITEM` items rather than special-casing them in `add_item`.
- **C#: mark `ItemData` `[GlobalClass]`** or the Inspector will not offer it as a type when creating `.tres` files.

### Inventory API contract

| Member | Returns | Contract |
|---|---|---|
| `add_item(item, quantity)` | `int` | Leftover that did not fit; `0` means everything was added |
| `remove_item(item, quantity)` | — | Removes up to `quantity`; silent when fewer are held |
| `has_item(item, quantity)` | `bool` | Convenience over `get_item_count` |
| `get_item_count(item)` | `int` | Summed across every slot |
| `inventory_changed` | signal | Fired once per mutating operation — drives all UI |
| `item_added(item, quantity)` | signal | Carries the amount actually added |
| `item_removed(item, quantity)` | signal | Carries the amount actually removed |

> Full `ItemData`, `Inventory`, and `InventorySlot` implementations in GDScript and C#: [references/core-classes.md](references/core-classes.md)

---

## 3. Equipment Extension

Add equipment slots (`HEAD`, `CHEST`, `WEAPON`, etc.) by extending the `Inventory` class with a typed slot map. Stat aggregation runs by summing `ItemData.stats` across equipped items; signal `equipment_changed` when slots change.

> See [references/equipment.md](references/equipment.md) for the full GDScript and C# `Equipment` class with `EquipmentSlotType` enum, equip / unequip API, and stat aggregation.

---

## 4. UI Binding

Slot-grid UI: a `GridContainer` of `Panel` slot widgets, each rendering one `InventorySlot`. Drag-and-drop uses `_get_drag_data` / `_drop_data` / `_can_drop_data` on the slot widget. The Inventory emits `inventory_changed`; the UI re-renders affected slots.

> See [references/ui-binding.md](references/ui-binding.md) for the full GDScript and C# slot widget (drag/drop, hover preview), inventory grid layout, and tooltip wiring.

---

## 5. Serialization

Persist Inventory + Equipment as a Dictionary keyed by item resource path (since ItemData lives at `res://items/<name>.tres`). Reload by `load(path)` and reconstructing the slot list. Version field gates migration on load.

> See [references/serialization.md](references/serialization.md) for the GDScript and C# save/load implementation with `version` field and ConfigFile / JSON variants.

---

---

## Implementation Checklist

- [ ] `ItemData` extends `Resource` with a stable `id` string set in the Inspector
- [ ] `ItemData` files live under `res://items/` and are committed to version control
- [ ] `Inventory.add_item()` returns leftover count; callers handle a full inventory
- [ ] `inventory_changed` signal drives all UI updates — UI never polls per-frame
- [ ] `InventorySlot.remove_from_stack()` clears `item` to `null` when quantity reaches 0
- [ ] Equipment slots keyed by `SlotType` enum, not by string, to catch typos at compile time
- [ ] `Equipment.get_total_stat()` is called when stats are needed, not cached unless profiling demands it
- [ ] Serialization stores `id + quantity` only — never full `ItemData` objects or resource paths
- [ ] `ItemRegistry` loads items at startup; all deserialization goes through it
- [ ] Drag-and-drop swaps slot contents directly then emits `inventory_changed` once
- [ ] `max_stack_size = 1` on `EQUIPMENT` and `KEY_ITEM` types to prevent stacking
- [ ] All `push_error()` messages include the class name and method for easy tracing
