# Consuming and Propagating Input

Reference for `skills/input-handling/SKILL.md` — stopping event propagation, node processing order, receiving input while paused.

> ← Back to [SKILL.md](../SKILL.md)

---
## 8. Consuming and Propagating Input

### Stopping Event Propagation

```gdscript
func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("interact"):
        _interact()
        # Mark as handled — no other node receives this event
        get_viewport().set_input_as_handled()
```

```csharp
public override void _UnhandledInput(InputEvent @event)
{
    if (@event.IsActionPressed("interact"))
    {
        Interact();
        GetViewport().SetInputAsHandled();
    }
}
```

### Node Processing Order

Input propagates in **reverse scene tree order** (deepest child first, root last). To control which node gets input first:

- Move it deeper in the tree, or
- Use `Node.set_process_input(true/false)` to enable/disable input on specific nodes
- Call `get_viewport().set_input_as_handled()` to stop propagation

### Paused Input

By default, `_unhandled_input()` and `_input()` don't fire when the tree is paused. To receive input during pause (e.g., pause menu):

```gdscript
# On the pause menu node:
func _ready() -> void:
    process_mode = Node.PROCESS_MODE_ALWAYS
```

```csharp
public override void _Ready()
{
    ProcessMode = ProcessModeEnum.Always;
}
```

---
