# Trial Project Validation Implementation Plan

**Status:** shipped in v1.0.0 (2026-04-06)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal top-down 2D action RPG at `tests/trial-project/` that validates 13+ GodotPrompter skills end-to-end, then port 3 systems to C#.

**Architecture:** Godot 4.3+ project using autoloads (GameManager, EventBus, DialogueManager, SaveManager) for cross-system communication. Enum-based FSM for player/enemy states. Component-based damage system (Hitbox/Hurtbox/Health). NavigationAgent2D for enemy AI. JSON save/load. CanvasLayer HUD.

**Tech Stack:** Godot 4.3+, GDScript (primary), C# (port of 3 systems). No external addons.

---

## File Map

| File | Responsibility |
|------|---------------|
| `tests/trial-project/project.godot` | Project configuration, autoload registration, input map |
| `tests/trial-project/.gitignore` | Godot-specific ignores |
| `tests/trial-project/autoloads/event_bus.gd` | Global typed signal hub |
| `tests/trial-project/autoloads/game_manager.gd` | Game state, scene transitions, pause |
| `tests/trial-project/autoloads/dialogue_manager.gd` | Dialogue flow, branching, signals |
| `tests/trial-project/autoloads/save_manager.gd` | JSON save/load with version migration |
| `tests/trial-project/resources/scripts/item_data.gd` | ItemData Resource class |
| `tests/trial-project/resources/scripts/enemy_stats.gd` | EnemyStats Resource class |
| `tests/trial-project/resources/scripts/dialogue_line.gd` | DialogueLine Resource class |
| `tests/trial-project/resources/scripts/dialogue_data.gd` | DialogueData Resource class |
| `tests/trial-project/resources/scripts/inventory_slot.gd` | InventorySlot RefCounted class |
| `tests/trial-project/resources/items/health_potion.tres` | Health potion item definition |
| `tests/trial-project/resources/items/sword.tres` | Sword item definition |
| `tests/trial-project/resources/enemies/slime_stats.tres` | Slime enemy stats |
| `tests/trial-project/resources/dialogue/npc_greeting.tres` | NPC greeting dialogue data |
| `tests/trial-project/scripts/components/health_component.gd` | Health tracking, signals |
| `tests/trial-project/scripts/components/hitbox_component.gd` | Damage dealer (Area2D) |
| `tests/trial-project/scripts/components/hurtbox_component.gd` | Damage receiver (Area2D) |
| `tests/trial-project/scripts/player/player.gd` | Player controller with FSM |
| `tests/trial-project/scripts/enemy/enemy.gd` | Enemy AI with FSM + NavigationAgent2D |
| `tests/trial-project/scripts/npc/npc.gd` | Interactable NPC |
| `tests/trial-project/scripts/items/pickup.gd` | World item pickup node |
| `tests/trial-project/scripts/inventory/inventory.gd` | Inventory data management |
| `tests/trial-project/scripts/camera/game_camera.gd` | Smooth follow + screen shake |
| `tests/trial-project/scripts/ui/health_bar.gd` | Animated health bar |
| `tests/trial-project/scripts/ui/hud.gd` | HUD controller |
| `tests/trial-project/scripts/ui/interaction_prompt.gd` | "Press E" prompt |
| `tests/trial-project/scripts/ui/dialogue_ui.gd` | Dialogue box + choices |
| `tests/trial-project/scripts/ui/inventory_ui.gd` | Basic inventory grid |
| `tests/trial-project/scenes/main.tscn` | Main game scene (world + HUD) |
| `tests/trial-project/scenes/player.tscn` | Player scene |
| `tests/trial-project/scenes/enemy.tscn` | Enemy scene |
| `tests/trial-project/scenes/npc.tscn` | NPC scene |
| `tests/trial-project/scenes/pickup.tscn` | Pickup scene |
| `tests/trial-project/scenes/ui/hud.tscn` | HUD CanvasLayer scene |
| `tests/trial-project/scenes/ui/dialogue_ui.tscn` | Dialogue panel scene |
| `tests/trial-project/scenes/ui/inventory_ui.tscn` | Inventory panel scene |
| `tests/trial-project/VALIDATION.md` | Per-skill pass/fail tracking |
| `tests/trial-project/csharp/EventBus.cs` | C# port of EventBus |
| `tests/trial-project/csharp/Player.cs` | C# port of PlayerController |
| `tests/trial-project/csharp/Inventory.cs` | C# port of Inventory |

---

### Task 1: Project Scaffold

**Validates:** godot-project-setup

**Files:**
- Create: `tests/trial-project/project.godot`
- Create: `tests/trial-project/.gitignore`
- Create: `tests/trial-project/VALIDATION.md`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p tests/trial-project/{autoloads,resources/{scripts,items,enemies,dialogue},scripts/{components,player,enemy,npc,items,inventory,camera,ui},scenes/ui,csharp}
```

- [ ] **Step 2: Create .gitignore**

Create `tests/trial-project/.gitignore`:

```gitignore
# Godot 4.x
.godot/
*.uid

# Mono / C#
.mono/
data_*/
*.translation

# OS
.DS_Store
Thumbs.db
```

- [ ] **Step 3: Create project.godot**

Create `tests/trial-project/project.godot`:

```ini
; Engine configuration file.
; It's best edited using the editor UI and not directly,
; but it can also be edited with a text editor.

config_version=5

[application]

config/name="GodotPrompter Trial"
run/main_scene="res://scenes/main.tscn"
config/features=PackedStringArray("4.3", "GL Compatibility")

[autoload]

EventBus="*res://autoloads/event_bus.gd"
GameManager="*res://autoloads/game_manager.gd"
DialogueManager="*res://autoloads/dialogue_manager.gd"
SaveManager="*res://autoloads/save_manager.gd"

[display]

window/size/viewport_width=1280
window/size/viewport_height=720
window/stretch/mode="canvas_items"

[input]

move_left={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":65,"key_label":0,"unicode":97,"location":0,"echo":false,"script":null)
]
}
move_right={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":68,"key_label":0,"unicode":100,"location":0,"echo":false,"script":null)
]
}
move_up={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":87,"key_label":0,"unicode":119,"location":0,"echo":false,"script":null)
]
}
move_down={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":83,"key_label":0,"unicode":115,"location":0,"echo":false,"script":null)
]
}
attack={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":32,"key_label":0,"unicode":32,"location":0,"echo":false,"script":null)
]
}
interact={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":69,"key_label":0,"unicode":101,"location":0,"echo":false,"script":null)
]
}
inventory={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":73,"key_label":0,"unicode":105,"location":0,"echo":false,"script":null)
]
}
save_game={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":4194333,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)
]
}
load_game={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":4194338,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)
]
}

[layer_names]

2d_physics/layer_1="player"
2d_physics/layer_2="enemy"
2d_physics/layer_3="environment"
2d_physics/layer_4="hitbox"
2d_physics/layer_5="hurtbox"
2d_physics/layer_6="interaction"
2d_physics/layer_7="navigation"
```

Input actions: WASD movement (`move_left/right/up/down`), Space (`attack`), E (`interact`), I (`inventory`), F5 (`save_game`), F9 (`load_game`).

- [ ] **Step 4: Create VALIDATION.md skeleton**

Create `tests/trial-project/VALIDATION.md`:

```markdown
# Skill Validation Results

| Skill | Status | Notes |
|-------|--------|-------|
| godot-project-setup | | |
| event-bus | | |
| resource-pattern | | |
| player-controller | | |
| state-machine | | |
| component-system | | |
| camera-system | | |
| ai-navigation | | |
| hud-system | | |
| inventory-system | | |
| dialogue-system | | |
| save-load | | |
| scene-organization | | |
| csharp-godot | | |
| csharp-signals | | |
```

- [ ] **Step 5: Commit scaffold**

```bash
git add tests/trial-project/
git commit -m "feat(trial): scaffold project structure and config"
```

---

### Task 2: EventBus Autoload

**Validates:** event-bus

**Files:**
- Create: `tests/trial-project/autoloads/event_bus.gd`

- [ ] **Step 1: Create EventBus with typed signals**

Create `tests/trial-project/autoloads/event_bus.gd`:

```gdscript
extends Node

# Player events
signal player_died
signal health_changed(current: int, maximum: int)

# Combat events
signal damage_dealt(amount: int, position: Vector2)

# Score / progression
signal score_changed(new_score: int)
signal item_collected(item_name: String)

# Dialogue events
signal dialogue_started
signal dialogue_ended

