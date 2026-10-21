# Grabbing Objects

Reference for `skills/xr-development/SKILL.md` — physics-based grabbing pattern (controller area + RigidBody3D freeze-and-reparent + release on grip). GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Grabbing Objects

### Physics-Based Grabbing

Freeze the body and reparent it to the controller while held; on release, restore the parent, unfreeze it, and hand it the controller's velocity. (A joint from the controller does not work: `XRController3D` is not a `PhysicsBody3D`, so the joint reports "Node A must be a PhysicsBody3D" and is never created.)

```gdscript
extends XRController3D

var _held_object: RigidBody3D = null
var _held_parent: Node = null

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
    for body in grab_area.get_overlapping_bodies():
        if body is RigidBody3D:
            _held_object = body
            _held_parent = body.get_parent()
            _held_object.freeze = true      # stop the simulation while held
            _held_object.reparent(self)     # keeps its global transform
            break

func _release() -> void:
    _held_object.reparent(_held_parent)
    _held_object.freeze = false
    var pose := get_pose()
    if pose:
        # Apply controller velocity to the thrown object
        _held_object.linear_velocity = pose.linear_velocity
        _held_object.angular_velocity = pose.angular_velocity
    _held_object = null
```

```csharp
public partial class XRGrabController : XRController3D
{
    private RigidBody3D _heldObject = null;
    private Node _heldParent = null;

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
                _heldParent = rigidBody.GetParent();
                _heldObject.Freeze = true;   // stop the simulation while held
                _heldObject.Reparent(this);  // keeps its global transform
                break;
            }
        }
    }

    private void Release()
    {
        _heldObject.Reparent(_heldParent);
        _heldObject.Freeze = false;
        var pose = GetPose();
        if (pose != null)
        {
            // Apply controller velocity to the thrown object
            _heldObject.LinearVelocity = pose.LinearVelocity;
            _heldObject.AngularVelocity = pose.AngularVelocity;
        }
        _heldObject = null;
    }
}
```

---

