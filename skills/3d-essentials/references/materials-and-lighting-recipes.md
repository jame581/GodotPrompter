# Materials & Lighting Recipes

Reference for `skills/3d-essentials/SKILL.md` — runnable code recipes for creating materials at runtime, per-instance material copies, dynamic lights with tween-driven decay, light properties, shadow configuration, bake modes, and AreaLight3D (Godot 4.7+).

> ← Back to [SKILL.md](../SKILL.md)

---

## Setting Materials from Code

### GDScript

```gdscript
@onready var mesh: MeshInstance3D = $MeshInstance3D

func _ready() -> void:
    var mat := StandardMaterial3D.new()
    mat.albedo_color = Color(0.8, 0.2, 0.2)
    mat.metallic = 0.3
    mat.roughness = 0.7
    mesh.material_override = mat

func flash_emissive() -> void:
    var mat: StandardMaterial3D = mesh.material_override
    mat.emission_enabled = true
    mat.emission = Color.WHITE
    mat.emission_energy_multiplier = 3.0
    var tween := create_tween()
    tween.tween_property(mat, "emission_energy_multiplier", 0.0, 0.3)
    tween.tween_callback(func(): mat.emission_enabled = false)
```

### C#

```csharp
private MeshInstance3D _mesh;

public override void _Ready()
{
    _mesh = GetNode<MeshInstance3D>("MeshInstance3D");
    var mat = new StandardMaterial3D();
    mat.AlbedoColor = new Color(0.8f, 0.2f, 0.2f);
    mat.Metallic = 0.3f;
    mat.Roughness = 0.7f;
    _mesh.MaterialOverride = mat;
}

public void FlashEmissive()
{
    var mat = _mesh.MaterialOverride as StandardMaterial3D;
    mat.EmissionEnabled = true;
    mat.Emission = Colors.White;
    mat.EmissionEnergyMultiplier = 3.0f;
    var tween = CreateTween();
    tween.TweenProperty(mat, "emission_energy_multiplier", 0.0f, 0.3);
    tween.TweenCallback(Callable.From(() => mat.EmissionEnabled = false));
}
```

## Transparency Modes

| Mode                | Performance | Shadows | Use For                          |
|---------------------|-------------|---------|----------------------------------|
| Disabled            | Fastest     | Yes     | Fully opaque objects             |
| Alpha               | Slow        | No      | Semi-transparent glass, water    |
| Alpha Scissor       | Fast        | Yes     | Binary cutout (leaves, fences)   |
| Alpha Hash          | Medium      | Yes     | Dithered transparency (hair)     |
| Depth Pre-Pass      | Medium      | Partial | Mostly opaque with transparent edges |

## Material Instancing

When multiple `MeshInstance3D` nodes share the same material, changing one affects all. To make a per-instance copy:

```gdscript
# In _ready() — creates an independent copy of the material
mesh.material_override = mesh.material_override.duplicate()
```

```csharp
_mesh.MaterialOverride = (Material)_mesh.MaterialOverride.Duplicate();
```

## Light Properties

| Property | Type | Default | Notes |
|---|---|---|---|
| `light_color` | `Color` | white | Drive day/night with a Tween or `Environment.sun_position` |
| `light_energy` | `float` | 1.0 | HDR; values >1 are valid |
| `shadow_enabled` | `bool` | false | Big perf hit when enabled |
| `directional_shadow_mode` | enum | 4 splits | `ORTHOGONAL` / `PARALLEL_2_SPLITS` / `PARALLEL_4_SPLITS` |
| `directional_shadow_max_distance` | `float` | 100 m | Lower = sharper shadows |

```gdscript
sun.light_color = Color(1.0, 0.95, 0.9)
sun.shadow_enabled = true
sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS
sun.directional_shadow_max_distance = 100.0
```

```csharp
sun.LightColor = new Color(1.0f, 0.95f, 0.9f);
sun.ShadowEnabled = true;
sun.DirectionalShadowMode = DirectionalLight3D.ShadowMode.Parallel4Splits;
sun.DirectionalShadowMaxDistance = 100.0f;
```

## Shadow Configuration Tips

| Setting                     | Effect                                             | Recommendation                       |
|-----------------------------|-----------------------------------------------------|--------------------------------------|
| `shadow_bias`               | Prevents self-shadowing (shadow acne)               | Start at 0.1, increase if acne visible |
| `shadow_normal_bias`        | Better acne fix than regular bias                   | Prefer this over `shadow_bias`       |
| `directional_shadow_max_distance` | Limits shadow range from camera               | Lower = better quality; 50–100m typical |
| Shadow map resolution       | Project Settings > Rendering > Lights and Shadows  | 2048 for perf, 4096 for quality      |
| `shadow_blur`               | Softens shadow edges                                | 1.0–2.0 for gentle softness         |

## Light Bake Modes

| Mode     | Description                                               | Use For                             |
|----------|-----------------------------------------------------------|-------------------------------------|
| Disabled | Not included in lightmap baking; fully real-time (default) | Moving lights, player flashlight    |
| Static   | Fully baked into lightmaps — no runtime cost              | Architecture, terrain, fixed lights |
| Dynamic  | Indirect light baked, direct light stays real-time        | Lights that change color/intensity  |

