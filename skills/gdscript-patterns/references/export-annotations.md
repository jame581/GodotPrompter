# Export Annotations

Reference for `skills/gdscript-patterns/SKILL.md` — `@export`, range/hint variants, export groups, node and Resource exports.

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. Export Annotations

### Basic Exports

```gdscript
@export var speed: float = 200.0
@export var health: int = 100
@export var player_name: String = "Hero"
@export var color: Color = Color.WHITE
@export var texture: Texture2D
@export var scene: PackedScene
```

### Range and Hints

```gdscript
@export_range(0.0, 100.0, 0.5) var volume: float = 50.0
@export_range(1, 10) var level: int = 1
@export_range(0.0, 1.0, 0.01, "or_greater") var scale: float = 1.0

@export_multiline var description: String = ""
@export_file("*.tscn") var level_path: String
@export_dir var save_directory: String
@export_color_no_alpha var outline_color: Color

# Enum export — creates dropdown in Inspector
@export_enum("Sword", "Bow", "Staff") var weapon: int = 0
# Or use a real enum:
enum Weapon { SWORD, BOW, STAFF }
@export var weapon_type: Weapon = Weapon.SWORD
```

### Export Groups

```gdscript
@export_group("Movement")
@export var speed: float = 200.0
@export var acceleration: float = 1500.0
@export var friction: float = 1200.0

@export_group("Combat")
@export var attack_damage: int = 10
@export var attack_speed: float = 1.0

@export_subgroup("Defense")
@export var armor: int = 5
@export var dodge_chance: float = 0.1

@export_category("Advanced Settings")
@export var debug_mode: bool = false
```

### Node and Resource Exports

```gdscript
# Node references (assigned in editor by dragging)
@export var target: Node2D
@export var spawn_point: Marker2D
@export var health_bar: ProgressBar

# Array of nodes/resources
@export var patrol_points: Array[Marker2D] = []
@export var loot_table: Array[ItemResource] = []
```

---

