---
name: player-controller
description: Use when implementing player movement — CharacterBody2D/3D patterns, input handling, physics, common movement recipes
---

# Player Controllers in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **physics-system** for RigidBody, Area, raycasting, and collision shapes, **2d-essentials** for TileMaps, parallax, and 2D lighting, **3d-essentials** for CharacterBody3D and 3D movement setup, **state-machine** for movement state management, **camera-system** for camera follow and shake, **component-system** for hitbox/hurtbox integration, **animation-system** for animation driven by movement state, **input-handling** for InputMap actions and controller support, **ai-navigation** for enemy movement and pathfinding.

---

## 1. Core Concepts

### CharacterBody vs RigidBody

| Body Type         | Use For                        | Physics Control | Notes                                                   |
|-------------------|--------------------------------|-----------------|----------------------------------------------------------|
| `CharacterBody2D/3D` | Player, enemies, NPCs       | Manual (full)   | You control velocity; `move_and_slide()` handles collisions |
| `RigidBody2D/3D`  | Projectiles, props, debris     | Engine-driven   | Physics engine applies forces; harder to control precisely  |
| `RigidBody2D/3D`  | Projectiles with bouncing      | Engine-driven   | Set `linear_velocity` once; let physics resolve bounces  |
| `CharacterBody2D` | Platformers, top-down, FPS    | Manual (full)   | Reliable and predictable; best for responsive game feel  |

**Rule of thumb:** Use `CharacterBody` when you need tight, responsive control. Use `RigidBody` when you want realistic physics simulation.

### The Movement Loop

Every physics frame follows this order:

```
1. Read input          → get axis/action values
2. Apply forces        → gravity, friction, acceleration
3. Modify velocity     → move_toward, lerp, clamp
4. move_and_slide()    → engine resolves collisions, updates position
5. Post-movement state → check is_on_floor(), is_on_wall(), landing events
```

Always put this loop in `_physics_process(delta)`, never `_process(delta)`.

---

## 2. 2D Top-Down Controller

### GDScript

```gdscript
extends CharacterBody2D

@export var speed: float = 200.0
@export var acceleration: float = 1500.0
@export var friction: float = 1200.0

func _physics_process(delta: float) -> void:
    # 1. Read input (normalized 4-directional vector)
    var input_dir: Vector2 = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")

    # 2 & 3. Apply acceleration or friction to velocity
    if input_dir != Vector2.ZERO:
        velocity = velocity.move_toward(input_dir * speed, acceleration * delta)
    else:
        velocity = velocity.move_toward(Vector2.ZERO, friction * delta)

    # 4. Move and resolve collisions
    move_and_slide()
```

### C#

```csharp
using Godot;

public partial class TopDownPlayer : CharacterBody2D
{
    [Export] public float Speed { get; set; } = 200.0f;
    [Export] public float Acceleration { get; set; } = 1500.0f;
    [Export] public float Friction { get; set; } = 1200.0f;

    public override void _PhysicsProcess(double delta)
    {
        // 1. Read input (normalized 4-directional vector)
        Vector2 inputDir = Input.GetVector("ui_left", "ui_right", "ui_up", "ui_down");

        // 2 & 3. Apply acceleration or friction
        if (inputDir != Vector2.Zero)
            Velocity = Velocity.MoveToward(inputDir * Speed, Acceleration * (float)delta);
        else
            Velocity = Velocity.MoveToward(Vector2.Zero, Friction * (float)delta);

        // 4. Move and resolve collisions
        MoveAndSlide();
    }
}
```

---

## 3. 2D Platformer Controller

### GDScript

