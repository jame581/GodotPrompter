# Decals

Reference for `skills/3d-essentials/SKILL.md` — decal scene setup, runtime spawning, decal limits.

> ← Back to [SKILL.md](../SKILL.md)

---
## 7. Decals

Decals project textures onto surfaces without modifying the underlying mesh. Use for bullet holes, blood splatters, footprints, ground markings.

### Scene Setup

```
World
├── MeshInstance3D (floor)
└── Decal
    size = Vector3(1, 0.5, 1)   ← Y controls projection depth
    texture_albedo = footprint.png
    texture_normal = footprint_normal.png
```

### Spawning Decals from Code

#### GDScript

```gdscript
func spawn_bullet_hole(hit_pos: Vector3, hit_normal: Vector3) -> void:
    var decal := Decal.new()
    decal.size = Vector3(0.3, 0.2, 0.3)
    decal.texture_albedo = preload("res://textures/bullet_hole.png")
    decal.position = hit_pos

    # Orient decal to project along the hit surface normal
    # Decals project along -Y, so rotate to align -Y with -hit_normal
    if hit_normal.abs() != Vector3.UP:
        decal.look_at(hit_pos - hit_normal, Vector3.UP)
        decal.rotate_object_local(Vector3.RIGHT, PI / 2.0)
    # For floor/ceiling hits (normal is UP or DOWN), default orientation works

    # Fade and cleanup
    decal.distance_fade_enabled = true
    decal.distance_fade_begin = 20.0
    decal.distance_fade_length = 5.0

    get_parent().add_child(decal)

    # Remove after 30 seconds
    get_tree().create_timer(30.0).timeout.connect(decal.queue_free)
```

#### C#

```csharp
public void SpawnBulletHole(Vector3 hitPos, Vector3 hitNormal)
{
    var decal = new Decal();
    decal.Size = new Vector3(0.3f, 0.2f, 0.3f);
    decal.TextureAlbedo = GD.Load<Texture2D>("res://textures/bullet_hole.png");
    decal.Position = hitPos;

    if (hitNormal.Abs() != Vector3.Up)
    {
        decal.LookAt(hitPos - hitNormal, Vector3.Up);
        decal.RotateObjectLocal(Vector3.Right, Mathf.Pi / 2.0f);
    }

    decal.DistanceFadeEnabled = true;
    decal.DistanceFadeBegin = 20.0f;
    decal.DistanceFadeLength = 5.0f;

    GetParent().AddChild(decal);

    GetTree().CreateTimer(30.0f).Timeout += decal.QueueFree;
}
```

### Decal Limits

| Renderer     | Max Decals                              |
|--------------|-----------------------------------------|
| Forward+     | 512 clustered elements (shared with lights, probes) |
| Mobile       | 8 per mesh resource                     |
| Compatibility | Limited by max renderable elements     |

---
