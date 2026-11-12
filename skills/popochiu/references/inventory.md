# Popochiu — Inventory Items

> Deep dive for [../SKILL.md](../SKILL.md) §5. Source: `addons/popochiu/engine/objects/inventory_item/popochiu_inventory_item.gd` (`PopochiuInventoryItem extends TextureRect` — **not** a `PopochiuClickable`) and `addons/popochiu/engine/interfaces/i_inventory.gd` (`I` singleton).

## Item creation

Dock "Create inventory item" button generates `res://game/inventory_items/<name>/inventory_item_<name>.gd` (+ `.tscn`, + `inventory_item_<name>_state.gd` extending `PopochiuInventoryItemData`), registered in `popochiu_data.cfg` under `inventory_items`.

**Gotcha:** `PopochiuInventoryItem` extends `TextureRect` (a `Control`), not `Area2D` via `PopochiuClickable` — even though it shares the same virtual-method *names* as Props/Hotspots/Characters (`_on_click`, `_on_right_click`, `_on_middle_click`, `_on_item_used`) by convention, plus its own `_on_added_to_inventory()` and `_on_quantity_changed(old, new)` (`_on_discard()` is still declared but nothing calls it in 2.2.1). Don't treat it as a `PopochiuClickable` subtype when writing generic clickable-handling code.

## `I` (`PopochiuIInventory`) API

```gdscript
func clean_inventory(character: PopochiuCharacter = null) -> void
func clean_inventory_bg(character: PopochiuCharacter = null) -> void
func show_inventory(time := 1.0) -> void          # queue_show_inventory() twin
func hide_inventory(use_anim := true) -> void      # queue_hide_inventory() twin
func get_item_instance(item_name: String) -> PopochiuInventoryItem
func set_active_item(item: PopochiuInventoryItem = null) -> void
func is_item_in_inventory(item_name: String, character: PopochiuCharacter = null) -> bool
func is_item_in_any_inventory(item_name: String) -> bool
func get_item_quantity(item_name: String, character: PopochiuCharacter = null) -> int
func has_item_been_collected(item_name: String) -> bool
func is_full(character: PopochiuCharacter = null) -> bool             # checks PopochiuSettings.inventory_limit
func deselect_active() -> void
```

State: `I.active: PopochiuInventoryItem` (currently selected/cursor item), `I.clicked`, `I.items_states: Dictionary`. Inventories are per character (and items have quantities): `C.player.inventory` is a `Dictionary`; `I.items` is deprecated.

Signals: `item_added`, `item_add_done`, `item_removed`, `item_remove_done` (each carries `(item, character)`), `item_replaced`, `item_replace_done`, `item_quantity_updated`, `item_selected`, `inventory_show_requested`, `inventory_shown`, `inventory_hide_requested`.

## Add / remove / combine (`PopochiuInventoryItem` instance API)

```gdscript
func add(quantity := 1, character: PopochiuCharacter = null) -> void          # queue_add() twin
func add_as_active(quantity := 1, character: PopochiuCharacter = null) -> void  # queue_add_as_active() twin — adds AND makes it the active cursor item
func remove(quantity := 0, character: PopochiuCharacter = null) -> void         # queue_remove() twin — 0 removes the whole stack
func replace(new_item: PopochiuInventoryItem, character: PopochiuCharacter = null) -> void  # queue_replace() twin — removes the whole stack, adds one; item-combining primitive
```

## Combining items

Pattern from the addon's own doc comment on `queue_replace` — this is the script of `InventoryItemHook.gd`, i.e. the item reachable as `I.Hook`. The doc comment overrides the public `on_item_used()`; override `_on_item_used()` instead, since the public wrapper also clears `I.active` afterwards:

```gdscript
func _on_item_used(item: PopochiuInventoryItem) -> void:
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

`_on_click()`, `_on_right_click()`, `_on_middle_click()`, `_on_item_used(item)` (item-on-item combining), `_on_added_to_inventory()`, `_on_quantity_changed(old, new)` — the base implementations are empty, so there is nothing to `super()`. `discard()`/`queue_discard()` were removed in 2.2.1 (use `remove()`), so `_on_discard()` and the `item_discarded` signal never fire.

## Prop `link_to_item`

A Prop can export `link_to_item := ""` naming an inventory item's `script_name`; the prop auto-hides once that item is collected, and exposes `_on_linked_item_removed()` for when the link breaks (the item leaves the inventory). `_on_linked_item_discarded()` is still declared but nothing triggers it in 2.2.1.
