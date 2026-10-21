---
name: ability-system
description: Use when building character abilities — Resource-based abilities with cost/cooldown/cast, buffs/debuffs, stat modifiers, gameplay tags, and HUD binding
---

# Ability System

Build a data-driven ability system from Godot-native parts: abilities are `Resource`s, an `AbilityComponent` node owns and runs them, and effects/stats/tags compose on top. No third-party addon required.

> **Related skills:** **resource-pattern** for the `Resource` data containers, **component-system** for the component node pattern, **event-bus** for cross-system ability events, **state-machine** for caster states (e.g. casting/stunned), **hud-system** for cooldown UI.

---

## 1. Architecture overview

An ability system in Godot 4.x is built from three collaborating layers:

- **Data layer — `Ability` (Resource):** Each ability is a `Resource` subclass with exported fields (`ability_name`, `cost`, `cooldown`, `cast_time`) and two methods: `can_activate(caster) -> bool` to validate preconditions, and `activate(caster) -> void` to execute the effect. Storing abilities as Resources lets designers create and balance them in the Godot editor without touching code.

- **Behaviour layer — `AbilityComponent` (Node):** A single node added to any entity that should use abilities. It holds the granted ability set, enforces cost/cooldown, and drives the `Ability.activate()` call. Four signals keep the rest of the game informed without coupling: `ability_activated(ability)`, `ability_failed(ability, reason)`, `cooldown_started(ability, duration)`, and `cooldown_finished(ability)`. Grant new abilities at runtime with `grant(ability)` and trigger them with `try_activate(ability_name)`.

- **Effects layer — stat modifiers, buffs/debuffs, and gameplay tags:** Abilities can read from and write to a caster's `StatSet` (a Resource that owns a dictionary of named `StatModifier` entries) to apply temporary or permanent stat changes. A `GameplayTagContainer` node (a child of the caster) gates activation — for example, a "stunned" tag can prevent any ability from firing. These three deep-dives are covered in the reference documents:
  - [Stat modifiers and StatSet](references/stat-modifiers.md)
  - [Gameplay tags and conditions](references/tags-and-conditions.md)
  - [HUD binding for cooldowns and resource bars](references/ui-binding.md)

**Core rule:** *Data in Resources, behavior in the component, communication via signals.*

This separation means an `Ability` resource carries no Node references and can be safely duplicated, saved, and loaded as any other Godot Resource. The `AbilityComponent` owns runtime state (cooldown timers, active ability set), keeping `Ability` resources stateless and reusable across multiple casters simultaneously.

---

## 2. Abilities (cost / cooldown / cast)

### GDScript

```gdscript
# ability.gd
class_name Ability
extends Resource

@export var ability_name: String
@export var cost: float = 0.0
@export var cooldown: float = 1.0
@export var cast_time: float = 0.0

# Override in subclasses or compose via exported effect resources.
func can_activate(caster: Node) -> bool:
    return true

func activate(caster: Node) -> void:
    pass
```

```gdscript
# ability_component.gd
class_name AbilityComponent
extends Node

signal ability_activated(ability: Ability)
signal ability_failed(ability: Ability, reason: String)
signal cooldown_started(ability: Ability, duration: float)
signal cooldown_finished(ability: Ability)

@export var resource_pool: float = 100.0

var _granted: Dictionary = {}        # ability_name -> Ability
var _cooldowns: Dictionary = {}      # ability_name -> seconds remaining

func grant(ability: Ability) -> void:
    _granted[ability.ability_name] = ability

func _process(delta: float) -> void:
    for name in _cooldowns.keys():
        _cooldowns[name] -= delta
        if _cooldowns[name] <= 0.0:
            _cooldowns.erase(name)
            if _granted.has(name):
                cooldown_finished.emit(_granted[name])

func try_activate(ability_name: String) -> bool:
    var ability: Ability = _granted.get(ability_name)
    if ability == null:
        return false
    if _cooldowns.has(ability_name):
        ability_failed.emit(ability, "on_cooldown")
        return false
    if resource_pool < ability.cost:
        ability_failed.emit(ability, "insufficient_resource")
        return false
    if not ability.can_activate(get_parent()):
        ability_failed.emit(ability, "conditions_unmet")
        return false
    resource_pool -= ability.cost
    ability.activate(get_parent())
    _cooldowns[ability_name] = ability.cooldown
    cooldown_started.emit(ability, ability.cooldown)
    ability_activated.emit(ability)
    return true
```

