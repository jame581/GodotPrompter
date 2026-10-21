# Stat Modifiers and StatSet

Reference for `skills/ability-system/SKILL.md` — the stat-modifier pipeline: `StatModifier` Resource, `StatSet` with computed final values, stacking vs. refresh by source, and the `stat_changed` signal.

> ← Back to [SKILL.md](../SKILL.md)

---

## Overview

A stat-modifier pipeline separates **base stats** (designer-controlled constants) from **runtime modifiers** (applied and removed by abilities, buffs, and equipment). `StatModifier` is a lightweight Resource that describes one change. `StatSet` is a Resource that owns base values and the active modifier list, and computes the final value on demand.

---

## 1. StatModifier Resource

`StatModifier` carries four fields:

| Field | Type | Purpose |
|---|---|---|
| `stat_name` | `String` | Identifies the stat to modify (e.g. `"speed"`, `"max_health"`) |
| `operation` | `Operation` enum | How to combine with existing value: `ADD`, `MULTIPLY`, `OVERRIDE` |
| `value` | `float` | The operand for the operation |
| `source` | `StringName` | Opaque key identifying the owner (ability name, buff ID, etc.). Same source = refresh, different sources = stack. |

### GDScript

```gdscript
# stat_modifier.gd
class_name StatModifier
extends Resource

enum Operation {
    ADD,       # final += value
    MULTIPLY,  # final *= (1.0 + value)  — e.g. value = 0.2 means +20%
    OVERRIDE,  # replaces all other results; highest value wins (last-added wins on ties)
}

@export var stat_name: String = ""
@export var operation: Operation = Operation.ADD
@export var value: float = 0.0
@export var source: StringName = &""
```

### C#

```csharp
// StatModifier.cs
using Godot;

[GlobalClass]
public partial class StatModifier : Resource
{
    public enum ModOp
    {
        Add,       // final += Value
        Multiply,  // final *= (1.0f + Value)  — e.g. Value = 0.2f means +20%
        Override,  // replaces all other results; highest value wins (last-added wins on ties)
    }

    [Export] public string StatName  { get; set; } = "";
    [Export] public ModOp Operation  { get; set; } = ModOp.Add; // serializes as "operation" (snake_case of the property name) — matches the GDScript field
    [Export] public float Value      { get; set; } = 0.0f;
    [Export] public StringName Source { get; set; } = "";
}
```

---

## 2. StatSet — Base Values, Modifiers, and Computed Final

`StatSet` stores:

- `_base_values`: `Dictionary` mapping `stat_name -> float` — the raw, unmodified numbers.
- `_modifiers`: `Dictionary` mapping `stat_name -> Dictionary[source, StatModifier]` — one modifier per source per stat (overwriting on re-add enforces refresh semantics).

### Compute order (exact)

Given `base` for a stat and its active modifiers, the final value is computed in three passes:

1. **ADD pass** — sum all `ADD` modifier values and add to base: `running = base + sum(ADD.value)`
2. **MULTIPLY pass** — for each `MULTIPLY` modifier apply `running *= (1.0 + modifier.value)` in arbitrary order. A `+20%` speed modifier (`value = 0.2`) and a `+10%` modifier (`value = 0.1`) give `running * 1.2 * 1.1 = running * 1.32`. Note: order within the MULTIPLY pass does not matter because multiplication is commutative.
3. **OVERRIDE pass** — if any `OVERRIDE` modifier exists, its `value` replaces `running` entirely. If multiple OVERRIDEs are present, the one with the highest `value` wins (last-added wins if equal).
4. **Clamp** — the result is clamped to `[min_value, max_value]` if limits are set for that stat (defaults: `0.0` to `INF`).

> **Why `(1 + value)` for MULTIPLY?** It lets `value = 0.0` be a neutral element (no change), `value = 0.5` mean +50%, and `value = -0.3` mean -30% — intuitive for designers without needing to write `1.3` or `0.7`.

