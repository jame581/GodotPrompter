---
name: limboai
description: Use when using the LimboAI addon — behavior trees and hierarchical state machines (C++ GDExtension) with a visual editor, BTTask subclassing, and a blackboard
---

# LimboAI

> **Related skills:** **ai-navigation** for movement the tasks drive, **state-machine** for core-engine FSM (when you don't need an addon), **godot-brainstorming** for choosing an AI approach.

> **Addon:** LimboAI · version `v1.8.0` · Godot 4.6+ (GDExtension) · MIT · source: https://github.com/limbonaut/limboai · written in C++ (GDExtension; engine-module build also available). GDExtension exposes GDScript; **C# requires the module build** (not GDExtension in v1.8.0), and the v1.8.0 module build targets **Godot 4.7**.

---

## 1. When to use LimboAI

| Approach | Best for |
|---|---|
| Core-engine FSM (`state-machine` skill) | Simple agents, < 5 states, no addon |
| **Beehave** (GDScript addon) | Lightweight BT, GDScript-only projects |
| **LimboAI** | BT **and** HSM together, visual editor, C++ performance, C# support (module build) |

Choose LimboAI when you need a behavior tree with a polished visual debugger, want to combine it with a hierarchical state machine (`BTState` bridges them), or need C++ task execution speed. Note: LimboAI requires **Godot 4.6+** and is not usable on 4.3–4.5. For a simpler GDScript-only behavior tree, Beehave is a lighter alternative. For plain state machines without a BT, use the built-in `state-machine` skill instead.

---

## 2. Install & setup

### GDExtension (recommended — no custom engine)

1. **Godot AssetLib** → search "LimboAI" → Download → Reload project.  
   Or download from GitHub Releases and place `addons/limboai/` in `res://addons/limboai/`.
2. Enable the plugin: **Project → Project Settings → Plugins** → tick LimboAI.
3. The `.gdextension` manifest ships at `res://addons/limboai/bin/`:

```ini
[configuration]
entry_symbol = "limboai_init"
compatibility_minimum = "4.2"

[libraries]
windows.debug.x86_64   = "res://addons/limboai/bin/liblimboai.windows.editor.x86_64.dll"
windows.release.x86_64 = "res://addons/limboai/bin/liblimboai.windows.template_release.x86_64.dll"
linux.debug.x86_64     = "res://addons/limboai/bin/liblimboai.linux.editor.x86_64.so"
linux.release.x86_64   = "res://addons/limboai/bin/liblimboai.linux.template_release.x86_64.so"
macos.debug            = "res://addons/limboai/bin/liblimboai.macos.editor.framework"
macos.release          = "res://addons/limboai/bin/liblimboai.macos.template_release.framework"
# ... (additional platform entries for linux arm64/rv64, android, iOS, web)
```

**GDExtension limitations:** no in-editor documentation tooltips; `BBParam` property editor not available in the inspector.

### Module version (C# or full editor integration)

Download pre-compiled editor + export templates from [GitHub Releases](https://github.com/limbonaut/limboai/releases). Requires the custom engine for export. v1.8.0 module builds are based on **Godot 4.7** (GDExtension supports 4.6+). The module build ships a NuGet package for C#:

```ini
# Add local NuGet source to your project:
# dotnet nuget add source path/to/nupkgs --name LimboNugetSource
```

---

## 3. Behavior trees

A `BehaviorTree` resource holds the task tree. `BTPlayer` runs it each physics frame (or idle/manual). Add `BTPlayer` as a child of the agent node and assign a `BehaviorTree` resource.

### GDScript

```gdscript
# EnemyAI.gd — assign behavior_tree in the Inspector or here
extends CharacterBody2D

@onready var bt_player: BTPlayer = $BTPlayer

func _ready() -> void:
    # BTPlayer starts executing automatically (active = true by default).
    # Connect to updated(status) to react when the tree finishes.
    bt_player.updated.connect(_on_bt_updated)

func _on_bt_updated(status: int) -> void:
    if status == BT.SUCCESS:
        bt_player.restart()  # loop the tree
```

### C#

```csharp
// EnemyAI.cs
using Godot;

public partial class EnemyAI : CharacterBody2D
{
    [Export] private BTPlayer _btPlayer;

    public override void _Ready()
    {
        _btPlayer.Updated += OnBtUpdated;
    }

    private void OnBtUpdated(int status)
    {
        if (status == (int)BT.Status.Success)
            _btPlayer.Restart();
    }
}
```

`BTPlayer.UpdateMode` controls when the tree ticks: `IDLE` (every `_process`), `PHYSICS` (every `_physics_process`, default), or `MANUAL` (call `bt_player.update(delta)` yourself).

---

## 4. Custom tasks

Subclass `BTAction` (multi-tick work) or `BTCondition` (immediate check). Annotate with `@tool` so `_generate_name()` and `_get_configuration_warnings()` work in the editor. Place scripts under `res://ai/tasks/`; subfolders become task categories.

### GDScript

```gdscript
@tool
extends BTAction
## Moves the agent toward a blackboard position each tick.

@export var target_pos_var: StringName = &"target_pos"
@export var speed: float = 200.0

func _generate_name() -> String:
    return "MoveToward %s" % LimboUtility.decorate_var(target_pos_var)

func _setup() -> void:
    pass  # one-time init; agent and blackboard are available here

func _enter() -> void:
    pass  # called when task transitions from non-RUNNING → RUNNING

func _tick(delta: float) -> Status:
    var target: Vector2 = blackboard.get_var(target_pos_var, Vector2.ZERO)
    if agent.global_position.distance_to(target) < 5.0:
        return SUCCESS
    agent.velocity = agent.global_position.direction_to(target) * speed
    agent.move_and_slide()
    return RUNNING

func _exit() -> void:
    pass  # cleanup after SUCCESS or FAILURE
```

```gdscript
@tool
extends BTCondition
## Returns SUCCESS if the agent is within range of a target node.

@export var target_var: StringName = &"target"
@export var distance_max: float = 150.0

var _max_sq: float

func _setup() -> void:
    _max_sq = distance_max * distance_max

func _tick(_delta: float) -> Status:
    var target: Node2D = blackboard.get_var(target_var, null)
    if not is_instance_valid(target):
        return FAILURE
    var in_range := agent.global_position.distance_squared_to(
        target.global_position) <= _max_sq
    return SUCCESS if in_range else FAILURE
```

### C#

```csharp
// MoveTowardTask.cs — place in res://ai/tasks/
using Godot;

[Tool]
public partial class MoveTowardTask : BTAction
{
    [Export] public StringName TargetPosVar { get; set; } = "target_pos";
    [Export] public float Speed { get; set; } = 200f;

    public override string _GenerateName() =>
        $"MoveToward {LimboUtility.DecorateVar(TargetPosVar)}";

    public override void _Setup() { }

    public override void _Enter() { }

    public override Status _Tick(double delta)
    {
        var target = (Vector2)Blackboard.GetVar(TargetPosVar, Vector2.Zero);
        var body = (CharacterBody2D)Agent;
        if (body.GlobalPosition.DistanceTo(target) < 5f)
            return Status.Success;
        body.Velocity = body.GlobalPosition.DirectionTo(target) * Speed;
        body.MoveAndSlide();
        return Status.Running;
    }

    public override void _Exit() { }
}
```

```csharp
// InRangeCondition.cs
using Godot;

[Tool]
public partial class InRangeCondition : BTCondition
{
    [Export] public StringName TargetVar { get; set; } = "target";
    [Export] public float DistanceMax { get; set; } = 150f;

    private float _maxSq;

    public override void _Setup() => _maxSq = DistanceMax * DistanceMax;

    public override Status _Tick(double delta)
    {
        var target = Blackboard.GetVar(TargetVar, default(Variant)).As<Node2D>();
        if (!GodotObject.IsInstanceValid(target))
            return Status.Failure;
        var agent2D = (Node2D)Agent;
        bool inRange = agent2D.GlobalPosition.DistanceSquaredTo(
            target.GlobalPosition) <= _maxSq;
        return inRange ? Status.Success : Status.Failure;
    }
}
```

Task lifecycle: `_setup()` once before first tick → `_enter()` when status transitions from non-RUNNING → `_tick(delta)` every execution → `_exit()` after SUCCESS or FAILURE.

---

## 5. Blackboard

The `Blackboard` is a `RefCounted` key/value store shared by all tasks in a tree. Use `StringName` keys (`&"key"`) and export them as task properties so the inspector shows a picker.

### GDScript

```gdscript
@tool
extends BTAction

@export var speed_var: StringName = &"speed"
@export var target_var: StringName = &"target"

func _tick(delta: float) -> Status:
    # Read with a default; use no type annotation for object vars
    # to avoid errors if the stored instance was freed.
    var speed: float = blackboard.get_var(speed_var, 100.0)
    var obj = blackboard.get_var(target_var, null)
    if not is_instance_valid(obj):
        return FAILURE

    # Write back
    blackboard.set_var(speed_var, speed * 1.1)
    return RUNNING
```

### C#

```csharp
// C# has no generic GetVar<T> — cast the returned Variant.
using Godot;

[Tool]
public partial class SampleTask : BTAction
{
    [Export] public StringName SpeedVar { get; set; } = "speed";
    [Export] public StringName TargetVar { get; set; } = "target";

    public override Status _Tick(double delta)
    {
        float speed = (float)Blackboard.GetVar(SpeedVar, 100f);
        var obj = Blackboard.GetVar(TargetVar, default(Variant)).As<GodotObject>();
        if (!GodotObject.IsInstanceValid(obj))
            return Status.Failure;

        Blackboard.SetVar(SpeedVar, speed * 1.1f);
        return Status.Running;
    }
}
```

Useful `Blackboard` methods: `has_var(name)`, `erase_var(name)`, `list_vars()`, `get_vars_as_dict()`, `bind_var_to_property(name, obj, prop)`, `link_var(name, target_bb, target_name)`, `print_state()` (debug).

`BlackboardPlan` defines the variable schema (types, defaults, hints) and is edited in the Inspector on `BTPlayer` or `LimboHSM`. Call `blackboard_plan.create_blackboard(scene_root)` to create a scoped `Blackboard` at runtime.

---

## 6. Hierarchical state machine (LimboHSM)

`LimboHSM` is a `LimboState` node that manages child `LimboState` nodes. Transitions fire when a state calls `dispatch(event)`. See [references/hsm.md](references/hsm.md) for advanced patterns (any-state transitions, `BTState`, nested HSMs, guards).

### GDScript — scene-tree setup

```gdscript
# Character.gd — scene tree: Character → LimboHSM → IdleState, MoveState
extends CharacterBody2D

@onready var hsm: LimboHSM = $LimboHSM
@onready var idle: LimboState = $LimboHSM/IdleState
@onready var move: LimboState = $LimboHSM/MoveState

func _ready() -> void:
    hsm.add_transition(idle, move, idle.EVENT_FINISHED)
    hsm.add_transition(move, idle, move.EVENT_FINISHED)
    hsm.initialize(self)
    hsm.set_active(true)
```

### C# — scene-tree setup

```csharp
// Character.cs
using Godot;

public partial class Character : CharacterBody2D
{
    [Export] private LimboHSM _hsm;
    [Export] private LimboState _idle;
    [Export] private LimboState _move;

    public override void _Ready()
    {
        _hsm.AddTransition(_idle, _move, _idle.EventFinished);
        _hsm.AddTransition(_move, _idle, _move.EventFinished);
        _hsm.Initialize(this);
        _hsm.SetActive(true);
    }
}
```

### GDScript — state script

```gdscript
# IdleState.gd
extends LimboState

func _setup() -> void:
    pass  # agent and blackboard available; runs once during hsm.initialize()

func _enter() -> void:
    agent.get_node("AnimationPlayer").play("idle")

func _exit() -> void:
    pass

func _update(delta: float) -> void:
    if Input.get_vector(&"ui_left", &"ui_right", &"ui_up", &"ui_down").length() > 0.1:
        dispatch(EVENT_FINISHED)
```

### C# — state script

```csharp
// IdleState.cs
using Godot;

public partial class IdleState : LimboState
{
    public override void _Setup() { }

    public override void _Enter()
    {
        Agent.GetNode<AnimationPlayer>("AnimationPlayer").Play("idle");
    }

    public override void _Exit() { }

    public override void _Update(double delta)
    {
        if (Input.GetVector("ui_left", "ui_right", "ui_up", "ui_down").Length() > 0.1f)
            Dispatch(EventFinished);
    }
}
```

---

## Implementation checklist

- [ ] `BTPlayer` added as a child of the agent; `behavior_tree` resource assigned
- [ ] Custom tasks annotated with `@tool` (GDScript) or `[Tool]` (C#) for editor display
- [ ] Every `_tick` returns `SUCCESS`, `FAILURE`, or `RUNNING` — never `void`/`null`
- [ ] Blackboard keys documented as exported `StringName` properties (suffix `_var`)
- [ ] C# Blackboard reads cast the `Variant` explicitly (`(float)Blackboard.GetVar(...)`)
- [ ] C# uses module build (not GDExtension) for C# support
- [ ] `BTPlayer.updated` signal used (not deprecated `behavior_tree_finished`)
- [ ] HSM: all `LimboState` nodes wired with `add_transition` before `initialize()`
- [ ] HSM: `set_active(true)` called after `initialize()`
- [ ] HSM transitions are exhaustive — every reachable state has an exit path
- [ ] `BBParam` inspector binding: use module build; GDExtension lacks the param editor UI