### C#

```csharp
// Ability.cs
using Godot;

[GlobalClass]
public partial class Ability : Resource
{
    [Export] public string AbilityName { get; set; } = "";
    [Export] public float Cost { get; set; } = 0.0f;
    [Export] public float Cooldown { get; set; } = 1.0f;
    [Export] public float CastTime { get; set; } = 0.0f;

    public virtual bool CanActivate(Node caster) => true;
    public virtual void Activate(Node caster) { }
}
```

```csharp
// AbilityComponent.cs
using Godot;
using System.Collections.Generic;

public partial class AbilityComponent : Node
{
    [Signal] public delegate void AbilityActivatedEventHandler(Ability ability);
    [Signal] public delegate void AbilityFailedEventHandler(Ability ability, string reason);
    [Signal] public delegate void CooldownStartedEventHandler(Ability ability, float duration);
    [Signal] public delegate void CooldownFinishedEventHandler(Ability ability);

    [Export] public float ResourcePool { get; set; } = 100.0f;

    private readonly Dictionary<string, Ability> _granted = new();
    private readonly Dictionary<string, float> _cooldowns = new();

    public void Grant(Ability ability) => _granted[ability.AbilityName] = ability;

    public override void _Process(double delta)
    {
        foreach (var name in new List<string>(_cooldowns.Keys))
        {
            _cooldowns[name] -= (float)delta;
            if (_cooldowns[name] <= 0.0f)
            {
                _cooldowns.Remove(name);
                if (_granted.TryGetValue(name, out var finished))
                    EmitSignal(SignalName.CooldownFinished, finished);
            }
        }
    }

    public bool TryActivate(string abilityName)
    {
        if (!_granted.TryGetValue(abilityName, out var ability)) return false;
        if (_cooldowns.ContainsKey(abilityName))
        {
            EmitSignal(SignalName.AbilityFailed, ability, "on_cooldown");
            return false;
        }
        if (ResourcePool < ability.Cost)
        {
            EmitSignal(SignalName.AbilityFailed, ability, "insufficient_resource");
            return false;
        }
        if (!ability.CanActivate(GetParent()))
        {
            EmitSignal(SignalName.AbilityFailed, ability, "conditions_unmet");
            return false;
        }
        ResourcePool -= ability.Cost;
        ability.Activate(GetParent());
        _cooldowns[abilityName] = ability.Cooldown;
        EmitSignal(SignalName.CooldownStarted, ability, ability.Cooldown);
        EmitSignal(SignalName.AbilityActivated, ability);
        return true;
    }
}
```

---

## 3. Buffs & debuffs (timed effects)

Effects are `Resource` subclasses — designers create them in the editor and abilities apply them. An `EffectHolder` node owns the runtime: it tracks elapsed time, calls periodic ticks, and removes effects when they expire.

### GDScript

```gdscript
# effect.gd
class_name Effect
extends Resource

@export var effect_name: String
@export var duration: float = 5.0       # seconds; <= 0 means instant
@export var tick_interval: float = 0.0  # 0 = no periodic tick

func on_apply(target: Node) -> void: pass
func on_tick(target: Node) -> void: pass
func on_expire(target: Node) -> void: pass
```

