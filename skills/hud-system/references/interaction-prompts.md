# Interaction Prompts

Reference for `skills/hud-system/SKILL.md` — screen-space "Press E to interact" prompt + Interactable Area2D. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 7. Interaction Prompts

Show a "Press E to interact" prompt near interactable objects. The prompt can be placed in screen space (always a fixed distance from the actor on screen) or in world space (floats above the object in the game world, moves with camera).

### GDScript — Screen-Space Prompt (recommended for most games)

The prompt lives in the HUD `CanvasLayer`. Its position is updated each frame by converting the interactable's world position to screen coordinates.

```gdscript
## interaction_prompt.gd — attach to a Label or Control inside the HUD CanvasLayer
extends Label

## Pixel offset above the interactable's screen position.
@export var offset: Vector2 = Vector2(0.0, -48.0)

var _target: Node2D = null


func _ready() -> void:
    hide()


## Call this when the player enters an interactable's Area2D.
func show_for(target: Node2D, action_name: String = "interact") -> void:
    _target = target
    var key: String = _get_key_label(action_name)
    text = "Press %s to interact" % key
    show()


## Call this when the player exits the Area2D.
func hide_prompt() -> void:
    _target = null
    hide()


func _process(_delta: float) -> void:
    if not _target or not visible:
        return
    # Convert world position → screen position
    var screen_pos: Vector2 = get_viewport().get_canvas_transform() * _target.global_position
    global_position = screen_pos + offset


func _get_key_label(action_name: String) -> String:
    var events: Array[InputEvent] = InputMap.action_get_events(action_name)
    for event in events:
        if event is InputEventKey:
            return event.as_text_physical_keycode()
        if event is InputEventJoypadButton:
            return event.as_text()
    return "[%s]" % action_name
```

### C# — Screen-Space Prompt

```csharp
// InteractionPrompt.cs — attach to a Label or Control inside the HUD CanvasLayer
using Godot;

public partial class InteractionPrompt : Label
{
    /// <summary>Pixel offset above the interactable's screen position.</summary>
    [Export] public Vector2 Offset { get; set; } = new(0.0f, -48.0f);

    private Node2D _target;

    public override void _Ready()
    {
        Hide();
    }

    /// <summary>Call when the player enters an interactable's Area2D.</summary>
    public void ShowFor(Node2D target, string actionName = "interact")
    {
        _target = target;
        string key = GetKeyLabel(actionName);
        Text = $"Press {key} to interact";
        Show();
    }

    /// <summary>Call when the player exits the Area2D.</summary>
    public void HidePrompt()
    {
        _target = null;
        Hide();
    }

    public override void _Process(double delta)
    {
        if (_target == null || !Visible)
            return;
        var screenPos = GetViewport().GetCanvasTransform() * _target.GlobalPosition;
        GlobalPosition = screenPos + Offset;
    }

    private static string GetKeyLabel(string actionName)
    {
        var events = InputMap.ActionGetEvents(actionName);
        foreach (var ev in events)
        {
            if (ev is InputEventKey key)
                return key.AsTextPhysicalKeycode();
            if (ev is InputEventJoypadButton btn)
                return btn.AsText();
        }
        return $"[{actionName}]";
    }
}
```

### Interactable Area2D (GDScript)

```gdscript
## interactable.gd — attach to an Area2D on the interactable object
extends Area2D

## Group used to find the HUD interaction prompt — set on the Label in the HUD.
const PROMPT_GROUP := "interaction_prompt"


func _ready() -> void:
    body_entered.connect(_on_body_entered)
    body_exited.connect(_on_body_exited)


func _on_body_entered(body: Node2D) -> void:
    if not body.is_in_group("player"):
        return
    _get_prompt().show_for(self)


func _on_body_exited(body: Node2D) -> void:
    if not body.is_in_group("player"):
        return
    _get_prompt().hide_prompt()


func _get_prompt() -> InteractionPrompt:
    return get_tree().get_first_node_in_group(PROMPT_GROUP) as InteractionPrompt
```

### Interactable Area2D (C#)

```csharp
// Interactable.cs — attach to an Area2D on the interactable object
using Godot;

public partial class Interactable : Area2D
{
    private const string PromptGroup = "interaction_prompt";

    public override void _Ready()
    {
        BodyEntered += OnBodyEntered;
        BodyExited += OnBodyExited;
    }

    private void OnBodyEntered(Node2D body)
    {
        if (!body.IsInGroup("player"))
            return;
        GetPrompt()?.ShowFor(this);
    }

    private void OnBodyExited(Node2D body)
    {
        if (!body.IsInGroup("player"))
            return;
        GetPrompt()?.HidePrompt();
    }

    private InteractionPrompt GetPrompt()
    {
        return GetTree().GetFirstNodeInGroup(PromptGroup) as InteractionPrompt;
    }
}
```

**World-space alternative:** Instead of a HUD Label, add a `Label3D` (3D) or a `Label` with `top_level = true` (2D) directly to the interactable scene. This floats above the object in world space and is naturally occluded by camera zoom or rotation. The trade-off is that it requires a `CanvasItem` in the world tree rather than the HUD layer, and does not automatically stay in screen bounds.

---

