# Graphics Settings Menu

Reference for `skills/rendering-pipeline/SKILL.md` — quality presets, applying them at runtime, and saving the player's choice.

> ← Back to [SKILL.md](../SKILL.md)

---

## Preset Table

A starting point for a Forward+ project. Mobile and Compatibility builds should hide the rows their renderer cannot honor (see Sections 3 and 4 of the skill).

| Setting | Low | Medium | High | Ultra |
|---|---|---|---|---|
| 3D scale (FSR 2 on Forward+) | 0.5 | 0.67 | 0.77 | 1.0 |
| MSAA 3D | Off | Off | 2× | 4× |
| Screen-space AA | FXAA without FSR 2 | FXAA without FSR 2 | Off (FSR 2 handles it) | Off |
| Directional shadow size | 1024 | 2048 | 4096 | 8192 |
| Shadow max distance (m) | 40 | 60 | 100 | 150 |
| SSAO / SSIL (if the level uses them) | Off / Off | On / Off | On / On | On / On |
| SDFGI / volumetric fog (if the level uses them) | Off | Off | On | On |
| Mesh LOD threshold (px) | 4.0 | 2.0 | 1.0 | 0.5 |

Directional shadow atlas size and mesh LOD apply through `RenderingServer` and the root `Viewport`; SSAO, SSIL, SDFGI, and volumetric fog are toggles on the active `Environment`. Presets only ever switch those **off**: each level's `Environment` keeps what its designer authored, and the preset can disable an effect but never turn on one the level was not lit for.

---

## Applying a Preset

Keep presets as data, and apply everything from one function so the menu, startup, and a "reset to defaults" button all go through the same path.

```gdscript
# graphics_settings.gd — autoload "GraphicsSettings"
extends Node

const PATH := "user://graphics.cfg"
const PRESETS := {
    "low":    {"scale": 0.5,  "msaa": Viewport.MSAA_DISABLED, "fxaa": true,  "shadow_size": 1024, "shadow_distance": 40.0,  "ssao": false, "ssil": false, "sdfgi": false, "lod": 4.0},
    "medium": {"scale": 0.67, "msaa": Viewport.MSAA_DISABLED, "fxaa": true,  "shadow_size": 2048, "shadow_distance": 60.0,  "ssao": true,  "ssil": false, "sdfgi": false, "lod": 2.0},
    "high":   {"scale": 0.77, "msaa": Viewport.MSAA_2X,       "fxaa": false, "shadow_size": 4096, "shadow_distance": 100.0, "ssao": true,  "ssil": true,  "sdfgi": true,  "lod": 1.0},
    "ultra":  {"scale": 1.0,  "msaa": Viewport.MSAA_4X,       "fxaa": false, "shadow_size": 8192, "shadow_distance": 150.0, "ssao": true,  "ssil": true,  "sdfgi": true,  "lod": 0.5},
}

var current_preset := "high"


func _ready() -> void:
    var cfg := ConfigFile.new()
    if cfg.load(PATH) == OK:
        current_preset = cfg.get_value("graphics", "preset", current_preset)
    apply_preset(current_preset)


func apply_preset(preset_name: String) -> void:
    var p: Dictionary = PRESETS.get(preset_name, PRESETS["high"])
    current_preset = preset_name
    var vp := get_viewport()
    var forward_plus: bool = ProjectSettings.get_setting_with_override("rendering/renderer/rendering_method") == "forward_plus"

    vp.scaling_3d_mode = Viewport.SCALING_3D_MODE_FSR2 if forward_plus and p.scale < 1.0 else Viewport.SCALING_3D_MODE_BILINEAR
    vp.scaling_3d_scale = p.scale
    vp.msaa_3d = p.msaa
    var fsr2 := vp.scaling_3d_mode == Viewport.SCALING_3D_MODE_FSR2
    vp.screen_space_aa = Viewport.SCREEN_SPACE_AA_FXAA if p.fxaa and not fsr2 else Viewport.SCREEN_SPACE_AA_DISABLED
    vp.mesh_lod_threshold = p.lod
    RenderingServer.directional_shadow_atlas_set_size(p.shadow_size, true)

    for light in get_tree().get_nodes_in_group("sun"):
        (light as DirectionalLight3D).directional_shadow_max_distance = p.shadow_distance

    var env := vp.find_world_3d().environment
    if env:
        # Remember what the level authored the first time we see this Environment.
        if not env.has_meta("authored_effects"):
            env.set_meta("authored_effects", {"ssao": env.ssao_enabled, "ssil": env.ssil_enabled,
                    "sdfgi": env.sdfgi_enabled, "fog": env.volumetric_fog_enabled})
        var authored: Dictionary = env.get_meta("authored_effects")
        env.ssao_enabled = authored.ssao and p.ssao
        env.ssil_enabled = authored.ssil and p.ssil
        env.sdfgi_enabled = authored.sdfgi and p.sdfgi
        env.volumetric_fog_enabled = authored.fog and p.sdfgi

    var cfg := ConfigFile.new()
    cfg.set_value("graphics", "preset", preset_name)
    cfg.save(PATH)
```

