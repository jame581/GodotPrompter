# Scene Tree Debugging

Reference for `skills/godot-debugging/SKILL.md` — `print_tree_pretty()`, remote scene tree, node groups for debugging, `_get_configuration_warnings()` for `@tool` scripts.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Scene Tree Debugging

### print_tree_pretty()

```gdscript
# Print the full subtree of a node in a readable format
func _ready() -> void:
    print_tree_pretty()
    # Output example:
    # ┖╴Player
    #    ┠╴CollisionShape3D
    #    ┠╴MeshInstance3D
    #    ┖╴Camera3D

# Print the entire scene tree from root
func _ready() -> void:
    get_tree().root.print_tree_pretty()
```

```csharp
// Print the full subtree of a node in a readable format
public override void _Ready()
{
    PrintTreePretty();

    // Print the entire scene tree from root
    GetTree().Root.PrintTreePretty();
}
```

### Remote Scene Tree in the Editor

1. Run the game.
2. In the **Scene** panel, click **Remote** (top-left toggle).
3. The live scene tree appears — nodes are shown with their current state.
4. Click any node to open it in the **Inspector** and edit properties in real time.
5. Use **Debugger > Breakpoints** to pause and then inspect mid-frame state.

### Node Groups for Debugging

```gdscript
# Tag nodes at runtime for batch inspection
func _ready() -> void:
    add_to_group("debug_enemies")

# Retrieve all tagged nodes from anywhere
func _input(event: InputEvent) -> void:
    if event.is_action_pressed("debug_dump_enemies"):
        for enemy in get_tree().get_nodes_in_group("debug_enemies"):
            print(enemy.name, " HP: ", enemy.health, " pos: ", enemy.global_position)
```

```csharp
// Tag nodes at runtime for batch inspection
public override void _Ready()
{
    AddToGroup("debug_enemies");
}

public override void _Input(InputEvent @event)
{
    if (@event.IsActionPressed("debug_dump_enemies"))
    {
        foreach (var node in GetTree().GetNodesInGroup("debug_enemies"))
        {
            if (node is Enemy enemy)
                GD.Print($"{enemy.Name} HP: {enemy.Health} pos: {enemy.GlobalPosition}");
        }
    }
}
```

### _get_configuration_warnings() for @tool Scripts

Use `_get_configuration_warnings()` in `@tool` scripts to surface misconfiguration warnings directly in the editor (a yellow warning icon on the node).

```gdscript
@tool
extends Node3D

@export var target_path: NodePath

func _get_configuration_warnings() -> PackedStringArray:
    var warnings := PackedStringArray()
    if target_path.is_empty():
        warnings.append("target_path must be set — this node will not function without it.")
    if not get_node_or_null(target_path) is CharacterBody3D:
        warnings.append("target_path must point to a CharacterBody3D node.")
    return warnings
```

### C\#

```csharp
#if TOOLS
[Tool]
public partial class EnemySpawner : Node3D
{
    [Export] public NodePath TargetPath { get; set; }

    public override string[] _GetConfigurationWarnings()
    {
        var warnings = new System.Collections.Generic.List<string>();
        if (TargetPath == null || TargetPath.IsEmpty)
            warnings.Add("TargetPath must be set.");
        return warnings.ToArray();
    }
}
#endif
```

---

