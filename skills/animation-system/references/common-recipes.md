# Common Animation Recipes

Reference for `skills/animation-system/SKILL.md` — gameplay-flavored animation recipes.

> ← Back to [SKILL.md](../SKILL.md)

---

## Hit Flash (Modulate Tween)

```gdscript
@onready var _sprite: Sprite2D = $Sprite2D

func flash_hit() -> void:
    var tween := create_tween()
    tween.tween_property(_sprite, "modulate", Color(3.0, 3.0, 3.0, 1.0), 0.05)
    tween.tween_property(_sprite, "modulate", Color.WHITE, 0.1)
```

```csharp
public void FlashHit()
{
    var tween = CreateTween();
    tween.TweenProperty(_sprite, "modulate", new Color(3f, 3f, 3f, 1f), 0.05);
    tween.TweenProperty(_sprite, "modulate", Colors.White, 0.1);
}
```

For a true white-out flash that overrides the sprite texture, use a `canvas_item` shader with a `flash_amount` uniform — see **shader-basics**.

## Attack Combo

Chain attacks within a buffer window. The Call Method track on each attack animation calls `open_combo_window()` near the end of the swing.

```gdscript
extends CharacterBody2D

@onready var anim_player: AnimationPlayer = $AnimationPlayer

var _combo_step: int = 0
var _combo_window: bool = false

func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("attack"):
        if _combo_step == 0:
            _combo_step = 1
            anim_player.play("attack_1")
        elif _combo_window:
            _combo_step += 1
            _combo_window = false
            if _combo_step <= 3:
                anim_player.play("attack_%d" % _combo_step)
            else:
                _reset_combo()

func open_combo_window() -> void:        # called by Call Method track
    _combo_window = true

func _reset_combo() -> void:
    _combo_step = 0
    _combo_window = false

func _on_animation_finished(anim_name: StringName) -> void:
    if anim_name.begins_with("attack"):
        _reset_combo()
        anim_player.play("idle")
```

```csharp
public partial class Player : CharacterBody2D
{
    private AnimationPlayer _animPlayer;
    private int _comboStep;
    private bool _comboWindow;

    public override void _Ready()
    {
        _animPlayer = GetNode<AnimationPlayer>("AnimationPlayer");
        _animPlayer.AnimationFinished += OnAnimationFinished;
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (!@event.IsActionPressed("attack"))
            return;

        if (_comboStep == 0)
        {
            _comboStep = 1;
            _animPlayer.Play("attack_1");
        }
        else if (_comboWindow)
        {
            _comboStep++;
            _comboWindow = false;
            if (_comboStep <= 3)
                _animPlayer.Play($"attack_{_comboStep}");
            else
                ResetCombo();
        }
    }

    // Called by the Call Method track. Must be public — the track resolves it by name.
    public void OpenComboWindow() => _comboWindow = true;

    private void ResetCombo()
    {
        _comboStep = 0;
        _comboWindow = false;
    }

    private void OnAnimationFinished(StringName animName)
    {
        if (animName.ToString().StartsWith("attack"))
        {
            ResetCombo();
            _animPlayer.Play("idle");
        }
    }
}
```
