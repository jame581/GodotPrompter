---
name: ai-navigation
description: Use when implementing AI movement — NavigationAgent2D/3D, steering behaviors, behavior trees, and patrol patterns
---

# AI Navigation in Godot 4.3+

Cover NavigationAgent2D/3D, steering behaviors, behavior trees, and patrol patterns. All examples target Godot 4.3+ with no deprecated APIs.

> **Related skills:** **state-machine** for AI state management, **component-system** for modular AI behaviors, **player-controller** for movement physics patterns, **math-essentials** for pathfinding vectors and steering math, **limboai** for BT + HSM with a visual editor, **beehave** for lightweight GDScript behavior trees. For a structured behavior tree (rather than steering/navigation), see the comparison tables in **limboai** and **beehave**.

---

## 1. Navigation Setup

### Scene Structure

```
World (Node2D or Node3D)
└── NavigationRegion2D (or NavigationRegion3D)
    ├── TileMapLayer / StaticBody2D (geometry)
    └── Enemy (CharacterBody2D with NavigationAgent2D child)
```

### NavigationRegion2D / NavigationRegion3D

1. Add a **NavigationRegion2D** (or **NavigationRegion3D**) node to your scene.
2. Assign a **NavigationPolygon** (2D) or **NavigationMesh** (3D) resource to it.
3. Draw the walkable area in the NavigationPolygon editor, or configure the NavigationMesh bounds in 3D.
4. **Bake the mesh at edit time:** select the NavigationRegion node → click **Bake NavigationPolygon** (2D) or **Bake NavigationMesh** (3D) in the toolbar.
5. **Bake at runtime** when the world changes dynamically:

```gdscript
# 2D
$NavigationRegion2D.bake_navigation_polygon()

# 3D
$NavigationRegion3D.bake_navigation_mesh()
```

```csharp
// 2D
GetNode<NavigationRegion2D>("NavigationRegion2D").BakeNavigationPolygon();

// 3D
GetNode<NavigationRegion3D>("NavigationRegion3D").BakeNavigationMesh();
```

### Async Navigation Baking (Godot 4.4+)

Navigation baking can cause frame drops on large maps. Godot 4.4 supports baking on a background thread: pass `true` to `bake_navigation_polygon(true)` (2D) or `bake_navigation_mesh(true)` (3D) and connect the region's `bake_finished` signal (use `CONNECT_ONE_SHOT`) to know when the mesh is ready.

> See [references/async-baking.md](references/async-baking.md) for the full GDScript and C# background-thread bake examples (2D and 3D).

> **When to use async baking:** Procedurally generated levels, destructible terrain, or any scene where the navigation mesh must be rebuilt at runtime. The game continues running while the mesh bakes.

### Navigation Layers

Navigation layers let you separate walkable areas for different agent types (ground troops, flying units, large enemies).

```gdscript
# Assign layer bits on the NavigationRegion (Inspector or code)
# Layer 1 = ground, Layer 2 = air, Layer 3 = large

# On the NavigationAgent, set matching layers:
$NavigationAgent2D.navigation_layers = 1   # ground only
$NavigationAgent2D.navigation_layers = 2   # air only
$NavigationAgent2D.navigation_layers = 1 | 2  # both (bitwise OR)
```

```csharp
// Assign layer bits on the NavigationRegion (Inspector or code)
// Layer 1 = ground, Layer 2 = air, Layer 3 = large

var navAgent = GetNode<NavigationAgent2D>("NavigationAgent2D");
navAgent.NavigationLayers = 1;       // ground only
navAgent.NavigationLayers = 2;       // air only
navAgent.NavigationLayers = 1 | 2;   // both (bitwise OR)
```

> Set `navigation_layers` on both the **NavigationRegion** and the **NavigationAgent** so they match. Mismatched layers are one of the most common reasons an agent finds no path.

---

## 2. NavigationAgent2D Basic Usage

### GDScript

```gdscript
extends CharacterBody2D

@export var speed: float = 120.0

@onready var nav_agent: NavigationAgent2D = $NavigationAgent2D


func _ready() -> void:
	# velocity_computed fires when avoidance calculates a safe velocity
	nav_agent.velocity_computed.connect(_on_velocity_computed)


func _physics_process(delta: float) -> void:
	if nav_agent.is_navigation_finished():
		return

	var next_pos: Vector2 = nav_agent.get_next_path_position()
	var direction: Vector2 = (next_pos - global_position).normalized()
	var desired_velocity: Vector2 = direction * speed

	if nav_agent.avoidance_enabled:
		# Hand desired velocity to the avoidance system; wait for the signal
		nav_agent.velocity = desired_velocity
	else:
		velocity = desired_velocity
		move_and_slide()


func _on_velocity_computed(safe_velocity: Vector2) -> void:
	velocity = safe_velocity
	move_and_slide()


func set_target(target_pos: Vector2) -> void:
	nav_agent.target_position = target_pos
```

