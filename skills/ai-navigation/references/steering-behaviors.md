# Steering Behaviors

Reference for `skills/ai-navigation/SKILL.md` — full implementations of seek, flee, arrive, and wander steering behaviors.

> ← Back to [SKILL.md](../SKILL.md)

---

Steering behaviors are lightweight calculations that run every physics frame. Combine them to produce natural-looking movement without a full navigation mesh.

### GDScript

```gdscript
extends CharacterBody2D

@export var speed: float = 120.0
@export var arrive_radius: float = 80.0    # start slowing down at this distance
@export var arrive_stop: float = 8.0       # stop at this distance
@export var wander_angle_change: float = 0.4  # radians per frame max

var _wander_angle: float = 0.0


# ── Seek ────────────────────────────────────────────────────────────────────
# Accelerate toward target at full speed.
func seek(target_pos: Vector2) -> Vector2:
	return (target_pos - global_position).normalized() * speed


# ── Flee ────────────────────────────────────────────────────────────────────
# Accelerate directly away from target at full speed.
func flee(target_pos: Vector2) -> Vector2:
	return (global_position - target_pos).normalized() * speed


# ── Arrive ──────────────────────────────────────────────────────────────────
# Like seek, but smoothly decelerates inside arrive_radius.
func arrive(target_pos: Vector2) -> Vector2:
	var to_target: Vector2 = target_pos - global_position
	var dist: float = to_target.length()
	if dist < arrive_stop:
		return Vector2.ZERO
	var ramped_speed: float = speed * (dist / arrive_radius)
	var clamped_speed: float = minf(ramped_speed, speed)
	return to_target.normalized() * clamped_speed


# ── Wander ──────────────────────────────────────────────────────────────────
# Project a circle ahead of the agent, then jitter a point on its edge.
func wander() -> Vector2:
	var circle_distance: float = 60.0
	var circle_radius: float = 30.0
	_wander_angle += randf_range(-wander_angle_change, wander_angle_change)
	var circle_center: Vector2 = velocity.normalized() * circle_distance
	if circle_center == Vector2.ZERO:
		circle_center = Vector2.RIGHT * circle_distance
	var displacement: Vector2 = Vector2(
		cos(_wander_angle) * circle_radius,
		sin(_wander_angle) * circle_radius
	)
	return (circle_center + displacement).normalized() * speed


# ── Usage example ────────────────────────────────────────────────────────────
func _physics_process(_delta: float) -> void:
	# Swap the desired behavior:
	velocity = arrive(get_tree().get_first_node_in_group("player").global_position)
	# velocity = flee(...)
	# velocity = wander()
	move_and_slide()
```

### C#

```csharp
using Godot;

public partial class SteeringEnemy : CharacterBody2D
{
    [Export] public float Speed { get; set; } = 120f;
    [Export] public float ArriveRadius { get; set; } = 80f;
    [Export] public float ArriveStop { get; set; } = 8f;
    [Export] public float WanderAngleChange { get; set; } = 0.4f;

    private float _wanderAngle;

    // ── Seek ──────────────────────────────────────────────────────────────
    public Vector2 Seek(Vector2 targetPos)
        => (targetPos - GlobalPosition).Normalized() * Speed;

    // ── Flee ──────────────────────────────────────────────────────────────
    public Vector2 Flee(Vector2 targetPos)
        => (GlobalPosition - targetPos).Normalized() * Speed;

    // ── Arrive ────────────────────────────────────────────────────────────
    public Vector2 Arrive(Vector2 targetPos)
    {
        Vector2 toTarget = targetPos - GlobalPosition;
        float dist = toTarget.Length();
        if (dist < ArriveStop) return Vector2.Zero;
        float rampedSpeed = Speed * (dist / ArriveRadius);
        float clampedSpeed = Mathf.Min(rampedSpeed, Speed);
        return toTarget.Normalized() * clampedSpeed;
    }

    // ── Wander ────────────────────────────────────────────────────────────
    public Vector2 Wander()
    {
        float circleDistance = 60f;
        float circleRadius = 30f;
        _wanderAngle += (float)GD.RandRange(-WanderAngleChange, WanderAngleChange);
        Vector2 circleCenter = Velocity.Normalized() * circleDistance;
        if (circleCenter == Vector2.Zero)
            circleCenter = Vector2.Right * circleDistance;
        var displacement = new Vector2(
            Mathf.Cos(_wanderAngle) * circleRadius,
            Mathf.Sin(_wanderAngle) * circleRadius
        );
        return (circleCenter + displacement).Normalized() * Speed;
    }

    // ── Usage example ─────────────────────────────────────────────────────
    public override void _PhysicsProcess(double delta)
    {
        var player = GetTree().GetFirstNodeInGroup("player") as Node2D;
        Velocity = Arrive(player.GlobalPosition);
        // Velocity = Flee(...);
        // Velocity = Wander();
        MoveAndSlide();
    }
}
```
