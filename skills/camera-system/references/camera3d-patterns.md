# Camera3D Patterns

Reference for `skills/camera-system/SKILL.md` — third-person follow with SpringArm3D, orbit camera (mouse drag), first-person camera.

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. Camera3D Patterns

### Third-Person Follow with SpringArm3D

`SpringArm3D` automatically shortens the arm when something is between the camera and the player, preventing the camera from clipping through walls.

```gdscript
## ThirdPersonCamera.gd — attach to the SpringArm3D node
## Scene: Player (CharacterBody3D) > CameraPivot (Node3D) > SpringArm3D > Camera3D
extends SpringArm3D

@export var target: Node3D          # The player body
@export var follow_speed: float = 10.0
@export var mouse_sensitivity: float = 0.003

# Pitch limits (radians)
@export var min_pitch: float = -0.6
@export var max_pitch: float = 1.0

var _yaw: float = 0.0
var _pitch: float = 0.0

func _ready() -> void:
    Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
    top_level = true  # Detach from player hierarchy so we control position manually

func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
        _yaw   -= event.relative.x * mouse_sensitivity
        _pitch  = clamp(_pitch - event.relative.y * mouse_sensitivity, min_pitch, max_pitch)

func _process(delta: float) -> void:
    if not target:
        return
    # Follow target position
    global_position = global_position.lerp(target.global_position, follow_speed * delta)
    # Apply accumulated mouse rotation
    rotation = Vector3(_pitch, _yaw, 0.0)
```

```csharp
// ThirdPersonCamera.cs — attach to the SpringArm3D node
// Scene: Player (CharacterBody3D) > CameraPivot (Node3D) > SpringArm3D > Camera3D
using Godot;

public partial class ThirdPersonCamera : SpringArm3D
{
    [Export] public Node3D Target;            // The player body
    [Export] public float FollowSpeed = 10.0f;
    [Export] public float MouseSensitivity = 0.003f;

    // Pitch limits (radians)
    [Export] public float MinPitch = -0.6f;
    [Export] public float MaxPitch = 1.0f;

    private float _yaw;
    private float _pitch;

    public override void _Ready()
    {
        Input.MouseMode = Input.MouseModeEnum.Captured;
        TopLevel = true; // Detach from player hierarchy so we control position manually
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event is InputEventMouseMotion motion && Input.MouseMode == Input.MouseModeEnum.Captured)
        {
            _yaw -= motion.Relative.X * MouseSensitivity;
            _pitch = Mathf.Clamp(_pitch - motion.Relative.Y * MouseSensitivity, MinPitch, MaxPitch);
        }
    }

    public override void _Process(double delta)
    {
        if (Target == null)
            return;
        // Follow target position
        GlobalPosition = GlobalPosition.Lerp(Target.GlobalPosition, FollowSpeed * (float)delta);
        // Apply accumulated mouse rotation
        Rotation = new Vector3(_pitch, _yaw, 0.0f);
    }
}
```

**Minimum scene tree:**

```
Player (CharacterBody3D)
└── (no camera here — SpringArm is top_level and follows via code)

SpringArm3D  (CameraPivot, top_level = true via code)
└── Camera3D
```

### Orbit Camera (Mouse Drag)

```gdscript
extends Camera3D

@export var target: Node3D
@export var orbit_distance: float = 5.0
@export var orbit_speed: float = 0.005
@export var zoom_speed: float = 0.5
@export var min_distance: float = 1.0
@export var max_distance: float = 20.0

var _yaw: float = 0.0
var _pitch: float = 0.3  # slight downward angle by default

func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):
        _yaw   -= event.relative.x * orbit_speed
        _pitch  = clamp(_pitch - event.relative.y * orbit_speed, -1.4, 1.4)

    if event is InputEventMouseButton:
        if event.button_index == MOUSE_BUTTON_WHEEL_UP:
            orbit_distance = maxf(orbit_distance - zoom_speed, min_distance)
        elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
            orbit_distance = minf(orbit_distance + zoom_speed, max_distance)

func _process(_delta: float) -> void:
    if not target:
        return
    # Spherical coordinates → Cartesian offset
    var offset := Vector3(
        orbit_distance * cos(_pitch) * sin(_yaw),
        orbit_distance * sin(_pitch),
        orbit_distance * cos(_pitch) * cos(_yaw)
    )
    global_position = target.global_position + offset
    look_at(target.global_position)
```

```csharp
using Godot;

public partial class OrbitCamera : Camera3D
{
    [Export] public Node3D Target;
    [Export] public float OrbitDistance = 5.0f;
    [Export] public float OrbitSpeed = 0.005f;
    [Export] public float ZoomSpeed = 0.5f;
    [Export] public float MinDistance = 1.0f;
    [Export] public float MaxDistance = 20.0f;

    private float _yaw;
    private float _pitch = 0.3f; // slight downward angle by default

    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event is InputEventMouseMotion motion && Input.IsMouseButtonPressed(MouseButton.Right))
        {
            _yaw -= motion.Relative.X * OrbitSpeed;
            _pitch = Mathf.Clamp(_pitch - motion.Relative.Y * OrbitSpeed, -1.4f, 1.4f);
        }

        if (@event is InputEventMouseButton btn)
        {
            if (btn.ButtonIndex == MouseButton.WheelUp)
                OrbitDistance = Mathf.Max(OrbitDistance - ZoomSpeed, MinDistance);
            else if (btn.ButtonIndex == MouseButton.WheelDown)
                OrbitDistance = Mathf.Min(OrbitDistance + ZoomSpeed, MaxDistance);
        }
    }

    public override void _Process(double delta)
    {
        if (Target == null)
            return;
        // Spherical coordinates → Cartesian offset
        var offset = new Vector3(
            OrbitDistance * Mathf.Cos(_pitch) * Mathf.Sin(_yaw),
            OrbitDistance * Mathf.Sin(_pitch),
            OrbitDistance * Mathf.Cos(_pitch) * Mathf.Cos(_yaw)
        );
        GlobalPosition = Target.GlobalPosition + offset;
        LookAt(Target.GlobalPosition);
    }
}
```

### First-Person Camera

First-person camera setup is covered in the **player-controller** skill (section 4). The key points: attach `Camera3D` as a child of a `Head` node on the `CharacterBody3D`, rotate the body for yaw, rotate the head for pitch, and clamp pitch to `±PI/2`.

---

