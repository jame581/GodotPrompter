#!/usr/bin/env bash
# Stages a small RPG project in the eval workspace so hooks/session-start finds a
# project.godot and injects the routing card. The project already has its own inventory,
# ability, and save systems, so a case can ask for a change inside one of them. The
# instructions file carries a GodotPrompter section so the hook does not also offer to add one.
# Identical in neg-01, neg-02 and neg-03; keep the three copies in step.
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
