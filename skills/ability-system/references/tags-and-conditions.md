# Gameplay Tags and Conditions

Reference for `skills/ability-system/SKILL.md` — the tag system: `GameplayTagContainer` storing `StringName` tags, gating ability activation with required/blocked tags, effect immunities, and a worked "stun blocks casting" example.

> ← Back to [SKILL.md](../SKILL.md)

---

## Overview

A gameplay tag system attaches semantic labels (`StringName`s like `&"status.stunned"` or `&"immune.fire"`) to entities at runtime. Two rules govern the system:

1. **Ability gating** — an `Ability` declares which tags the caster *must* have (`required_tags`) and which tags *prevent* activation (`blocked_tags`). The `can_activate(caster)` virtual checks the caster's `GameplayTagContainer` before firing.
2. **Effect immunity** — an `Effect` declares what immunity tag blocks it from being applied. The `EffectHolder.apply_effect()` call checks the target's container and silently skips immune targets.

Tags are `StringName`s so comparisons are O(1) hash lookups. Store them in a `Dictionary` (key = tag, value = `true`) for O(1) membership; use an `Array[StringName]` only when order matters (rare).

---

## 1. GameplayTagContainer

`GameplayTagContainer` is a `Node` added as a direct child of any entity that needs tags. It can be added in the scene tree and named `"GameplayTagContainer"` for consistent lookup.

### GDScript

```gdscript
# gameplay_tag_container.gd
class_name GameplayTagContainer
extends Node

signal tag_added(tag: StringName)
signal tag_removed(tag: StringName)

# Internal store: tag -> true. Dictionary gives O(1) has/add/remove.
var _tags: Dictionary = {}


func add_tag(tag: StringName) -> void:
    if not _tags.has(tag):
        _tags[tag] = true
        tag_added.emit(tag)


func remove_tag(tag: StringName) -> void:
    if _tags.erase(tag):
        tag_removed.emit(tag)


func has_tag(tag: StringName) -> bool:
    return _tags.has(tag)


# Returns true if at least one tag in `tags` is present.
func has_any(tags: Array[StringName]) -> bool:
    for tag in tags:
        if _tags.has(tag):
            return true
    return false


# Returns true only if every tag in `tags` is present.
func has_all(tags: Array[StringName]) -> bool:
    for tag in tags:
        if not _tags.has(tag):
            return false
    return true


func get_all() -> Array[StringName]:
    var result: Array[StringName] = []
    result.assign(_tags.keys())
    return result


func clear() -> void:
    var removed := get_all()
    _tags.clear()
    for tag in removed:
        tag_removed.emit(tag)
```

### C#

```csharp
// GameplayTagContainer.cs
using Godot;
using System.Collections.Generic;

[GlobalClass]
public partial class GameplayTagContainer : Node
{
    [Signal] public delegate void TagAddedEventHandler(StringName tag);
    [Signal] public delegate void TagRemovedEventHandler(StringName tag);

    private readonly HashSet<StringName> _tags = new();

    public void AddTag(StringName tag)
    {
        if (_tags.Add(tag))
            EmitSignal(SignalName.TagAdded, tag);
    }

    public void RemoveTag(StringName tag)
    {
        if (_tags.Remove(tag))
            EmitSignal(SignalName.TagRemoved, tag);
    }

    public bool HasTag(StringName tag) => _tags.Contains(tag);

    /// <summary>Returns true if at least one tag in <paramref name="tags"/> is present.</summary>
    public bool HasAny(IEnumerable<StringName> tags)
    {
        foreach (var tag in tags)
            if (_tags.Contains(tag)) return true;
        return false;
    }

    /// <summary>Returns true only if every tag in <paramref name="tags"/> is present.</summary>
    public bool HasAll(IEnumerable<StringName> tags)
    {
        foreach (var tag in tags)
            if (!_tags.Contains(tag)) return false;
        return true;
    }

    public IReadOnlyCollection<StringName> GetAll() => _tags;

    public void Clear()
    {
        var removed = new List<StringName>(_tags);
        _tags.Clear();
        foreach (var tag in removed)
            EmitSignal(SignalName.TagRemoved, tag);
    }
}
```

