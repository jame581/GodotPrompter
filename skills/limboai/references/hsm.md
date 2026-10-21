# LimboAI — Advanced HSM Patterns

> Deep-dive reference for `LimboHSM` + `LimboState` + `BTState`. Load when you need any-state transitions, guard callables, nested HSMs, or HSM + BT bridging via `BTState`.

---

## Any-state transitions

Use `hsm.ANYSTATE` as `from_state` to define a transition that fires from any active state:

### GDScript

```gdscript
# From any state, dispatch "stunned" → go to StunnedState
hsm.add_transition(hsm.ANYSTATE, stunned_state, &"stunned")
hsm.add_transition(hsm.ANYSTATE, dead_state, &"died")
```

### C#

```csharp
_hsm.AddTransition(_hsm.Anystate, _stunnedState, "stunned");
_hsm.AddTransition(_hsm.Anystate, _deadState, "died");
```

---

## Guard callables

A guard prevents a transition from firing unless the callable returns `true`:

### GDScript

```gdscript
func _has_enough_health() -> bool:
    return agent.health > 0.0

func _ready() -> void:
    hsm.add_transition(idle_state, move_state, &"movement_started",
        _has_enough_health)
```

### C#

```csharp
private bool HasEnoughHealth() => _agent.Health > 0f;

public override void _Ready()
{
    _hsm.AddTransition(_idle, _move, "movement_started",
        Callable.From(HasEnoughHealth));
}
```

---

## Fluent (single-file) setup

Create states programmatically without scene-tree nodes — useful for procedural or data-driven characters:

### GDScript

```gdscript
func _init_hsm() -> void:
    var hsm := LimboHSM.new()
    add_child(hsm)

    var idle := LimboState.new().named("Idle") \
        .call_on_enter(func(): $AnimationPlayer.play("idle")) \
        .call_on_update(_idle_update)
    var move := LimboState.new().named("Move") \
        .call_on_enter(func(): $AnimationPlayer.play("walk")) \
        .call_on_update(_move_update)

    hsm.add_child(idle)
    hsm.add_child(move)
    hsm.add_transition(idle, move, &"movement_started")
    hsm.add_transition(move, idle, &"movement_ended")
    hsm.initialize(self)
    hsm.set_active(true)
```

### C#

```csharp
// Fluent chaining (.Named()/.CallOnEnter()) is GDScript-only via LimboState builder methods.
// In C# assign properties and connect signals instead.
private void InitHsm()
{
    var hsm = new LimboHSM();
    AddChild(hsm);

    var idle = new LimboState { Name = "Idle" };
    idle.Connect(LimboState.SignalName.Entered,
        Callable.From(() => GetNode<AnimationPlayer>("AnimationPlayer").Play("idle")));
    idle.Connect(LimboState.SignalName.Updated,
        Callable.From((double d) => IdleUpdate(d)));

    var move = new LimboState { Name = "Move" };
    move.Connect(LimboState.SignalName.Entered,
        Callable.From(() => GetNode<AnimationPlayer>("AnimationPlayer").Play("walk")));
    move.Connect(LimboState.SignalName.Updated,
        Callable.From((double d) => MoveUpdate(d)));

    hsm.AddChild(idle);
    hsm.AddChild(move);
    hsm.AddTransition(idle, move, "movement_started");
    hsm.AddTransition(move, idle, "movement_ended");
    hsm.Initialize(this);
    hsm.SetActive(true);
}
```

---

## BTState — bridging HSM and behavior trees

`BTState` is a `LimboState` that runs a `BehaviorTree` resource. When the BT returns `SUCCESS` it dispatches `success_event`; on `FAILURE` it dispatches `failure_event`. Use it to embed a BT inside an HSM state slot:

### GDScript

```gdscript
func _ready() -> void:
    var hsm := LimboHSM.new()
    add_child(hsm)

    var patrol := BTState.new()
    patrol.behavior_tree = preload("res://ai/trees/patrol.tres")
    patrol.set_scene_root_hint(self)  # call before initialize()
    # patrol.success_event = &"patrol_done"  # default is &"success"

    hsm.add_child(patrol)
    hsm.initial_state = patrol
    hsm.initialize(self)
    hsm.set_active(true)
```

### C#

```csharp
public override void _Ready()
{
    var hsm = new LimboHSM();
    AddChild(hsm);

    var patrol = new BTState();
    patrol.BehaviorTree = GD.Load<BehaviorTree>("res://ai/trees/patrol.tres");
    patrol.SetSceneRootHint(this);  // call before Initialize()

    hsm.AddChild(patrol);
    hsm.InitialState = patrol;
    hsm.Initialize(this);
    hsm.SetActive(true);
}
```

---

## Dispatching events

Any state or external code can dispatch events. Events propagate from the leaf state up to the root:

### GDScript

```gdscript
# From inside a LimboState subclass:
dispatch(EVENT_FINISHED)           # use per-state shorthand
dispatch(&"stunned", damage_info)  # named event with cargo

# From outside (e.g. the agent script):
hsm.dispatch(&"player_spotted")
```

### C#

```csharp
// From inside a LimboState subclass:
Dispatch(EventFinished);
Dispatch("stunned", damageInfo);

// From outside:
_hsm.Dispatch("player_spotted");
```

`dispatch()` returns `true` if an event was consumed by a transition. Unhandled events are silently ignored.
