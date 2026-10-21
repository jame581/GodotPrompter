# HUD Binding for Cooldowns, Resource Bars, and Effect Icons

Connect `AbilityComponent` and `EffectHolder` signals to HUD widgets — no per-frame polling.

> **Related skills:** **hud-system** for HUD architecture and resource-bar patterns, **godot-ui** for Control-tree layout and theming.

---

## 1. Signal contract

| Signal | Source | Payload |
|---|---|---|
| `ability_activated(ability)` | `AbilityComponent` | `Ability` resource |
| `cooldown_started(ability, duration)` | `AbilityComponent` | `Ability`, `float` |
| `cooldown_finished(ability)` | `AbilityComponent` | `Ability` resource |
| `effect_applied(effect)` | `EffectHolder` | `Effect` resource |
| `effect_expired(effect)` | `EffectHolder` | `Effect` resource |

**Rule:** Bind the HUD to these signals via a dedicated `init(player)` call (see §5), not directly in `_ready` — the HUD may be instantiated before the player exists (loading screens, scene transitions). Never read `_cooldowns` or `_active` directly from the HUD.

---

## 2. Cooldown sweep with TextureProgressBar

Use a `TextureProgressBar` in radial mode to display remaining cooldown as a sweep overlay. On `cooldown_started` record the total duration and start a per-frame lerp; on `cooldown_finished` snap to zero and hide the overlay.

### GDScript

```gdscript
# ability_icon.gd — one per ability slot in the HUD
class_name AbilityIcon
extends TextureRect

@export var ability_name: String

@onready var cooldown_sweep: TextureProgressBar = $CooldownSweep
@onready var charge_count: Label = $ChargeCount

var _cooldown_total: float = 0.0
var _cooldown_remaining: float = 0.0
var _on_cooldown: bool = false

func bind(ability_component: AbilityComponent) -> void:
    # `value` is driven as a 0..1 fraction, so the bar's range must be 0..1
    # (TextureProgressBar defaults to 0..100 — otherwise the sweep looks empty).
    cooldown_sweep.min_value = 0.0
    cooldown_sweep.max_value = 1.0
    ability_component.cooldown_started.connect(_on_cooldown_started)
    ability_component.cooldown_finished.connect(_on_cooldown_finished)
    ability_component.ability_activated.connect(_on_ability_activated)

func _on_cooldown_started(ability: Ability, duration: float) -> void:
    if ability.ability_name != ability_name:
        return
    _cooldown_total = duration
    _cooldown_remaining = duration
    _on_cooldown = true
    cooldown_sweep.value = 1.0
    cooldown_sweep.show()

func _on_cooldown_finished(ability: Ability) -> void:
    if ability.ability_name != ability_name:
        return
    _on_cooldown = false
    cooldown_sweep.value = 0.0
    cooldown_sweep.hide()

func _on_ability_activated(ability: Ability) -> void:
    if ability.ability_name != ability_name:
        return
    # Flash or animate the icon on activation (optional).

func _process(delta: float) -> void:
    if not _on_cooldown:
        return
    _cooldown_remaining = maxf(0.0, _cooldown_remaining - delta)
    # value = 1 when on full cooldown, 0 when ready.
    cooldown_sweep.value = _cooldown_remaining / _cooldown_total if _cooldown_total > 0.0 else 0.0
```

**Scene tree for one ability slot:**
```
AbilityIcon (TextureRect)
├── CooldownSweep (TextureProgressBar)   ← radial mode, fill texture = dark tint
└── ChargeCount (Label)                  ← hidden unless ability has charges
```

Configure `TextureProgressBar`:
- `min_value` = 0, `max_value` = 1 (the code drives `value` as a 0..1 fraction; set in `bind()`/`_Ready()` above so it works regardless of Inspector defaults)
- `fill_mode` = `FILL_CLOCKWISE` (radial sweep)
- `nine_patch_stretch` = off
- modulate alpha ~0.65 for the tint overlay

