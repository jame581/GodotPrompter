# RigidBody Recipes

Reference for `skills/physics-system/SKILL.md` — Contact monitoring, PhysicsMaterial, Freeze Modes, RigidBody3D `look_at` via physics.

> ← Back to [SKILL.md](../SKILL.md)

---
### Contact Monitoring

To receive `body_entered`/`body_exited` signals on a RigidBody:

1. Set `contact_monitor = true`
2. Set `max_contacts_reported` to a non-zero value (e.g. 4)

```gdscript
extends RigidBody3D

func _ready() -> void:
    contact_monitor = true
    max_contacts_reported = 4
    body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node) -> void:
    if body.has_method("take_damage"):
        body.take_damage(10)
```

```csharp
public partial class PhysicsCrate : RigidBody3D
{
    public override void _Ready()
    {
        ContactMonitor = true;
        MaxContactsReported = 4;
        BodyEntered += OnBodyEntered;
    }

    private void OnBodyEntered(Node body)
    {
        if (body.HasMethod("TakeDamage"))
            body.Call("TakeDamage", 10);
    }
}
```

### PhysicsMaterial

Attach a `PhysicsMaterial` resource to control surface properties:

| Property | Default | Effect |
|----------|---------|--------|
| `friction` | 1.0 | Resistance to sliding (0 = ice, 1 = rubber) |
| `bounce` | 0.0 | Restitution (0 = no bounce, 1 = full bounce) |
| `rough` | false | If true, uses max friction instead of geometric mean |
| `absorbent` | false | If true, uses min bounce instead of geometric mean |

### Freeze Modes

RigidBody can be frozen to temporarily stop physics simulation:

| Mode | Behavior |
|------|----------|
| `FREEZE_MODE_STATIC` | Acts like a StaticBody (other bodies collide with it) |
| `FREEZE_MODE_KINEMATIC` | Acts like an AnimatableBody (can be moved by code, pushes other bodies) |

```gdscript
# Freeze a crate in place
rigid_body.freeze = true
rigid_body.freeze_mode = RigidBody3D.FREEZE_MODE_STATIC

# Unfreeze
rigid_body.freeze = false
```

### RigidBody3D look_at — Orientation via Physics

You cannot use `look_at()` on a RigidBody3D each frame. Use angular velocity via cross product instead:

```gdscript
extends RigidBody3D

@export var turn_speed: float = 0.1

func _integrate_forces(state: PhysicsDirectBodyState3D) -> void:
    var target_pos: Vector3 = $"../Target".global_position
    var forward: Vector3 = -global_transform.basis.z.normalized()
    var to_target: Vector3 = (target_pos - global_position).normalized()
    var dot: float = clampf(forward.dot(to_target), -1.0, 1.0)
    var angle_to_target: float = acos(dot)
    var turn_angle: float = minf(turn_speed, angle_to_target)
    if angle_to_target > 1e-4:
        state.angular_velocity = forward.cross(to_target).normalized() * turn_angle / state.step
```

```csharp
public partial class HomingBody : RigidBody3D
{
    [Export] public float TurnSpeed { get; set; } = 0.1f;

    public override void _IntegrateForces(PhysicsDirectBodyState3D state)
    {
        var targetPos = GetNode<Node3D>("../Target").GlobalPosition;
        var forward = -GlobalTransform.Basis.Z.Normalized();
        var toTarget = (targetPos - GlobalPosition).Normalized();
        float dot = Mathf.Clamp(forward.Dot(toTarget), -1f, 1f);
        float angleToTarget = Mathf.Acos(dot);
        float turnAngle = Mathf.Min(TurnSpeed, angleToTarget);
        if (angleToTarget > 1e-4f)
            state.AngularVelocity = forward.Cross(toTarget).Normalized() * turnAngle / state.Step;
    }
}
```

---

## _integrate_forces() — Safe Physics Modification

Use `_integrate_forces()` instead of `_physics_process()` when you need to directly modify a RigidBody's transform, velocity, or angular velocity. Setting `position` or `linear_velocity` directly in `_physics_process()` fights the physics engine.

```gdscript
extends RigidBody2D

var thrust := Vector2(0, -250)
var torque_force := 20000.0

func _integrate_forces(state: PhysicsDirectBodyState2D) -> void:
    if Input.is_action_pressed("ui_up"):
        state.apply_force(thrust.rotated(rotation))
    else:
        state.apply_force(Vector2())

    var rotation_dir: float = Input.get_axis("ui_left", "ui_right")
    state.apply_torque(rotation_dir * torque_force)
```

```csharp
public partial class Ship : RigidBody2D
{
    private Vector2 _thrust = new(0, -250);
    private float _torqueForce = 20000f;

    public override void _IntegrateForces(PhysicsDirectBodyState2D state)
    {
        if (Input.IsActionPressed("ui_up"))
            state.ApplyForce(_thrust.Rotated(Rotation));
        else
            state.ApplyForce(new Vector2());

        float rotDir = Input.GetAxis("ui_left", "ui_right");
        state.ApplyTorque(rotDir * _torqueForce);
    }
}
```

> **Warning:** `_integrate_forces()` is NOT called while the body is sleeping. Enable `can_sleep = false` if you need continuous callbacks, but prefer letting bodies sleep for performance.

## Forces vs Impulses (canonical example)

```gdscript
extends RigidBody2D

func _physics_process(_delta: float) -> void:
    # Continuous force — applied every physics frame (e.g. thrust)
    if Input.is_action_pressed("thrust"):
        apply_force(Vector2(0, -500).rotated(rotation))

    # Central impulse — instant velocity change (e.g. explosion knockback)
    if Input.is_action_just_pressed("explode"):
        apply_central_impulse(Vector2(0, -800))

    # Torque — continuous rotation force
    var turn: float = Input.get_axis("ui_left", "ui_right")
    apply_torque(turn * 20000.0)
```

```csharp
public partial class Ship : RigidBody2D
{
    public override void _PhysicsProcess(double delta)
    {
        if (Input.IsActionPressed("thrust"))
            ApplyForce(new Vector2(0, -500).Rotated(Rotation));

        if (Input.IsActionJustPressed("explode"))
            ApplyCentralImpulse(new Vector2(0, -800));

        float turn = Input.GetAxis("ui_left", "ui_right");
        ApplyTorque(turn * 20000.0f);
    }
}
```