```gdscript
# effect_holder.gd
class_name EffectHolder
extends Node

signal effect_applied(effect: Effect)
signal effect_expired(effect: Effect)

# effect -> [elapsed, tick_accum]
var _active: Dictionary = {}

func apply_effect(effect: Effect) -> void:
    effect.on_apply(get_parent())
    effect_applied.emit(effect)
    if effect.duration <= 0.0:
        effect.on_expire(get_parent())
        effect_expired.emit(effect)
        return
    _active[effect] = [0.0, 0.0]

func _process(delta: float) -> void:
    var to_remove: Array = []
    for effect in _active:
        _active[effect][0] += delta
        if effect.tick_interval > 0.0:
            _active[effect][1] += delta
            if _active[effect][1] >= effect.tick_interval:
                _active[effect][1] -= effect.tick_interval
                effect.on_tick(get_parent())
        if effect.duration > 0.0 and _active[effect][0] >= effect.duration:
            to_remove.append(effect)
    for effect in to_remove:
        _active.erase(effect)
        effect.on_expire(get_parent())
        effect_expired.emit(effect)
```

### C#

```csharp
// Effect.cs
using Godot;

[GlobalClass]
public partial class Effect : Resource
{
    [Export] public string EffectName { get; set; } = "";
    [Export] public float Duration { get; set; } = 5.0f;     // <= 0 = instant
    [Export] public float TickInterval { get; set; } = 0.0f; // 0 = no tick

    public virtual void OnApply(Node target) { }
    public virtual void OnTick(Node target) { }
    public virtual void OnExpire(Node target) { }
}
```

```csharp
// EffectHolder.cs
using Godot;
using System.Collections.Generic;

public partial class EffectHolder : Node
{
    [Signal] public delegate void EffectAppliedEventHandler(Effect effect);
    [Signal] public delegate void EffectExpiredEventHandler(Effect effect);

    private readonly Dictionary<Effect, (float Elapsed, float TickAccum)> _active = new();

    public void ApplyEffect(Effect effect)
    {
        effect.OnApply(GetParent());
        EmitSignal(SignalName.EffectApplied, effect);
        if (effect.Duration <= 0f)
        {
            effect.OnExpire(GetParent());
            EmitSignal(SignalName.EffectExpired, effect);
            return;
        }
        _active[effect] = (0f, 0f);
    }

    public override void _Process(double delta)
    {
        var toRemove = new List<Effect>();
        foreach (var effect in new List<Effect>(_active.Keys))
        {
            var (elapsed, tickAccum) = _active[effect];
            elapsed += (float)delta;
            if (effect.TickInterval > 0f)
            {
                tickAccum += (float)delta;
                if (tickAccum >= effect.TickInterval)
                {
                    tickAccum -= effect.TickInterval;
                    effect.OnTick(GetParent());
                }
            }
            if (effect.Duration > 0f && elapsed >= effect.Duration)
                toRemove.Add(effect);
            else
                _active[effect] = (elapsed, tickAccum); // still active — write back updated elapsed and tick accumulator
        }
        foreach (var effect in toRemove)
        {
            _active.Remove(effect);
            effect.OnExpire(GetParent());
            EmitSignal(SignalName.EffectExpired, effect);
        }
    }
}
```

> **Footgun:** Never iterate `_active` directly while removing entries. GDScript builds a `to_remove` list and erases after the loop; C# iterates `new List<Effect>(_active.Keys)` for the same reason.

---

## Implementation checklist

- [ ] Abilities are `Resource`s; behavior lives in `AbilityComponent`, not in the data.
- [ ] Activation validates cost, cooldown, and `can_activate()` before spending resources.
- [ ] Cooldowns tick in `_process`/`_Process` and emit start/finish signals.
- [ ] Buffs/debuffs apply → tick → expire and emit signals; durations refresh or stack by source.
- [ ] Stat modifiers recompute deterministically (ADD → MULTIPLY → OVERRIDE) and clamp.
- [ ] Ability gating uses the gameplay-tag container; immunities block effects.
- [ ] HUD binds to component signals — no per-frame polling of cooldown state.
