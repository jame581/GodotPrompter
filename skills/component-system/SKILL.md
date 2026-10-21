---
name: component-system
description: Use when building reusable node components — composition patterns, component communication, and interface design
---

# Component System in Godot 4.3+

Build behavior through composition. Attach small, focused components to any entity rather than climbing an inheritance chain. All examples target Godot 4.3+ with no deprecated APIs.

> **Related skills:** **scene-organization** for scene tree composition, **event-bus** for decoupled component communication, **resource-pattern** for data-driven component configuration, **physics-system** for Area2D/3D overlap detection and collision shapes, **ability-system** for an AbilityComponent example built on this pattern.

---

## 1. Why Components

| Problem with inheritance | How components solve it |
|--------------------------|-------------------------|
| Deep chains are brittle — change one class, break many | Each component is an isolated scene with a single job |
| Sharing behavior across unrelated entities requires awkward base classes | Drop a component onto any entity that needs that behavior |
| Adding a new combination means a new subclass | Mix and match components freely at the scene level |

Key benefits:

- **Reuse across entities** — a `HealthComponent` works on a player, an enemy, a destructible crate, or a boss with no code changes.
- **Separation of concerns** — damage detection, health tracking, and state animation are each their own file. Debugging is local.
- **Mix-and-match behaviors** — give an enemy a `HitboxComponent` and a `PatrolComponent` independently. Removing one does not affect the other.

---

## 2. Component Design Rules

1. **One responsibility per component.** If you find yourself naming it `HealthAndShieldAndRegenComponent`, split it.
2. **Communicate via signals, not direct sibling access.** A component must not call `get_parent().get_node("SiblingComponent")`. Emit a signal instead.
3. **Stateless where possible.** Prefer deriving state from inputs and `@export` configuration over storing mutable state. When state is necessary, keep it private.
4. **Use `@export` for all configuration.** Damage amount, cooldown duration, and layer masks belong in the Inspector, not hardcoded constants.

---

## 3. Common Components

| Component | Purpose | Key Signals |
|---|---|---|
| `HealthComponent` | Tracks current and max HP, applies damage and healing | `health_changed(current, maximum)`, `died` |
| `HitboxComponent` | Detects overlapping hurtboxes and triggers damage | `hit(target_hurtbox)` |
| `HurtboxComponent` | Receives hits, routes damage to `HealthComponent` | `hurt(damage_amount)` |
| `InteractableComponent` | Marks an entity as interactable and fires on player overlap | `interacted(interactor)` |
| `StateMachineComponent` | Delegates `_process` and `_physics_process` to child state nodes | `state_changed(from, to)` |

---

## 4. HitboxComponent

Attach to any entity that deals damage. Configure `damage` in the Inspector.

### GDScript (`hitbox_component.gd`)

```gdscript
class_name HitboxComponent
extends Area2D

## Damage dealt to the target hurtbox on contact.
@export var damage: int = 10

## Minimum seconds between successive hits (0 = no cooldown).
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


func _on_cooldown_timeout() -> void:
	_on_cooldown = false


func _build_timer() -> Timer:
	var t := Timer.new()
	t.one_shot = true
	t.timeout.connect(_on_cooldown_timeout)
	add_child(t)
	return t
```

### C# (`HitboxComponent.cs`)

```csharp
using Godot;

public partial class HitboxComponent : Area2D
{
    /// <summary>Damage dealt to the target hurtbox on contact.</summary>
    [Export] public int Damage { get; set; } = 10;

    /// <summary>Minimum seconds between successive hits (0 = no cooldown).</summary>
    [Export] public float CooldownDuration { get; set; } = 0.5f;

    [Signal] public delegate void HitEventHandler(HurtboxComponent targetHurtbox);

    private bool _onCooldown;
    private Timer _cooldownTimer;

    public override void _Ready()
    {
        _cooldownTimer = new Timer { OneShot = true };
        _cooldownTimer.Timeout += OnCooldownTimeout;
        AddChild(_cooldownTimer);

        AreaEntered += OnAreaEntered;
    }

    private void OnAreaEntered(Area2D area)
    {
        if (_onCooldown) return;
        if (area is not HurtboxComponent hurtbox) return;

        EmitSignal(SignalName.Hit, hurtbox);
        hurtbox.ReceiveHit(Damage);

        if (CooldownDuration > 0f)
        {
            _onCooldown = true;
            _cooldownTimer.Start(CooldownDuration);
        }
    }

    private void OnCooldownTimeout() => _onCooldown = false;
}
```