# Save/Load events
signal game_saved(slot_name: String)
signal game_loaded(slot_name: String)
```

- [ ] **Step 2: Create GameManager autoload**

Create `tests/trial-project/autoloads/game_manager.gd`:

```gdscript
extends Node

signal scene_changed(scene_path: String)
signal game_paused(is_paused: bool)

var score: int = 0:
	set(value):
		score = value
		EventBus.score_changed.emit(score)

var is_paused: bool = false

func change_scene(path: String) -> void:
	scene_changed.emit(path)
	get_tree().change_scene_to_file(path)

func set_paused(paused: bool) -> void:
	is_paused = paused
	get_tree().paused = paused
	game_paused.emit(paused)

func add_score(amount: int) -> void:
	score += amount
```

- [ ] **Step 3: Commit**

```bash
git add tests/trial-project/autoloads/
git commit -m "feat(trial): add EventBus and GameManager autoloads"
```

---

### Task 3: Resource Definitions

**Validates:** resource-pattern

**Files:**
- Create: `tests/trial-project/resources/scripts/item_data.gd`
- Create: `tests/trial-project/resources/scripts/enemy_stats.gd`
- Create: `tests/trial-project/resources/scripts/inventory_slot.gd`
- Create: `tests/trial-project/resources/items/health_potion.tres`
- Create: `tests/trial-project/resources/items/sword.tres`
- Create: `tests/trial-project/resources/enemies/slime_stats.tres`

- [ ] **Step 1: Create ItemData resource class**

Create `tests/trial-project/resources/scripts/item_data.gd`:

```gdscript
class_name ItemData
extends Resource

enum ItemType { WEAPON, CONSUMABLE, QUEST }

@export var id: String = ""
@export var name: String = ""
@export_multiline var description: String = ""
@export var icon: Texture2D
@export var value: int = 0
@export var item_type: ItemType = ItemType.CONSUMABLE
@export var max_stack: int = 1
@export var heal_amount: int = 0
```

- [ ] **Step 2: Create EnemyStats resource class**

Create `tests/trial-project/resources/scripts/enemy_stats.gd`:

```gdscript
class_name EnemyStats
extends Resource

@export_group("Combat")
@export_range(1, 5000, 1) var health: int = 100
@export_range(0.0, 500.0, 0.1) var speed: float = 80.0
@export_range(0, 999, 1) var damage: int = 10
@export_range(0.1, 10.0, 0.1) var attack_interval: float = 1.5

@export_group("AI")
@export_range(0.0, 500.0, 1.0) var chase_range: float = 200.0
@export_range(0.0, 200.0, 1.0) var attack_range: float = 40.0
@export_range(0.0, 500.0, 1.0) var patrol_range: float = 150.0

@export_group("Drops")
@export var drop_items: Array[ItemData] = []
@export_range(0.0, 1.0, 0.01) var drop_chance: float = 0.3
```

- [ ] **Step 3: Create InventorySlot class**

Create `tests/trial-project/resources/scripts/inventory_slot.gd`:

```gdscript
class_name InventorySlot
extends RefCounted

var item: ItemData = null
var quantity: int = 0

func is_empty() -> bool:
	return item == null or quantity <= 0

func add_to_stack(amount: int) -> int:
	if item == null:
		return amount
	var can_add := mini(amount, item.max_stack - quantity)
	quantity += can_add
	return amount - can_add

func remove_from_stack(amount: int) -> void:
	quantity -= amount
	if quantity <= 0:
		item = null
		quantity = 0
```

- [ ] **Step 4: Create .tres resource files**

Create `tests/trial-project/resources/items/health_potion.tres`:

```ini
[gd_resource type="Resource" script_class="ItemData" load_steps=2 format=3]

[ext_resource type="Script" path="res://resources/scripts/item_data.gd" id="1"]

[resource]
script = ExtResource("1")
id = "health_potion"
name = "Health Potion"
description = "Restores 30 health."
value = 10
item_type = 1
max_stack = 5
heal_amount = 30
```

Create `tests/trial-project/resources/items/sword.tres`:

```ini
[gd_resource type="Resource" script_class="ItemData" load_steps=2 format=3]

[ext_resource type="Script" path="res://resources/scripts/item_data.gd" id="1"]

[resource]
script = ExtResource("1")
id = "sword"
name = "Iron Sword"
description = "A basic iron sword."
value = 25
item_type = 0
max_stack = 1
```

Create `tests/trial-project/resources/enemies/slime_stats.tres`:

```ini
[gd_resource type="Resource" script_class="EnemyStats" load_steps=2 format=3]

[ext_resource type="Script" path="res://resources/scripts/enemy_stats.gd" id="1"]

[resource]
script = ExtResource("1")
health = 50
speed = 60.0
damage = 5
attack_interval = 2.0
chase_range = 180.0
attack_range = 35.0
patrol_range = 120.0
drop_chance = 0.5
```

- [ ] **Step 5: Commit**

```bash
git add tests/trial-project/resources/
git commit -m "feat(trial): add ItemData, EnemyStats, InventorySlot resources"
```

---

### Task 4: Component System

**Validates:** component-system

**Files:**
- Create: `tests/trial-project/scripts/components/health_component.gd`
- Create: `tests/trial-project/scripts/components/hitbox_component.gd`
- Create: `tests/trial-project/scripts/components/hurtbox_component.gd`

- [ ] **Step 1: Create HealthComponent**

Create `tests/trial-project/scripts/components/health_component.gd`:

```gdscript
class_name HealthComponent
extends Node

signal health_changed(current: int, maximum: int)
signal died

@export var max_health: int = 100

var current_health: int:
	get:
		return _current_health

var _current_health: int

func _ready() -> void:
	_current_health = max_health

func take_damage(amount: int) -> void:
	_current_health = maxi(_current_health - amount, 0)
	health_changed.emit(_current_health, max_health)
	if _current_health <= 0:
		died.emit()

func heal(amount: int) -> void:
	_current_health = mini(_current_health + amount, max_health)
	health_changed.emit(_current_health, max_health)

func get_health_percent() -> float:
	if max_health <= 0:
		return 0.0
	return float(_current_health) / float(max_health)
```

- [ ] **Step 2: Create HitboxComponent**

Create `tests/trial-project/scripts/components/hitbox_component.gd`:

```gdscript
class_name HitboxComponent
extends Area2D

@export var damage: int = 10
@export var cooldown_duration: float = 0.5

signal hit(target_hurtbox: HurtboxComponent)

var _on_cooldown: bool = false
@onready var _cooldown_timer: Timer = _build_timer()

func _ready() -> void:
	area_entered.connect(_on_area_entered)

func _on_area_entered(area: Area2D) -> void:
	if _on_cooldown:
		return
	if area is not HurtboxComponent:
		return
	hit.emit(area)
	area.receive_hit(damage)
	if cooldown_duration > 0.0:
		_on_cooldown = true
		_cooldown_timer.start(cooldown_duration)

func _build_timer() -> Timer:
	var t := Timer.new()
	t.one_shot = true
	t.timeout.connect(func(): _on_cooldown = false)
	add_child(t)
	return t
```

- [ ] **Step 3: Create HurtboxComponent**

Create `tests/trial-project/scripts/components/hurtbox_component.gd`:

```gdscript
class_name HurtboxComponent
extends Area2D

@export var health_component: HealthComponent
@export var invincibility_duration: float = 0.5

signal hurt(damage_amount: int)

var _invincible: bool = false
@onready var _iframes_timer: Timer = _build_timer()

func receive_hit(damage: int) -> void:
	if _invincible:
		return
	hurt.emit(damage)
	if health_component:
		health_component.take_damage(damage)
	if invincibility_duration > 0.0:
		_invincible = true
		_iframes_timer.start(invincibility_duration)

func _build_timer() -> Timer:
	var t := Timer.new()
	t.one_shot = true
	t.timeout.connect(func(): _invincible = false)
	add_child(t)
	return t
```

- [ ] **Step 4: Commit**

```bash
git add tests/trial-project/scripts/components/
git commit -m "feat(trial): add Health, Hitbox, Hurtbox components"
```

---

### Task 5: Player Controller

**Validates:** player-controller, state-machine

**Files:**
- Create: `tests/trial-project/scripts/player/player.gd`
- Create: `tests/trial-project/scenes/player.tscn`

- [ ] **Step 1: Create player script with FSM**

Create `tests/trial-project/scripts/player/player.gd`:

```gdscript
extends CharacterBody2D

enum State { IDLE, MOVE, ATTACK }

@export var speed: float = 200.0
@export var acceleration: float = 1500.0
@export var friction: float = 1200.0
@export var attack_duration: float = 0.3

