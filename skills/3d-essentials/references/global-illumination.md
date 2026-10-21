# Global Illumination

Reference for `skills/3d-essentials/SKILL.md` — GI methods comparison, ReflectionProbe, LightmapGI, SDFGI deep dive, and the 4.5+ specular occlusion and bent normal map notes, which apply across GI methods.

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. Global Illumination

### GI Methods Comparison

| Method          | Quality   | Performance | Dynamic | Renderer  | Use For                    |
|-----------------|-----------|-------------|---------|-----------|----------------------------|
| None (ambient)  | Low       | Free        | Yes     | All       | Simple/stylized games      |
| `ReflectionProbe` | Medium  | Low         | Optional | All      | Localized reflections      |
| `LightmapGI`   | High      | Free at runtime | No   | All (bake: Forward+/Mobile editor) | Static scenes (archviz)    |
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

### Specular Occlusion from Ambient Light (Godot 4.5+)

Godot 4.5+ dims indirect specular (sky, ReflectionProbe, GI reflections) by the brightness of the ambient light reaching each pixel, in all three renderers. This prevents unrealistically bright reflections in areas that receive little indirect light (under eaves, in crevices and corners). It is on by default and needs no re-bake: turn it off globally with `rendering/reflections/specular_occlusion/enabled`, or per shader with `render_mode specular_occlusion_disabled`.

### Bent Normal Maps (Godot 4.5+)

Bent normal maps encode the mean unoccluded direction from each texel — the average direction toward open sky across the hemisphere. When assigned to the **Bent Normal** slot on `StandardMaterial3D`, Godot uses this information to improve indirect lighting directionality and specular occlusion accuracy. The result is more realistic ambient lighting on complex surfaces like cloth, carved stone, or organic shapes.

**Inspector setup:** In `StandardMaterial3D`, enable **Bent Normal** → assign your tangent-space bent normal texture (baked from Marmoset, Substance, or xNormal).

> **Most visible on:** materials that combine low roughness or high metallic values with baked GI (LightmapGI / VoxelGI / SDFGI). On fully rough dielectric surfaces the benefit is subtler. Use on hero assets; skip on background geometry.

> See [materials-and-lighting-recipes.md](materials-and-lighting-recipes.md#bent-normal-maps-godot-45) for the runtime-assignment GDScript + C# code path (the Inspector setup above is the typical case).
