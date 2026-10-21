# Sprite Frame Animation

Reference for `skills/animation-system/SKILL.md` — 2D sprite animation patterns: `AnimatedSprite2D` vs `AnimationPlayer + Sprite2D`.

> ← Back to [SKILL.md](../SKILL.md)

---

## AnimatedSprite2D vs AnimationPlayer + Sprite2D

| Approach                       | Pros                                          | Cons                                        |
|--------------------------------|-----------------------------------------------|---------------------------------------------|
| `AnimatedSprite2D`             | Quick setup, built-in SpriteFrames editor     | Frames only; no property tracks             |
| `AnimationPlayer` + `Sprite2D` | Full property animation, method calls, audio  | More setup, need to keyframe region/frame   |

**Use AnimatedSprite2D** for simple characters with only frame animations. **Use AnimationPlayer** when you also need to animate hitboxes, particles, sounds, or other properties in sync.

```gdscript
extends CharacterBody2D

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D

func _physics_process(delta: float) -> void:
    var input_dir := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")

    if input_dir != Vector2.ZERO:
        velocity = input_dir * 200.0
        sprite.play("walk")
        if input_dir.x != 0.0:
            sprite.flip_h = input_dir.x < 0.0
    else:
        velocity = Vector2.ZERO
        sprite.play("idle")

    move_and_slide()
```

```csharp
using Godot;

public partial class Character : CharacterBody2D
{
    private AnimatedSprite2D _sprite;

    public override void _Ready()
    {
        _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
    }

    public override void _PhysicsProcess(double delta)
    {
        Vector2 inputDir = Input.GetVector("ui_left", "ui_right", "ui_up", "ui_down");

        if (inputDir != Vector2.Zero)
        {
            Velocity = inputDir * 200.0f;
            _sprite.Play("walk");
            if (inputDir.X != 0.0f)
                _sprite.FlipH = inputDir.X < 0.0f;
        }
        else
        {
            Velocity = Vector2.Zero;
            _sprite.Play("idle");
        }

        MoveAndSlide();
    }
}
```
