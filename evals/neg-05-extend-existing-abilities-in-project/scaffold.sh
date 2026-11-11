#!/usr/bin/env bash
# Stages a small RPG project in the eval workspace so hooks/session-start finds a
# project.godot and injects the routing card. The project already has its own inventory,
# ability, and save systems, so a case can ask for a change inside one of them. The
# instructions file carries a GodotPrompter section so the hook does not also offer to add one.
# RICH variant for neg-04 and neg-05 (identical in both): adds an ItemData resource, a slot UI scene,
# a status-effect host and an Ability base with cost/cooldown hooks, replacing the simple
# inventory.gd, ability.gd and fireball.gd of the neg-01..03 scaffold.
set -euo pipefail

mkdir -p scripts/inventory scripts/abilities scripts/save .github/workflows

cat > project.godot <<'GODOT'
config_version=5

[application]

config/name="Emberfall"
config/features=PackedStringArray("4.3", "Forward Plus")

[autoload]

SaveManager="*res://scripts/save/save_manager.gd"
GODOT

cat > CLAUDE.md <<'MD'
# Emberfall

A small top-down RPG. Inventory, abilities, and saving already exist under `scripts/`.

## GodotPrompter

Invoke the matching `godot-prompter:*` skill before implementing any Godot system.
MD

cat > README.md <<'MD'
# Emberfall

A small top-down RPG built with Godot 4.3.

## Running

Open the project in Godot 4.3 or newer and press F5.

## Project layout

- `scripts/inventory/` - slot-based inventory
- `scripts/abilities/` - player abilities
- `scripts/save/` - save and load
MD

cat > .github/workflows/build.yml <<'YML'
name: Build

on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    container:
      image: barichello/godot-ci:4.3
    steps:
      - uses: actions/checkout@v4
      - name: Import project
        run: godot --headless --import
YML

cat > scripts/inventory/inventory.gd <<'GD'
class_name Inventory
extends Node
## Slot-based inventory. Each slot is {"id": StringName, "count": int}.

signal changed
signal item_added(id: StringName, count: int)

@export var slot_count: int = 20
@export var max_stack: int = 16

var slots: Array[Dictionary] = []


func _ready() -> void:
	slots.resize(slot_count)
	for i in slot_count:
		slots[i] = {}


## Adds count items. Returns how many did not fit.
func add_item(id: StringName, count: int) -> int:
	var remaining := count
	# Top up existing stacks first.
	for slot in slots:
		if remaining <= 0:
			break
		if slot.is_empty() or slot["id"] != id:
			continue
		if slot["count"] <= max_stack:
			var room: int = max_stack - slot["count"] + 1
			var moved: int = mini(room, remaining)
			slot["count"] += moved
			remaining -= moved
	# Then open empty slots.
	for i in slots.size():
		if remaining <= 0:
			break
		if not slots[i].is_empty():
			continue
		var moved: int = mini(max_stack, remaining)
		slots[i] = {"id": id, "count": moved}
		remaining -= moved
	if remaining < count:
		item_added.emit(id, count - remaining)
		changed.emit()
	return remaining


func remove_item(id: StringName, count: int) -> bool:
	if count_of(id) < count:
		return false
	var to_remove := count
	for i in slots.size():
		if to_remove <= 0:
			break
		var slot := slots[i]
		if slot.is_empty() or slot["id"] != id:
			continue
		var taken: int = mini(slot["count"], to_remove)
		slot["count"] -= taken
		to_remove -= taken
		if slot["count"] == 0:
			slots[i] = {}
	changed.emit()
	return true


func count_of(id: StringName) -> int:
	var total := 0
	for slot in slots:
		if not slot.is_empty() and slot["id"] == id:
			total += slot["count"]
	return total


func to_dict() -> Dictionary:
	return {"slots": slots.duplicate(true)}


func from_dict(data: Dictionary) -> void:
	slots.clear()
	for s in data.get("slots", []):
		slots.append(s)
	changed.emit()
GD

cat > scripts/abilities/ability.gd <<'GD'
class_name Ability
extends Resource
## Base class for player abilities.

@export var display_name: String = ""
@export var cooldown: float = 1.0
@export var mana_cost: int = 0
@export_multiline var tooltip: String = ""

