# Common GDScript Idioms

Reference for `skills/gdscript-patterns/SKILL.md` — ternary expressions, string formatting, null/empty checks, dictionary access patterns, array operations, setget/properties.

> ← Back to [SKILL.md](../SKILL.md)

---
## 8. Common Idioms

### Ternary Expression

```gdscript
var label := "alive" if health > 0 else "dead"
var direction := -1 if facing_left else 1
velocity.x = speed * (1.5 if sprinting else 1.0)
```

### String Formatting

```gdscript
# % operator (printf-style)
var msg := "Player %s has %d HP" % [player_name, health]
var formatted := "%.2f seconds" % elapsed_time

# String interpolation — no built-in f-strings, use % or format()
var text := "Score: %d / %d" % [current_score, max_score]
```

### Null / Empty Checks

```gdscript
# Check if a node reference is valid
if is_instance_valid(target):
    target.take_damage(10)

# Check if a variable is null
if weapon != null:
    weapon.attack()

# Shorthand for non-null (works because null is falsy)
if weapon:
    weapon.attack()

# Check array/dictionary/string emptiness
if inventory.is_empty():
    show_empty_message()
if not player_name.is_empty():
    display_name(player_name)
```

### Dictionary Access Patterns

```gdscript
var stats: Dictionary = {"health": 100, "attack": 15, "defense": 8}

# Safe access with default
var hp: int = stats.get("health", 0)
var missing: int = stats.get("magic", 0)  # returns 0, no error

# Check existence
if stats.has("attack"):
    apply_damage(stats["attack"])

# Merge dictionaries
var defaults := {"health": 100, "attack": 10}
var overrides := {"attack": 20, "speed": 5}
defaults.merge(overrides, true)  # true = overwrite existing keys
```

### Useful Array Operations

```gdscript
var items: Array[String] = ["sword", "shield", "potion", "sword"]

items.append("bow")              # add to end
items.erase("sword")             # remove first occurrence
items.has("shield")              # true
items.find("potion")             # index or -1
items.pick_random()              # random element
items.shuffle()                  # randomize order
items.reverse()                  # reverse in place
items.slice(1, 3)                # sub-array [index 1 to 3)

# Remove duplicates
var unique: Array[String] = []
for item in items:
    if item not in unique:
        unique.append(item)
```

### Setget / Properties

```gdscript
var health: int = 100:
    set(value):
        health = clampi(value, 0, max_health)
        health_changed.emit(health)
        if health == 0:
            died.emit()
    get:
        return health
```

---