**Key NavigationAgent2D properties:**

| Property | Purpose |
|---|---|
| `target_position` | World-space destination |
| `path_desired_distance` | How close to each waypoint counts as reached (default 1) |
| `target_desired_distance` | How close to the final target counts as finished (default 10) |
| `avoidance_enabled` | Enable RVO obstacle avoidance |
| `radius` | Agent collision radius for avoidance |
| `time_horizon_agents` | Seconds of avoidance look-ahead (tune to reduce jitter) |

### C#

```csharp
using Godot;

public partial class Enemy2D : CharacterBody2D
{
    [Export] public float Speed { get; set; } = 120f;

    private NavigationAgent2D _navAgent;

    public override void _Ready()
    {
        _navAgent = GetNode<NavigationAgent2D>("NavigationAgent2D");
        _navAgent.VelocityComputed += OnVelocityComputed;
    }

    public override void _PhysicsProcess(double delta)
    {
        if (_navAgent.IsNavigationFinished()) return;

        Vector2 nextPos = _navAgent.GetNextPathPosition();
        Vector2 direction = (nextPos - GlobalPosition).Normalized();
        Vector2 desiredVelocity = direction * Speed;

        if (_navAgent.AvoidanceEnabled)
            _navAgent.Velocity = desiredVelocity;
        else
        {
            Velocity = desiredVelocity;
            MoveAndSlide();
        }
    }

    private void OnVelocityComputed(Vector2 safeVelocity)
    {
        Velocity = safeVelocity;
        MoveAndSlide();
    }

    public void SetTarget(Vector2 targetPos) => _navAgent.TargetPosition = targetPos;
}
```

---

## 3. NavigationAgent3D Basic Usage

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

---

## 4. Steering Behaviors

Lightweight per-frame calculations (seek, flee, arrive, wander) that produce natural-looking movement without a navigation mesh. Combine them by summing the returned vectors, or pick one and assign it to `velocity` each `_physics_process` tick.

> See [references/steering-behaviors.md](references/steering-behaviors.md) for the full GDScript and C# implementations of seek, flee, arrive (with deceleration ramp), and wander (with circle-projection jitter).

---

## 5. Patrol Patterns

A `NavigationAgent2D` plus an array of `Marker2D` waypoints and a `Timer` for the pause at each point produces a clean patrol loop. Cycle the index on `wait_timer.timeout`, set `nav_agent.target_position` to the next waypoint, and gate movement on `is_navigation_finished()`.

> See [references/patrol-patterns.md](references/patrol-patterns.md) for the full GDScript and C# waypoint-chain patrol with wait-timer pauses.

---

## 6. Behavior Tree Concept

A behavior tree (BT) is a tree of nodes evaluated every tick. Three core node types:

| Type | Succeeds when | Fails when |
|---|---|---|
| **Sequence** | all children succeed (AND) | any child fails |
| **Selector** | any child succeeds (OR) | all children fail |
| **Action** | the leaf action completes | the leaf reports failure |

Sequences model "do A then B then C". Selectors model "try A, else try B, else try C".

> See [references/behavior-trees.md](references/behavior-trees.md) for the full lightweight BT implementation (BTNode base + Sequence / Selector / Action) and a worked enemy that uses "chase OR patrol", in both GDScript and C#.

---

## 7. Chase + Attack Pattern

Combines NavigationAgent2D with a state machine. See the **state-machine** skill for the full FSM infrastructure.

### States

| State | Entry condition | Exit condition |
|---|---|---|
| PATROL | default / player escaped | player enters detect_range |
| CHASE | player in detect_range | player in attack_range OR player escaped |
| ATTACK | player in attack_range | player left attack_range |

> See [references/chase-attack.md](references/chase-attack.md) for the full GDScript and C# implementation (PATROL → CHASE → ATTACK transitions, attack cooldown timer, patrol-waypoint advancement, escape-range hand-off back to patrol).

> For larger projects, extract each state into its own node class using the **state-machine** skill and inject the `NavigationAgent2D` reference from the parent.