var _ready_at_msec: int = 0


func can_use(mana: int) -> bool:
	return mana >= mana_cost and Time.get_ticks_msec() >= _ready_at_msec


func use(caster: Node) -> void:
	_ready_at_msec = Time.get_ticks_msec() + int(cooldown * 1000.0)
	_cast(caster)


func _cast(_caster: Node) -> void:
	pass
GD

cat > scripts/abilities/fireball.gd <<'GD'
class_name Fireball
extends Ability

@export var projectile_scene: PackedScene
@export var damage: int = 25


func _init() -> void:
	display_name = "Fireball"
	cooldown = 3.0
	mana_cost = 12
	tooltip = "Hurls a fireball that deals %d damage. Cooldown: 3 seconds." % damage


func _cast(caster: Node) -> void:
	var projectile: Node2D = projectile_scene.instantiate()
	projectile.set("damage", damage)
	caster.get_parent().add_child(projectile)
	projectile.global_position = caster.global_position
GD

cat > scripts/save/save_manager.gd <<'GD'
extends Node
## Autoload. Writes a single JSON save to user://save.json.

const SAVE_PATH := "user://save.json"
const SAVE_VERSION := 2

signal saved
signal loaded


func save_game(inventory: Inventory, player_position: Vector2) -> Error:
	var data := {
		"version": SAVE_VERSION,
		"player_position": [player_position.x, player_position.y],
		"inventory": inventory.to_dict(),
	}
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		return FileAccess.get_open_error()
	file.store_string(JSON.stringify(data))
	saved.emit()
	return OK


func load_game(inventory: Inventory) -> Vector2:
	if not FileAccess.file_exists(SAVE_PATH):
		return Vector2.ZERO
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(SAVE_PATH))
	if typeof(parsed) != TYPE_DICTIONARY:
		return Vector2.ZERO
	inventory.from_dict(parsed.get("inventory", {}))
	var pos: Array = parsed.get("player_position", [0, 0])
	loaded.emit()
	return Vector2(pos[0], pos[1])
GD

# ---- rich project extras -------------------------------------------------------------------
mkdir -p scripts/ui scripts/combat scenes/ui data/items
rm -f scripts/inventory/inventory.gd scripts/abilities/ability.gd scripts/abilities/fireball.gd

cat > scripts/inventory/item_data.gd <<'GD'
class_name ItemData
extends Resource
## One item definition. Instances live in res://data/items/*.tres and are registered with ItemDatabase.

enum Category { WEAPON, ARMOR, CONSUMABLE, MATERIAL, QUEST }

@export var id: StringName
@export var display_name: String = ""
@export var icon: Texture2D
@export var category: Category = Category.MATERIAL
@export var max_stack: int = 16
@export var base_value: int = 1
@export_multiline var description: String = ""


func get_tooltip() -> String:
	var lines: PackedStringArray = [display_name, Category.keys()[category].capitalize()]
	if description != "":
		lines.append(description)
	lines.append("Value: %d" % base_value)
	return "\n".join(lines)
GD

cat > scripts/inventory/item_database.gd <<'GD'
extends Node
## Autoload. Loads every ItemData in res://data/items/ and looks them up by id.

var _items: Dictionary = {}


func _ready() -> void:
	for file in DirAccess.get_files_at("res://data/items"):
		if file.ends_with(".tres"):
			var item := load("res://data/items/" + file) as ItemData
			if item != null:
				_items[item.id] = item


func get_item(id: StringName) -> ItemData:
	return _items.get(id)
GD

cat > scripts/inventory/inventory.gd <<'GD'
class_name Inventory
extends Node
## Slot-based inventory. Each slot is {"id": StringName, "count": int}; item rules come from ItemData.

signal changed
signal item_added(item: ItemData, count: int)

@export var slot_count: int = 20

var slots: Array[Dictionary] = []


func _ready() -> void:
	slots.resize(slot_count)
	for i in slot_count:
		slots[i] = {}


