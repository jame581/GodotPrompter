# NavigationAgent3D Basic Usage

Reference for `skills/ai-navigation/SKILL.md` — a `CharacterBody3D` enemy that follows a `NavigationAgent3D` path with gravity and optional avoidance.

> ← Back to [SKILL.md](../SKILL.md)

---

### GDScript

```gdscript
extends CharacterBody3D

@export var speed: float = 4.0
@export var gravity: float = 9.8

@onready var nav_agent: NavigationAgent3D = $NavigationAgent3D


func _ready() -> void:
	nav_agent.velocity_computed.connect(_on_velocity_computed)


func _physics_process(delta: float) -> void:
	# Apply gravity
	if not is_on_floor():
		velocity.y -= gravity * delta

	if nav_agent.is_navigation_finished():
		move_and_slide()
		return

	var next_pos: Vector3 = nav_agent.get_next_path_position()
	var direction: Vector3 = (next_pos - global_position)
	direction.y = 0.0
	direction = direction.normalized()
	var desired_velocity: Vector3 = direction * speed
	desired_velocity.y = velocity.y  # preserve gravity

	if nav_agent.avoidance_enabled:
		nav_agent.velocity = desired_velocity
	else:
		velocity = desired_velocity
		move_and_slide()


func _on_velocity_computed(safe_velocity: Vector3) -> void:
	velocity = safe_velocity
	move_and_slide()


func set_target(target_pos: Vector3) -> void:
	nav_agent.target_position = target_pos
```

### C#

```csharp
using Godot;

public partial class Enemy3D : CharacterBody3D
{
    [Export] public float Speed   { get; set; } = 4f;
    [Export] public float Gravity { get; set; } = 9.8f;

    private NavigationAgent3D _navAgent;

    public override void _Ready()
    {
        _navAgent = GetNode<NavigationAgent3D>("NavigationAgent3D");
        _navAgent.VelocityComputed += OnVelocityComputed;
    }

    public override void _PhysicsProcess(double delta)
    {
        var vel = Velocity;
        if (!IsOnFloor()) vel.Y -= Gravity * (float)delta;

        if (_navAgent.IsNavigationFinished())
        {
            Velocity = vel;
            MoveAndSlide();
            return;
        }

        Vector3 nextPos = _navAgent.GetNextPathPosition();
        var direction = (nextPos - GlobalPosition) with { Y = 0f };
        direction = direction.Normalized();
        vel.X = direction.X * Speed;
        vel.Z = direction.Z * Speed;

        if (_navAgent.AvoidanceEnabled)
            _navAgent.Velocity = vel;
        else
        {
            Velocity = vel;
            MoveAndSlide();
        }
    }

    private void OnVelocityComputed(Vector3 safeVelocity)
    {
        Velocity = safeVelocity;
        MoveAndSlide();
    }

    public void SetTarget(Vector3 targetPos) => _navAgent.TargetPosition = targetPos;
}
```
