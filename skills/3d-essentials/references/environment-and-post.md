# Environment & Post-Processing

Reference for `skills/3d-essentials/SKILL.md` — `WorldEnvironment` setup, sky options, tonemap modes, post-processing effects, and the 4.6+ glow / SSR upgrades.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Environment & Post-Processing

### WorldEnvironment Setup

```
World (Node3D)
├── WorldEnvironment     ← holds Environment + CameraAttributes resources
├── DirectionalLight3D
├── Camera3D
└── ...
```

Set the **Environment** resource on WorldEnvironment and the **Camera Attributes** for exposure/DOF.

### Sky Options

| Sky Material           | Description                              | Use For                    |
|------------------------|------------------------------------------|----------------------------|
| `PanoramaSkyMaterial`  | 360° HDR panorama image                 | Realistic environments     |
| `ProceduralSkyMaterial` | Generated sky with color gradients     | Quick prototyping          |
| `PhysicalSkyMaterial`  | Physics-based atmosphere + sun          | Outdoor day/night cycles   |

#### GDScript

```gdscript
func setup_environment() -> void:
    var env := Environment.new()

    # Sky
    var sky := Sky.new()
    var sky_mat := ProceduralSkyMaterial.new()
    sky_mat.sky_top_color = Color(0.4, 0.6, 1.0)
    sky_mat.sky_horizon_color = Color(0.7, 0.8, 1.0)
    sky_mat.ground_bottom_color = Color(0.2, 0.15, 0.1)
    sky.sky_material = sky_mat
    env.sky = sky
    env.background_mode = Environment.BG_SKY

    # Tonemap
    env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
    env.tonemap_exposure = 1.0

    # Ambient light from sky
    env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY

    $WorldEnvironment.environment = env
```

#### C#

```csharp
public void SetupEnvironment()
{
    var env = new Godot.Environment();

    var sky = new Sky();
    var skyMat = new ProceduralSkyMaterial();
    skyMat.SkyTopColor = new Color(0.4f, 0.6f, 1.0f);
    skyMat.SkyHorizonColor = new Color(0.7f, 0.8f, 1.0f);
    skyMat.GroundBottomColor = new Color(0.2f, 0.15f, 0.1f);
    sky.SkyMaterial = skyMat;
    env.Sky = sky;
    env.BackgroundMode = Godot.Environment.BGMode.Sky;

    env.TonemapMode = Godot.Environment.ToneMapper.Filmic;
    env.TonemapExposure = 1.0f;

    env.AmbientLightSource = Godot.Environment.AmbientSource.Sky;

    GetNode<WorldEnvironment>("WorldEnvironment").Environment = env;
}
```

### Tonemap Modes

| Mode       | Character                                  | Best For                       |
|------------|---------------------------------------------|--------------------------------|
| Linear     | Clips brights — blown-out look             | Debug, deliberately flat look  |
| Reinhard   | Simple curve, preserves brights            | General use                    |
| Filmic     | Film-like contrast                          | Cinematic games                |
| ACES       | High contrast with desaturation            | Realistic/photographic         |
| AgX        | Maintains hue as brightness increases      | Physically accurate lighting   |

### Post-Processing Effects (Inspector)

Configure these on the Environment resource — no shader code needed:

| Effect    | Description                              | Renderer Support         |
|-----------|------------------------------------------|--------------------------|
| Glow      | Bloom/glow on bright surfaces            | All                      |
| SSAO      | Screen-space ambient occlusion           | Forward+ only            |
| SSIL      | Screen-space indirect lighting           | Forward+ only            |
| SSR       | Screen-space reflections                 | Forward+ only            |
| SDFGI     | Real-time GI for large scenes            | Forward+ only            |
| DOF       | Depth of field blur (via CameraAttributes) | All                   |
| Fog       | Depth and height fog                     | All                      |
| Adjustments | Brightness, contrast, saturation, color correction | All          |
| Auto Exposure | Adaptive exposure (via CameraAttributes) | Forward+, Mobile     |

### Glow Pipeline and AgX Controls (Godot 4.6+)

Godot 4.6 changes the order of the post-processing pipeline: **Glow now runs before tonemapping** (previously it ran after). This is physically more correct — glow should operate on HDR values before they are tone-mapped to LDR. The result is that bright emissive surfaces produce more natural-looking bloom.

**Upgrade impact:** Projects upgrading from 4.5 to 4.6 may notice a visible change in glow appearance. If your glow looks more intense or differently colored after upgrading, re-tune `glow_intensity`, `glow_bloom`, and `glow_hdr_threshold` on your Environment resource.

Godot 4.6 also adds two new controls to the **AgX** tonemapper:

| Property | Description |
|----------|-------------|
| `tonemap_agx_white` | White reference for AgX (default `16.29`) — higher values keep more highlight detail |
| `tonemap_agx_contrast` | Contrast of the AgX curve (default `1.25`) — higher makes darks darker and brights brighter |

```gdscript
var env: Environment = $WorldEnvironment.environment
env.tonemap_mode = Environment.TONE_MAPPER_AGX
# New AgX controls (Godot 4.6+) — separate from tonemap_white, which the other tonemappers use
env.tonemap_agx_white = 16.29     # default; raise to keep more highlight detail
env.tonemap_agx_contrast = 1.25   # default; raise for more contrast
```

```csharp
var env = GetNode<WorldEnvironment>("WorldEnvironment").Environment;
env.TonemapMode = Godot.Environment.ToneMapper.Agx;
// New AgX controls (Godot 4.6+)
env.TonemapAgxWhite = 16.29f;
env.TonemapAgxContrast = 1.25f;
```

> **When to use AgX:** AgX maintains hue as brightness increases, which avoids the "neon burn" artefact common with ACES on saturated emissives. The new `tonemap_agx_white` and `tonemap_agx_contrast` controls let you match a specific look reference.

### Screen-Space Reflections — Quality Upgrade (Godot 4.6+)

SSR in Godot 4.6 has been redesigned for higher quality at reduced GPU cost. The WorldEnvironment SSR settings (`ssr_enabled`, `ssr_max_steps`, `ssr_fade_in`, `ssr_fade_out`, `ssr_depth_tolerance`) remain unchanged — the improvement is automatic for all existing projects that upgrade to 4.6.

If you previously disabled SSR due to performance concerns, it is worth re-enabling after upgrading to 4.6 and re-profiling.

---