> **Why `HashSet` in C# but `Dictionary` in GDScript?** GDScript has no built-in `HashSet`, so a `Dictionary` with dummy `true` values gives the same O(1) membership semantics. C# `HashSet<StringName>` is the idiomatic choice there.

---

## 2. Gating Abilities with Required and Blocked Tags

Add two exported arrays to `Ability` and override `can_activate` to query the caster's `GameplayTagContainer`. The container is expected to live as a direct child node named `"GameplayTagContainer"` — a helper `_get_tags(caster)` locates it.

### GDScript

```gdscript
# ability.gd  (extends the base class from SKILL.md Section 2)
class_name Ability
extends Resource

@export var ability_name: String
@export var cost: float = 0.0
@export var cooldown: float = 1.0
@export var cast_time: float = 0.0

# Tags the caster must have for this ability to activate.
@export var required_tags: Array[StringName] = []

# Tags that prevent activation when present on the caster.
@export var blocked_tags: Array[StringName] = []


func can_activate(caster: Node) -> bool:
    var tags := _get_tags(caster)
    if tags == null:
        return true  # no container means no tag constraints
    if not required_tags.is_empty() and not tags.has_all(required_tags):
        return false
    if not blocked_tags.is_empty() and tags.has_any(blocked_tags):
        return false
    return true


func activate(caster: Node) -> void:
    pass


# Retrieve the GameplayTagContainer from the caster.
# Looks for a direct child node named "GameplayTagContainer"; returns null if not found.
static func _get_tags(caster: Node) -> GameplayTagContainer:
    var child := caster.get_node_or_null("GameplayTagContainer")
    if child is GameplayTagContainer:
        return child
    return null
```

### C#

```csharp
// Ability.cs  (extends the base class from SKILL.md Section 2)
using Godot;
using Godot.Collections;

[GlobalClass]
public partial class Ability : Resource
{
    [Export] public string AbilityName { get; set; } = "";
    [Export] public float Cost         { get; set; } = 0.0f;
    [Export] public float Cooldown     { get; set; } = 1.0f;
    [Export] public float CastTime     { get; set; } = 0.0f;

    /// <summary>Tags the caster must have for this ability to activate.</summary>
    [Export] public Array<StringName> RequiredTags { get; set; } = new();

    /// <summary>Tags that prevent activation when present on the caster.</summary>
    [Export] public Array<StringName> BlockedTags  { get; set; } = new();

    public virtual bool CanActivate(Node caster)
    {
        var tags = GetTags(caster);
        if (tags == null) return true;
        if (RequiredTags.Count > 0 && !tags.HasAll(RequiredTags)) return false;
        if (BlockedTags.Count  > 0 && tags.HasAny(BlockedTags))   return false;
        return true;
    }

    public virtual void Activate(Node caster) { }

    /// <summary>
    /// Locate the <see cref="GameplayTagContainer"/> on the caster.
    /// Looks for a direct child node named "GameplayTagContainer"; returns null if not found.
    /// </summary>
    protected static GameplayTagContainer? GetTags(Node caster)
        => caster.GetNodeOrNull("GameplayTagContainer") as GameplayTagContainer;
}
```

> **Design note:** `_get_tags` / `GetTags` is a static helper so subclasses can call it without boilerplate. If you always name the container node `"GameplayTagContainer"`, you can also inline the lookup directly in `can_activate` without the helper.

---

## 3. Effect Immunities

An `Effect` declares one optional immunity tag. Before `EffectHolder.apply_effect()` calls `on_apply`, it checks whether the target owns the immunity tag and skips application entirely if so.

### GDScript

```gdscript
# effect.gd  (extends the base class from SKILL.md Section 3)
class_name Effect
extends Resource

@export var effect_name: String
@export var duration: float = 5.0
@export var tick_interval: float = 0.0

# If the target has this tag, the effect is blocked entirely.
# Leave empty (&"") to make the effect never immune.
@export var immunity_tag: StringName = &""

func on_apply(target: Node) -> void: pass
func on_tick(target: Node) -> void: pass
func on_expire(target: Node) -> void: pass
```

