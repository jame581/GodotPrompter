---
name: camera-system
description: Use when implementing cameras — smooth follow, screen shake, camera zones, and transitions for 2D and 3D
---

# Camera Systems in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **player-controller** for first-person camera setup, **state-machine** for camera state transitions, **godot-optimization** for camera culling and performance, **physics-system** for physics interpolation and camera smoothing, **2d-essentials** for canvas layers, parallax scrolling, and coordinate conversion, **math-essentials** for smoothstep and lerp-based interpolation, **tween-animation** for camera shake and cinematic transitions, **phantom-camera** for a Cinemachine-style camera addon.

---

## 1. Camera2D Basics

### Key Properties

| Property | Type | Description |
|---|---|---|
| `position_smoothing_enabled` | `bool` | Enables built-in position smoothing (lerp toward target) |
| `position_smoothing_speed` | `float` | Speed of built-in smoothing (default `5.0`) |
| `drag_horizontal_enabled` | `bool` | Enables a horizontal drag zone; camera only moves when target exits zone |
| `drag_vertical_enabled` | `bool` | Enables a vertical drag zone |
| `limit_left` | `int` | Left pixel boundary — camera will not scroll past this |
| `limit_right` | `int` | Right pixel boundary |
| `limit_top` | `int` | Top pixel boundary |
| `limit_bottom` | `int` | Bottom pixel boundary |
| `zoom` | `Vector2` | Zoom level; `Vector2(2, 2)` = 2× zoom in, `Vector2(0.5, 0.5)` = zoom out |

Set limits to match your tilemap or level bounds so the camera never shows outside the world. Limits are in world pixels, not tiles.

---

## 2. Smooth Follow

A manual follow camera gives more control than the built-in smoothing — you can add look-ahead, offset, and custom easing.

### GDScript

```gdscript
extends Camera2D

## Target node to follow (assign in Inspector or via code)
@export var target: Node2D

## How quickly the camera catches up to the target (higher = snappier)
@export var follow_speed: float = 8.0

## How far ahead the camera leads in the movement direction
@export var look_ahead_distance: float = 80.0

## How quickly the look-ahead offset responds to direction changes
@export var look_ahead_speed: float = 4.0

var _look_ahead_offset: Vector2 = Vector2.ZERO
var _previous_target_pos: Vector2 = Vector2.ZERO

func _ready() -> void:
    # Disable built-in smoothing — we handle it manually
    position_smoothing_enabled = false
    if target:
        _previous_target_pos = target.global_position
        global_position = target.global_position

func _process(delta: float) -> void:
    if not target:
        return

    # Compute movement direction from last frame
    var move_delta: Vector2 = target.global_position - _previous_target_pos
    _previous_target_pos = target.global_position

    # Smoothly steer look-ahead offset toward movement direction
    var desired_ahead: Vector2 = move_delta.normalized() * look_ahead_distance if move_delta.length() > 0.5 else Vector2.ZERO
    _look_ahead_offset = _look_ahead_offset.lerp(desired_ahead, look_ahead_speed * delta)

    # Lerp camera position toward target + look-ahead
    var desired_pos: Vector2 = target.global_position + _look_ahead_offset
    global_position = global_position.lerp(desired_pos, follow_speed * delta)
```

### C#

```csharp
using Godot;

public partial class SmoothFollowCamera : Camera2D
{
    [Export] public Node2D Target { get; set; }
    [Export] public float FollowSpeed { get; set; } = 8.0f;
    [Export] public float LookAheadDistance { get; set; } = 80.0f;
    [Export] public float LookAheadSpeed { get; set; } = 4.0f;

    private Vector2 _lookAheadOffset = Vector2.Zero;
    private Vector2 _previousTargetPos = Vector2.Zero;

    public override void _Ready()
    {
        PositionSmoothingEnabled = false;
        if (Target != null)
        {
            _previousTargetPos = Target.GlobalPosition;
            GlobalPosition = Target.GlobalPosition;
        }
    }

    public override void _Process(double delta)
    {
        if (Target == null)
            return;

        float dt = (float)delta;

        Vector2 moveDelta = Target.GlobalPosition - _previousTargetPos;
        _previousTargetPos = Target.GlobalPosition;

        Vector2 desiredAhead = moveDelta.Length() > 0.5f
            ? moveDelta.Normalized() * LookAheadDistance
            : Vector2.Zero;

        _lookAheadOffset = _lookAheadOffset.Lerp(desiredAhead, LookAheadSpeed * dt);

        Vector2 desiredPos = Target.GlobalPosition + _lookAheadOffset;
        GlobalPosition = GlobalPosition.Lerp(desiredPos, FollowSpeed * dt);
    }
}
```

---

## 3. Screen Shake

A trauma-based system produces more natural-looking shake than a simple sine wave. High trauma = violent shake; trauma decays over time; offset scales with `trauma^2` so small trauma values feel subtle.

### GDScript

