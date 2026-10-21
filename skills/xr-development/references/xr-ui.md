# XR UI Interaction

Reference for `skills/xr-development/SKILL.md` — in-world UI panels (`SubViewport` + `ViewportTexture` mapped to a Quad), pointer/ray interaction.

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. XR UI Interaction

### In-World UI Panels

Standard Godot `Control` nodes don't work directly in 3D XR. Use a `SubViewport` rendered onto a `MeshInstance3D`:

```
UIPanel (StaticBody3D)
├── MeshInstance3D (QuadMesh, material with SubViewport texture)
├── CollisionShape3D (for ray interaction)
└── SubViewport (size = 1024x768)
    └── Control (your UI scene)
```

### Pointer/Ray Interaction

```gdscript
extends XRController3D

@onready var ray: RayCast3D = $RayCast3D  # pointing forward from controller

func _physics_process(_delta: float) -> void:
    if ray.is_colliding():
        var collider: Object = ray.get_collider()
        if collider.has_method("xr_hover"):
            collider.xr_hover(ray.get_collision_point())

        if get_float("trigger") > 0.8:
            if collider.has_method("xr_click"):
                collider.xr_click(ray.get_collision_point())
```

```csharp
public partial class XRPointerController : XRController3D
{
    [Export] public RayCast3D Ray { get; set; }

    public override void _PhysicsProcess(double delta)
    {
        if (Ray.IsColliding())
        {
            var collider = Ray.GetCollider();
            if (collider is GodotObject obj)
            {
                if (obj.HasMethod("xr_hover"))
                    obj.Call("xr_hover", Ray.GetCollisionPoint());

                if (GetFloat("trigger") > 0.8f)
                {
                    if (obj.HasMethod("xr_click"))
                        obj.Call("xr_click", Ray.GetCollisionPoint());
                }
            }
        }
    }
}
```

> **Tip:** Use the community addon [Godot XR Tools](https://github.com/GodotVR/godot-xr-tools) for production-ready interaction systems, locomotion, and UI helpers.

---

