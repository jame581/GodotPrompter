# Input Buffering

Reference for `skills/input-handling/SKILL.md` — buffering discrete actions so they aren't lost between physics frames.

> ← Back to [SKILL.md](../SKILL.md)

---
## 3. Reading Input — Input Buffering

Buffer discrete actions so they aren't lost between physics frames.

```gdscript
var _jump_buffered: bool = false
var _jump_buffer_timer: float = 0.0
const JUMP_BUFFER_TIME: float = 0.1

func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("jump"):
        _jump_buffered = true
        _jump_buffer_timer = JUMP_BUFFER_TIME

func _physics_process(delta: float) -> void:
    if _jump_buffered:
        _jump_buffer_timer -= delta
        if _jump_buffer_timer <= 0.0:
            _jump_buffered = false

    if _jump_buffered and is_on_floor():
        velocity.y = JUMP_VELOCITY
        _jump_buffered = false
```

```csharp
private bool _jumpBuffered;
private float _jumpBufferTimer;
private const float JumpBufferTime = 0.1f;

public override void _UnhandledInput(InputEvent @event)
{
    if (@event.IsActionPressed("jump"))
    {
        _jumpBuffered = true;
        _jumpBufferTimer = JumpBufferTime;
    }
}

public override void _PhysicsProcess(double delta)
{
    if (_jumpBuffered)
    {
        _jumpBufferTimer -= (float)delta;
        if (_jumpBufferTimer <= 0f)
            _jumpBuffered = false;
    }

    if (_jumpBuffered && IsOnFloor())
    {
        Vector2 vel = Velocity;
        vel.Y = JumpVelocity;
        Velocity = vel;
        _jumpBuffered = false;
    }
}
```

---
