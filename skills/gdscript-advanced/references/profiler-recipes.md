# Profiler-Driven Optimization Recipes

Reference for `skills/gdscript-advanced/SKILL.md` — annotated before/after examples for common profiler hot spots.

> ← Back to [SKILL.md](../SKILL.md)

---

## 1. String allocation in `_process`

**Hot:**

```gdscript
func _process(delta: float) -> void:
    label.text = "Score: %d / %d" % [score, max_score]
```

This allocates a new String every frame even if the values haven't changed.

**Cool:**

```gdscript
var _last_score: int = -1

func _process(delta: float) -> void:
    if score != _last_score:
        label.text = "Score: %d / %d" % [score, max_score]
        _last_score = score
```

Or, even better — drive the label from a signal:

```gdscript
# In ScoreManager
signal score_changed(new_score: int)

# In UI
score_manager.score_changed.connect(_on_score_changed)
func _on_score_changed(new: int) -> void:
    label.text = "Score: %d / %d" % [new, max_score]
```

## 2. Repeated `get_node` calls

**Hot:**

```gdscript
func _process(delta: float) -> void:
    $UI/HUD/HealthBar.value = health
    $UI/HUD/StaminaBar.value = stamina
    $UI/HUD/ManaBar.value = mana
```

**Cool:**

```gdscript
@onready var _health_bar: ProgressBar = $UI/HUD/HealthBar
@onready var _stamina_bar: ProgressBar = $UI/HUD/StaminaBar
@onready var _mana_bar: ProgressBar = $UI/HUD/ManaBar

func _process(delta: float) -> void:
    _health_bar.value = health
    _stamina_bar.value = stamina
    _mana_bar.value = mana
```

## 3. Position-update signal storms

**Hot:** emitting `position_changed` every physics frame for a non-player entity.

**Cool:** emit at 10 Hz only when the listener actually needs it; for distance checks, poll directly.

```gdscript
var _emit_timer: float = 0.0
const EMIT_INTERVAL: float = 0.1  # 10 Hz

func _physics_process(delta: float) -> void:
    _emit_timer += delta
    if _emit_timer >= EMIT_INTERVAL:
        _emit_timer = 0.0
        position_changed.emit(global_position)
```

## 4. Allocator churn

**Hot:**

```gdscript
func _process(delta: float) -> void:
    var nearby: Array = _find_enemies_within(10.0)  # allocates a new Array every frame
    for enemy in nearby:
        enemy.take_damage(damage_per_second * delta)
```

**Cool:** pool the array as a member:

```gdscript
var _nearby_buffer: Array = []

func _process(delta: float) -> void:
    _nearby_buffer.clear()
    _find_enemies_within_into(10.0, _nearby_buffer)
    for enemy in _nearby_buffer:
        enemy.take_damage(damage_per_second * delta)
```
