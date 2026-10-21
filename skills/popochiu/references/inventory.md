# Popochiu — Inventory Items

> Deep dive for [../SKILL.md](../SKILL.md) §5. Source: `addons/popochiu/engine/objects/inventory_item/popochiu_inventory_item.gd` (`PopochiuInventoryItem extends Node` — **not** a `PopochiuClickable`) and `addons/popochiu/engine/interfaces/i_inventory.gd` (`I` singleton).

## Item creation

Dock "Create inventory item" button generates `res://game/inventory_items/<name>/inventory_item_<name>.gd` (+ `.tscn`, + `inventory_item_<name>_state.gd` extending `PopochiuInventoryItemData`), registered in `popochiu_data.cfg` under `inventory_items`.

**Gotcha:** `PopochiuInventoryItem` extends `Node`, not `Area2D` via `PopochiuClickable` — even though it shares the same virtual-method *names* as Props/Hotspots/Characters (`_on_click`, `_on_right_click`, `_on_middle_click`, `_on_item_used`) by convention, plus its own `_on_added_to_inventory()` / `_on_discard()`. Don't treat it as a `PopochiuClickable` subtype when writing generic clickable-handling code.

## `I` (`PopochiuIInventory`) API

```gdscript
func clean_inventory(in_bg := false) -> void
func show_inventory(time := 1.0) -> void          # queue_show_inventory() twin
func hide_inventory(use_anim := true) -> void      # queue_hide_inventory() twin
func get_item_instance(item_name: String) -> PopochiuInventoryItem
func set_active_item(item: PopochiuInventoryItem = null) -> void
func is_item_in_inventory(item_name: String) -> bool
func has_item_been_collected(item_name: String) -> bool
func is_full() -> bool             # checks PopochiuSettings.inventory_limit
func deselect_active() -> void
```

State: `I.active: PopochiuInventoryItem` (currently selected/cursor item), `I.clicked`, `I.items: Array`, `I.items_states: Dictionary`.

Signals: `item_added`, `item_add_done`, `item_removed`, `item_remove_done`, `item_replaced`, `item_replace_done`, `item_discarded`, `item_selected`, `inventory_show_requested`, `inventory_shown`, `inventory_hide_requested`.

## Add / remove / combine (`PopochiuInventoryItem` instance API)

```gdscript
func add(animate := true) -> void                       # queue_add() twin
func add_as_active(animate := true) -> void               # queue_add_as_active() twin — adds AND makes it the active cursor item
func remove(animate := false) -> void                      # queue_remove() twin
func replace(new_item: PopochiuInventoryItem) -> void       # queue_replace() twin — item-combining primitive
func discard(animate := false) -> void                       # queue_discard() twin — removes without destroying the instance
```

## Combining items

Pattern from the addon's own doc comment on `queue_replace` — this is the script of `InventoryItemHook.gd`, i.e. the item reachable as `I.Hook`:

```gdscript
func on_item_used(item: PopochiuInventoryItem) -> void:
    if item == I.Rope:
        E.queue([
            I.Rope.queue_remove(),
            queue_replace(I.RopeWithHook),
        ])
```

## Using an item on a scene object

Every `PopochiuClickable` (Prop, Hotspot, Character) implements `_on_item_used(item: PopochiuInventoryItem)`, called when the player clicks the object while `I.active` is set:

```gdscript
func _on_item_used(item: PopochiuInventoryItem) -> void:
    if item == I.ToyCar:
        await C.player.walk_to_clicked()
        await C.player.say("Honey, here is your toy car!")
        I.ToyCar.remove()
```

## Item virtual lifecycle

`_on_click()`, `_on_right_click()`, `_on_middle_click()`, `_on_item_used(item)` (item-on-item combining), `_on_added_to_inventory()`, `_on_discard()` — the latter two call `super()` to preserve default GUI feedback when overridden.

## Prop `link_to_item`

A Prop can export `link_to_item := ""` naming an inventory item's `script_name`; the prop auto-hides once that item is collected, and exposes `_on_linked_item_removed()` / `_on_linked_item_discarded()` virtuals for when the link breaks (e.g. the item is later discarded from the inventory).
