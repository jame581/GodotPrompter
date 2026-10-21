# Action Rebinding at Runtime

Reference for `skills/input-handling/SKILL.md` — adding actions in code, plus the full action-rebinding flow with GDScript and C#: capture new key, swap action's events, persist via ConfigFile, restore on launch.

> ← Back to [SKILL.md](../SKILL.md)

---
## 2. Input Map Setup — Adding Actions in Code

```gdscript
# Typically done in an autoload _ready(), not every frame
func _ready() -> void:
    if not InputMap.has_action("move_left"):
        InputMap.add_action("move_left")
        var event := InputEventKey.new()
        event.physical_keycode = KEY_A
        InputMap.action_add_event("move_left", event)
```

```csharp
public override void _Ready()
{
    if (!InputMap.HasAction("move_left"))
    {
        InputMap.AddAction("move_left");
        var ev = new InputEventKey();
        ev.PhysicalKeycode = Key.A;
        InputMap.ActionAddEvent("move_left", ev);
    }
}
```

> **Best practice:** Define actions in the editor Input Map. Only add actions in code for dynamically generated bindings or mod support.

---
## 7. Action Rebinding at Runtime

Allow players to change their key bindings in-game.

### GDScript

```gdscript
# rebind_button.gd — attach to a Button in a settings menu
extends Button

@export var action_name: String = "jump"

var _is_listening: bool = false


func _ready() -> void:
    _update_label()


func _pressed() -> void:
    _is_listening = true
    text = "Press a key..."


func _unhandled_input(event: InputEvent) -> void:
    if not _is_listening:
        return

    # Accept keyboard, mouse button, and gamepad button events
    if not (event is InputEventKey or event is InputEventMouseButton or event is InputEventJoypadButton):
        return

    # Ignore modifier-only presses (Shift, Ctrl, Alt alone)
    if event is InputEventKey and event.keycode in [KEY_SHIFT, KEY_CTRL, KEY_ALT, KEY_META]:
        return

    # Replace all existing events for this action
    InputMap.action_erase_events(action_name)
    InputMap.action_add_event(action_name, event)

    _is_listening = false
    _update_label()
    get_viewport().set_input_as_handled()


func _update_label() -> void:
    var events := InputMap.action_get_events(action_name)
    if events.size() > 0:
        text = "%s: %s" % [action_name, events[0].as_text()]
    else:
        text = "%s: (unbound)" % action_name
```

### C#

```csharp
using Godot;

public partial class RebindButton : Button
{
    [Export] public string ActionName { get; set; } = "jump";

    private bool _isListening;

    public override void _Ready()
    {
        UpdateLabel();
        Pressed += OnPressed;
    }

    private void OnPressed()
    {
        _isListening = true;
        Text = "Press a key...";
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (!_isListening)
            return;

        if (@event is not (InputEventKey or InputEventMouseButton or InputEventJoypadButton))
            return;

        if (@event is InputEventKey keyEvent &&
            keyEvent.Keycode is Key.Shift or Key.Ctrl or Key.Alt or Key.Meta)
            return;

        InputMap.ActionEraseEvents(ActionName);
        InputMap.ActionAddEvent(ActionName, @event);

        _isListening = false;
        UpdateLabel();
        GetViewport().SetInputAsHandled();
    }

    private void UpdateLabel()
    {
        var events = InputMap.ActionGetEvents(ActionName);
        Text = events.Count > 0
            ? $"{ActionName}: {events[0].AsText()}"
            : $"{ActionName}: (unbound)";
    }
}
```

### Saving & Loading Bindings

```gdscript
# Save current bindings to ConfigFile
func save_bindings(config: ConfigFile) -> void:
    for action in InputMap.get_actions():
        # Skip built-in ui_* actions
        if action.begins_with("ui_"):
            continue
        var events := InputMap.action_get_events(action)
        var event_data: Array[Dictionary] = []
        for event in events:
            event_data.append({
                "type": event.get_class(),
                "data": var_to_str(event)
            })
        config.set_value("input", action, event_data)
    config.save("user://input_bindings.cfg")


# Load saved bindings
func load_bindings() -> void:
    var config := ConfigFile.new()
    if config.load("user://input_bindings.cfg") != OK:
        return
    for action in config.get_section_keys("input"):
        if not InputMap.has_action(action):
            continue
        InputMap.action_erase_events(action)
        var event_data: Array = config.get_value("input", action, [])
        for entry in event_data:
            var event: InputEvent = str_to_var(entry["data"])
            if event:
                InputMap.action_add_event(action, event)
```

```csharp
public void SaveBindings()
{
    var config = new ConfigFile();
    foreach (StringName action in InputMap.GetActions())
    {
        if (((string)action).StartsWith("ui_"))
            continue;
        var events = InputMap.ActionGetEvents(action);
        var eventData = new Godot.Collections.Array();
        foreach (var ev in events)
        {
            var dict = new Godot.Collections.Dictionary
            {
                { "type", ev.GetClass() },
                { "data", GD.VarToStr(ev) }
            };
            eventData.Add(dict);
        }
        config.SetValue("input", action, eventData);
    }
    config.Save("user://input_bindings.cfg");
}

public void LoadBindings()
{
    var config = new ConfigFile();
    if (config.Load("user://input_bindings.cfg") != Error.Ok)
        return;
    foreach (string action in config.GetSectionKeys("input"))
    {
        if (!InputMap.HasAction(action))
            continue;
        InputMap.ActionEraseEvents(action);
        var eventData = (Godot.Collections.Array)config.GetValue("input", action, new Godot.Collections.Array());
        foreach (var entry in eventData)
        {
            var dict = (Godot.Collections.Dictionary)entry;
            var ev = GD.StrToVar((string)dict["data"]).As<InputEvent>();
            if (ev != null)
                InputMap.ActionAddEvent(action, ev);
        }
    }
}
```

---