```gdscript
extends Camera2D

## Maximum pixel offset during maximum trauma
@export var max_offset: Vector2 = Vector2(20.0, 15.0)

## Maximum rotation offset in degrees during maximum trauma
@export var max_roll: float = 3.0

## Rate at which trauma decays per second (0–1 range)
@export var decay_rate: float = 1.5

var _trauma: float = 0.0  # 0.0 = no shake, 1.0 = maximum shake

# Optional: use noise for smooth, organic shake
var _noise: FastNoiseLite
var _noise_time: float = 0.0
@export var use_noise: bool = true
@export var noise_speed: float = 60.0

func _ready() -> void:
    _noise = FastNoiseLite.new()
    _noise.noise_type = FastNoiseLite.TYPE_SIMPLEX
    _noise.seed = randi()

## Call this from any node to trigger a shake (amount in 0–1 range; can stack)
func add_trauma(amount: float) -> void:
    _trauma = minf(_trauma + amount, 1.0)

func _process(delta: float) -> void:
    if _trauma <= 0.0:
        offset = Vector2.ZERO
        rotation = 0.0
        return

    # Decay trauma over time
    _trauma = maxf(_trauma - decay_rate * delta, 0.0)
    _noise_time += delta * noise_speed

    var shake: float = _trauma * _trauma  # squaring gives subtle feel at low trauma

    if use_noise:
        offset.x = max_offset.x * shake * _noise.get_noise_2d(_noise_time, 0.0)
        offset.y = max_offset.y * shake * _noise.get_noise_2d(0.0, _noise_time)
        rotation = deg_to_rad(max_roll) * shake * _noise.get_noise_2d(_noise_time, _noise_time)
    else:
        offset.x = max_offset.x * shake * randf_range(-1.0, 1.0)
        offset.y = max_offset.y * shake * randf_range(-1.0, 1.0)
        rotation = deg_to_rad(max_roll) * shake * randf_range(-1.0, 1.0)
```

**Triggering shake from another node:**

```gdscript
# Any node that can reach the camera
func on_explosion() -> void:
    var cam := get_viewport().get_camera_2d() as ScreenShakeCamera
    if cam:
        cam.add_trauma(0.6)
```

### C#

```csharp
using Godot;

public partial class ScreenShakeCamera : Camera2D
{
    [Export] public Vector2 MaxOffset { get; set; } = new Vector2(20f, 15f);
    [Export] public float MaxRoll { get; set; } = 3.0f;
    [Export] public float DecayRate { get; set; } = 1.5f;
    [Export] public bool UseNoise { get; set; } = true;
    [Export] public float NoiseSpeed { get; set; } = 60.0f;

    private float _trauma = 0f;
    private float _noiseTime = 0f;
    private FastNoiseLite _noise;

    public override void _Ready()
    {
        _noise = new FastNoiseLite();
        _noise.NoiseType = FastNoiseLite.NoiseTypeEnum.Simplex;
        _noise.Seed = (int)GD.Randi();
    }

    public void AddTrauma(float amount)
    {
        _trauma = Mathf.Min(_trauma + amount, 1.0f);
    }

    public override void _Process(double delta)
    {
        if (_trauma <= 0f)
        {
            Offset = Vector2.Zero;
            Rotation = 0f;
            return;
        }

        float dt = (float)delta;
        _trauma = Mathf.Max(_trauma - DecayRate * dt, 0f);
        _noiseTime += dt * NoiseSpeed;

        float shake = _trauma * _trauma;

        if (UseNoise)
        {
            Offset = new Vector2(
                MaxOffset.X * shake * _noise.GetNoise2D(_noiseTime, 0f),
                MaxOffset.Y * shake * _noise.GetNoise2D(0f, _noiseTime)
            );
            Rotation = Mathf.DegToRad(MaxRoll) * shake * _noise.GetNoise2D(_noiseTime, _noiseTime);
        }
        else
        {
            Offset = new Vector2(
                MaxOffset.X * shake * (float)GD.RandRange(-1.0, 1.0),
                MaxOffset.Y * shake * (float)GD.RandRange(-1.0, 1.0)
            );
            Rotation = Mathf.DegToRad(MaxRoll) * shake * (float)GD.RandRange(-1.0, 1.0);
        }
    }
}
```

---

## 4. Camera Zones / Rooms

For room-based games (metroidvanias, top-down dungeons): an `Area2D` per room with a script that, on `body_entered`, tweens the active `Camera2D`'s `limit_left` / `limit_right` / `limit_top` / `limit_bottom` to the room's bounds. Smooth transitions when the player crosses room boundaries.

> See [references/camera-zones.md](references/camera-zones.md) for the full GDScript + C# CameraZone implementation.

---

## 5. Camera3D Patterns

Three canonical 3D camera setups: **third-person follow** with `SpringArm3D` (handles wall collision), **orbit camera** with mouse-drag rotation, **first-person** with mouse-look-from-camera.

> See [references/camera3d-patterns.md](references/camera3d-patterns.md) for full GDScript implementations of each pattern.

---

## 6. Camera Transitions

Async camera transitions via `Tween` + `await ToSignal`. The pattern: tween the next camera's position/zoom from the current camera's, then call `make_current()` on the next camera. Works for both 2D and 3D.

> See [references/transitions.md](references/transitions.md) for the full `CameraTransitionManager` implementation (2D and 3D).

---

## 7. Split Screen (Local Multiplayer)

Render multiple cameras to separate `SubViewport`s, then arrange `SubViewportContainer`s in a layout (`HBoxContainer`, `VBoxContainer`, or `GridContainer`). Each player's camera is set as `current` for its viewport.

> See [references/split-screen.md](references/split-screen.md) for the SubViewport scene-tree setup and a 2-player split-screen example.

---

## 8. Implementation Checklist

- [ ] `Camera2D` limits match level/tilemap bounds so no out-of-world edges are visible
- [ ] Smooth follow uses `_process` (visual interpolation), not `_physics_process`
- [ ] Screen shake resets `offset` and `rotation` to zero when `_trauma` reaches `0.0`
- [ ] `add_trauma()` clamps to `1.0`; it does not exceed maximum shake
- [ ] Camera zone `Area2D` collision layers are set so only the player triggers them
- [ ] `SpringArm3D` collision mask includes all environment layers for wall avoidance
- [ ] Camera transition awaits tween completion before calling `make_current()`
- [ ] Split screen `SubViewport` sizes are updated on window resize (`get_tree().root.size_changed` signal)
- [ ] Only one `SubViewport` has `audio_listener_enable_2d` or `audio_listener_enable_3d` set to `true`