---

## 5. HurtboxComponent

Attach to any entity that can take damage. Wire it to a sibling `HealthComponent` via `@export`.

### GDScript (`hurtbox_component.gd`)

```gdscript
class_name HurtboxComponent
extends Area2D

## Reference to the HealthComponent on the same entity.
@export var health_component: HealthComponent

## Invincibility frame duration in seconds (0 = none).
@export var invincibility_duration: float = 0.0

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


func _on_iframes_timeout() -> void:
	_invincible = false


func _build_timer() -> Timer:
	var t := Timer.new()
	t.one_shot = true
	t.timeout.connect(_on_iframes_timeout)
	add_child(t)
	return t
```

### C# (`HurtboxComponent.cs`)

```csharp
using Godot;

public partial class HurtboxComponent : Area2D
{
    /// <summary>Reference to the HealthComponent on the same entity.</summary>
    [Export] public HealthComponent HealthComponent { get; set; }

    /// <summary>Invincibility frame duration in seconds (0 = none).</summary>
    [Export] public float InvincibilityDuration { get; set; } = 0f;

    [Signal] public delegate void HurtEventHandler(int damageAmount);

    private bool _invincible;
    private Timer _iframesTimer;

    public override void _Ready()
    {
        _iframesTimer = new Timer { OneShot = true };
        _iframesTimer.Timeout += OnIframesTimeout;
        AddChild(_iframesTimer);
    }

    public void ReceiveHit(int damage)
    {
        if (_invincible) return;

        EmitSignal(SignalName.Hurt, damage);
        HealthComponent?.TakeDamage(damage);

        if (InvincibilityDuration > 0f)
        {
            _invincible = true;
            _iframesTimer.Start(InvincibilityDuration);
        }
    }

    private void OnIframesTimeout() => _invincible = false;
}
```

---

## 6. Component Communication

Components must not call methods on siblings directly. Use signals to keep them decoupled.

```
┌─────────────────────────────────────────────────────┐
│  Entity (CharacterBody2D)                            │
│                                                      │
│  ┌──────────────┐    hit(hurtbox)                    │
│  │ HitboxComponent ──────────────────────────────┐  │
│  └──────────────┘                                 │  │
│                                                   ▼  │
│                              ┌─────────────────────┐ │
│                              │  HurtboxComponent   │ │
│                              │  receive_hit(dmg)   │ │
│                              │  ──── calls ──────► │ │
│                              │  HealthComponent    │ │
│                              │  .take_damage(dmg) │ │
│                              └────────┬────────────┘ │
│                                       │              │
│                              health_changed / died   │
│                                       │              │
│                              ┌────────▼────────────┐ │
│                              │  HealthComponent    │ │
│                              │  emits: died        │ │
│                              └─────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Flow explained:**

1. `HitboxComponent` detects an overlapping `HurtboxComponent` via `area_entered`.
2. It emits `hit(target_hurtbox)` (for the entity's own logic, e.g. playing a sound) and calls `target_hurtbox.receive_hit(damage)` — the only cross-component call, and it targets the direct interface of the hurtbox, not a sibling.
3. `HurtboxComponent.receive_hit()` emits `hurt(damage_amount)` for animation/VFX, then calls `health_component.take_damage(damage)` on its explicitly wired reference.
4. `HealthComponent.take_damage()` updates HP and emits `health_changed` or `died`. Listeners (UI, GameManager, etc.) connect to those signals without touching the combat components.

---

## 7. Wiring Components

Three patterns in order of preference:

### @export NodePath — most flexible, works across the scene tree

```gdscript
# hurtbox_component.gd
@export var health_component: HealthComponent