```csharp
// GraphicsSettings.cs — autoload "GraphicsSettings"
using System.Collections.Generic;
using Godot;

public partial class GraphicsSettings : Node
{
    private const string SettingsPath = "user://graphics.cfg";

    private readonly record struct Preset(float Scale, Viewport.Msaa Msaa, bool Fxaa, int ShadowSize,
        float ShadowDistance, bool Ssao, bool Ssil, bool Sdfgi, float Lod);

    private static readonly Dictionary<string, Preset> Presets = new()
    {
        { "low",    new Preset(0.5f,  Viewport.Msaa.Disabled, true,  1024, 40f,  false, false, false, 4.0f) },
        { "medium", new Preset(0.67f, Viewport.Msaa.Disabled, true,  2048, 60f,  true,  false, false, 2.0f) },
        { "high",   new Preset(0.77f, Viewport.Msaa.Msaa2X,   false, 4096, 100f, true,  true,  true,  1.0f) },
        { "ultra",  new Preset(1.0f,  Viewport.Msaa.Msaa4X,   false, 8192, 150f, true,  true,  true,  0.5f) },
    };

    public string CurrentPreset { get; private set; } = "high";

    public override void _Ready()
    {
        var cfg = new ConfigFile();
        if (cfg.Load(SettingsPath) == Error.Ok)
            CurrentPreset = cfg.GetValue("graphics", "preset", CurrentPreset).AsString();
        ApplyPreset(CurrentPreset);
    }

    public void ApplyPreset(string presetName)
    {
        Preset p = Presets.TryGetValue(presetName, out Preset found) ? found : Presets["high"];
        CurrentPreset = presetName;
        Viewport vp = GetViewport();
        bool forwardPlus = ProjectSettings.GetSettingWithOverride("rendering/renderer/rendering_method").AsString() == "forward_plus";

        vp.Scaling3DMode = forwardPlus && p.Scale < 1.0f ? Viewport.Scaling3DModeEnum.Fsr2 : Viewport.Scaling3DModeEnum.Bilinear;
        vp.Scaling3DScale = p.Scale;
        vp.Msaa3D = p.Msaa;
        bool fsr2 = vp.Scaling3DMode == Viewport.Scaling3DModeEnum.Fsr2;
        vp.ScreenSpaceAA = p.Fxaa && !fsr2 ? Viewport.ScreenSpaceAAEnum.Fxaa : Viewport.ScreenSpaceAAEnum.Disabled;
        vp.MeshLodThreshold = p.Lod;
        RenderingServer.DirectionalShadowAtlasSetSize(p.ShadowSize, true);

        foreach (Node node in GetTree().GetNodesInGroup("sun"))
            ((DirectionalLight3D)node).DirectionalShadowMaxDistance = p.ShadowDistance;

        Environment env = vp.FindWorld3D().Environment;
        if (env != null)
        {
            // Remember what the level authored the first time we see this Environment.
            if (!env.HasMeta("authored_effects"))
            {
                env.SetMeta("authored_effects", new Godot.Collections.Dictionary
                {
                    { "ssao", env.SsaoEnabled }, { "ssil", env.SsilEnabled },
                    { "sdfgi", env.SdfgiEnabled }, { "fog", env.VolumetricFogEnabled },
                });
            }
            var authored = env.GetMeta("authored_effects").AsGodotDictionary();
            env.SsaoEnabled = authored["ssao"].AsBool() && p.Ssao;
            env.SsilEnabled = authored["ssil"].AsBool() && p.Ssil;
            env.SdfgiEnabled = authored["sdfgi"].AsBool() && p.Sdfgi;
            env.VolumetricFogEnabled = authored["fog"].AsBool() && p.Sdfgi;
        }

        var cfg = new ConfigFile();
        cfg.SetValue("graphics", "preset", presetName);
        cfg.Save(SettingsPath);
    }
}
```

Notes:

- `find_world_3d().environment` is the environment set by the scene's `WorldEnvironment`. Re-apply the preset after changing levels (connect to your scene-change signal), since each scene brings its own `Environment`.
- The camera's own `Camera3D.environment`, if set, wins over the world's — apply to that one too if your project uses it.
- The `Environment` is usually a shared `.tres`. The changes above are in memory only (never call `ResourceSaver.save()` on it from the game), and the stored metadata travels with it, so a level reloaded later still restores to its authored look.
- Put sun lights in a `sun` group so the preset can reach them in any level.
- In C#, `Environment` here is `Godot.Environment`; add `using Environment = Godot.Environment;` if `System` is also imported.

---

## Individual Toggles and Window Settings

Expose a few independent settings next to the preset dropdown:

| Toggle | Apply with |
|---|---|
| V-Sync | `DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_ENABLED)` |
| Frame-rate cap | `Engine.max_fps = 60` (`0` = unlimited) |
| Fullscreen | `get_window().mode = Window.MODE_EXCLUSIVE_FULLSCREEN` |
| Field of view | `camera.fov` |

Store each one in the same `ConfigFile` section and re-apply in `_ready()`. Window and stretch settings for multiple resolutions: **responsive-ui**.