var current_state: State = State.IDLE
var _attack_timer: float = 0.0

@onready var health_component: HealthComponent = $HealthComponent
@onready var hitbox: HitboxComponent = $AttackPivot/HitboxComponent
@onready var hurtbox: HurtboxComponent = $HurtboxComponent
@onready var attack_pivot: Node2D = $AttackPivot
@onready var sprite: ColorRect = $Sprite

func _ready() -> void:
	add_to_group("player")
	hitbox.monitoring = false
	health_component.health_changed.connect(_on_health_changed)
	health_component.died.connect(_on_died)
	hurtbox.hurt.connect(_on_hurt)

func _physics_process(delta: float) -> void:
	match current_state:
		State.IDLE:
			_state_idle(delta)
		State.MOVE:
			_state_move(delta)
		State.ATTACK:
			_state_attack(delta)
	move_and_slide()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("attack") and current_state != State.ATTACK:
		_enter_attack()

func _state_idle(delta: float) -> void:
	velocity = velocity.move_toward(Vector2.ZERO, friction * delta)
	var input_dir := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	if input_dir != Vector2.ZERO:
		current_state = State.MOVE

func _state_move(delta: float) -> void:
	var input_dir := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	if input_dir == Vector2.ZERO:
		current_state = State.IDLE
		return
	velocity = velocity.move_toward(input_dir * speed, acceleration * delta)
	# Rotate attack pivot to face movement direction
	attack_pivot.rotation = input_dir.angle()

func _state_attack(delta: float) -> void:
	velocity = velocity.move_toward(Vector2.ZERO, friction * delta)
	_attack_timer -= delta
	if _attack_timer <= 0.0:
		hitbox.monitoring = false
		current_state = State.IDLE

func _enter_attack() -> void:
	current_state = State.ATTACK
	_attack_timer = attack_duration
	hitbox.monitoring = true

func _on_health_changed(current: int, maximum: int) -> void:
	EventBus.health_changed.emit(current, maximum)

func _on_died() -> void:
	EventBus.player_died.emit()
	# Simple death: just disable input for now
	set_physics_process(false)

func _on_hurt(damage_amount: int) -> void:
	EventBus.damage_dealt.emit(damage_amount, global_position)
	# Flash red briefly
	sprite.color = Color.RED
	get_tree().create_timer(0.15).timeout.connect(func(): sprite.color = Color.DODGER_BLUE)
```

- [ ] **Step 2: Create player scene**

Create `tests/trial-project/scenes/player.tscn`:

```ini
[gd_scene load_steps=5 format=3]

[ext_resource type="Script" path="res://scripts/player/player.gd" id="1"]
[ext_resource type="Script" path="res://scripts/components/health_component.gd" id="2"]
[ext_resource type="Script" path="res://scripts/components/hitbox_component.gd" id="3"]
[ext_resource type="Script" path="res://scripts/components/hurtbox_component.gd" id="4"]

[node name="Player" type="CharacterBody2D"]
collision_layer = 1
collision_mask = 3
script = ExtResource("1")

[node name="Sprite" type="ColorRect" parent="."]
offset_left = -16.0
offset_top = -16.0
offset_right = 16.0
offset_bottom = 16.0
color = Color(0.118, 0.565, 1, 1)

[node name="CollisionShape2D" type="CollisionShape2D" parent="."]
shape = SubResource("RectangleShape2D_player")

[sub_resource type="RectangleShape2D" id="RectangleShape2D_player"]
size = Vector2(28, 28)

[node name="HealthComponent" type="Node" parent="."]
script = ExtResource("2")
max_health = 100

[node name="HurtboxComponent" type="Area2D" parent="."]
collision_layer = 16
collision_mask = 8
script = ExtResource("4")
health_component = NodePath("../HealthComponent")

[node name="HurtboxShape" type="CollisionShape2D" parent="HurtboxComponent"]
shape = SubResource("RectangleShape2D_player_hurtbox")

[sub_resource type="RectangleShape2D" id="RectangleShape2D_player_hurtbox"]
size = Vector2(30, 30)

[node name="AttackPivot" type="Node2D" parent="."]

[node name="HitboxComponent" type="Area2D" parent="AttackPivot"]
position = Vector2(30, 0)
collision_layer = 8
collision_mask = 16
monitoring = false
script = ExtResource("3")
damage = 20

[node name="HitboxShape" type="CollisionShape2D" parent="AttackPivot/HitboxComponent"]
shape = SubResource("RectangleShape2D_player_hitbox")

[sub_resource type="RectangleShape2D" id="RectangleShape2D_player_hitbox"]
size = Vector2(24, 24)
```

- [ ] **Step 3: Commit**

```bash
git add tests/trial-project/scripts/player/ tests/trial-project/scenes/player.tscn
git commit -m "feat(trial): add player controller with FSM and combat"
```

---

### Task 6: Camera System

**Validates:** camera-system

**Files:**
- Create: `tests/trial-project/scripts/camera/game_camera.gd`

- [ ] **Step 1: Create smooth follow camera with screen shake**

Create `tests/trial-project/scripts/camera/game_camera.gd`:

```gdscript
extends Camera2D

@export var target: Node2D
@export var follow_speed: float = 8.0
@export var look_ahead_distance: float = 60.0
@export var look_ahead_speed: float = 4.0

# Screen shake
var _trauma: float = 0.0
var _max_offset: float = 12.0
var _trauma_decay: float = 2.0

var _look_ahead_offset: Vector2 = Vector2.ZERO
var _previous_target_pos: Vector2 = Vector2.ZERO

func _ready() -> void:
	position_smoothing_enabled = false
	if target:
		_previous_target_pos = target.global_position
		global_position = target.global_position

func _process(delta: float) -> void:
	if not target:
		return

	# Smooth follow with look-ahead
	var move_delta: Vector2 = target.global_position - _previous_target_pos
	_previous_target_pos = target.global_position

	var desired_ahead: Vector2 = move_delta.normalized() * look_ahead_distance if move_delta.length() > 0.5 else Vector2.ZERO
	_look_ahead_offset = _look_ahead_offset.lerp(desired_ahead, look_ahead_speed * delta)

	var desired_pos: Vector2 = target.global_position + _look_ahead_offset
	global_position = global_position.lerp(desired_pos, follow_speed * delta)

	# Screen shake
	if _trauma > 0.0:
		_trauma = maxf(_trauma - _trauma_decay * delta, 0.0)
		var shake_intensity := _trauma * _trauma  # quadratic falloff
		offset = Vector2(
			randf_range(-_max_offset, _max_offset) * shake_intensity,
			randf_range(-_max_offset, _max_offset) * shake_intensity
		)
	else:
		offset = Vector2.ZERO

func add_trauma(amount: float) -> void:
	_trauma = minf(_trauma + amount, 1.0)
```

- [ ] **Step 2: Commit**

```bash
git add tests/trial-project/scripts/camera/
git commit -m "feat(trial): add smooth follow camera with screen shake"
```

---

### Task 7: Enemy AI

**Validates:** ai-navigation, state-machine, component-system

**Files:**
- Create: `tests/trial-project/scripts/enemy/enemy.gd`
- Create: `tests/trial-project/scenes/enemy.tscn`

- [ ] **Step 1: Create enemy script with patrol/chase/attack FSM**

Create `tests/trial-project/scripts/enemy/enemy.gd`:

```gdscript
extends CharacterBody2D

enum State { IDLE, PATROL, CHASE, ATTACK, DEAD }

@export var stats: EnemyStats

var current_state: State = State.IDLE
var _attack_timer: float = 0.0
var _idle_timer: float = 0.0

@onready var nav_agent: NavigationAgent2D = $NavigationAgent2D
@onready var health_component: HealthComponent = $HealthComponent
@onready var hitbox: HitboxComponent = $AttackPivot/HitboxComponent
@onready var hurtbox: HurtboxComponent = $HurtboxComponent
@onready var sprite: ColorRect = $Sprite
@onready var attack_pivot: Node2D = $AttackPivot

var _player: Node2D = null

func _ready() -> void:
	add_to_group("enemies")
	hitbox.monitoring = false
	if stats:
		stats = stats.duplicate()
		health_component.max_health = stats.health
		health_component._current_health = stats.health
		hitbox.damage = stats.damage
	health_component.died.connect(_on_died)
	hurtbox.hurt.connect(_on_hurt)
	_idle_timer = randf_range(1.0, 3.0)

