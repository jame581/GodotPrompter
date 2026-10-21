# Chase + Attack Pattern

Reference for `skills/ai-navigation/SKILL.md` — full chase/attack/patrol enemy combining `NavigationAgent2D` with an enum-based state machine.

> ← Back to [SKILL.md](../SKILL.md)

---

Combines NavigationAgent2D with a state machine. See the **state-machine** skill for the full FSM infrastructure.

### States

| State | Entry condition | Exit condition |
|---|---|---|
| PATROL | default / player escaped | player enters detect_range |
| CHASE | player in detect_range | player in attack_range OR player escaped |
| ATTACK | player in attack_range | player left attack_range |

### GDScript

```gdscript
extends CharacterBody2D

enum State { PATROL, CHASE, ATTACK }

@export var detect_range: float  = 250.0
@export var attack_range: float  = 40.0
@export var escape_range: float  = 320.0
@export var speed: float         = 110.0
@export var attack_cooldown: float = 0.8

@export var patrol_waypoints: Array[Marker2D] = []

@onready var nav_agent: NavigationAgent2D     = $NavigationAgent2D
@onready var attack_timer: Timer              = $AttackTimer
@onready var patrol_wait_timer: Timer         = $PatrolWaitTimer

var _state: State = State.PATROL
var _patrol_index: int = 0
var _patrol_waiting: bool = false

@onready var _player: Node2D = get_tree().get_first_node_in_group("player")


func _ready() -> void:
	attack_timer.wait_time = attack_cooldown
	attack_timer.one_shot = true
	patrol_wait_timer.wait_time = 1.0
	patrol_wait_timer.one_shot = true
	patrol_wait_timer.timeout.connect(_advance_patrol)
	nav_agent.velocity_computed.connect(_on_velocity_computed)
	_go_to_patrol_point()


func _physics_process(_delta: float) -> void:
	if not is_instance_valid(_player):
		return

	var dist: float = global_position.distance_to(_player.global_position)

	match _state:
		State.PATROL:
			_do_patrol()
			if dist <= detect_range:
				_enter_chase()

		State.CHASE:
			nav_agent.target_position = _player.global_position
			if dist <= attack_range:
				_enter_attack()
			elif dist >= escape_range:
				_enter_patrol()
			else:
				var next := nav_agent.get_next_path_position()
				nav_agent.velocity = (next - global_position).normalized() * speed

		State.ATTACK:
			velocity = Vector2.ZERO
			if dist > attack_range:
				_enter_chase()

	move_and_slide()


func _on_velocity_computed(safe_vel: Vector2) -> void:
	velocity = safe_vel


# ── State transitions ────────────────────────────────────────────────────────

func _enter_chase() -> void:
	_state = State.CHASE


func _enter_attack() -> void:
	_state = State.ATTACK
	if attack_timer.is_stopped():
		_perform_attack()
		attack_timer.start()


func _enter_patrol() -> void:
	_state = State.PATROL
	_go_to_patrol_point()


# ── Patrol helpers ────────────────────────────────────────────────────────────

func _do_patrol() -> void:
	if patrol_waypoints.is_empty() or _patrol_waiting:
		velocity = Vector2.ZERO
		return
	if nav_agent.is_navigation_finished():
		_patrol_waiting = true
		patrol_wait_timer.start()
		return
	var next := nav_agent.get_next_path_position()
	nav_agent.velocity = (next - global_position).normalized() * (speed * 0.5)


func _advance_patrol() -> void:
	_patrol_waiting = false
	_patrol_index = (_patrol_index + 1) % patrol_waypoints.size()
	_go_to_patrol_point()


func _go_to_patrol_point() -> void:
	if patrol_waypoints.is_empty():
		return
	nav_agent.target_position = patrol_waypoints[_patrol_index].global_position


# ── Attack ────────────────────────────────────────────────────────────────────

func _perform_attack() -> void:
	# Replace with your attack logic (animation, hitbox, etc.)
	pass
```

### C#