## AreaLight3D (Godot 4.7+)

`AreaLight3D` is a `Light3D` node that emits light over a two-dimensional rectangle — neon tubes, screens, softbox panels. Light is emitted along the node's **-Z** axis, and PCSS soft shadows are controlled through `light_size` (the shadow map is drawn from the light's center).

| Property | Default | Notes |
|---|---|---|
| `area_size` | `Vector2(1, 1)` | Width and height of the rectangle in meters |
| `area_range` | `5.0` | Max distance (meters) from any point on the area that still receives light |
| `area_attenuation` | `1.0` | `0.0` ≈ constant brightness through most of the range; `2.0` = physically accurate inverse square |
| `area_normalize_energy` | `true` | Divides energy by surface area — resizing doesn't change total light output |
| `area_texture` | (none) | Optional textured emission (e.g. a screen). Forward+ and Mobile only |
| `light_size` | `0.5` | Overridden `Light3D` default — drives the PCSS penumbra |
| `shadow_normal_bias` | `1.0` | Overridden `Light3D` default |

> **Note:** With `area_attenuation` at `2.0` or higher, distant objects may receive almost no light even within range. For runtime `area_texture` swaps, keep each texture dimension a multiple of 128 px or a power of two to skip the scaling pass (e.g. 32x64, 128x128, 256x384).

### GDScript

```gdscript
func add_screen_light() -> void:
    var panel := AreaLight3D.new()
    panel.light_color = Color(0.85, 0.9, 1.0)
    panel.light_energy = 4.0
    panel.area_size = Vector2(2.0, 1.2)  # meters
    panel.area_range = 8.0
    panel.area_attenuation = 2.0  # physically accurate inverse-square falloff
    panel.area_normalize_energy = true  # resizing keeps total output stable
    panel.shadow_enabled = true  # PCSS soft shadows (not in Compatibility)
    panel.area_texture = load("res://textures/screen_content.png")  # Forward+/Mobile only
    add_child(panel)
```

### C#

```csharp
public void AddScreenLight()
{
    var panel = new AreaLight3D();
    panel.LightColor = new Color(0.85f, 0.9f, 1.0f);
    panel.LightEnergy = 4.0f;
    panel.AreaSize = new Vector2(2.0f, 1.2f);
    panel.AreaRange = 8.0f;
    panel.AreaAttenuation = 2.0f;
    panel.AreaNormalizeEnergy = true;
    panel.ShadowEnabled = true;
    panel.AreaTexture = GD.Load<Texture2D>("res://textures/screen_content.png");
    AddChild(panel);
}
```

> **Warning:** Shadows can look incorrect when the caster has few subdivisions and sits very close to the light (same limitation as OmniLight3D's Dual Paraboloid mode). In Mobile, the PCSS penumbra size doesn't vary as it should; in Compatibility, area lights cannot cast shadows.

## Dynamic Point Light

Spawn an OmniLight3D at runtime, drive its energy with a tween, and queue-free it on tween completion. Pattern works for explosions, muzzle flashes, magic effects.

```gdscript
func create_explosion_light(pos: Vector3) -> void:
    var light := OmniLight3D.new()
    light.light_color = Color(1.0, 0.6, 0.2)
    light.light_energy = 4.0
    light.omni_range = 10.0
    light.omni_attenuation = 2.0
    light.position = pos
    add_child(light)

    var tween := create_tween()
    tween.tween_property(light, "light_energy", 0.0, 0.5)
    tween.tween_callback(light.queue_free)
```

```csharp
public void CreateExplosionLight(Vector3 pos)
{
    var light = new OmniLight3D();
    light.LightColor = new Color(1.0f, 0.6f, 0.2f);
    light.LightEnergy = 4.0f;
    light.OmniRange = 10.0f;
    light.OmniAttenuation = 2.0f;
    light.Position = pos;
    AddChild(light);

    var tween = CreateTween();
    tween.TweenProperty(light, "light_energy", 0.0f, 0.5);
    tween.TweenCallback(Callable.From(light.QueueFree));
}
```

## Bent Normal Maps (Godot 4.5+)

Code path for setting a bent-normal texture at runtime (the typical case is via Inspector instead).

```gdscript
@onready var mesh: MeshInstance3D = $MeshInstance3D

func _ready() -> void:
    var mat := mesh.get_surface_override_material(0) as StandardMaterial3D
    if mat == null:
        mat = StandardMaterial3D.new()
    mat.bent_normal_enabled = true
    mat.bent_normal_texture = preload("res://textures/rock_bent_normal.png")
    mesh.set_surface_override_material(0, mat)
```

```csharp
private MeshInstance3D _mesh;

public override void _Ready()
{
    _mesh = GetNode<MeshInstance3D>("MeshInstance3D");
    var mat = _mesh.GetSurfaceOverrideMaterial(0) as StandardMaterial3D
        ?? new StandardMaterial3D();
    mat.BentNormalEnabled = true;
    mat.BentNormalTexture = GD.Load<Texture2D>("res://textures/rock_bent_normal.png");
    _mesh.SetSurfaceOverrideMaterial(0, mat);
}
```