func _physics_process(delta: float) -> void:
	if current_state == State.DEAD:
		return

	_player = get_tree().get_first_node_in_group("player")

	match current_state:
		State.IDLE:
			_state_idle(delta)
		State.PATROL:
			_state_patrol(delta)
		State.CHASE:
			_state_chase(delta)
		State.ATTACK:
			_state_attack(delta)

	move_and_slide()

func _state_idle(delta: float) -> void:
	velocity = Vector2.ZERO
	if _player_in_range(stats.chase_range):
		current_state = State.CHASE
		return
	_idle_timer -= delta
	if _idle_timer <= 0.0:
		var offset := Vector2(randf_range(-stats.patrol_range, stats.patrol_range), randf_range(-stats.patrol_range, stats.patrol_range))
		nav_agent.target_position = global_position + offset
		current_state = State.PATROL

func _state_patrol(delta: float) -> void:
	if _player_in_range(stats.chase_range):
		current_state = State.CHASE
		return
	if nav_agent.is_navigation_finished():
		current_state = State.IDLE
		_idle_timer = randf_range(1.0, 3.0)
		return
	var next_pos: Vector2 = nav_agent.get_next_path_position()
	velocity = (next_pos - global_position).normalized() * stats.speed

func _state_chase(delta: float) -> void:
	if not _player or not _player_in_range(stats.chase_range * 1.5):
		current_state = State.IDLE
		_idle_timer = 1.0
		return
	if _player_in_range(stats.attack_range):
		_enter_attack()
		return
	nav_agent.target_position = _player.global_position
	var next_pos: Vector2 = nav_agent.get_next_path_position()
	velocity = (next_pos - global_position).normalized() * stats.speed
	# Face player
	var dir := (_player.global_position - global_position).normalized()
	attack_pivot.rotation = dir.angle()

func _state_attack(delta: float) -> void:
	velocity = Vector2.ZERO
	_attack_timer -= delta
	if _attack_timer <= 0.0:
		hitbox.monitoring = false
		current_state = State.CHASE

func _enter_attack() -> void:
	current_state = State.ATTACK
	_attack_timer = stats.attack_interval
	hitbox.monitoring = true
	# Brief hitbox window
	get_tree().create_timer(0.2).timeout.connect(func():
		if current_state == State.ATTACK:
			hitbox.monitoring = false
	)

func _player_in_range(range_dist: float) -> bool:
	if not _player:
		return false
	return global_position.distance_to(_player.global_position) < range_dist

func _on_died() -> void:
	current_state = State.DEAD
	velocity = Vector2.ZERO
	hitbox.monitoring = false
	# Drop items
	if stats and randf() < stats.drop_chance and stats.drop_items.size() > 0:
		var drop: ItemData = stats.drop_items.pick_random()
		EventBus.item_collected.emit(drop.name)
		# Spawn pickup at position — handled by main scene listening to signal
	sprite.color = Color(0.3, 0.3, 0.3, 0.5)
	get_tree().create_timer(1.0).timeout.connect(queue_free)

func _on_hurt(damage_amount: int) -> void:
	sprite.color = Color.RED
	get_tree().create_timer(0.1).timeout.connect(func(): sprite.color = Color.INDIAN_RED)
	EventBus.damage_dealt.emit(damage_amount, global_position)
```

- [ ] **Step 2: Create enemy scene**

Create `tests/trial-project/scenes/enemy.tscn`:

```ini
[gd_scene load_steps=6 format=3]

[ext_resource type="Script" path="res://scripts/enemy/enemy.gd" id="1"]
[ext_resource type="Script" path="res://scripts/components/health_component.gd" id="2"]
[ext_resource type="Script" path="res://scripts/components/hitbox_component.gd" id="3"]
[ext_resource type="Script" path="res://scripts/components/hurtbox_component.gd" id="4"]
[ext_resource type="Resource" path="res://resources/enemies/slime_stats.tres" id="5"]

[node name="Enemy" type="CharacterBody2D"]
collision_layer = 2
collision_mask = 3
script = ExtResource("1")
stats = ExtResource("5")

[node name="Sprite" type="ColorRect" parent="."]
offset_left = -12.0
offset_top = -12.0
offset_right = 12.0
offset_bottom = 12.0
color = Color(0.804, 0.361, 0.361, 1)

[node name="CollisionShape2D" type="CollisionShape2D" parent="."]
shape = SubResource("RectangleShape2D_enemy")

[sub_resource type="RectangleShape2D" id="RectangleShape2D_enemy"]
size = Vector2(20, 20)

[node name="NavigationAgent2D" type="NavigationAgent2D" parent="."]
path_desired_distance = 4.0
target_desired_distance = 4.0

[node name="HealthComponent" type="Node" parent="."]
script = ExtResource("2")
max_health = 50

[node name="HurtboxComponent" type="Area2D" parent="."]
collision_layer = 16
collision_mask = 8
script = ExtResource("4")
health_component = NodePath("../HealthComponent")

[node name="HurtboxShape" type="CollisionShape2D" parent="HurtboxComponent"]
shape = SubResource("RectangleShape2D_enemy_hurtbox")

[sub_resource type="RectangleShape2D" id="RectangleShape2D_enemy_hurtbox"]
size = Vector2(22, 22)

[node name="AttackPivot" type="Node2D" parent="."]

[node name="HitboxComponent" type="Area2D" parent="AttackPivot"]
position = Vector2(25, 0)
collision_layer = 8
collision_mask = 16
monitoring = false
script = ExtResource("3")
damage = 5

[node name="HitboxShape" type="CollisionShape2D" parent="AttackPivot/HitboxComponent"]
shape = SubResource("RectangleShape2D_enemy_hitbox")

[sub_resource type="RectangleShape2D" id="RectangleShape2D_enemy_hitbox"]
size = Vector2(18, 18)
```

- [ ] **Step 3: Commit**

```bash
git add tests/trial-project/scripts/enemy/ tests/trial-project/scenes/enemy.tscn
git commit -m "feat(trial): add enemy AI with patrol/chase/attack FSM"
```

---

### Task 8: HUD System

**Validates:** hud-system

**Files:**
- Create: `tests/trial-project/scripts/ui/health_bar.gd`
- Create: `tests/trial-project/scripts/ui/hud.gd`
- Create: `tests/trial-project/scripts/ui/interaction_prompt.gd`
- Create: `tests/trial-project/scenes/ui/hud.tscn`

- [ ] **Step 1: Create HealthBar script**

Create `tests/trial-project/scripts/ui/health_bar.gd`:

```gdscript
class_name HealthBar
extends ProgressBar

@export var tween_duration: float = 0.25

var _tween: Tween

func _ready() -> void:
	step = 0.0
	max_value = 100
	value = 100
	EventBus.health_changed.connect(_on_health_changed)

func _on_health_changed(current: int, maximum: int) -> void:
	max_value = maximum
	_animate_to(current)

func _animate_to(target_value: float) -> void:
	if _tween:
		_tween.kill()
	_tween = create_tween()
	_tween.set_ease(Tween.EASE_OUT)
	_tween.set_trans(Tween.TRANS_QUAD)
	_tween.tween_property(self, "value", target_value, tween_duration)
```

- [ ] **Step 2: Create InteractionPrompt script**

Create `tests/trial-project/scripts/ui/interaction_prompt.gd`:

```gdscript
extends Label

func _ready() -> void:
	visible = false
	text = "Press E to interact"

func show_prompt(action_text: String = "interact") -> void:
	text = "Press E to %s" % action_text
	visible = true

func hide_prompt() -> void:
	visible = false
```

- [ ] **Step 3: Create HUD controller**

Create `tests/trial-project/scripts/ui/hud.gd`:

```gdscript
extends CanvasLayer

@onready var health_bar: ProgressBar = $MarginContainer/VBoxContainer/HealthBar
@onready var score_label: Label = $MarginContainer/VBoxContainer/ScoreLabel
@onready var interaction_prompt: Label = $InteractionPrompt

func _ready() -> void:
	EventBus.score_changed.connect(_on_score_changed)
	_on_score_changed(0)

func _on_score_changed(new_score: int) -> void:
	score_label.text = "Score: %d" % new_score
```

- [ ] **Step 4: Create HUD scene**

Create `tests/trial-project/scenes/ui/hud.tscn`:

```ini
[gd_scene load_steps=4 format=3]

[ext_resource type="Script" path="res://scripts/ui/hud.gd" id="1"]
[ext_resource type="Script" path="res://scripts/ui/health_bar.gd" id="2"]
[ext_resource type="Script" path="res://scripts/ui/interaction_prompt.gd" id="3"]

[node name="HUD" type="CanvasLayer"]
layer = 1
script = ExtResource("1")

