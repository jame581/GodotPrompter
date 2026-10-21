# Metaprogramming Recipes

Reference for `skills/gdscript-advanced/SKILL.md` — Callable patterns, dynamic dispatch, and modding security.

> ← Back to [SKILL.md](../SKILL.md)

---

## 1. Callable as strategy

A common pattern: pass a behavior as data.

```gdscript
class_name Sorter

static func sort_by(items: Array, key: Callable) -> Array:
    items.sort_custom(func(a, b): return key.call(a) < key.call(b))
    return items

# Usage:
var by_health := Sorter.sort_by(enemies, func(e): return e.health)
var by_distance := Sorter.sort_by(enemies, func(e): return e.global_position.distance_to(player.global_position))
```

## 2. Bind for partial application

```gdscript
func damage_target(target: Node, amount: int) -> void:
    target.take_damage(amount)

# Make a Callable that always damages this player for 25:
var damage_player_25: Callable = damage_target.bind(player, 25)

# Then somewhere else, call without arguments:
damage_player_25.call()
```

## 3. Modding-safe RPC dispatch

Never call user-provided method names directly. Allowlist them.

```gdscript
const MOD_RPC_ALLOWLIST: PackedStringArray = [
    "on_item_pickup",
    "on_enemy_killed",
    "on_quest_complete",
]

func dispatch_mod_event(event_name: String, args: Array) -> void:
    if event_name not in MOD_RPC_ALLOWLIST:
        push_warning("Mod tried to call disallowed event: %s" % event_name)
        return
    for mod in active_mods:
        if mod.has_method(event_name):
            mod.callv(event_name, args)
```

## 4. `call_deferred` for thread/signal safety

```gdscript
# Inside a worker thread or a signal handler that may run during physics:
func _on_collision(other: Node) -> void:
    other.queue_free()       # NOT safe inside collision callback
    queue_free.call_deferred()  # safe — runs on idle frame
```

## 5. Callable lifecycle pitfall

```gdscript
var _callbacks: Array[Callable] = []

func register(cb: Callable) -> void:
    _callbacks.append(cb)

# Later:
func _exit_tree() -> void:
    _callbacks.clear()  # Drop captures so freed objects don't leak references.
```