### C#

```csharp
// AbilityIcon.cs
using Godot;

public partial class AbilityIcon : TextureRect
{
    [Export] public string AbilityName { get; set; } = "";

    private TextureProgressBar _cooldownSweep = null!;
    private Label _chargeCount = null!;

    private float _cooldownTotal;
    private float _cooldownRemaining;
    private bool _onCooldown;

    public override void _Ready()
    {
        _cooldownSweep = GetNode<TextureProgressBar>("CooldownSweep");
        _chargeCount = GetNode<Label>("ChargeCount");
        // Value is driven as a 0..1 fraction, so the bar's range must be 0..1
        // (TextureProgressBar defaults to 0..100 — otherwise the sweep looks empty).
        _cooldownSweep.MinValue = 0.0;
        _cooldownSweep.MaxValue = 1.0;
    }

    public void Bind(AbilityComponent component)
    {
        component.CooldownStarted += OnCooldownStarted;
        component.CooldownFinished += OnCooldownFinished;
        component.AbilityActivated += OnAbilityActivated;
    }

    private void OnCooldownStarted(Ability ability, float duration)
    {
        if (ability.AbilityName != AbilityName) return;
        _cooldownTotal = duration;
        _cooldownRemaining = duration;
        _onCooldown = true;
        _cooldownSweep.Value = 1.0;
        _cooldownSweep.Show();
    }

    private void OnCooldownFinished(Ability ability)
    {
        if (ability.AbilityName != AbilityName) return;
        _onCooldown = false;
        _cooldownSweep.Value = 0.0;
        _cooldownSweep.Hide();
    }

    private void OnAbilityActivated(Ability ability)
    {
        if (ability.AbilityName != AbilityName) return;
        // Optional: flash animation on activation.
    }

    public override void _Process(double delta)
    {
        if (!_onCooldown) return;
        _cooldownRemaining = Mathf.Max(0f, _cooldownRemaining - (float)delta);
        _cooldownSweep.Value = _cooldownTotal > 0f
            ? _cooldownRemaining / _cooldownTotal
            : 0.0;
    }
}
```

---

## 3. Charge pips

Abilities with a maximum charge count (e.g. up to 3 uses before a longer recharge) can display pips — small icons that fill/empty as charges are spent and recovered.

```gdscript
# charge_pips.gd
class_name ChargePips
extends HBoxContainer

@export var max_charges: int = 3
@export var filled_color: Color = Color.WHITE
@export var empty_color: Color = Color(1, 1, 1, 0.3)

var _pips: Array[ColorRect] = []
var _current_charges: int

func _ready() -> void:
    _current_charges = max_charges
    for i in max_charges:
        var pip := ColorRect.new()
        pip.custom_minimum_size = Vector2(12, 12)
        pip.color = filled_color
        add_child(pip)
        _pips.append(pip)

func set_charges(count: int) -> void:
    _current_charges = clampi(count, 0, max_charges)
    for i in _pips.size():
        _pips[i].color = filled_color if i < _current_charges else empty_color

# Call set_charges() from AbilityComponent signals or from game logic
# that tracks how many charges remain.
```

```csharp
// ChargePips.cs
using Godot;
using System.Collections.Generic;

public partial class ChargePips : HBoxContainer
{
    [Export] public int MaxCharges { get; set; } = 3;
    [Export] public Color FilledColor { get; set; } = Colors.White;
    [Export] public Color EmptyColor { get; set; } = new Color(1, 1, 1, 0.3f);

    private readonly List<ColorRect> _pips = new();
    private int _currentCharges;

    public override void _Ready()
    {
        for (int i = 0; i < MaxCharges; i++)
        {
            var pip = new ColorRect
            {
                CustomMinimumSize = new Vector2(12, 12),
                Color = FilledColor
            };
            AddChild(pip);
            _pips.Add(pip);
        }
    }

    public void SetCharges(int count)
    {
        _currentCharges = Mathf.Clamp(count, 0, MaxCharges);
        for (int i = 0; i < _pips.Count; i++)
            _pips[i].Color = i < _currentCharges ? FilledColor : EmptyColor;
    }
}
```