[node name="MarginContainer" type="MarginContainer" parent="."]
anchors_preset = 10
anchor_right = 1.0
offset_bottom = 60.0
grow_horizontal = 2
theme_override_constants/margin_left = 16
theme_override_constants/margin_top = 16
theme_override_constants/margin_right = 16

[node name="VBoxContainer" type="VBoxContainer" parent="MarginContainer"]
layout_mode = 2

[node name="HealthBar" type="ProgressBar" parent="MarginContainer/VBoxContainer"]
layout_mode = 2
custom_minimum_size = Vector2(200, 20)
script = ExtResource("2")

[node name="ScoreLabel" type="Label" parent="MarginContainer/VBoxContainer"]
layout_mode = 2
text = "Score: 0"

[node name="InteractionPrompt" type="Label" parent="."]
anchors_preset = 7
anchor_left = 0.5
anchor_top = 1.0
anchor_right = 0.5
anchor_bottom = 1.0
offset_left = -80.0
offset_top = -60.0
offset_right = 80.0
grow_horizontal = 2
grow_vertical = 0
horizontal_alignment = 1
script = ExtResource("3")
```

- [ ] **Step 5: Commit**

```bash
git add tests/trial-project/scripts/ui/ tests/trial-project/scenes/ui/hud.tscn
git commit -m "feat(trial): add HUD with health bar, score, interaction prompt"
```

---

### Task 9: Inventory System

**Validates:** inventory-system

**Files:**
- Create: `tests/trial-project/scripts/inventory/inventory.gd`
- Create: `tests/trial-project/scripts/items/pickup.gd`
- Create: `tests/trial-project/scenes/pickup.tscn`
- Create: `tests/trial-project/scripts/ui/inventory_ui.gd`
- Create: `tests/trial-project/scenes/ui/inventory_ui.tscn`

- [ ] **Step 1: Create Inventory class**

Create `tests/trial-project/scripts/inventory/inventory.gd`:

```gdscript
class_name Inventory
extends Node

signal inventory_changed
signal item_added(item: ItemData, quantity: int)
signal item_removed(item: ItemData, quantity: int)

@export var capacity: int = 12

var slots: Array[InventorySlot] = []

func _ready() -> void:
	slots.resize(capacity)
	for i in capacity:
		slots[i] = InventorySlot.new()

func add_item(item: ItemData, quantity: int = 1) -> int:
	var remaining := quantity

	# First try existing stacks
	for slot in slots:
		if remaining <= 0:
			break
		if not slot.is_empty() and slot.item == item:
			remaining = slot.add_to_stack(remaining)

	# Then try empty slots
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

func has_item(item_id: String) -> bool:
	for slot in slots:
		if not slot.is_empty() and slot.item.id == item_id:
			return true
	return false

func to_save_data() -> Array:
	var data: Array = []
	for slot in slots:
		if slot.is_empty():
			data.append({"id": "", "qty": 0})
		else:
			data.append({"id": slot.item.id, "qty": slot.quantity})
	return data
```

- [ ] **Step 2: Create Pickup scene script**

Create `tests/trial-project/scripts/items/pickup.gd`:

```gdscript
extends Area2D

@export var item: ItemData
@export var quantity: int = 1

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
	if not body.is_in_group("player"):
		return
	var inventory: Inventory = body.get_node_or_null("Inventory")
	if not inventory:
		return
	var leftover := inventory.add_item(item, quantity)
	if leftover < quantity:
		GameManager.add_score(item.value)
		if leftover <= 0:
			queue_free()
		else:
			quantity = leftover
