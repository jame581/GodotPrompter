# Fog Recipes

Reference for `skills/3d-essentials/SKILL.md` — depth fog, height fog, volumetric fog, FogVolume.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Fog

### Depth & Height Fog (Environment)

Simple fog configured on the Environment resource:

#### GDScript

```gdscript
var env: Environment = $WorldEnvironment.environment

# Depth fog — increases with distance from camera
env.fog_enabled = true
env.fog_light_color = Color(0.7, 0.75, 0.8)
env.fog_density = 0.01

# Height fog — thicker below a certain Y level
env.fog_height = 0.0
env.fog_height_density = 0.5

# Sun scattering — tints fog with directional light color
env.fog_sun_scatter = 0.3
```

#### C#

```csharp
var env = GetNode<WorldEnvironment>("WorldEnvironment").Environment;
env.FogEnabled = true;
env.FogLightColor = new Color(0.7f, 0.75f, 0.8f);
env.FogDensity = 0.01f;
env.FogHeight = 0.0f;
env.FogHeightDensity = 0.5f;
env.FogSunScatter = 0.3f;
```

### Volumetric Fog (Forward+ only)

Realistic fog that interacts with lights and casts volumetric shadows.

Enable on the Environment:

```gdscript
env.volumetric_fog_enabled = true
env.volumetric_fog_density = 0.05
env.volumetric_fog_albedo = Color(0.9, 0.9, 0.9)
env.volumetric_fog_emission = Color(0.0, 0.0, 0.0)
env.volumetric_fog_length = 64.0
env.volumetric_fog_temporal_reprojection_enabled = true
```

```csharp
var env = GetNode<WorldEnvironment>("WorldEnvironment").Environment;
env.VolumetricFogEnabled = true;
env.VolumetricFogDensity = 0.05f;
env.VolumetricFogAlbedo = new Color(0.9f, 0.9f, 0.9f);
env.VolumetricFogEmission = new Color(0.0f, 0.0f, 0.0f);
env.VolumetricFogLength = 64.0f;
env.VolumetricFogTemporalReprojectionEnabled = true;
```

> ⚠️ **Changed in Godot 4.7:** Volumetric fog is now blended using transmittance instead of opacity, so fog tuned on earlier versions can look different after upgrading. Enable the project setting `rendering/environment/fog/use_legacy_blending` (default `false`) to restore the previous behavior. See [GH-119414](https://github.com/godotengine/godot/pull/119414).

### FogVolume (Localized Fog)

Create fog in specific areas (caves, steam vents, magic effects):

```
Scene
├── WorldEnvironment (volumetric_fog_enabled = true, density = 0.0)
└── FogVolume
    shape = Box
    size = Vector3(5, 3, 5)
    material = FogMaterial (density = 1.0)
```

```gdscript
func create_fog_cloud(pos: Vector3) -> void:
    var fog := FogVolume.new()
    fog.shape = RenderingServer.FOG_VOLUME_SHAPE_ELLIPSOID
    fog.size = Vector3(4.0, 2.0, 4.0)
    fog.position = pos

    var mat := FogMaterial.new()
    mat.density = 0.5
    mat.albedo = Color(0.8, 0.85, 0.9)
    fog.material = mat

    add_child(fog)
```

```csharp
public void CreateFogCloud(Vector3 pos)
{
    var fog = new FogVolume();
    fog.Shape = RenderingServer.FogVolumeShape.Ellipsoid;
    fog.Size = new Vector3(4.0f, 2.0f, 4.0f);
    fog.Position = pos;

    var mat = new FogMaterial();
    mat.Density = 0.5f;
    mat.Albedo = new Color(0.8f, 0.85f, 0.9f);
    fog.Material = mat;

    AddChild(fog);
}
```

> Set global `volumetric_fog_density` to 0.0 and use FogVolume nodes to place fog only where needed. This gives full control without blanket fog everywhere.

---
