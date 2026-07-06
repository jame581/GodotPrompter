# State Machine Examples

Reference for `skills/animation-system/SKILL.md` — the full GDScript and C# canonical state machine example (CharacterBody2D driving `AnimationNodeStateMachinePlayback`).

> ← Back to [SKILL.md](../SKILL.md)

---

### State Machine — GDScript

```gdscript
extends CharacterBody2D

@onready var anim_tree: AnimationTree = $AnimationTree
@onready var state_machine: AnimationNodeStateMachinePlayback = anim_tree["parameters/playback"]

func _physics_process(delta: float) -> void:
    var input_dir := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")

    if input_dir != Vector2.ZERO:
        velocity = input_dir * 200.0
        state_machine.travel("walk")
    else:
        velocity = Vector2.ZERO
        state_machine.travel("idle")

    move_and_slide()

func attack() -> void:
    # travel() transitions smoothly; use start() for immediate switch
    state_machine.travel("attack")

func get_current_state() -> StringName:
    return state_machine.get_current_node()
```

### State Machine — C#

```csharp
using Godot;

public partial class Character : CharacterBody2D
{
    private AnimationTree _animTree;
    private AnimationNodeStateMachinePlayback _stateMachine;

    public override void _Ready()
    {
        _animTree = GetNode<AnimationTree>("AnimationTree");
        _stateMachine = _animTree.Get("parameters/playback").As<AnimationNodeStateMachinePlayback>();
    }

    public override void _PhysicsProcess(double delta)
    {
        Vector2 inputDir = Input.GetVector("ui_left", "ui_right", "ui_up", "ui_down");

        if (inputDir != Vector2.Zero)
        {
            Velocity = inputDir * 200.0f;
            _stateMachine.Travel("walk");
        }
        else
        {
            Velocity = Vector2.Zero;
            _stateMachine.Travel("idle");
        }

        MoveAndSlide();
    }

    public void Attack()
    {
        _stateMachine.Travel("attack");
    }
}
```