```

- [ ] **Step 3: Create Pickup scene**

Create `tests/trial-project/scenes/pickup.tscn`:

```ini
[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/items/pickup.gd" id="1"]

[node name="Pickup" type="Area2D"]
collision_layer = 32
collision_mask = 1
script = ExtResource("1")

[node name="Sprite" type="ColorRect" parent="."]
offset_left = -8.0
offset_top = -8.0
offset_right = 8.0
offset_bottom = 8.0
color = Color(1, 0.843, 0, 1)

[node name="CollisionShape2D" type="CollisionShape2D" parent="."]
shape = SubResource("CircleShape2D_pickup")

[sub_resource type="CircleShape2D" id="CircleShape2D_pickup"]
radius = 12.0
```

- [ ] **Step 4: Create basic inventory UI**

Create `tests/trial-project/scripts/ui/inventory_ui.gd`:

```gdscript
extends PanelContainer

@onready var grid: GridContainer = $MarginContainer/VBoxContainer/GridContainer
@onready var close_btn: Button = $MarginContainer/VBoxContainer/Header/CloseButton

var _inventory: Inventory = null

func _ready() -> void:
	visible = false
	close_btn.pressed.connect(func(): visible = false)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("inventory"):
		visible = !visible
		if visible:
			refresh()

func bind(inventory: Inventory) -> void:
	_inventory = inventory
	_inventory.inventory_changed.connect(func(): if visible: refresh())

func refresh() -> void:
	if not _inventory:
		return
	# Clear existing slot labels
	for child in grid.get_children():
		child.queue_free()
	# Rebuild
	for slot in _inventory.slots:
		var label := Label.new()
		if slot.is_empty():
			label.text = "---"
		else:
			label.text = "%s x%d" % [slot.item.name, slot.quantity]
		label.custom_minimum_size = Vector2(120, 30)
		grid.add_child(label)
```

- [ ] **Step 5: Create inventory UI scene**

Create `tests/trial-project/scenes/ui/inventory_ui.tscn`:

```ini
[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/ui/inventory_ui.gd" id="1"]

[node name="InventoryUI" type="PanelContainer"]
anchors_preset = 8
anchor_left = 0.5
anchor_top = 0.5
anchor_right = 0.5
anchor_bottom = 0.5
offset_left = -200.0
offset_top = -150.0
offset_right = 200.0
offset_bottom = 150.0
grow_horizontal = 2
grow_vertical = 2
script = ExtResource("1")

[node name="MarginContainer" type="MarginContainer" parent="."]
layout_mode = 2
theme_override_constants/margin_left = 12
theme_override_constants/margin_top = 12
theme_override_constants/margin_right = 12
theme_override_constants/margin_bottom = 12

[node name="VBoxContainer" type="VBoxContainer" parent="MarginContainer"]
layout_mode = 2

[node name="Header" type="HBoxContainer" parent="MarginContainer/VBoxContainer"]
layout_mode = 2

[node name="Title" type="Label" parent="MarginContainer/VBoxContainer/Header"]
layout_mode = 2
size_flags_horizontal = 3
text = "Inventory"

[node name="CloseButton" type="Button" parent="MarginContainer/VBoxContainer/Header"]
layout_mode = 2
text = "X"

[node name="GridContainer" type="GridContainer" parent="MarginContainer/VBoxContainer"]
layout_mode = 2
columns = 3
```

- [ ] **Step 6: Commit**

```bash
git add tests/trial-project/scripts/inventory/ tests/trial-project/scripts/items/ tests/trial-project/scripts/ui/inventory_ui.gd tests/trial-project/scenes/pickup.tscn tests/trial-project/scenes/ui/inventory_ui.tscn
git commit -m "feat(trial): add inventory system with pickups and UI"
```

---

### Task 10: Dialogue System

**Validates:** dialogue-system

**Files:**
- Create: `tests/trial-project/resources/scripts/dialogue_line.gd`
- Create: `tests/trial-project/resources/scripts/dialogue_data.gd`
- Create: `tests/trial-project/autoloads/dialogue_manager.gd`
- Create: `tests/trial-project/scripts/npc/npc.gd`
- Create: `tests/trial-project/scripts/ui/dialogue_ui.gd`
- Create: `tests/trial-project/scenes/npc.tscn`
- Create: `tests/trial-project/scenes/ui/dialogue_ui.tscn`
- Create: `tests/trial-project/resources/dialogue/npc_greeting.tres`

- [ ] **Step 1: Create dialogue resources**

Create `tests/trial-project/resources/scripts/dialogue_line.gd`:

```gdscript
class_name DialogueLine
extends Resource

@export var id: String = ""
@export var speaker: String = ""
@export_multiline var text: String = ""
@export var choices: Array[Dictionary] = []
@export var next_line_id: String = ""
```

Create `tests/trial-project/resources/scripts/dialogue_data.gd`:

```gdscript
class_name DialogueData
extends Resource

@export var start_line_id: String = ""
@export var lines: Array[DialogueLine] = []

func get_line(line_id: String) -> DialogueLine:
	for line in lines:
		if line.id == line_id:
			return line
	return null
```

- [ ] **Step 2: Create DialogueManager autoload**

Create `tests/trial-project/autoloads/dialogue_manager.gd`:

```gdscript
extends Node

signal dialogue_started
signal line_displayed(line: DialogueLine)
signal choice_presented(choices: Array)
signal dialogue_ended

var _data: DialogueData = null
var _current_line: DialogueLine = null
var _active: bool = false

func is_active() -> bool:
	return _active

func start_dialogue(dialogue_data: DialogueData) -> void:
	_data = dialogue_data
	_active = true
	dialogue_started.emit()
	EventBus.dialogue_started.emit()
	_go_to_line(_data.start_line_id)

func advance() -> void:
	if not _active or _current_line == null:
		return
	if not _current_line.choices.is_empty():
		return
	_go_to_line(_current_line.next_line_id)

func choose(choice_index: int) -> void:
	if not _active or _current_line == null:
		return
	if choice_index < 0 or choice_index >= _current_line.choices.size():
		return
	var next_id: String = _current_line.choices[choice_index].get("next_line_id", "")
	_go_to_line(next_id)

func _go_to_line(line_id: String) -> void:
	if line_id.is_empty():
		_end_dialogue()
		return
	_current_line = _data.get_line(line_id)
	if _current_line == null:
		push_error("DialogueManager: line '%s' not found" % line_id)
		_end_dialogue()
		return
	line_displayed.emit(_current_line)
	if not _current_line.choices.is_empty():
		choice_presented.emit(_current_line.choices)

func _end_dialogue() -> void:
	_active = false
	_current_line = null
	_data = null
	dialogue_ended.emit()
	EventBus.dialogue_ended.emit()
```

- [ ] **Step 3: Create NPC script and scene**

Create `tests/trial-project/scripts/npc/npc.gd`:

```gdscript
extends StaticBody2D

@export var dialogue_data: DialogueData
@export var npc_name: String = "NPC"

var _player_nearby: bool = false

@onready var interaction_area: Area2D = $InteractionArea

func _ready() -> void:
	add_to_group("npcs")
	interaction_area.body_entered.connect(_on_body_entered)
	interaction_area.body_exited.connect(_on_body_exited)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("interact") and _player_nearby and not DialogueManager.is_active():
		if dialogue_data:
			DialogueManager.start_dialogue(dialogue_data)

func _on_body_entered(body: Node2D) -> void:
	if body.is_in_group("player"):
		_player_nearby = true
		# Show prompt via HUD
		var hud := get_tree().get_first_node_in_group("hud")
		if hud:
			hud.get_node("InteractionPrompt").show_prompt("talk")

func _on_body_exited(body: Node2D) -> void:
	if body.is_in_group("player"):
		_player_nearby = false
		var hud := get_tree().get_first_node_in_group("hud")
		if hud:
			hud.get_node("InteractionPrompt").hide_prompt()
```

Create `tests/trial-project/scenes/npc.tscn`:

```ini
[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/npc/npc.gd" id="1"]

[node name="NPC" type="StaticBody2D"]
collision_layer = 3
collision_mask = 0
script = ExtResource("1")
npc_name = "Elder"

[node name="Sprite" type="ColorRect" parent="."]
offset_left = -16.0
offset_top = -16.0
offset_right = 16.0
offset_bottom = 16.0
color = Color(0.196, 0.804, 0.196, 1)

[node name="NameLabel" type="Label" parent="."]
offset_left = -30.0
offset_top = -32.0
offset_right = 30.0
offset_bottom = -16.0
horizontal_alignment = 1
text = "Elder"

[node name="CollisionShape2D" type="CollisionShape2D" parent="."]
shape = SubResource("RectangleShape2D_npc")

[sub_resource type="RectangleShape2D" id="RectangleShape2D_npc"]
size = Vector2(28, 28)

[node name="InteractionArea" type="Area2D" parent="."]
collision_layer = 32
collision_mask = 1

[node name="CollisionShape2D" type="CollisionShape2D" parent="InteractionArea"]
shape = SubResource("CircleShape2D_npc_interaction")

[sub_resource type="CircleShape2D" id="CircleShape2D_npc_interaction"]
radius = 50.0
```

- [ ] **Step 4: Create dialogue UI**

Create `tests/trial-project/scripts/ui/dialogue_ui.gd`:

```gdscript
extends PanelContainer

@onready var speaker_label: Label = $MarginContainer/VBoxContainer/SpeakerLabel
@onready var text_label: RichTextLabel = $MarginContainer/VBoxContainer/TextLabel
@onready var choices_container: VBoxContainer = $MarginContainer/VBoxContainer/ChoicesContainer
@onready var continue_label: Label = $MarginContainer/VBoxContainer/ContinueLabel

func _ready() -> void:
	visible = false
	DialogueManager.line_displayed.connect(_on_line_displayed)
	DialogueManager.choice_presented.connect(_on_choice_presented)
	DialogueManager.dialogue_ended.connect(_on_dialogue_ended)
	DialogueManager.dialogue_started.connect(func(): visible = true)

func _unhandled_input(event: InputEvent) -> void:
	if not visible:
		return
	if event.is_action_pressed("interact") or event.is_action_pressed("attack"):
		DialogueManager.advance()

func _on_line_displayed(line: DialogueLine) -> void:
	speaker_label.text = line.speaker
	text_label.text = line.text
	# Clear choices
	for child in choices_container.get_children():
		child.queue_free()
	continue_label.visible = line.choices.is_empty()

func _on_choice_presented(choices: Array) -> void:
	continue_label.visible = false
	for i in choices.size():
		var btn := Button.new()
		btn.text = choices[i].get("text", "...")
		var idx := i
		btn.pressed.connect(func(): DialogueManager.choose(idx))
		choices_container.add_child(btn)

func _on_dialogue_ended() -> void:
	visible = false
```

Create `tests/trial-project/scenes/ui/dialogue_ui.tscn`:

```ini
[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/ui/dialogue_ui.gd" id="1"]

[node name="DialogueUI" type="PanelContainer"]
anchors_preset = 12
anchor_top = 1.0
anchor_right = 1.0
anchor_bottom = 1.0
offset_left = 100.0
offset_top = -180.0
offset_right = -100.0
grow_horizontal = 2
grow_vertical = 0
script = ExtResource("1")

[node name="MarginContainer" type="MarginContainer" parent="."]
layout_mode = 2
theme_override_constants/margin_left = 16
theme_override_constants/margin_top = 12
theme_override_constants/margin_right = 16
theme_override_constants/margin_bottom = 12

[node name="VBoxContainer" type="VBoxContainer" parent="MarginContainer"]
layout_mode = 2

[node name="SpeakerLabel" type="Label" parent="MarginContainer/VBoxContainer"]
layout_mode = 2
text = "Speaker"

[node name="TextLabel" type="RichTextLabel" parent="MarginContainer/VBoxContainer"]
layout_mode = 2
custom_minimum_size = Vector2(0, 60)
bbcode_enabled = true
text = "Dialogue text..."
fit_content = true

[node name="ChoicesContainer" type="VBoxContainer" parent="MarginContainer/VBoxContainer"]
layout_mode = 2

[node name="ContinueLabel" type="Label" parent="MarginContainer/VBoxContainer"]
layout_mode = 2
horizontal_alignment = 2
text = "Press E to continue..."
```

- [ ] **Step 5: Create sample dialogue .tres**

Create `tests/trial-project/resources/dialogue/npc_greeting.tres`. This will be hand-written JSON-style resource since dialogue data with nested arrays is complex to express in .tres. Instead, create a GDScript loader.

Create `tests/trial-project/resources/dialogue/npc_greeting.gd` (factory script):

```gdscript
## Call NpcGreetingDialogue.create() to get the DialogueData resource.
class_name NpcGreetingDialogue

static func create() -> DialogueData:
	var data := DialogueData.new()
	data.start_line_id = "greet"

	var line1 := DialogueLine.new()
	line1.id = "greet"
	line1.speaker = "Elder"
	line1.text = "Welcome, traveler! It's dangerous out here."
	line1.choices = [
		{"text": "Tell me more.", "next_line_id": "info"},
		{"text": "I can handle it.", "next_line_id": "brave"},
	]

	var line2 := DialogueLine.new()
	line2.id = "info"
	line2.speaker = "Elder"
	line2.text = "Slimes have been appearing near the village. Defeat them and I'll reward you."
	line2.next_line_id = ""

	var line3 := DialogueLine.new()
	line3.id = "brave"
	line3.speaker = "Elder"
	line3.text = "Ha! Bold words. Prove it by clearing the slimes."
	line3.next_line_id = ""

	data.lines = [line1, line2, line3]
	return data
```

Update `tests/trial-project/scripts/npc/npc.gd` — in `_unhandled_input`, if `dialogue_data` is null, try the factory:

Add to the NPC `_ready()`:

```gdscript
func _ready() -> void:
	add_to_group("npcs")
	interaction_area.body_entered.connect(_on_body_entered)
	interaction_area.body_exited.connect(_on_body_exited)
	if not dialogue_data:
		dialogue_data = NpcGreetingDialogue.create()
```

- [ ] **Step 6: Commit**

```bash
git add tests/trial-project/resources/scripts/dialogue_line.gd tests/trial-project/resources/scripts/dialogue_data.gd tests/trial-project/autoloads/dialogue_manager.gd tests/trial-project/scripts/npc/ tests/trial-project/scripts/ui/dialogue_ui.gd tests/trial-project/scenes/npc.tscn tests/trial-project/scenes/ui/dialogue_ui.tscn tests/trial-project/resources/dialogue/
git commit -m "feat(trial): add dialogue system with NPC and branching choices"
```

---

### Task 11: Save/Load System

**Validates:** save-load

**Files:**
- Create: `tests/trial-project/autoloads/save_manager.gd`

- [ ] **Step 1: Create SaveManager autoload**

Create `tests/trial-project/autoloads/save_manager.gd`:

```gdscript
extends Node

const SAVE_DIR := "user://saves/"
const SAVE_EXTENSION := ".json"
const CURRENT_VERSION := 1

func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(SAVE_DIR)

func save_game(slot_name: String = "autosave") -> bool:
	var player := get_tree().get_first_node_in_group("player")
	if not player:
		push_error("SaveManager: no player found")
		return false

	var inventory: Inventory = player.get_node_or_null("Inventory")

	var data: Dictionary = {
		"version": CURRENT_VERSION,
		"timestamp": Time.get_unix_time_from_system(),
		"player": {
			"position_x": player.global_position.x,
			"position_y": player.global_position.y,
			"health": player.health_component.current_health,
		},
		"inventory": inventory.to_save_data() if inventory else [],
		"score": GameManager.score,
	}

	var json_string := JSON.stringify(data, "\t")
	var path := SAVE_DIR + slot_name + SAVE_EXTENSION
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		push_error("SaveManager: cannot open '%s' for writing" % path)
		return false

	file.store_string(json_string)
	EventBus.game_saved.emit(slot_name)
	print("Game saved to %s" % path)
	return true

func load_game(slot_name: String = "autosave") -> bool:
	var path := SAVE_DIR + slot_name + SAVE_EXTENSION
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_error("SaveManager: no save file at '%s'" % path)
		return false

	var json := JSON.new()
	var err := json.parse(file.get_as_text())
	if err != OK:
		push_error("SaveManager: JSON parse error: %s" % json.get_error_message())
		return false

	var data: Dictionary = json.data
	data = _migrate(data)

	var player := get_tree().get_first_node_in_group("player")
	if player:
		player.global_position = Vector2(data["player"]["position_x"], data["player"]["position_y"])
		player.health_component.heal(data["player"]["health"] - player.health_component.current_health)

	GameManager.score = int(data["score"])

	EventBus.game_loaded.emit(slot_name)
	print("Game loaded from %s" % path)
	return true

func _migrate(data: Dictionary) -> Dictionary:
	var version: int = int(data.get("version", 0))
	# Future migrations go here
	data["version"] = CURRENT_VERSION
	return data

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("save_game"):
		save_game()
	elif event.is_action_pressed("load_game"):
		load_game()
```

- [ ] **Step 2: Commit**

```bash
git add tests/trial-project/autoloads/save_manager.gd
git commit -m "feat(trial): add JSON save/load system with version migration"
```

---

### Task 12: Main Scene Wiring

**Validates:** scene-organization

**Files:**
- Create: `tests/trial-project/scenes/main.tscn`

- [ ] **Step 1: Create main scene script**

Create `tests/trial-project/scripts/main.gd`:

```gdscript
extends Node2D

@onready var player: CharacterBody2D = $Player
@onready var camera: Camera2D = $GameCamera
@onready var hud: CanvasLayer = $HUD
@onready var inventory_ui = $HUD/InventoryUI
@onready var dialogue_ui = $HUD/DialogueUI

func _ready() -> void:
	# Wire camera to player
	camera.target = player

	# Wire inventory UI to player's inventory
	var inventory: Inventory = player.get_node("Inventory")
	inventory_ui.bind(inventory)

	# Wire screen shake to damage events
	EventBus.damage_dealt.connect(_on_damage_dealt)

	# Add HUD to group for NPC prompt access
	hud.add_to_group("hud")

func _on_damage_dealt(_amount: int, _position: Vector2) -> void:
	camera.add_trauma(0.3)
```

- [ ] **Step 2: Create main scene .tscn**

Create `tests/trial-project/scenes/main.tscn`:

```ini
[gd_scene load_steps=8 format=3]

[ext_resource type="Script" path="res://scripts/main.gd" id="1"]
[ext_resource type="PackedScene" path="res://scenes/player.tscn" id="2"]
[ext_resource type="PackedScene" path="res://scenes/enemy.tscn" id="3"]
[ext_resource type="PackedScene" path="res://scenes/npc.tscn" id="4"]
[ext_resource type="PackedScene" path="res://scenes/pickup.tscn" id="5"]
[ext_resource type="PackedScene" path="res://scenes/ui/hud.tscn" id="6"]
[ext_resource type="Script" path="res://scripts/camera/game_camera.gd" id="7"]
[ext_resource type="Script" path="res://scripts/inventory/inventory.gd" id="8"]
[ext_resource type="PackedScene" path="res://scenes/ui/inventory_ui.tscn" id="9"]
[ext_resource type="PackedScene" path="res://scenes/ui/dialogue_ui.tscn" id="10"]
[ext_resource type="Resource" path="res://resources/items/health_potion.tres" id="11"]

[node name="Main" type="Node2D"]
script = ExtResource("1")

[node name="NavigationRegion2D" type="NavigationRegion2D" parent="."]
navigation_polygon = SubResource("NavigationPolygon_main")

[sub_resource type="NavigationPolygon" id="NavigationPolygon_main"]
vertices = PackedVector2Array(-500, -400, 500, -400, 500, 400, -500, 400)
polygons = Array[PackedInt32Array]([PackedInt32Array(0, 1, 2, 3)])
outlines = Array[PackedVector2Array]([PackedVector2Array(-500, -400, 500, -400, 500, 400, -500, 400)])

[node name="Walls" type="Node2D" parent="NavigationRegion2D"]

[node name="WallTop" type="StaticBody2D" parent="NavigationRegion2D/Walls"]
position = Vector2(0, -420)
collision_layer = 4

[node name="Shape" type="CollisionShape2D" parent="NavigationRegion2D/Walls/WallTop"]
shape = SubResource("RectangleShape2D_wall_h")

[sub_resource type="RectangleShape2D" id="RectangleShape2D_wall_h"]
size = Vector2(1040, 40)

[node name="WallBottom" type="StaticBody2D" parent="NavigationRegion2D/Walls"]
position = Vector2(0, 420)
collision_layer = 4

[node name="Shape" type="CollisionShape2D" parent="NavigationRegion2D/Walls/WallBottom"]
shape = SubResource("RectangleShape2D_wall_h")

[node name="WallLeft" type="StaticBody2D" parent="NavigationRegion2D/Walls"]
position = Vector2(-520, 0)
collision_layer = 4

[node name="Shape" type="CollisionShape2D" parent="NavigationRegion2D/Walls/WallLeft"]
shape = SubResource("RectangleShape2D_wall_v")

[sub_resource type="RectangleShape2D" id="RectangleShape2D_wall_v"]
size = Vector2(40, 880)

[node name="WallRight" type="StaticBody2D" parent="NavigationRegion2D/Walls"]
position = Vector2(520, 0)
collision_layer = 4

[node name="Shape" type="CollisionShape2D" parent="NavigationRegion2D/Walls/WallRight"]
shape = SubResource("RectangleShape2D_wall_v")

[node name="Floor" type="ColorRect" parent="NavigationRegion2D"]
offset_left = -500.0
offset_top = -400.0
offset_right = 500.0
offset_bottom = 400.0
color = Color(0.2, 0.25, 0.2, 1)

[node name="Player" parent="NavigationRegion2D" instance=ExtResource("2")]
position = Vector2(0, 100)

[node name="Inventory" type="Node" parent="NavigationRegion2D/Player"]
script = ExtResource("8")

[node name="Enemy1" parent="NavigationRegion2D" instance=ExtResource("3")]
position = Vector2(-200, -150)

[node name="Enemy2" parent="NavigationRegion2D" instance=ExtResource("3")]
position = Vector2(250, -100)

[node name="NPC" parent="NavigationRegion2D" instance=ExtResource("4")]
position = Vector2(0, -200)

[node name="HealthPotion1" parent="NavigationRegion2D" instance=ExtResource("5")]
position = Vector2(-300, 200)
item = ExtResource("11")

[node name="HealthPotion2" parent="NavigationRegion2D" instance=ExtResource("5")]
position = Vector2(350, 250)
item = ExtResource("11")

[node name="GameCamera" type="Camera2D" parent="."]
script = ExtResource("7")

[node name="HUD" instance=ExtResource("6")]

[node name="InventoryUI" parent="HUD" instance=ExtResource("9")]

[node name="DialogueUI" parent="HUD" instance=ExtResource("10")]
```

- [ ] **Step 3: Commit**

```bash
git add tests/trial-project/scripts/main.gd tests/trial-project/scenes/main.tscn
git commit -m "feat(trial): wire main scene with all systems"
```

---

### Task 13: C# Port

**Validates:** csharp-godot, csharp-signals

**Files:**
- Create: `tests/trial-project/csharp/EventBus.cs`
- Create: `tests/trial-project/csharp/Player.cs`
- Create: `tests/trial-project/csharp/Inventory.cs`

- [ ] **Step 1: Create C# EventBus**

Create `tests/trial-project/csharp/EventBus.cs`:

```csharp
using Godot;

public partial class CSharpEventBus : Node
{
    // Player events
    [Signal] public delegate void PlayerDiedEventHandler();
    [Signal] public delegate void HealthChangedEventHandler(int current, int maximum);

    // Combat events
    [Signal] public delegate void DamageDealtEventHandler(int amount, Vector2 position);

    // Score / progression
    [Signal] public delegate void ScoreChangedEventHandler(int newScore);
    [Signal] public delegate void ItemCollectedEventHandler(string itemName);

    // Dialogue events
    [Signal] public delegate void DialogueStartedEventHandler();
    [Signal] public delegate void DialogueEndedEventHandler();

    // Save/Load events
    [Signal] public delegate void GameSavedEventHandler(string slotName);
    [Signal] public delegate void GameLoadedEventHandler(string slotName);
}
```

- [ ] **Step 2: Create C# Player**

Create `tests/trial-project/csharp/Player.cs`:

```csharp
using Godot;

public partial class CSharpPlayer : CharacterBody2D
{
    private enum State { Idle, Move, Attack }

    [Export] public float Speed { get; set; } = 200.0f;
    [Export] public float Acceleration { get; set; } = 1500.0f;
    [Export] public float Friction { get; set; } = 1200.0f;
    [Export] public float AttackDuration { get; set; } = 0.3f;

    private State _currentState = State.Idle;
    private float _attackTimer;

    private HealthComponent _healthComponent;
    private HitboxComponent _hitbox;
    private Node2D _attackPivot;
    private ColorRect _sprite;

    public override void _Ready()
    {
        AddToGroup("player");
        _healthComponent = GetNode<HealthComponent>("HealthComponent");
        _hitbox = GetNode<HitboxComponent>("AttackPivot/HitboxComponent");
        _attackPivot = GetNode<Node2D>("AttackPivot");
        _sprite = GetNode<ColorRect>("Sprite");

        _hitbox.Monitoring = false;
    }

    public override void _PhysicsProcess(double delta)
    {
        float dt = (float)delta;
        switch (_currentState)
        {
            case State.Idle:
                StateIdle(dt);
                break;
            case State.Move:
                StateMove(dt);
                break;
            case State.Attack:
                StateAttack(dt);
                break;
        }
        MoveAndSlide();
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event.IsActionPressed("attack") && _currentState != State.Attack)
            EnterAttack();
    }

    private void StateIdle(float delta)
    {
        Velocity = Velocity.MoveToward(Vector2.Zero, Friction * delta);
        var inputDir = Input.GetVector("move_left", "move_right", "move_up", "move_down");
        if (inputDir != Vector2.Zero)
            _currentState = State.Move;
    }

    private void StateMove(float delta)
    {
        var inputDir = Input.GetVector("move_left", "move_right", "move_up", "move_down");
        if (inputDir == Vector2.Zero)
        {
            _currentState = State.Idle;
            return;
        }
        Velocity = Velocity.MoveToward(inputDir * Speed, Acceleration * delta);
        _attackPivot.Rotation = inputDir.Angle();
    }

    private void StateAttack(float delta)
    {
        Velocity = Velocity.MoveToward(Vector2.Zero, Friction * delta);
        _attackTimer -= delta;
        if (_attackTimer <= 0.0f)
        {
            _hitbox.Monitoring = false;
            _currentState = State.Idle;
        }
    }

    private void EnterAttack()
    {
        _currentState = State.Attack;
        _attackTimer = AttackDuration;
        _hitbox.Monitoring = true;
    }
}
```

- [ ] **Step 3: Create C# Inventory**

Create `tests/trial-project/csharp/Inventory.cs`:

```csharp
using Godot;
using System.Collections.Generic;

public partial class CSharpInventory : Node
{
    [Signal] public delegate void InventoryChangedEventHandler();
    [Signal] public delegate void ItemAddedEventHandler(Resource item, int quantity);
    [Signal] public delegate void ItemRemovedEventHandler(Resource item, int quantity);

    [Export] public int Capacity { get; set; } = 12;

    private readonly List<InventorySlotData> _slots = new();

    public override void _Ready()
    {
        for (int i = 0; i < Capacity; i++)
            _slots.Add(new InventorySlotData());
    }

    public int AddItem(ItemData item, int quantity = 1)
    {
        int remaining = quantity;

        // Try existing stacks first
        foreach (var slot in _slots)
        {
            if (remaining <= 0) break;
            if (!slot.IsEmpty && slot.Item == item)
                remaining = slot.AddToStack(remaining);
        }

        // Then empty slots
        foreach (var slot in _slots)
        {
            if (remaining <= 0) break;
            if (slot.IsEmpty)
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

    public bool HasItem(string itemId)
    {
        foreach (var slot in _slots)
        {
            if (!slot.IsEmpty && slot.Item.Id == itemId)
                return true;
        }
        return false;
    }

    private class InventorySlotData
    {
        public ItemData Item { get; set; }
        public int Quantity { get; set; }
        public bool IsEmpty => Item == null || Quantity <= 0;

        public int AddToStack(int amount)
        {
            if (Item == null) return amount;
            int canAdd = Mathf.Min(amount, Item.MaxStack - Quantity);
            Quantity += canAdd;
            return amount - canAdd;
        }
    }
}
```

- [ ] **Step 4: Verify C# compiles**

Open project in Godot editor, verify the C# scripts compile without errors. Note any issues in VALIDATION.md.

- [ ] **Step 5: Commit**

```bash
git add tests/trial-project/csharp/
git commit -m "feat(trial): add C# ports of EventBus, Player, Inventory"
```

---

### Task 14: Validation and Results

- [ ] **Step 1: Open project in Godot 4.3+ and run**

Open `tests/trial-project/project.godot` in Godot editor. Press F5 to run. Test:

1. Player moves with WASD
2. Player attacks with Space (hitbox appears)
3. Enemies patrol, chase when close, attack
4. Player and enemies take damage (health bar animates)
5. Screen shakes on damage
6. Camera follows player smoothly
7. Picking up items adds to inventory
8. I key toggles inventory UI
9. Walking near NPC shows "Press E to talk"
10. E key starts dialogue, choices work
11. F5 saves game, F9 loads game
12. Score changes when collecting items

- [ ] **Step 2: Record results in VALIDATION.md**

For each skill, update the table with PASS/PARTIAL/FAIL and specific notes about what worked, what needed adjustment, and any issues found in the skill documentation.

- [ ] **Step 3: Fix any skill issues found**

If validation reveals incorrect advice, wrong API usage, or missing steps in any skill SKILL.md files, fix them in the skill files at `skills/<name>/SKILL.md`.

- [ ] **Step 4: Final commit**

```bash
git add tests/trial-project/VALIDATION.md
git add skills/  # if any fixes were made
git commit -m "docs(trial): record validation results and fix skill issues"
```