# Inspector: drag the HealthComponent node into the slot.
```

> **Gotcha:** `@export` node references are wired via the editor inspector. If you build scenes programmatically or hand-write `.tscn` files, the reference may be null at runtime. In that case, wire it explicitly in the parent's `_ready()`:
> ```gdscript
> hurtbox.health_component = health_component
> ```

### @onready direct child — simple when the component is a known child

```gdscript
# enemy.gd
@onready var health: HealthComponent = $HealthComponent
@onready var hurtbox: HurtboxComponent = $HurtboxComponent
```

### get_node pattern — when the path is dynamic or optional

```gdscript
func _ready() -> void:
	var health := get_node_or_null("HealthComponent") as HealthComponent
	if health:
		health.died.connect(_on_died)
```

> Prefer `@export` when the wired node lives elsewhere in the tree. Prefer `@onready` for direct children that are always present. Use `get_node_or_null` when the component is optional.

### C# parity

```csharp
// Pattern 1: [Export] property — drag-and-drop in the Inspector.
public partial class HurtboxComponent : Area3D
{
    [Export] public HealthComponent Health { get; set; }
}

// Pattern 2: GetNode<T> for a known child path (equivalent to @onready var x := $Path).
public partial class Enemy : CharacterBody3D
{
    private HealthComponent _health;
    private HurtboxComponent _hurtbox;

    public override void _Ready()
    {
        _health = GetNode<HealthComponent>("HealthComponent");
        _hurtbox = GetNode<HurtboxComponent>("HurtboxComponent");
        _health.Died += QueueFree;
    }
}

// Pattern 3: GetNodeOrNull<T> when the component is optional (equivalent to get_node_or_null).
public partial class Pickup : Node3D
{
    public override void _Ready()
    {
        var health = GetNodeOrNull<HealthComponent>("HealthComponent");
        if (health != null)
            health.Died += OnDied;
    }

    private void OnDied() { /* ... */ }
}
```

---

## 8. Finding Components at Runtime

Use a static utility to locate the first component of a given type on any entity. This avoids hardcoding node names across different entity scenes.

### GDScript (`component_utils.gd`)

```gdscript
class_name ComponentUtils


## Returns the first child of [param entity] that is an instance of [param component_type],
## or null if none is found.
static func get_component(entity: Node, component_type: GDScript) -> Node:
	for child in entity.get_children():
		if is_instance_of(child, component_type):
			return child
	return null


## Example usage:
##   var health := ComponentUtils.get_component(enemy, HealthComponent) as HealthComponent
##   if health:
##       health.take_damage(5)
```

### C# (`ComponentUtils.cs`)

```csharp
using Godot;

public static class ComponentUtils
{
    /// <summary>
    /// Returns the first child of <paramref name="entity"/> that is of type
    /// <typeparamref name="T"/>, or null if none is found.
    /// </summary>
    public static T GetComponent<T>(Node entity) where T : Node
    {
        foreach (var child in entity.GetChildren())
        {
            if (child is T component)
                return component;
        }
        return null;
    }
}

// Example usage:
//   var health = ComponentUtils.GetComponent<HealthComponent>(enemy);
//   health?.TakeDamage(5);
```

---

## 9. Implementation Checklist

- [ ] Each component is saved as its own `.tscn` scene and reused by instancing
- [ ] Components communicate through signals — no `get_parent().get_node("Sibling")` calls
- [ ] No direct sibling access anywhere inside a component script
- [ ] All tuneable values (`damage`, `max_health`, `cooldown_duration`) are `@export`
- [ ] Each component can be tested by attaching it to a minimal test scene in isolation
