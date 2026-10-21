# Patrol Patterns

Reference for `skills/ai-navigation/SKILL.md` — waypoint-chain patrol with wait timers using `NavigationAgent2D`.

> ← Back to [SKILL.md](../SKILL.md)

---

### GDScript

```gdscript
extends CharacterBody2D

@export var waypoints: Array[Marker2D] = []
@export var speed: float = 80.0
@export var wait_time: float = 1.0  # seconds to pause at each waypoint

@onready var nav_agent: NavigationAgent2D = $NavigationAgent2D
@onready var wait_timer: Timer = $WaitTimer

var _current_index: int = 0
var _waiting: bool = false


func _ready() -> void:
	wait_timer.wait_time = wait_time
	wait_timer.one_shot = true
	wait_timer.timeout.connect(_on_wait_timer_timeout)
	_go_to_current_waypoint()


func _physics_process(_delta: float) -> void:
	if _waiting or waypoints.is_empty():
		return

	if nav_agent.is_navigation_finished():
		_waiting = true
		wait_timer.start()
		return

	var next_pos: Vector2 = nav_agent.get_next_path_position()
	velocity = (next_pos - global_position).normalized() * speed
	move_and_slide()


func _on_wait_timer_timeout() -> void:
	_waiting = false
	_current_index = (_current_index + 1) % waypoints.size()
	_go_to_current_waypoint()


func _go_to_current_waypoint() -> void:
	if waypoints.is_empty():
		return
	nav_agent.target_position = waypoints[_current_index].global_position
```

**Scene setup:** add a `Timer` node named `WaitTimer` as a child. Assign `Marker2D` nodes to the `waypoints` export array in the Inspector.

### C#

```csharp
using Godot;
using Godot.Collections;

public partial class PatrolEnemy : CharacterBody2D
{
    [Export] public Array<Marker2D> Waypoints { get; set; } = new();
    [Export] public float Speed     { get; set; } = 80f;
    [Export] public float WaitTime  { get; set; } = 1f;

    private NavigationAgent2D _navAgent;
    private Timer _waitTimer;
    private int _currentIndex;
    private bool _waiting;

    public override void _Ready()
    {
        _navAgent   = GetNode<NavigationAgent2D>("NavigationAgent2D");
        _waitTimer  = GetNode<Timer>("WaitTimer");

        _waitTimer.WaitTime = WaitTime;
        _waitTimer.OneShot  = true;
        _waitTimer.Timeout += OnWaitTimerTimeout;

        GoToCurrentWaypoint();
    }

    public override void _PhysicsProcess(double delta)
    {
        if (_waiting || Waypoints.Count == 0) return;

        if (_navAgent.IsNavigationFinished())
        {
            _waiting = true;
            _waitTimer.Start();
            return;
        }

        Vector2 nextPos  = _navAgent.GetNextPathPosition();
        Velocity = (nextPos - GlobalPosition).Normalized() * Speed;
        MoveAndSlide();
    }

    private void OnWaitTimerTimeout()
    {
        _waiting = false;
        _currentIndex = (_currentIndex + 1) % Waypoints.Count;
        GoToCurrentWaypoint();
    }

    private void GoToCurrentWaypoint()
    {
        if (Waypoints.Count == 0) return;
        _navAgent.TargetPosition = Waypoints[_currentIndex].GlobalPosition;
    }
}
```