## Adds count of item. Returns how many did not fit.
func add_item(item: ItemData, count: int) -> int:
	var remaining := count
	for slot in slots:
		if remaining <= 0:
			break
		if slot.is_empty() or slot["id"] != item.id:
			continue
		var moved: int = mini(item.max_stack - slot["count"], remaining)
		if moved > 0:
			slot["count"] += moved
			remaining -= moved
	for i in slots.size():
		if remaining <= 0:
			break
		if not slots[i].is_empty():
			continue
		var moved: int = mini(item.max_stack, remaining)
		slots[i] = {"id": item.id, "count": moved}
		remaining -= moved
	if remaining < count:
		item_added.emit(item, count - remaining)
		changed.emit()
	return remaining


func remove_item(item: ItemData, count: int) -> bool:
	if count_of(item) < count:
		return false
	var to_remove := count
	for i in slots.size():
		if to_remove <= 0:
			break
		var slot := slots[i]
		if slot.is_empty() or slot["id"] != item.id:
			continue
		var taken: int = mini(slot["count"], to_remove)
		slot["count"] -= taken
		to_remove -= taken
		if slot["count"] == 0:
			slots[i] = {}
	changed.emit()
	return true


func count_of(item: ItemData) -> int:
	var total := 0
	for slot in slots:
		if not slot.is_empty() and slot["id"] == item.id:
			total += slot["count"]
	return total


func get_item_at(index: int) -> ItemData:
	if slots[index].is_empty():
		return null
	var database: Node = get_node("/root/ItemDatabase")
	return database.get_item(slots[index]["id"])


func to_dict() -> Dictionary:
	return {"slots": slots.duplicate(true)}


func from_dict(data: Dictionary) -> void:
	slots.clear()
	for s in data.get("slots", []):
		slots.append(s)
	changed.emit()
GD

cat > scripts/ui/inventory_slot.gd <<'GD'
class_name InventorySlot
extends PanelContainer
## One cell of the inventory grid. Shows the icon and stack count; the tooltip comes from ItemData.

@onready var _icon: TextureRect = $Icon
@onready var _count: Label = $Count

var _item: ItemData


func show_stack(item: ItemData, count: int) -> void:
	_item = item
	if item == null:
		_icon.texture = null
		_count.text = ""
		tooltip_text = ""
		return
	_icon.texture = item.icon
	_count.text = str(count) if count > 1 else ""
	tooltip_text = item.get_tooltip()
GD

cat > scripts/ui/inventory_grid.gd <<'GD'
class_name InventoryGrid
extends GridContainer
## Builds one InventorySlot per inventory slot and refreshes them when the inventory changes.

const SLOT_SCENE := preload("res://scenes/ui/inventory_slot.tscn")

@export var inventory: Inventory

var _cells: Array[InventorySlot] = []


func _ready() -> void:
	for i in inventory.slot_count:
		var cell: InventorySlot = SLOT_SCENE.instantiate()
		add_child(cell)
		_cells.append(cell)
	inventory.changed.connect(_refresh)
	_refresh()


func _refresh() -> void:
	for i in _cells.size():
		var slot := inventory.slots[i]
		_cells[i].show_stack(inventory.get_item_at(i), slot.get("count", 0))
GD