```gdscript
extends CharacterBody2D

@export var speed: float = 200.0
@export var jump_velocity: float = -400.0
@export var acceleration: float = 1200.0
@export var deceleration: float = 900.0

# Coyote time and jump buffer
@export var coyote_time: float = 0.12
@export var jump_buffer_time: float = 0.12

var _gravity: float = ProjectSettings.get_setting("physics/2d/default_gravity")
var _coyote_timer: float = 0.0
var _jump_buffer_timer: float = 0.0
var _was_on_floor: bool = false

func _physics_process(delta: float) -> void:
    # Coyote time: allow jump briefly after walking off a ledge
    if is_on_floor():
        _coyote_timer = coyote_time
        _was_on_floor = true
    else:
        _coyote_timer -= delta

    # Jump buffer: register jump input before landing
    if Input.is_action_just_pressed("ui_accept"):
        _jump_buffer_timer = jump_buffer_time
    else:
        _jump_buffer_timer -= delta

    # Apply gravity when airborne
    if not is_on_floor():
        velocity.y += _gravity * delta

    # Jump: consume coyote time and buffer together
    var can_jump: bool = _coyote_timer > 0.0
    if _jump_buffer_timer > 0.0 and can_jump:
        velocity.y = jump_velocity
        _coyote_timer = 0.0
        _jump_buffer_timer = 0.0

    # Variable jump height: cut velocity when button released early
    if Input.is_action_just_released("ui_accept") and velocity.y < 0.0:
        velocity.y *= 0.5

    # Horizontal movement with deceleration
    var input_x: float = Input.get_axis("ui_left", "ui_right")
    if input_x != 0.0:
        velocity.x = move_toward(velocity.x, input_x * speed, acceleration * delta)
    else:
        velocity.x = move_toward(velocity.x, 0.0, deceleration * delta)

    move_and_slide()
```

### C#

```csharp
using Godot;

public partial class PlatformerPlayer : CharacterBody2D
{
    [Export] public float Speed { get; set; } = 200.0f;
    [Export] public float JumpVelocity { get; set; } = -400.0f;
    [Export] public float Acceleration { get; set; } = 1200.0f;
    [Export] public float Deceleration { get; set; } = 900.0f;
    [Export] public float CoyoteTime { get; set; } = 0.12f;
    [Export] public float JumpBufferTime { get; set; } = 0.12f;

    private float _gravity = ProjectSettings.GetSetting("physics/2d/default_gravity").AsSingle();
    private float _coyoteTimer;
    private float _jumpBufferTimer;

    public override void _PhysicsProcess(double delta)
    {
        float dt = (float)delta;

        // Coyote time
        if (IsOnFloor())
            _coyoteTimer = CoyoteTime;
        else
            _coyoteTimer -= dt;

        // Jump buffer
        if (Input.IsActionJustPressed("ui_accept"))
            _jumpBufferTimer = JumpBufferTime;
        else
            _jumpBufferTimer -= dt;

        // Gravity
        if (!IsOnFloor())
        {
            Vector2 vel = Velocity;
            vel.Y += _gravity * dt;
            Velocity = vel;
        }

        // Jump
        if (_jumpBufferTimer > 0f && _coyoteTimer > 0f)
        {
            Vector2 vel = Velocity;
            vel.Y = JumpVelocity;
            Velocity = vel;
            _coyoteTimer = 0f;
            _jumpBufferTimer = 0f;
        }

        // Variable jump height
        if (Input.IsActionJustReleased("ui_accept") && Velocity.Y < 0f)
        {
            Vector2 vel = Velocity;
            vel.Y *= 0.5f;
            Velocity = vel;
        }

        // Horizontal movement
        float inputX = Input.GetAxis("ui_left", "ui_right");
        Vector2 velocity = Velocity;
        if (inputX != 0f)
            velocity.X = Mathf.MoveToward(velocity.X, inputX * Speed, Acceleration * dt);
        else
            velocity.X = Mathf.MoveToward(velocity.X, 0f, Deceleration * dt);

        Velocity = velocity;
        MoveAndSlide();
    }
}
```

---

## 4. 3D First-Person Controller

### GDScript

```gdscript
extends CharacterBody3D

@export var move_speed: float = 5.0
@export var jump_velocity: float = 5.0
@export var mouse_sensitivity: float = 0.002

@onready var head: Node3D = $Head  # Child Node3D that holds Camera3D

var _gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")

func _ready() -> void:
    Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
        # Horizontal look: rotate the body (yaw)
        rotate_y(-event.relative.x * mouse_sensitivity)
        # Vertical look: rotate the head (pitch), clamped to ±90°
        head.rotate_x(-event.relative.y * mouse_sensitivity)
        head.rotation.x = clamp(head.rotation.x, -PI / 2.0, PI / 2.0)

    if event.is_action_pressed("ui_cancel"):
        Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

func _physics_process(delta: float) -> void:
    # Gravity
    if not is_on_floor():
        velocity.y -= _gravity * delta

    # Jump
    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = jump_velocity

    # Movement relative to the direction the player is facing
    var input_dir: Vector2 = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
    var direction: Vector3 = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

    if direction != Vector3.ZERO:
        velocity.x = direction.x * move_speed
        velocity.z = direction.z * move_speed
    else:
        velocity.x = move_toward(velocity.x, 0.0, move_speed)
        velocity.z = move_toward(velocity.z, 0.0, move_speed)

    move_and_slide()
```

