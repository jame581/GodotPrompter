# Raycasting Recipes

Reference for `skills/physics-system/SKILL.md` — RayCast node usage, code-based raycasting, and 3D mouse picking with Camera3D.project_ray_origin / project_ray_normal.

> ← Back to [SKILL.md](../SKILL.md)

---

## RayCast2D/3D Nodes (Simple Per-Frame Rays)

```gdscript
@onready var ray: RayCast2D = $RayCast2D

func _physics_process(_delta: float) -> void:
    if ray.is_colliding():
        var collider := ray.get_collider()
        var point := ray.get_collision_point()
```

```csharp
private RayCast2D _ray;
public override void _Ready() => _ray = GetNode<RayCast2D>("RayCast2D");
public override void _PhysicsProcess(double delta)
{
    if (_ray.IsColliding())
    {
        var collider = _ray.GetCollider();
        var point = _ray.GetCollisionPoint();
    }
}
```
### 3D Mouse Picking (Ray from Screen)

```gdscript
const RAY_LENGTH := 1000.0

# Store mouse position from input event
var _mouse_pos: Vector2 = Vector2.ZERO

func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventMouseButton and event.pressed:
        _mouse_pos = event.position

func _physics_process(_delta: float) -> void:
    if _mouse_pos == Vector2.ZERO:
        return

    var camera: Camera3D = get_viewport().get_camera_3d()
    var origin: Vector3 = camera.project_ray_origin(_mouse_pos)
    var end: Vector3 = origin + camera.project_ray_normal(_mouse_pos) * RAY_LENGTH

    var space: PhysicsDirectSpaceState3D = get_world_3d().direct_space_state
    var query := PhysicsRayQueryParameters3D.create(origin, end)
    query.collide_with_areas = true  # also detect Area3D nodes

    var result: Dictionary = space.intersect_ray(query)
    if result:
        print("Clicked: ", result.collider.name, " at ", result.position)

    _mouse_pos = Vector2.ZERO
```

```csharp
private const float RayLength = 1000f;
private Vector2 _mousePos;

public override void _UnhandledInput(InputEvent @event)
{
    if (@event is InputEventMouseButton mb && mb.Pressed)
        _mousePos = mb.Position;
}

public override void _PhysicsProcess(double delta)
{
    if (_mousePos == Vector2.Zero) return;

    var camera = GetViewport().GetCamera3D();
    var origin = camera.ProjectRayOrigin(_mousePos);
    var end = origin + camera.ProjectRayNormal(_mousePos) * RayLength;

    var space = GetWorld3D().DirectSpaceState;
    var query = PhysicsRayQueryParameters3D.Create(origin, end);
    query.CollideWithAreas = true;

    var result = space.IntersectRay(query);
    if (result.Count > 0)
        GD.Print($"Clicked: {((Node)result["collider"]).Name} at {result["position"]}");

    _mousePos = Vector2.Zero;
}
```


## Code-Based Raycasting (PhysicsDirectSpaceState)

For on-demand queries, access the space state. **Only safe inside `_physics_process()`** — the physics space is locked during rendering.

```gdscript
func _physics_process(_delta: float) -> void:
    var space: PhysicsDirectSpaceState2D = get_world_2d().direct_space_state
    var query := PhysicsRayQueryParameters2D.create(
        global_position,                       # from
        global_position + Vector2(0, 100),     # to
    )
    query.exclude = [get_rid()]   # skip self (expects Array[RID])
    query.collision_mask = 0b0100 # only layer 3

    var result: Dictionary = space.intersect_ray(query)
    if result:
        var hit_point: Vector2 = result.position
        var hit_normal: Vector2 = result.normal
        var hit_collider: Object = result.collider
```

```csharp
public override void _PhysicsProcess(double delta)
{
    var space = GetWorld2D().DirectSpaceState;
    var query = PhysicsRayQueryParameters2D.Create(
        GlobalPosition,
        GlobalPosition + new Vector2(0, 100)
    );
    var exclude = new Godot.Collections.Array<Rid>();
    exclude.Add(GetRid());
    query.Exclude = exclude;
    query.CollisionMask = 0b0100;

    var result = space.IntersectRay(query);
    if (result.Count > 0)
    {
        var hitPoint = (Vector2)result["position"];
        var hitNormal = (Vector2)result["normal"];
        var hitCollider = (GodotObject)result["collider"];
    }
}
```