```gdscript
# effect_holder.gd  (extends the base class from SKILL.md Section 3)
class_name EffectHolder
extends Node

signal effect_applied(effect: Effect)
signal effect_expired(effect: Effect)
signal effect_blocked(effect: Effect, reason: String)

var _active: Dictionary = {}

func apply_effect(effect: Effect) -> void:
    # --- Immunity check ---
    if effect.immunity_tag != &"":
        var tags := _get_tags()
        if tags != null and tags.has_tag(effect.immunity_tag):
            effect_blocked.emit(effect, "immune")
            return

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

func _get_tags() -> GameplayTagContainer:
    var child := get_parent().get_node_or_null("GameplayTagContainer")
    if child is GameplayTagContainer:
        return child
    return null
```

### C#

```csharp
// Effect.cs  (extends the base class from SKILL.md Section 3)
using Godot;

[GlobalClass]
public partial class Effect : Resource
{
    [Export] public string EffectName    { get; set; } = "";
    [Export] public float  Duration      { get; set; } = 5.0f;
    [Export] public float  TickInterval  { get; set; } = 0.0f;

    /// <summary>If the target has this tag, the effect is blocked. Empty means never immune.</summary>
    [Export] public StringName ImmunityTag { get; set; } = "";

    public virtual void OnApply(Node target)  { }
    public virtual void OnTick(Node target)   { }
    public virtual void OnExpire(Node target) { }
}
```

```csharp
// EffectHolder.cs  (extends the base class from SKILL.md Section 3)
using Godot;
using System.Collections.Generic;

public partial class EffectHolder : Node
{
    [Signal] public delegate void EffectAppliedEventHandler(Effect effect);
    [Signal] public delegate void EffectExpiredEventHandler(Effect effect);
    [Signal] public delegate void EffectBlockedEventHandler(Effect effect, string reason);

    private readonly Dictionary<Effect, (float Elapsed, float TickAccum)> _active = new();

    public void ApplyEffect(Effect effect)
    {
        // --- Immunity check ---
        if (!effect.ImmunityTag.IsEmpty)
        {
            var tags = GetTags();
            if (tags != null && tags.HasTag(effect.ImmunityTag))
            {
                EmitSignal(SignalName.EffectBlocked, effect, "immune");
                return;
            }
        }

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
                _active[effect] = (elapsed, tickAccum);
        }
        foreach (var effect in toRemove)
        {
            _active.Remove(effect);
            effect.OnExpire(GetParent());
            EmitSignal(SignalName.EffectExpired, effect);
        }
    }

    private GameplayTagContainer? GetTags()
        => GetParent().GetNodeOrNull("GameplayTagContainer") as GameplayTagContainer;
}
```

---

## 4. Worked Example — "Stun Blocks Casting"

This example wires together all three pieces: a `StunEffect` that adds the `&"status.stunned"` tag on apply and removes it on expiry, and a `FireballAbility` (or any ability) whose `blocked_tags` includes `&"status.stunned"`.

### Scene tree

```
Player (CharacterBody2D)
├── AbilityComponent        ← drives ability activation
├── EffectHolder            ← manages active effects
└── GameplayTagContainer    ← owned by the player node
```

### GDScript

```gdscript
# stun_effect.gd
class_name StunEffect
extends Effect

func _init() -> void:
    effect_name = "stun"
    duration = 2.0          # stun lasts 2 seconds
    tick_interval = 0.0
    immunity_tag = &"immune.stun"   # entities with this tag resist the stun

func on_apply(target: Node) -> void:
    var tags := target.get_node_or_null("GameplayTagContainer") as GameplayTagContainer
    if tags:
        tags.add_tag(&"status.stunned")

func on_expire(target: Node) -> void:
    var tags := target.get_node_or_null("GameplayTagContainer") as GameplayTagContainer
    if tags:
        tags.remove_tag(&"status.stunned")
```

```gdscript
# fireball_ability.gd
class_name FireballAbility
extends Ability

func _init() -> void:
    ability_name = "fireball"
    cost = 30.0
    cooldown = 3.0
    # Stunned casters cannot cast — add the tag to blocked_tags.
    blocked_tags = [&"status.stunned"]

func activate(caster: Node) -> void:
    # Spawn fireball projectile here.
    pass
```

