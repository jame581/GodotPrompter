# Controllers and Input

Reference for `skills/xr-development/SKILL.md` — `XRController3D` setup, common OpenXR button mappings, thumbstick locomotion.

> ← Back to [SKILL.md](../SKILL.md)

---
## 2. Controllers and Input

### XRController3D

`XRController3D` automatically tracks the physical controller's position and rotation.

```gdscript
extends XRController3D

func _ready() -> void:
    button_pressed.connect(_on_button_pressed)
    button_released.connect(_on_button_released)
    input_float_changed.connect(_on_float_changed)

func _on_button_pressed(button_name: String) -> void:
    match button_name:
        "trigger_click":
            shoot()
        "grip_click":
            grab()
        "ax_button":  # A or X depending on hand
            jump()
        "by_button":  # B or Y depending on hand
            open_menu()

func _on_button_released(button_name: String) -> void:
    if button_name == "grip_click":
        release()

func _on_float_changed(float_name: String, value: float) -> void:
    if float_name == "trigger":
        # Analog trigger value 0.0–1.0
        update_trigger_visual(value)
```

```csharp
public partial class XRControllerHandler : XRController3D
{
    public override void _Ready()
    {
        ButtonPressed += OnButtonPressed;
        ButtonReleased += OnButtonReleased;
        InputFloatChanged += OnFloatChanged;
    }

    private void OnButtonPressed(string buttonName)
    {
        switch (buttonName)
        {
            case "trigger_click": Shoot(); break;
            case "grip_click": Grab(); break;
            case "ax_button": Jump(); break;
        }
    }

    private void OnButtonReleased(string buttonName)
    {
        if (buttonName == "grip_click") Release();
    }

    private void OnFloatChanged(string floatName, double value)
    {
        if (floatName == "trigger") UpdateTriggerVisual((float)value);
    }
}
```

### Common Controller Buttons (OpenXR)

| Signal Name | Physical Button |
|-------------|----------------|
| `trigger_click` | Index finger trigger (digital) |
| `trigger` | Index finger trigger (analog float) |
| `grip_click` | Side grip |
| `grip` | Side grip (analog float) |
| `ax_button` | A (right) or X (left) |
| `by_button` | B (right) or Y (left) |
| `primary` | Thumbstick click |
| `primary_x/y` | Thumbstick axes (-1 to 1) |

### Thumbstick Locomotion

```gdscript
extends XROrigin3D

@export var move_speed: float = 2.0
@export var turn_speed: float = 2.0
@export var snap_turn_degrees: float = 30.0

@onready var left_controller: XRController3D = $LeftController
@onready var camera: XRCamera3D = $XRCamera3D

func _physics_process(delta: float) -> void:
    # Smooth locomotion from left thumbstick
    var input := Vector2(
        left_controller.get_float("primary_x"),
        left_controller.get_float("primary_y")
    )

    if input.length() > 0.1:
        # Move in camera's forward direction (ignore vertical)
        var forward := -camera.global_basis.z
        forward.y = 0.0
        forward = forward.normalized()
        var right := camera.global_basis.x
        right.y = 0.0
        right = right.normalized()

        var movement: Vector3 = (forward * input.y + right * input.x) * move_speed * delta
        global_position += movement
```

---

