# Behavior Trees

Reference for `skills/ai-navigation/SKILL.md` — lightweight custom behavior tree implementation (Sequence, Selector, Action) and wiring an enemy with a chase-or-patrol BT.

> ← Back to [SKILL.md](../SKILL.md)

---

A behavior tree (BT) is a tree of nodes evaluated every tick. Three core node types:

| Type | Succeeds when | Fails when |
|---|---|---|
| **Sequence** | all children succeed (AND) | any child fails |
| **Selector** | any child succeeds (OR) | all children fail |
| **Action** | the leaf action completes | the leaf reports failure |

Sequences model "do A then B then C". Selectors model "try A, else try B, else try C".

### Lightweight GDScript Implementation

```gdscript
# bt_node.gd — base class
class_name BTNode
extends RefCounted

enum Status { SUCCESS, FAILURE, RUNNING }

func tick(actor: Node, _delta: float) -> Status:
	return Status.FAILURE
```

```gdscript
# bt_sequence.gd — run children in order; fail fast
class_name BTSequence
extends BTNode

var children: Array[BTNode] = []


func tick(actor: Node, delta: float) -> Status:
	for child in children:
		var result: BTNode.Status = child.tick(actor, delta)
		if result != Status.SUCCESS:
			return result  # FAILURE or RUNNING stops the sequence
	return Status.SUCCESS
```

```gdscript
# bt_selector.gd — try children in order; succeed on first success
class_name BTSelector
extends BTNode

var children: Array[BTNode] = []


func tick(actor: Node, delta: float) -> Status:
	for child in children:
		var result: BTNode.Status = child.tick(actor, delta)
		if result != Status.FAILURE:
			return result  # SUCCESS or RUNNING stops the selector
	return Status.FAILURE
```

```gdscript
# bt_action.gd — leaf node backed by a callable
class_name BTAction
extends BTNode

var _action: Callable


func _init(action: Callable) -> void:
	_action = action


func tick(actor: Node, delta: float) -> Status:
	return _action.call(actor, delta) as Status
```

### Lightweight C# Implementation

```csharp
// BTNode.cs — base class
public abstract class BTNode
{
    public enum Status { Success, Failure, Running }

    public virtual Status Tick(Node actor, float delta) => Status.Failure;
}
```

```csharp
// BTSequence.cs — run children in order; fail fast
using Godot;
using System.Collections.Generic;

public class BTSequence : BTNode
{
    public List<BTNode> Children { get; set; } = new();

    public override Status Tick(Node actor, float delta)
    {
        foreach (var child in Children)
        {
            var result = child.Tick(actor, delta);
            if (result != Status.Success)
                return result; // Failure or Running stops the sequence
        }
        return Status.Success;
    }
}
```

```csharp
// BTSelector.cs — try children in order; succeed on first success
using Godot;
using System.Collections.Generic;

public class BTSelector : BTNode
{
    public List<BTNode> Children { get; set; } = new();

    public override Status Tick(Node actor, float delta)
    {
        foreach (var child in Children)
        {
            var result = child.Tick(actor, delta);
            if (result != Status.Failure)
                return result; // Success or Running stops the selector
        }
        return Status.Failure;
    }
}
```

```csharp
// BTAction.cs — leaf node backed by a delegate
using Godot;
using System;

public class BTAction : BTNode
{
    private readonly Func<Node, float, Status> _action;

    public BTAction(Func<Node, float, Status> action) => _action = action;

    public override Status Tick(Node actor, float delta) => _action(actor, delta);
}
```

### Wiring a BT in an Enemy

```gdscript
extends CharacterBody2D

var _bt_root: BTNode


func _ready() -> void:
	# "Chase player OR patrol" selector
	var chase_seq := BTSequence.new()
	chase_seq.children = [
		BTAction.new(_can_see_player),
		BTAction.new(_chase_player),
	]

	var patrol_act := BTAction.new(_patrol)

	var root := BTSelector.new()
	root.children = [chase_seq, patrol_act]
	_bt_root = root


func _physics_process(delta: float) -> void:
	_bt_root.tick(self, delta)
	move_and_slide()


func _can_see_player(_actor: Node, _delta: float) -> BTNode.Status:
	var player := get_tree().get_first_node_in_group("player")
	if not is_instance_valid(player):
		return BTNode.Status.FAILURE
	return BTNode.Status.SUCCESS if global_position.distance_to(player.global_position) < 300.0 \
		else BTNode.Status.FAILURE


func _chase_player(actor: Node, _delta: float) -> BTNode.Status:
	var player := get_tree().get_first_node_in_group("player")
	velocity = (player.global_position - global_position).normalized() * 120.0
	return BTNode.Status.RUNNING


func _patrol(_actor: Node, _delta: float) -> BTNode.Status:
	# minimal inline patrol; replace with full patrol logic
	velocity = Vector2.RIGHT * 60.0
	return BTNode.Status.RUNNING
```

### C#

```csharp
using Godot;

public partial class BTEnemy : CharacterBody2D
{
    private BTNode _btRoot;

    public override void _Ready()
    {
        var chaseSeq = new BTSequence
        {
            Children = { new BTAction(CanSeePlayer), new BTAction(ChasePlayer) }
        };
        var patrolAct = new BTAction(Patrol);
        _btRoot = new BTSelector { Children = { chaseSeq, patrolAct } };
    }

    public override void _PhysicsProcess(double delta)
    {
        _btRoot.Tick(this, (float)delta);
        MoveAndSlide();
    }

    private BTNode.Status CanSeePlayer(Node actor, float delta)
    {
        var player = GetTree().GetFirstNodeInGroup("player") as Node2D;
        if (!IsInstanceValid(player)) return BTNode.Status.Failure;
        return GlobalPosition.DistanceTo(player.GlobalPosition) < 300f
            ? BTNode.Status.Success
            : BTNode.Status.Failure;
    }

    private BTNode.Status ChasePlayer(Node actor, float delta)
    {
        var player = GetTree().GetFirstNodeInGroup("player") as Node2D;
        Velocity = (player.GlobalPosition - GlobalPosition).Normalized() * 120f;
        return BTNode.Status.Running;
    }

    private BTNode.Status Patrol(Node actor, float delta)
    {
        // Minimal inline patrol; replace with full patrol logic
        Velocity = Vector2.Right * 60f;
        return BTNode.Status.Running;
    }
}
```
