# Damage Numbers

Reference for `skills/hud-system/SKILL.md` — floating damage-number scene with rise-and-fade tween and a pooled spawner. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Damage Numbers

Damage numbers are short-lived `Label` nodes that float upward and fade out. Spawn one per damage event; release it after the tween completes. For high-frequency damage (e.g. rapid-fire weapons) a simple manual pool avoids per-hit allocation.

### GDScript — DamageNumber scene (single instance)

```gdscript
## damage_number.gd — attach to a Label; root of a small PackedScene
class_name DamageNumber
extends Label

## Pixels to travel upward during the animation.
@export var rise_distance: float = 40.0

## Duration (seconds) for the full rise-and-fade.
@export var lifetime: float = 0.7

## Optional: tint critical hits differently before spawning.
@export var critical_color: Color = Color(1.0, 0.3, 0.1)
@export var normal_color: Color   = Color(1.0, 1.0, 1.0)


func show_damage(amount: int, is_critical: bool = false) -> void:
    text           = str(amount) if not is_critical else "!" + str(amount)
    modulate.a     = 1.0
    add_theme_font_size_override("font_size", 24 if not is_critical else 32)
    modulate       = critical_color if is_critical else normal_color
    _play_animation()


func _play_animation() -> void:
    var tween := create_tween()
    tween.set_parallel(true)

    # Rise upward
    tween.tween_property(self, "position:y", position.y - rise_distance, lifetime) \
        .set_ease(Tween.EASE_OUT) \
        .set_trans(Tween.TRANS_QUAD)

    # Fade out (start fading at halfway point)
    tween.tween_property(self, "modulate:a", 0.0, lifetime * 0.5) \
        .set_delay(lifetime * 0.5) \
        .set_ease(Tween.EASE_IN)

    tween.finished.connect(queue_free)
```

### C# — DamageNumber scene (single instance)

```csharp
// DamageNumber.cs — attach to a Label; root of a small PackedScene
using Godot;

public partial class DamageNumber : Label
{
    [Export] public float RiseDistance { get; set; } = 40.0f;
    [Export] public float Lifetime { get; set; } = 0.7f;
    [Export] public Color CriticalColor { get; set; } = new(1.0f, 0.3f, 0.1f);
    [Export] public Color NormalColor { get; set; } = new(1.0f, 1.0f, 1.0f);

    public void ShowDamage(int amount, bool isCritical = false)
    {
        Text = isCritical ? $"!{amount}" : amount.ToString();
        Modulate = new Color(Modulate, 1.0f);
        AddThemeFontSizeOverride("font_size", isCritical ? 32 : 24);
        Modulate = isCritical ? CriticalColor : NormalColor;
        PlayAnimation();
    }

    private void PlayAnimation()
    {
        var tween = CreateTween();
        tween.SetParallel(true);

        // Rise upward
        tween.TweenProperty(this, "position:y", Position.Y - RiseDistance, Lifetime)
            .SetEase(Tween.EaseType.Out)
            .SetTrans(Tween.TransitionType.Quad);

        // Fade out (start fading at halfway point)
        tween.TweenProperty(this, "modulate:a", 0.0f, Lifetime * 0.5f)
            .SetDelay(Lifetime * 0.5f)
            .SetEase(Tween.EaseType.In);

        tween.Finished += QueueFree;
    }
}
```

### GDScript — Spawner (attach to the HUD or a DamageNumbersLayer Node2D)

```gdscript
## damage_number_spawner.gd
extends Node

@export var damage_number_scene: PackedScene

## Simple pool: pre-instantiate a fixed number and recycle them.
## For low-frequency damage, omit pooling and just instantiate directly.
const POOL_SIZE := 20
var _pool: Array[DamageNumber] = []
var _pool_index: int = 0


func _ready() -> void:
    for i in POOL_SIZE:
        var dn: DamageNumber = damage_number_scene.instantiate()
        dn.visible = false
        add_child(dn)
        _pool.append(dn)


## Call this from any node that receives damage events.
## `world_position` is the attacker or victim's global position in world space.
func spawn(world_position: Vector2, amount: int, is_critical: bool = false) -> void:
    # Convert world position to screen space so the label sits above the entity
    var screen_pos: Vector2 = get_viewport().get_canvas_transform() * world_position

    # Wraps around — if POOL_SIZE is too small, older labels get recycled mid-animation.
    var dn := _pool[_pool_index % POOL_SIZE]
    _pool_index += 1

    dn.position = screen_pos
    dn.visible  = true
    dn.show_damage(amount, is_critical)
```

### C# — Spawner (attach to the HUD or a DamageNumbersLayer Node2D)

```csharp
// DamageNumberSpawner.cs
using Godot;

public partial class DamageNumberSpawner : Node
{
    [Export] public PackedScene DamageNumberScene { get; set; }

    private const int PoolSize = 20;
    private readonly DamageNumber[] _pool = new DamageNumber[PoolSize];
    private int _poolIndex = 0;

    public override void _Ready()
    {
        for (int i = 0; i < PoolSize; i++)
        {
            var dn = DamageNumberScene.Instantiate<DamageNumber>();
            dn.Visible = false;
            AddChild(dn);
            _pool[i] = dn;
        }
    }

    /// <summary>
    /// Call from any node that receives damage events.
    /// <paramref name="worldPosition"/> is the attacker or victim's global position.
    /// </summary>
    public void Spawn(Vector2 worldPosition, int amount, bool isCritical = false)
    {
        var screenPos = GetViewport().GetCanvasTransform() * worldPosition;

        var dn = _pool[_poolIndex % PoolSize];
        _poolIndex++;

        dn.Position = screenPos;
        dn.Visible = true;
        dn.ShowDamage(amount, isCritical);
    }
}
```

**Connecting to a damage event (GDScript):**

```gdscript
# In the HUD root or the DamageNumberSpawner's _ready:
EventBus.damage_dealt.connect(func(pos: Vector2, amount: int, crit: bool) -> void:
    $DamageNumbersLayer/DamageNumberSpawner.spawn(pos, amount, crit)
)
```

**Connecting to a damage event (C#):**

```csharp
// In the HUD root or the DamageNumberSpawner's _Ready:
EventBus.Instance.DamageDealt += (Vector2 pos, int amount, bool crit) =>
{
    GetNode<DamageNumberSpawner>("DamageNumbersLayer/DamageNumberSpawner")
        .Spawn(pos, amount, crit);
};
```

**Pool notes:** The simple modular pool above recycles labels before they finish animating if POOL_SIZE is too small. Increase the pool size or skip pooling entirely for games with infrequent hits. A more robust pool tracks which instances are free using a `free_list` array.

---