```csharp
using Godot;
using Godot.Collections;

public partial class ChaseAttackEnemy : CharacterBody2D
{
    private enum State { Patrol, Chase, Attack }

    [Export] public float DetectRange { get; set; } = 250f;
    [Export] public float AttackRange { get; set; } = 40f;
    [Export] public float EscapeRange { get; set; } = 320f;
    [Export] public float Speed { get; set; } = 110f;
    [Export] public float AttackCooldown { get; set; } = 0.8f;
    [Export] public Array<Marker2D> PatrolWaypoints { get; set; } = new();

    private NavigationAgent2D _navAgent;
    private Timer _attackTimer;
    private Timer _patrolWaitTimer;
    private State _state = State.Patrol;
    private int _patrolIndex;
    private bool _patrolWaiting;
    private Node2D _player;

    public override void _Ready()
    {
        _navAgent = GetNode<NavigationAgent2D>("NavigationAgent2D");
        _attackTimer = GetNode<Timer>("AttackTimer");
        _patrolWaitTimer = GetNode<Timer>("PatrolWaitTimer");

        _attackTimer.WaitTime = AttackCooldown;
        _attackTimer.OneShot = true;
        _patrolWaitTimer.WaitTime = 1.0;
        _patrolWaitTimer.OneShot = true;
        _patrolWaitTimer.Timeout += AdvancePatrol;
        _navAgent.VelocityComputed += OnVelocityComputed;

        _player = GetTree().GetFirstNodeInGroup("player") as Node2D;
        GoToPatrolPoint();
    }

    public override void _PhysicsProcess(double delta)
    {
        if (!IsInstanceValid(_player)) return;

        float dist = GlobalPosition.DistanceTo(_player.GlobalPosition);

        switch (_state)
        {
            case State.Patrol:
                DoPatrol();
                if (dist <= DetectRange) EnterChase();
                break;

            case State.Chase:
                _navAgent.TargetPosition = _player.GlobalPosition;
                if (dist <= AttackRange)
                    EnterAttack();
                else if (dist >= EscapeRange)
                    EnterPatrol();
                else
                {
                    Vector2 next = _navAgent.GetNextPathPosition();
                    _navAgent.Velocity = (next - GlobalPosition).Normalized() * Speed;
                }
                break;

            case State.Attack:
                Velocity = Vector2.Zero;
                if (dist > AttackRange) EnterChase();
                break;
        }

        MoveAndSlide();
    }

    private void OnVelocityComputed(Vector2 safeVel) => Velocity = safeVel;

    // ── State transitions ─────────────────────────────────────────────────
    private void EnterChase() => _state = State.Chase;

    private void EnterAttack()
    {
        _state = State.Attack;
        if (_attackTimer.IsStopped())
        {
            PerformAttack();
            _attackTimer.Start();
        }
    }

    private void EnterPatrol()
    {
        _state = State.Patrol;
        GoToPatrolPoint();
    }

    // ── Patrol helpers ────────────────────────────────────────────────────
    private void DoPatrol()
    {
        if (PatrolWaypoints.Count == 0 || _patrolWaiting)
        {
            Velocity = Vector2.Zero;
            return;
        }
        if (_navAgent.IsNavigationFinished())
        {
            _patrolWaiting = true;
            _patrolWaitTimer.Start();
            return;
        }
        Vector2 next = _navAgent.GetNextPathPosition();
        _navAgent.Velocity = (next - GlobalPosition).Normalized() * (Speed * 0.5f);
    }

    private void AdvancePatrol()
    {
        _patrolWaiting = false;
        _patrolIndex = (_patrolIndex + 1) % PatrolWaypoints.Count;
        GoToPatrolPoint();
    }

    private void GoToPatrolPoint()
    {
        if (PatrolWaypoints.Count == 0) return;
        _navAgent.TargetPosition = PatrolWaypoints[_patrolIndex].GlobalPosition;
    }

    // ── Attack ────────────────────────────────────────────────────────────
    private void PerformAttack()
    {
        // Replace with your attack logic (animation, hitbox, etc.)
    }
}
```

> For larger projects, extract each state into its own node class using the **state-machine** skill and inject the `NavigationAgent2D` reference from the parent.