---

## 8. Dedicated 2D Navigation Server (Godot 4.5+)

Prior to Godot 4.5, `NavigationServer2D` was a thin frontend that delegated all work to the 3D navigation server internally. Godot 4.5 splits them into fully independent servers. The change is **transparent** — no API changes and no code migration is required — but it brings two practical benefits:

- **Performance:** 2D pathfinding no longer competes with 3D navigation for server resources. Large 2D scenes with many agents see lower CPU overhead.
- **Smaller exports for 2D-only games:** The 3D navigation server can be stripped from 2D-only export templates, reducing binary size.

```gdscript
# No code change needed — NavigationServer2D calls work identically.
# The split is internal; you continue using NavigationServer2D as before.

# Example: query a path directly via the server (unchanged API).
func get_path_to(target: Vector2) -> PackedVector2Array:
    var map: RID = get_world_2d().get_navigation_map()
    return NavigationServer2D.map_get_path(
        map,
        global_position,
        target,
        true  # optimize path
    )
```

```csharp
// No code change needed — NavigationServer2D calls work identically.
public PackedVector2Array GetPathTo(Vector2 target)
{
    var map = GetWorld2D().GetNavigationMap();
    return NavigationServer2D.MapGetPath(map, GlobalPosition, target, true);
}
```

> **2D-only projects:** In **Project Settings → Modules**, you can disable the `NavigationServer3D` module to reduce export size. This is only safe if no 3D navigation nodes (`NavigationRegion3D`, `NavigationAgent3D`) are used anywhere in the project.

---

## 9. Common Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| **Navigation mesh not baked** | Agent stands still; no path found | Bake the NavigationPolygon/NavigationMesh before running, or call `bake_navigation_polygon()` at runtime after scene loads |
| **`agent_radius` too large** | Agent can't fit through doorways or narrow corridors | Lower `radius` on NavigationAgent to be slightly less than half the passage width |
| **Avoidance jitter** | Agent stutters or oscillates when near other agents | Increase `time_horizon_agents` (try 2–4 s) or slightly lower `max_speed` on the agent |
| **Path recalculation too frequent** | CPU spike each frame; agents lag | Add a `Timer` (0.2–0.5 s) and only set `target_position` when the timer fires, not every physics frame |
| **Wrong navigation layer** | Agent ignores some regions or finds no path | Confirm `navigation_layers` bitmask matches between the NavigationRegion and the NavigationAgent |
| **Target set before NavigationServer is ready** | Path is empty on the first frame | Defer `target_position` assignment to `_ready()` or await `NavigationServer2D.map_changed` |
| **Gravity ignored in 3D** | Agent floats or sinks into the floor | Always accumulate `velocity.y` from gravity separately; only zero out X/Z from the nav direction |
| **Baking causes frame drop** | Synchronous bake on large maps blocks the main thread | Use async baking: `bake_navigation_mesh(true)` (Godot 4.4+); connect `bake_finished` signal |

> ⚠️ **Changed in Godot 4.7:** `NavigationServer3D.map_get_closest_point_normal(map, to_point)` now returns a normalized vector ([GH-119022](https://github.com/godotengine/godot/pull/119022)) — previously the returned surface normal could be unnormalized. Code that compensated by calling `normalized()` on the result keeps working; code that relied on the unnormalized magnitude breaks.

---

## 10. Checklist

- [ ] NavigationRegion2D/3D added to the scene with a NavigationPolygon/NavigationMesh resource
- [ ] Navigation mesh baked (edit-time or at runtime before the agent needs a path)
- [ ] `navigation_layers` bitmask matches between NavigationRegion and NavigationAgent
- [ ] `NavigationAgent2D`/`NavigationAgent3D` is a **child** of the enemy node
- [ ] `get_next_path_position()` called each physics frame, not `get_target_position()`
- [ ] `velocity_computed` signal connected when `avoidance_enabled` is `true`
- [ ] `is_navigation_finished()` checked before moving to avoid jitter at the destination
- [ ] Path target updated via a throttle timer rather than every frame when following a moving player
- [ ] `agent_radius` small enough to fit through the narrowest passage in the level
- [ ] Gravity applied independently of horizontal nav velocity (3D only)
- [ ] Large or dynamic maps use async baking (`bake_navigation_mesh(true)`) to avoid frame drops (Godot 4.4+)
- [ ] 2D-only projects on Godot 4.5+ can disable `NavigationServer3D` in Project Settings to reduce export size