---

## 4. Buff/debuff icon row

Listen to `effect_applied` and `effect_expired` from `EffectHolder` to add/remove icons. Each icon can show a countdown label driven from `_process` while the effect is active.

### GDScript

```gdscript
# effect_icon_row.gd
class_name EffectIconRow
extends HBoxContainer

# Preloaded per-effect scene: TextureRect + Label for remaining time.
@export var effect_icon_scene: PackedScene

var _icon_map: Dictionary = {}  # Effect -> Control node

func bind(effect_holder: EffectHolder) -> void:
    effect_holder.effect_applied.connect(_on_effect_applied)
    effect_holder.effect_expired.connect(_on_effect_expired)

func _on_effect_applied(effect: Effect) -> void:
    if _icon_map.has(effect):
        return
    var icon: Control = effect_icon_scene.instantiate()
    icon.name = effect.effect_name
    # Set texture from effect data if your Effect Resource carries one.
    add_child(icon)
    _icon_map[effect] = icon

func _on_effect_expired(effect: Effect) -> void:
    if not _icon_map.has(effect):
        return
    _icon_map[effect].queue_free()
    _icon_map.erase(effect)
```

### C#

```csharp
// EffectIconRow.cs
using Godot;
using System.Collections.Generic;

public partial class EffectIconRow : HBoxContainer
{
    [Export] public PackedScene EffectIconScene { get; set; } = null!;

    private readonly Dictionary<Effect, Control> _iconMap = new();

    public void Bind(EffectHolder effectHolder)
    {
        effectHolder.EffectApplied += OnEffectApplied;
        effectHolder.EffectExpired += OnEffectExpired;
    }

    private void OnEffectApplied(Effect effect)
    {
        if (_iconMap.ContainsKey(effect)) return;
        var icon = EffectIconScene.Instantiate<Control>();
        icon.Name = effect.EffectName;
        AddChild(icon);
        _iconMap[effect] = icon;
    }

    private void OnEffectExpired(Effect effect)
    {
        if (!_iconMap.TryGetValue(effect, out var icon)) return;
        icon.QueueFree();
        _iconMap.Remove(effect);
    }
}
```

---

## 5. Wiring it up in the HUD

```gdscript
# hud.gd
extends CanvasLayer

@onready var fireball_icon: AbilityIcon = $AbilityBar/FireballIcon
@onready var effect_row: EffectIconRow = $EffectRow

func init(player: Node) -> void:
    var ability_comp: AbilityComponent = player.get_node("AbilityComponent")
    var effect_holder: EffectHolder = player.get_node("EffectHolder")

    fireball_icon.bind(ability_comp)
    effect_row.bind(effect_holder)
```

```csharp
// Hud.cs
using Godot;

public partial class Hud : CanvasLayer
{
    private AbilityIcon _fireballIcon = null!;
    private EffectIconRow _effectRow = null!;

    public override void _Ready()
    {
        _fireballIcon = GetNode<AbilityIcon>("AbilityBar/FireballIcon");
        _effectRow = GetNode<EffectIconRow>("EffectRow");
    }

    public void Init(Node player)
    {
        var abilityComp = player.GetNode<AbilityComponent>("AbilityComponent");
        var effectHolder = player.GetNode<EffectHolder>("EffectHolder");

        _fireballIcon.Bind(abilityComp);
        _effectRow.Bind(effectHolder);
    }
}
```

> **Footgun:** Connect HUD signals in a dedicated `init(player)` call rather than directly in `_ready`, so the HUD can be instantiated before the player node exists (e.g., loading screens, scene transitions).
