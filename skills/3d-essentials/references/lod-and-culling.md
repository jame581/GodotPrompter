# LOD, Culling, MultiMesh

Reference for `skills/3d-essentials/SKILL.md` — mesh LOD, visibility ranges, occlusion culling, MultiMeshInstance3D.

> ← Back to [SKILL.md](../SKILL.md)

---
## 8. Optimization — LOD, Culling, MultiMesh

### Mesh LOD (Automatic)

Godot auto-generates LOD levels on import for glTF, Blend, Collada, and FBX files. No manual setup needed.

Control LOD aggressiveness:

```gdscript
# Per-object LOD bias (GeometryInstance3D property)
# > 1.0 = keep high detail longer, < 1.0 = switch to low detail sooner
$MeshInstance3D.lod_bias = 1.5
```

```csharp
GetNode<MeshInstance3D>("MeshInstance3D").LodBias = 1.5f;
```

Global LOD threshold: **Project Settings > Rendering > Mesh LOD > LOD Change > Threshold Pixels** (default 1.0 — perceptually lossless).

### Visibility Ranges (Manual LOD)

For custom LOD with different meshes at different distances:

```gdscript
# Close-up: full-detail tree (0–30m)
$TreeDetailed.visibility_range_begin = 0.0
$TreeDetailed.visibility_range_end = 30.0
$TreeDetailed.visibility_range_fade_mode = GeometryInstance3D.VISIBILITY_RANGE_FADE_SELF

# Far: billboard impostor (25–100m, with crossfade overlap)
$TreeBillboard.visibility_range_begin = 25.0
$TreeBillboard.visibility_range_end = 100.0
$TreeBillboard.visibility_range_fade_mode = GeometryInstance3D.VISIBILITY_RANGE_FADE_SELF
```

### Occlusion Culling

Prevents rendering objects hidden behind walls/large geometry.

**Setup:**
1. Enable: **Project Settings > Rendering > Occlusion Culling > Use Occlusion Culling**
2. Add an **OccluderInstance3D** node to your scene
3. Select it → click **Bake Occluders** in the 3D toolbar
4. Exclude dynamic objects via **Bake > Cull Mask** (assign them to different visual layers)

> Only bake occluders from static geometry. Moving OccluderInstance3D nodes at runtime forces expensive BVH rebuilds.

### MultiMeshInstance3D

Render thousands of identical meshes (grass, trees, debris) in a single draw call.

#### GDScript

```gdscript
func spawn_grass(positions: PackedVector3Array) -> void:
    var mm := MultiMesh.new()
    mm.transform_format = MultiMesh.TRANSFORM_3D
    mm.mesh = preload("res://meshes/grass_blade.tres")
    mm.instance_count = positions.size()

    for i in positions.size():
        var xform := Transform3D()
        xform.origin = positions[i]
        # Random rotation around Y
        xform = xform.rotated(Vector3.UP, randf() * TAU)
        # Random scale variation
        var s := randf_range(0.8, 1.2)
        xform = xform.scaled(Vector3(s, s, s))
        mm.set_instance_transform(i, xform)

    var mmi := MultiMeshInstance3D.new()
    mmi.multimesh = mm
    add_child(mmi)
```

#### C#

```csharp
public void SpawnGrass(Vector3[] positions)
{
    var mm = new MultiMesh();
    mm.TransformFormat = MultiMesh.TransformFormatEnum.Transform3D;
    mm.Mesh = GD.Load<Mesh>("res://meshes/grass_blade.tres");
    mm.InstanceCount = positions.Length;

    for (int i = 0; i < positions.Length; i++)
    {
        var xform = Transform3D.Identity;
        xform.Origin = positions[i];
        xform = xform.Rotated(Vector3.Up, (float)GD.RandRange(0, Mathf.Tau));
        float s = (float)GD.RandRange(0.8, 1.2);
        xform = xform.Scaled(new Vector3(s, s, s));
        mm.SetInstanceTransform(i, xform);
    }

    var mmi = new MultiMeshInstance3D();
    mmi.Multimesh = mm;
    AddChild(mmi);
}
```

---
