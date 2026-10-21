# Touch Input

Reference for `skills/input-handling/SKILL.md` — basic touch events, the emulate-touch settings, and the Godot 4.7 `VirtualJoystick` on-screen stick.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Touch Input

### Basic Touch Events

```gdscript
func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventScreenTouch:
        if event.pressed:
            print("Touch at: ", event.position)
        else:
            print("Touch released")

    if event is InputEventScreenDrag:
        print("Drag delta: ", event.relative)
```

```csharp
public override void _UnhandledInput(InputEvent @event)
{
    if (@event is InputEventScreenTouch touch)
    {
        if (touch.Pressed)
            GD.Print($"Touch at: {touch.Position}");
        else
            GD.Print("Touch released");
    }

    if (@event is InputEventScreenDrag drag)
        GD.Print($"Drag delta: {drag.Relative}");
}
```

### Emulate Touch from Mouse

Enable in **Project > Project Settings > Input Devices > Pointing > Emulate Touch From Mouse**. This lets you test touch input on desktop with mouse clicks.

The reverse (**Emulate Mouse From Touch**) is enabled by default — touchscreen taps generate mouse events so UI controls work on mobile without changes.

### VirtualJoystick (Godot 4.7+)

Godot 4.7 adds a built-in `VirtualJoystick` Control node for on-screen touch joysticks. Add it to a `CanvasLayer`, point its `action_up/down/left/right` properties (`StringName`, defaults `&"ui_up"` etc.) at your movement actions, and it triggers those actions like a physical stick.

```gdscript
@onready var joystick: VirtualJoystick = $CanvasLayer/VirtualJoystick

func _ready() -> void:
    joystick.action_left = &"move_left"
    joystick.action_right = &"move_right"
    joystick.action_up = &"move_up"
    joystick.action_down = &"move_down"
    joystick.joystick_mode = VirtualJoystick.JOYSTICK_DYNAMIC  # recenters on touch
    joystick.visibility_mode = VirtualJoystick.VISIBILITY_WHEN_TOUCHED

func _physics_process(_delta: float) -> void:
    # The joystick drives the actions — normal polling just works
    var direction := Input.get_vector("move_left", "move_right", "move_up", "move_down")
```

```csharp
private VirtualJoystick _joystick;

public override void _Ready()
{
    _joystick = GetNode<VirtualJoystick>("CanvasLayer/VirtualJoystick");
    _joystick.ActionLeft = "move_left";
    _joystick.ActionRight = "move_right";
    _joystick.ActionUp = "move_up";
    _joystick.ActionDown = "move_down";
    _joystick.JoystickMode = VirtualJoystick.JoystickModeEnum.Dynamic;
    _joystick.VisibilityMode = VirtualJoystick.VisibilityModeEnum.WhenTouched;
}

public override void _PhysicsProcess(double delta)
{
    Vector2 direction = Input.GetVector("move_left", "move_right", "move_up", "move_down");
}
```

Tune `deadzone_ratio` (default `0.0` — InputMap action deadzones apply on top), `clampzone_ratio` (`1.0`), `joystick_size` (`100.0` px), and `tip_size` (`50.0` px); restyle via the `normal_joystick`/`normal_tip` and `pressed_joystick`/`pressed_tip` StyleBox theme slots. The `released(input_vector)` and `flicked(input_vector)` signals report final direction and strength.