### GDScript

```gdscript
# stat_set.gd
class_name StatSet
extends Resource

signal stat_changed(stat_name: String, new_value: float)

# base_values: { "speed": 300.0, "max_health": 100.0, ... }
@export var base_values: Dictionary = {}

# Optional per-stat clamp limits. Key = stat_name, value = Vector2(min, max).
# If a stat has no entry its range is (0.0, INF).
@export var clamp_limits: Dictionary = {}

# Internal: { stat_name: { source: StatModifier } }
var _modifiers: Dictionary = {}


# Add or refresh a modifier. Calling with the same source replaces the old one.
func add_modifier(modifier: StatModifier) -> void:
    var stat := modifier.stat_name
    if not _modifiers.has(stat):
        _modifiers[stat] = {}
    _modifiers[stat][modifier.source] = modifier
    _emit_if_changed(stat)


# Remove the modifier from a given source for a given stat.
func remove_modifier(stat_name: String, source: StringName) -> void:
    if _modifiers.has(stat_name):
        _modifiers[stat_name].erase(source)
        if _modifiers[stat_name].is_empty():
            _modifiers.erase(stat_name)
    _emit_if_changed(stat_name)


# Remove all modifiers from a given source across all stats.
func remove_all_from_source(source: StringName) -> void:
    var affected: Array[String] = []
    for stat in _modifiers.keys():
        if _modifiers[stat].has(source):
            _modifiers[stat].erase(source)
            if _modifiers[stat].is_empty():
                _modifiers.erase(stat)
            affected.append(stat)
    for stat in affected:
        _emit_if_changed(stat)


# Return the final computed value for a stat.
func get_value(stat_name: String) -> float:
    var base: float = float(base_values.get(stat_name, 0.0))
    var mods: Dictionary = _modifiers.get(stat_name, {})

    # --- Pass 1: ADD ---
    var running := base
    for mod: StatModifier in mods.values():
        if mod.operation == StatModifier.Operation.ADD:
            running += mod.value

    # --- Pass 2: MULTIPLY (each modifier scales by its own factor) ---
    for mod: StatModifier in mods.values():
        if mod.operation == StatModifier.Operation.MULTIPLY:
            running *= (1.0 + mod.value)

    # --- Pass 3: OVERRIDE (highest value wins; last-added wins on ties) ---
    var override_value := -INF
    var has_override := false
    for mod: StatModifier in mods.values():
        if mod.operation == StatModifier.Operation.OVERRIDE:
            if mod.value >= override_value:
                override_value = mod.value
                has_override = true
    if has_override:
        running = override_value

    # --- Pass 4: Clamp ---
    var limits: Vector2 = clamp_limits.get(stat_name, Vector2(0.0, INF))
    return clamp(running, limits.x, limits.y)


# Set a base value and emit if it changed.
func set_base(stat_name: String, value: float) -> void:
    base_values[stat_name] = value
    _emit_if_changed(stat_name)


var _last_values: Dictionary = {}

func _emit_if_changed(stat_name: String) -> void:
    var new_val := get_value(stat_name)
    if _last_values.get(stat_name, null) != new_val:
        _last_values[stat_name] = new_val
        stat_changed.emit(stat_name, new_val)
```

### C#