cat > scenes/ui/inventory_slot.tscn <<'TSCN'
[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/ui/inventory_slot.gd" id="1"]

[node name="InventorySlot" type="PanelContainer"]
custom_minimum_size = Vector2(64, 64)
script = ExtResource("1")

[node name="Icon" type="TextureRect" parent="."]
layout_mode = 2
expand_mode = 1

[node name="Count" type="Label" parent="."]
layout_mode = 2
horizontal_alignment = 2
vertical_alignment = 2
TSCN

cat > data/items/iron_sword.tres <<'TRES'
[gd_resource type="Resource" script_class="ItemData" load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/inventory/item_data.gd" id="1"]

[resource]
script = ExtResource("1")
id = &"iron_sword"
display_name = "Iron Sword"
category = 0
max_stack = 1
base_value = 40
description = "A plain blade."
TRES

cat > data/items/health_potion.tres <<'TRES'
[gd_resource type="Resource" script_class="ItemData" load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/inventory/item_data.gd" id="1"]

[resource]
script = ExtResource("1")
id = &"health_potion"
display_name = "Health Potion"
category = 2
max_stack = 16
base_value = 12
description = "Restores 30 health."
TRES

cat >> project.godot <<'GODOT'
ItemDatabase="*res://scripts/inventory/item_database.gd"
GODOT

cat > scripts/combat/status_effect.gd <<'GD'
class_name StatusEffect
extends RefCounted
## A timed effect on a target. Subclasses override _on_start, _on_tick and _on_end.

var duration: float = 1.0
var elapsed: float = 0.0
var host: StatusEffectHost


func start(p_host: StatusEffectHost) -> void:
	host = p_host
	_on_start()


func tick(delta: float) -> bool:
	elapsed += delta
	_on_tick(delta)
	return elapsed >= duration


func end() -> void:
	_on_end()


func _on_start() -> void:
	pass


func _on_tick(_delta: float) -> void:
	pass


func _on_end() -> void:
	pass
GD

cat > scripts/combat/burn_effect.gd <<'GD'
class_name BurnEffect
extends StatusEffect

var damage_per_second: float = 4.0


func _init(p_duration: float = 3.0) -> void:
	duration = p_duration


func _on_tick(delta: float) -> void:
	if host.target.has_method("take_damage"):
		host.target.take_damage(damage_per_second * delta)
GD

cat > scripts/combat/status_effect_host.gd <<'GD'
class_name StatusEffectHost
extends Node
## Child of anything that can be affected. Runs effects and removes them when they expire.

signal effect_applied(effect: StatusEffect)
signal effect_ended(effect: StatusEffect)

@onready var target: Node = get_parent()

var _effects: Array[StatusEffect] = []


func apply(effect: StatusEffect) -> void:
	_effects.append(effect)
	effect.start(self)
	effect_applied.emit(effect)


func _process(delta: float) -> void:
	for effect in _effects.duplicate():
		if effect.tick(delta):
			effect.end()
			_effects.erase(effect)
			effect_ended.emit(effect)
GD

cat > scripts/abilities/ability.gd <<'GD'
class_name Ability
extends Resource
## Base class for player abilities. Subclasses override the hooks; the cost, cooldown and
## targeting checks live here so every ability behaves the same way.

signal cast(caster: Node)
signal cooldown_started(duration: float)

@export var display_name: String = ""
@export var cooldown: float = 1.0
@export var mana_cost: int = 0
@export var cast_range: float = 300.0
@export_multiline var tooltip: String = ""

var _ready_at_msec: int = 0


func can_cast(caster: Node) -> bool:
	if Time.get_ticks_msec() < _ready_at_msec:
		return false
	return _has_resources(caster) and _is_target_valid(caster)


func try_cast(caster: Node) -> bool:
	if not can_cast(caster):
		return false
	_pay_cost(caster)
	_ready_at_msec = Time.get_ticks_msec() + int(cooldown * 1000.0)
	cooldown_started.emit(cooldown)
	_on_cast(caster)
	cast.emit(caster)
	return true


## Hook: does the caster have mana, charges, and so on.
func _has_resources(caster: Node) -> bool:
	return caster.get("mana") != null and caster.mana >= mana_cost


## Hook: is there something to hit.
func _is_target_valid(_caster: Node) -> bool:
	return true


## Hook: deduct the cost.
func _pay_cost(caster: Node) -> void:
	caster.mana -= mana_cost


## Hook: the actual effect.
func _on_cast(_caster: Node) -> void:
	pass
GD

cat > scripts/abilities/fireball.gd <<'GD'
class_name Fireball
extends Ability

@export var projectile_scene: PackedScene
@export var damage: int = 25
@export var burn_seconds: float = 3.0


func _init() -> void:
	display_name = "Fireball"
	cooldown = 3.0
	mana_cost = 12
	cast_range = 500.0
	tooltip = "Hurls a fireball that deals %d damage and burns the target. Cooldown: 3 seconds." % damage


func _is_target_valid(caster: Node) -> bool:
	return caster.get("target") != null


func _on_cast(caster: Node) -> void:
	var projectile: Node2D = projectile_scene.instantiate()
	projectile.set("damage", damage)
	projectile.set("target", caster.target)
	caster.get_parent().add_child(projectile)
	projectile.global_position = caster.global_position
	var host := caster.target.get_node_or_null("StatusEffectHost") as StatusEffectHost
	if host != null:
		host.apply(BurnEffect.new(burn_seconds))
GD