```gdscript
# Usage — apply a stun to the player, then watch fireball fail.
func _on_player_hit_by_stun() -> void:
    var stun := StunEffect.new()
    player.get_node("EffectHolder").apply_effect(stun)
    # 'status.stunned' is now on player's GameplayTagContainer.

    var result := player.get_node("AbilityComponent").try_activate("fireball")
    # `AbilityComponent` (with `try_activate` and the `ability_failed` "conditions_unmet" reason) is defined in the main skill — see Section 2 of SKILL.md.
    # result == false; ability_failed emitted with reason "conditions_unmet".
    # After 2 s, StunEffect.on_expire removes 'status.stunned';
    # fireball activates normally again.
```

### C#

```csharp
// StunEffect.cs
using Godot;

[GlobalClass]
public partial class StunEffect : Effect
{
    public StunEffect()
    {
        EffectName   = "stun";
        Duration     = 2.0f;          // stun lasts 2 seconds
        TickInterval = 0.0f;
        ImmunityTag  = new StringName("immune.stun");
    }

    public override void OnApply(Node target)
    {
        if (target.GetNodeOrNull("GameplayTagContainer") is GameplayTagContainer tags)
            tags.AddTag(new StringName("status.stunned"));
    }

    public override void OnExpire(Node target)
    {
        if (target.GetNodeOrNull("GameplayTagContainer") is GameplayTagContainer tags)
            tags.RemoveTag(new StringName("status.stunned"));
    }
}
```

```csharp
// FireballAbility.cs
using Godot;
using Godot.Collections;

[GlobalClass]
public partial class FireballAbility : Ability
{
    public FireballAbility()
    {
        AbilityName  = "fireball";
        Cost         = 30.0f;
        Cooldown     = 3.0f;
        // Stunned casters cannot cast.
        BlockedTags  = new Array<StringName> { new StringName("status.stunned") };
    }

    public override void Activate(Node caster)
    {
        // Spawn fireball projectile here.
    }
}
```

```csharp
// Usage — apply a stun to the player, then watch fireball fail.
private void OnPlayerHitByStun()
{
    var stun = new StunEffect();
    _player.GetNode<EffectHolder>("EffectHolder").ApplyEffect(stun);
    // "status.stunned" is now in the player's GameplayTagContainer.

    bool result = _player.GetNode<AbilityComponent>("AbilityComponent").TryActivate("fireball");
    // `AbilityComponent` (with `TryActivate` and the `AbilityFailed` "conditions_unmet" reason) is defined in the main skill — see Section 2 of SKILL.md.
    // result == false; AbilityFailed emitted with reason "conditions_unmet".
    // After 2 s, StunEffect.OnExpire removes "status.stunned";
    // fireball activates normally again.
}
```

> **Flow summary:** `EffectHolder.apply_effect(stun)` → `StunEffect.on_apply` → `tags.add_tag(&"status.stunned")`. Later, `AbilityComponent.try_activate("fireball")` → `ability.can_activate(caster)` → `tags.has_any([&"status.stunned"])` returns `true` → `can_activate` returns `false` → `ability_failed` emitted.

---

## Implementation Checklist

- [ ] `GameplayTagContainer` Node added as a direct child node named `"GameplayTagContainer"` on the entity
- [ ] `Ability.required_tags` and `Ability.blocked_tags` exported and set in the Inspector
- [ ] `Ability.can_activate` calls `_get_tags(caster)` / `GetTags(caster)` and checks both arrays
- [ ] `Effect.immunity_tag` set for effects that should be resistible; leave empty for always-applicable effects
- [ ] `EffectHolder.apply_effect` checks the immunity tag before calling `on_apply`
- [ ] `StunEffect` (or equivalent) adds the status tag in `on_apply` and removes it in `on_expire`
- [ ] `ability_failed` signal connected to HUD or log to surface "conditions_unmet" failures
- [ ] Tag strings use `StringName` literals (`&"status.stunned"` in GDScript; `new StringName("status.stunned")` in C#) to avoid per-frame allocations
