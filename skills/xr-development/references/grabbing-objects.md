# Grabbing Objects

Reference for `skills/xr-development/SKILL.md` — physics-based grabbing pattern (controller area + RigidBody3D capture + release on trigger). GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Grabbing Objects

### Physics-Based Grabbing

```gdscript
extends XRController3D

var _held_object: RigidBody3D = null
var _grab_joint: Generic6DOFJoint3D = null

@onready var grab_area: Area3D = $GrabArea  # small Area3D at controller position

func _ready() -> void:
    button_pressed.connect(_on_button_pressed)
    button_released.connect(_on_button_released)

func _on_button_pressed(button_name: String) -> void:
    if button_name == "grip_click" and _held_object == null:
        _try_grab()

func _on_button_released(button_name: String) -> void:
    if button_name == "grip_click" and _held_object != null:
        _release()

func _try_grab() -> void:
    var bodies: Array[Node3D] = grab_area.get_overlapping_bodies()
    for body in bodies:
        if body is RigidBody3D:
            _held_object = body
            # Create a joint to attach object to controller
            _grab_joint = Generic6DOFJoint3D.new()
            add_child(_grab_joint)
            _grab_joint.node_a = get_path()
            _grab_joint.node_b = _held_object.get_path()
            break

func _release() -> void:
    if _grab_joint:
        _grab_joint.queue_free()
        _grab_joint = null
    if _held_object:
        # Apply controller velocity to thrown object
        _held_object.linear_velocity = get_pose().linear_velocity
        _held_object.angular_velocity = get_pose().angular_velocity
        _held_object = null
```

```csharp
public partial class XRGrabController : XRController3D
{
    private RigidBody3D _heldObject = null;
    private Generic6DofJoint3D _grabJoint = null;

    [Export] public Area3D GrabArea { get; set; }

    public override void _Ready()
    {
        ButtonPressed += OnButtonPressed;
        ButtonReleased += OnButtonReleased;
    }

    private void OnButtonPressed(string buttonName)
    {
        if (buttonName == "grip_click" && _heldObject == null)
            TryGrab();
    }

    private void OnButtonReleased(string buttonName)
    {
        if (buttonName == "grip_click" && _heldObject != null)
            Release();
    }

    private void TryGrab()
    {
        foreach (var body in GrabArea.GetOverlappingBodies())
        {
            if (body is RigidBody3D rigidBody)
            {
                _heldObject = rigidBody;
                _grabJoint = new Generic6DofJoint3D();
                AddChild(_grabJoint);
                _grabJoint.NodeA = GetPath();
                _grabJoint.NodeB = _heldObject.GetPath();
                break;
            }
        }
    }

    private void Release()
    {
        if (_grabJoint != null)
        {
            _grabJoint.QueueFree();
            _grabJoint = null;
        }
        if (_heldObject != null)
        {
            var pose = GetPose();
            _heldObject.LinearVelocity = pose.LinearVelocity;
            _heldObject.AngularVelocity = pose.AngularVelocity;
            _heldObject = null;
        }
    }
}
```

---

