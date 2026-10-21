# Common Game Math Recipes

Reference for `skills/math-essentials/SKILL.md` — look-at target (2D), orbit around a point, sine-wave bob (floating), angle wrapping, clamped approach with deadzone.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Common Game Math Recipes

### Look At Target (2D)

```gdscript
# Instant look-at
rotation = global_position.angle_to_point(target.global_position)

# Smooth rotation toward target
var target_angle: float = global_position.angle_to_point(target.global_position)
rotation = lerp_angle(rotation, target_angle, 10.0 * delta)
```

```csharp
Rotation = GlobalPosition.AngleToPoint(target.GlobalPosition);

float targetAngle = GlobalPosition.AngleToPoint(target.GlobalPosition);
Rotation = Mathf.LerpAngle(Rotation, targetAngle, 10.0f * (float)delta);
```

### Orbit Around a Point

```gdscript
func _process(delta: float) -> void:
    var angle: float = Time.get_ticks_msec() / 1000.0 * orbit_speed
    position = center + Vector2(cos(angle), sin(angle)) * orbit_radius
```

```csharp
public override void _Process(double delta)
{
    float angle = Time.GetTicksMsec() / 1000.0f * orbitSpeed;
    Position = center + new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * orbitRadius;
}
```

### Sine Wave Bob (Floating Effect)

```gdscript
var _base_y: float

func _ready() -> void:
    _base_y = position.y

func _process(delta: float) -> void:
    position.y = _base_y + sin(Time.get_ticks_msec() / 1000.0 * bob_speed) * bob_amplitude
```

```csharp
private float _baseY;

public override void _Ready() => _baseY = Position.Y;

public override void _Process(double delta)
{
    Vector2 pos = Position;
    pos.Y = _baseY + Mathf.Sin(Time.GetTicksMsec() / 1000.0f * bobSpeed) * bobAmplitude;
    Position = pos;
}
```

### Angle Wrapping

```gdscript
# Wrap angle to -PI..PI range
var wrapped: float = wrapf(angle, -PI, PI)

# Shortest rotation direction between two angles
var diff: float = angle_difference(current_angle, target_angle)
# Returns the shortest path, accounting for wrapping

# Lerp angles correctly (handles wrapping)
rotation = lerp_angle(rotation, target_rotation, 5.0 * delta)
```

```csharp
float wrapped = Mathf.Wrap(angle, -Mathf.Pi, Mathf.Pi);
float diff = Mathf.AngleDifference(currentAngle, targetAngle);
Rotation = Mathf.LerpAngle(Rotation, targetRotation, 5.0f * (float)delta);
```

### Clamped Approach with Deadzone

```gdscript
# Move toward target but stop within a deadzone
func approach_with_deadzone(current: Vector2, target: Vector2, speed: float, deadzone: float, delta: float) -> Vector2:
    var dist: float = current.distance_to(target)
    if dist <= deadzone:
        return current
    return current.move_toward(target, speed * delta)
```

---

