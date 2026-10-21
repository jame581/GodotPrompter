# Global Illumination

Reference for `skills/3d-essentials/SKILL.md` — GI methods comparison, ReflectionProbe, LightmapGI, SDFGI deep dive. The 4.5+ Specular Occlusion and Bent Normal Maps notes stay in core SKILL.md.

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. Global Illumination

### GI Methods Comparison

| Method          | Quality   | Performance | Dynamic | Renderer  | Use For                    |
|-----------------|-----------|-------------|---------|-----------|----------------------------|
| None (ambient)  | Low       | Free        | Yes     | All       | Simple/stylized games      |
| `ReflectionProbe` | Medium  | Low         | Optional | All      | Localized reflections      |
| `LightmapGI`   | High      | Free at runtime | No   | Forward+  | Static scenes (archviz)    |
| `VoxelGI`       | High      | High        | Yes     | Forward+  | Small-medium dynamic scenes |
| `SDFGI`         | Medium-High | Medium    | Yes     | Forward+  | Large open-world scenes    |

### ReflectionProbe

Captures the surrounding environment into a cubemap for reflections on nearby objects.

```
Room (Node3D)
├── ReflectionProbe      ← extents cover the room
├── MeshInstance3D (walls)
└── MeshInstance3D (shiny floor)
```

```gdscript
@onready var probe: ReflectionProbe = $ReflectionProbe

func _ready() -> void:
    probe.size = Vector3(10.0, 4.0, 10.0)  # cover the room
    probe.update_mode = ReflectionProbe.UPDATE_ONCE  # bake once, free at runtime
```

```csharp
public override void _Ready()
{
    var probe = GetNode<ReflectionProbe>("ReflectionProbe");
    probe.Size = new Vector3(10.0f, 4.0f, 10.0f);
    probe.UpdateMode = ReflectionProbe.UpdateModeEnum.Once;
}
```

### LightmapGI (Baked)

Best quality, zero runtime cost. Requires UV2 on meshes (auto-generated on import).

1. Add a **LightmapGI** node to the scene
2. Set all static lights to **Bake Mode: Static**
3. Set all static meshes to **GI Mode: Static** in the GeometryInstance3D section
4. Select LightmapGI → click **Bake Lightmaps** in the toolbar
5. Baked data is saved as a `LightmapGIData` resource — commit it with your project

### SDFGI (Real-Time)

Enable on the Environment resource — no nodes needed:

```gdscript
var env: Environment = $WorldEnvironment.environment
env.sdfgi_enabled = true
env.sdfgi_cascades = 4
env.sdfgi_use_occlusion = true
```

```csharp
var env = GetNode<WorldEnvironment>("WorldEnvironment").Environment;
env.SdfgiEnabled = true;
env.SdfgiCascades = 4;
env.SdfgiUseOcclusion = true;
```