```csharp
// StatSet.cs
using Godot;
using System.Collections.Generic;

[GlobalClass]
public partial class StatSet : Resource
{
    [Signal] public delegate void StatChangedEventHandler(string statName, float newValue);

    // base_values: exported so designers can fill them in the Inspector.
    [Export] public Godot.Collections.Dictionary BaseValues { get; set; } = new();

    // Per-stat clamp limits as Vector2(min, max). If absent: (0, float.PositiveInfinity).
    [Export] public Godot.Collections.Dictionary ClampLimits { get; set; } = new();

    // stat_name -> (source -> StatModifier)
    private readonly Dictionary<string, Dictionary<StringName, StatModifier>> _modifiers = new();
    private readonly Dictionary<string, float> _lastValues = new();

    /// <summary>Add or refresh a modifier. Same source on the same stat replaces the old entry.</summary>
    public void AddModifier(StatModifier modifier)
    {
        if (!_modifiers.TryGetValue(modifier.StatName, out var bySource))
        {
            bySource = new Dictionary<StringName, StatModifier>();
            _modifiers[modifier.StatName] = bySource;
        }
        bySource[modifier.Source] = modifier;
        EmitIfChanged(modifier.StatName);
    }

    /// <summary>Remove the modifier from a specific source for a specific stat.</summary>
    public void RemoveModifier(string statName, StringName source)
    {
        if (_modifiers.TryGetValue(statName, out var bySource))
        {
            bySource.Remove(source);
            if (bySource.Count == 0)
                _modifiers.Remove(statName);
        }
        EmitIfChanged(statName);
    }

    /// <summary>Remove all modifiers applied by a given source across all stats.</summary>
    public void RemoveAllFromSource(StringName source)
    {
        var affected = new List<string>();
        foreach (var (statName, bySource) in _modifiers)
        {
            if (bySource.Remove(source))
                affected.Add(statName);
        }
        // Clean up empty inner dicts.
        foreach (var statName in affected)
            if (_modifiers.TryGetValue(statName, out var bs) && bs.Count == 0)
                _modifiers.Remove(statName);
        foreach (var statName in affected)
            EmitIfChanged(statName);
    }

    /// <summary>Compute and return the final value for a stat.</summary>
    public float GetValue(string statName)
    {
        float baseVal = BaseValues.ContainsKey(statName)
            ? BaseValues[statName].As<float>()
            : 0f;

        _modifiers.TryGetValue(statName, out var bySource);

        // --- Pass 1: ADD ---
        float running = baseVal;
        if (bySource != null)
            foreach (var mod in bySource.Values)
                if (mod.Operation == StatModifier.ModOp.Add)
                    running += mod.Value;

        // --- Pass 2: MULTIPLY ---
        if (bySource != null)
            foreach (var mod in bySource.Values)
                if (mod.Operation == StatModifier.ModOp.Multiply)
                    running *= (1.0f + mod.Value);

        // --- Pass 3: OVERRIDE (highest value wins) ---
        if (bySource != null)
        {
            float overrideVal  = float.NegativeInfinity;
            bool  hasOverride  = false;
            foreach (var mod in bySource.Values)
                if (mod.Operation == StatModifier.ModOp.Override && mod.Value >= overrideVal)
                {
                    overrideVal = mod.Value;
                    hasOverride = true;
                }
            if (hasOverride) running = overrideVal;
        }

        // --- Pass 4: Clamp ---
        float min = 0f, max = float.PositiveInfinity;
        if (ClampLimits.ContainsKey(statName))
        {
            var limits = ClampLimits[statName].As<Vector2>();
            min = limits.X; max = limits.Y;
        }
        return Mathf.Clamp(running, min, max);
    }

    /// <summary>Change a base value and emit if the computed final changes.</summary>
    public void SetBase(string statName, float value)
    {
        BaseValues[statName] = Variant.From(value);
        EmitIfChanged(statName);
    }

    private void EmitIfChanged(string statName)
    {
        float newVal = GetValue(statName);
        if (!_lastValues.TryGetValue(statName, out var prev) || prev != newVal)
        {
            _lastValues[statName] = newVal;
            EmitSignal(SignalName.StatChanged, statName, newVal);
        }
    }
}
```

---

## 3. Stacking vs. Refresh

The inner `Dictionary` keyed by `source` enforces the rule automatically:

- **Same source, re-apply** — `add_modifier` overwrites the existing entry; the old modifier is gone. Use this for abilities that refresh their own buff (e.g. re-casting "Sprint" resets the speed bonus rather than stacking two separate bonuses).
- **Different sources** — each source occupies its own slot; all of them participate in the compute. Use this for abilities and equipment that legitimately combine (e.g. "Sprint" ability + "Boots of Speed" equipment each contribute their own `ADD` modifier and both take effect).

```gdscript
# Refresh: re-applying "sprint" removes the previous sprint modifier.
var sprint_mod := StatModifier.new()
sprint_mod.stat_name = "speed"
sprint_mod.operation = StatModifier.Operation.ADD
sprint_mod.value = 100.0
sprint_mod.source = &"ability:sprint"
stat_set.add_modifier(sprint_mod)        # first application
stat_set.add_modifier(sprint_mod)        # refreshes — still only one modifier, not two

# Stack: boots and sprint are different sources, both active simultaneously.
var boots_mod := StatModifier.new()
boots_mod.stat_name = "speed"
boots_mod.operation = StatModifier.Operation.ADD
boots_mod.value = 50.0
boots_mod.source = &"item:boots_of_speed"
stat_set.add_modifier(boots_mod)
# speed = base(300) + sprint(100) + boots(50) = 450
```

```csharp
// Refresh: re-applying "sprint" replaces the old entry.
var sprintMod = new StatModifier {
    StatName  = "speed",
    Operation = StatModifier.ModOp.Add,
    Value     = 100f,
    Source    = new StringName("ability:sprint"),
};
statSet.AddModifier(sprintMod);  // first application
statSet.AddModifier(sprintMod);  // refresh — one modifier, not two

// Stack: boots and sprint are separate sources.
var bootsMod = new StatModifier {
    StatName  = "speed",
    Operation = StatModifier.ModOp.Add,
    Value     = 50f,
    Source    = new StringName("item:boots_of_speed"),
};
statSet.AddModifier(bootsMod);
// speed = base(300) + sprint(100) + boots(50) = 450
```

---

## 4. Connecting stat_changed to the HUD

`stat_changed(stat_name, new_value)` fires only when the computed final value actually changes. Connect it once in `_ready` and update any UI that reflects the stat:

```gdscript
# In the entity's root node or a dedicated stats component.
func _ready() -> void:
    stat_set.stat_changed.connect(_on_stat_changed)

func _on_stat_changed(stat_name: String, new_value: float) -> void:
    if stat_name == "max_health":
        health_bar.max_value = new_value
    elif stat_name == "speed":
        # Propagate to CharacterBody2D / CharacterBody3D movement code.
        movement_component.speed = new_value
```

```csharp
public override void _Ready()
{
    _statSet.StatChanged += OnStatChanged;
}

private void OnStatChanged(string statName, float newValue)
{
    switch (statName)
    {
        case "max_health":
            _healthBar.MaxValue = newValue;
            break;
        case "speed":
            _movementComponent.Speed = newValue;
            break;
    }
}
```

> **Tip:** To remove a buff when an ability expires, call `stat_set.remove_modifier(stat_name, source)` from the `Effect.on_expire()` override (see `EffectHolder` in the parent skill). Calling `remove_all_from_source(source)` at expiry is safer when an ability touches multiple stats at once.

---

## Implementation Checklist

- [ ] `StatModifier` Resource created with `stat_name`, `operation`, `value`, `source`
- [ ] `StatSet` Resource added to caster entity; base values exported and set in the Inspector
- [ ] `add_modifier` called on ability `activate()`; `remove_modifier` or `remove_all_from_source` called on effect expiry
- [ ] Compute order confirmed: ADD → MULTIPLY → OVERRIDE → clamp
- [ ] `clamp_limits` configured for stats with hard caps (e.g. health 0–max, speed 0–1000)
- [ ] `stat_changed` signal connected to relevant HUD nodes and movement components
- [ ] Re-applying from the same source refreshes, not stacks (verified by checking modifier count stays at 1)