### C#

```csharp
using Godot;

public partial class FPSController : CharacterBody3D
{
    [Export] public float MoveSpeed { get; set; } = 5.0f;
    [Export] public float JumpVelocity { get; set; } = 5.0f;
    [Export] public float MouseSensitivity { get; set; } = 0.002f;

    private float _gravity = ProjectSettings.GetSetting("physics/3d/default_gravity").AsSingle();
    private Node3D _head;

    public override void _Ready()
    {
        _head = GetNode<Node3D>("Head");
        Input.MouseMode = Input.MouseModeEnum.Captured;
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event is InputEventMouseMotion motion
            && Input.MouseMode == Input.MouseModeEnum.Captured)
        {
            // Horizontal look (yaw on body)
            RotateY(-motion.Relative.X * MouseSensitivity);
            // Vertical look (pitch on head), clamped to ±90°
            _head.RotateX(-motion.Relative.Y * MouseSensitivity);
            Vector3 rot = _head.Rotation;
            rot.X = Mathf.Clamp(rot.X, -Mathf.Pi / 2f, Mathf.Pi / 2f);
            _head.Rotation = rot;
        }

        if (@event.IsActionPressed("ui_cancel"))
            Input.MouseMode = Input.MouseModeEnum.Visible;
    }

    public override void _PhysicsProcess(double delta)
    {
        float dt = (float)delta;
        Vector3 vel = Velocity;

        // Gravity
        if (!IsOnFloor())
            vel.Y -= _gravity * dt;

        // Jump
        if (Input.IsActionJustPressed("ui_accept") && IsOnFloor())
            vel.Y = JumpVelocity;

        // Movement relative to facing direction
        Vector2 inputDir = Input.GetVector("ui_left", "ui_right", "ui_up", "ui_down");
        Vector3 direction = (Transform.Basis * new Vector3(inputDir.X, 0, inputDir.Y)).Normalized();

        if (direction != Vector3.Zero)
        {
            vel.X = direction.X * MoveSpeed;
            vel.Z = direction.Z * MoveSpeed;
        }
        else
        {
            vel.X = Mathf.MoveToward(vel.X, 0f, MoveSpeed);
            vel.Z = Mathf.MoveToward(vel.Z, 0f, MoveSpeed);
        }

        Velocity = vel;
        MoveAndSlide();
    }
}
```

---

## 5. Common Movement Recipes

Beyond the basic locomotion patterns above, two recipes come up so often that they deserve their own block: **Dash** (timer-based velocity override for a short burst, with a cooldown and one dash per airtime) and **Wall Jump** (vertical wall slide + bounce off `GetWallNormal()` when jump is pressed). Both apply to a `CharacterBody2D` and slot into the standard `_physics_process` loop alongside gravity and horizontal movement.

See [references/common-movement-recipes.md](references/common-movement-recipes.md) for full GDScript and C# implementations of both recipes.

---

## 6. Common Pitfalls

| Symptom                        | Cause                                        | Fix                                                              |
|-------------------------------|----------------------------------------------|------------------------------------------------------------------|
| Player sticks to walls        | Default wall blocking behavior               | Set `floor_block_on_wall = false` on the CharacterBody           |
| Jittery or frame-rate-dependent movement | Movement in `_process`              | Move all physics/velocity code to `_physics_process(delta)`      |
| Inconsistent jump height      | Fixed velocity ignores frame timing          | Use variable jump (cut `velocity.y` on button release)           |
| Player slides down slopes     | No snap or angle limits                      | Set `floor_snap_length` > 0 and tune `floor_max_angle`           |
| Mouse look inverted           | Wrong sign on rotation delta                 | Negate `event.relative.x` for yaw and/or `event.relative.y` for pitch |

---

## 7. Implementation Checklist

- [ ] All movement logic is inside `_physics_process(delta)`, not `_process`
- [ ] Input action names match exactly what is defined in **Project > Project Settings > Input Map**
- [ ] Gravity value is read from `ProjectSettings` (`physics/2d/default_gravity` or `physics/3d/default_gravity`), not hard-coded
- [ ] `move_and_slide()` is called after all velocity modifications each frame
- [ ] Platformers implement coyote time and jump buffering for responsive feel
- [ ] FPS controllers capture mouse in `_ready()` and release on escape
- [ ] Variable jump height is handled via early-release velocity reduction
