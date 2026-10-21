> ← Back to [SKILL.md](../SKILL.md)

# Common Movement Recipes

Two recipes that come up in almost every platformer: **Dash** (timer-based velocity override for a short burst, limited by a cooldown and one dash per airtime — without a limit it can be chained forever) and **Wall Jump** (vertical wall slide + bounce off `get_wall_normal()` / `GetWallNormal()` when jump is pressed). Both apply to a `CharacterBody2D` and slot into the standard `_physics_process` loop alongside gravity and horizontal movement.

---

## Dash (GDScript)

```gdscript
extends CharacterBody2D

@export var dash_speed: float = 600.0
@export var dash_duration: float = 0.2
@export var dash_cooldown: float = 0.5

var _dash_timer: float = 0.0      # > 0 while dashing
var _cooldown_timer: float = 0.0  # > 0 while the dash is unavailable
var _can_air_dash: bool = true    # one dash per airtime; landing refills it
var _dash_direction: Vector2 = Vector2.ZERO
var _facing: float = 1.0

func _physics_process(delta: float) -> void:
    _cooldown_timer = maxf(_cooldown_timer - delta, 0.0)
    if is_on_floor():
        _can_air_dash = true

    var input_dir: Vector2 = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
    if input_dir.x != 0.0:
        _facing = signf(input_dir.x)

    # is_on_floor() here never decides the branch on its own: landing already set
    # _can_air_dash true, so this reads as "can dash" — kept for readability.
    if Input.is_action_just_pressed("dash") and _cooldown_timer <= 0.0 \
            and (is_on_floor() or _can_air_dash):
        _dash_timer = dash_duration
        _cooldown_timer = dash_duration + dash_cooldown  # cooldown starts when the dash ends
        if not is_on_floor():
            _can_air_dash = false
        # Dash along the input, or forward when there is none
        _dash_direction = input_dir.normalized() if input_dir != Vector2.ZERO else Vector2(_facing, 0.0)

    if _dash_timer > 0.0:
        _dash_timer -= delta
        velocity = _dash_direction * dash_speed  # overrides gravity for the dash only
    else:
        if not is_on_floor():
            velocity += get_gravity() * delta
        # ... your normal horizontal movement ...

    move_and_slide()
```

## Dash (C#)

```csharp
using Godot;

public partial class Player : CharacterBody2D
{
    [Export] public float DashSpeed { get; set; } = 600.0f;
    [Export] public float DashDuration { get; set; } = 0.2f;
    [Export] public float DashCooldown { get; set; } = 0.5f;

    private float _dashTimer;          // > 0 while dashing
    private float _cooldownTimer;      // > 0 while the dash is unavailable
    private bool _canAirDash = true;   // one dash per airtime; landing refills it
    private Vector2 _dashDirection;
    private float _facing = 1.0f;

    public override void _PhysicsProcess(double delta)
    {
        float dt = (float)delta;
        _cooldownTimer = Mathf.Max(_cooldownTimer - dt, 0.0f);
        if (IsOnFloor())
            _canAirDash = true;

        Vector2 inputDir = Input.GetVector("ui_left", "ui_right", "ui_up", "ui_down");
        if (inputDir.X != 0.0f)
            _facing = Mathf.Sign(inputDir.X);

        // IsOnFloor() here never decides the branch on its own: landing already set
        // _canAirDash true, so this reads as "can dash" — kept for readability.
        if (Input.IsActionJustPressed("dash") && _cooldownTimer <= 0.0f
            && (IsOnFloor() || _canAirDash))
        {
            _dashTimer = DashDuration;
            _cooldownTimer = DashDuration + DashCooldown; // cooldown starts when the dash ends
            if (!IsOnFloor())
                _canAirDash = false;
            // Dash along the input, or forward when there is none
            _dashDirection = inputDir != Vector2.Zero ? inputDir.Normalized() : new Vector2(_facing, 0.0f);
        }

        Vector2 velocity = Velocity;
        if (_dashTimer > 0.0f)
        {
            _dashTimer -= dt;
            velocity = _dashDirection * DashSpeed; // overrides gravity for the dash only
        }
        else
        {
            if (!IsOnFloor())
                velocity += GetGravity() * dt;
            // ... your normal horizontal movement ...
        }

        Velocity = velocity;
        MoveAndSlide();
    }
}
```

---

## Wall Jump (GDScript)

```gdscript
extends CharacterBody2D

@export var speed: float = 200.0
@export var jump_velocity: float = -400.0
@export var wall_jump_velocity: Vector2 = Vector2(250.0, -350.0)

var _gravity: float = ProjectSettings.get_setting("physics/2d/default_gravity")

func _physics_process(delta: float) -> void:
    if not is_on_floor():
        velocity.y += _gravity * delta

    # Wall jump: bounce off in the direction of the wall normal
    if Input.is_action_just_pressed("ui_accept"):
        if is_on_floor():
            velocity.y = jump_velocity
        elif is_on_wall():
            var wall_normal: Vector2 = get_wall_normal()
            velocity = wall_normal * wall_jump_velocity.x + Vector2(0, wall_jump_velocity.y)

    var input_x: float = Input.get_axis("ui_left", "ui_right")
    velocity.x = move_toward(velocity.x, input_x * speed, 1000.0 * delta)

    move_and_slide()
```

## Wall Jump (C#)

```csharp
using Godot;

public partial class WallJumpPlayer : CharacterBody2D
{
    [Export] public float Speed = 200f;
    [Export] public float JumpVelocity = -400f;
    [Export] public Vector2 WallJumpVelocity = new(250f, -350f);

    private float _gravity = (float)ProjectSettings.GetSetting("physics/2d/default_gravity");

    public override void _PhysicsProcess(double delta)
    {
        var velocity = Velocity;

        if (!IsOnFloor())
            velocity.Y += _gravity * (float)delta;

        // Wall jump: bounce off in the direction of the wall normal
        if (Input.IsActionJustPressed("ui_accept"))
        {
            if (IsOnFloor())
            {
                velocity.Y = JumpVelocity;
            }
            else if (IsOnWall())
            {
                var wallNormal = GetWallNormal();
                velocity = wallNormal * WallJumpVelocity.X + new Vector2(0, WallJumpVelocity.Y);
            }
        }

        var inputX = Input.GetAxis("ui_left", "ui_right");
        velocity.X = Mathf.MoveToward(velocity.X, inputX * Speed, 1000f * (float)delta);

        Velocity = velocity;
        MoveAndSlide();
    }
}
```
