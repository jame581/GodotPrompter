---
name: rendering-pipeline
description: Use when choosing a renderer or planning a project's look and frame budget — renderer per platform, lighting strategy and light limits, anti-aliasing, 3D resolution scaling (FSR, MetalFX), SubViewports and render targets, shader stutter, graphics settings menus, and rendering stats
---

# Rendering Pipeline in Godot 4.3+

Project-level rendering decisions: which renderer runs where, how the lighting is built for it, how edges are smoothed, what resolution 3D renders at, and how to measure the result. All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

This skill picks the strategy; **3d-essentials** holds the per-node recipes (materials, light properties, GI setup, fog, decals).

> **Related skills:** **3d-essentials** for materials, lights, environment and GI node setup, **2d-essentials** for 2D lights and shadows, **shader-basics** for post-processing, compositor effects and the Shader Baker, **godot-optimization** for profiling CPU/GPU bottlenecks, **web-export** for the Compatibility-only browser target.

---

## 1. Pick the Renderer First

The renderer decides which lighting features exist at all, so choose it before building the look.

| Renderer | `rendering_method` | Use for | Missing compared to Forward+ |
|---|---|---|---|
| **Forward+** | `forward_plus` | Desktop and console, high-end visuals | — |
| **Mobile** | `mobile` | Phones, tablets, standalone XR, low-end desktop | SDFGI, VoxelGI, SSAO/SSIL/SSR, volumetric fog, TAA, FSR |
| **Compatibility** | `gl_compatibility` | Web (the only option there), very old GPUs | Everything Mobile lacks (though SSAO arrives in 4.6), plus FXAA/SMAA and MetalFX; glow is a simplified version |

Set **Project Settings → Rendering → Renderer → Rendering Method**. Platform overrides already exist: `rendering/renderer/rendering_method.mobile` defaults to `mobile` and `rendering_method.web` to `gl_compatibility`, so one project can run Forward+ on desktop and Mobile on phones — but then **test the look on both**, because effects silently disappear on the lighter renderer.

A settings menu must hide options the running renderer cannot honor. The later sections use this helper:

```gdscript
func is_forward_plus() -> bool:
    # Godot 4.4+: prefer RenderingServer.get_current_rendering_method(), which also sees
    # the --rendering-method CLI flag and the automatic fallback on unsupported hardware.
    return ProjectSettings.get_setting_with_override("rendering/renderer/rendering_method") == "forward_plus"
```

```csharp
public static bool IsForwardPlus()
{
    // Godot 4.4+: prefer RenderingServer.GetCurrentRenderingMethod(), which also sees
    // the --rendering-method CLI flag and the automatic fallback on unsupported hardware.
    return ProjectSettings.GetSettingWithOverride("rendering/renderer/rendering_method").AsString() == "forward_plus";
}
```

Short feature table: see the renderer comparison in **3d-essentials** (`references/renderer-comparison.md`).

---

## 2. Lighting Strategy

Decide where light comes from before placing lights. Baked light is nearly free at runtime on every renderer; real-time GI is Forward+ only.

| Scene | Forward+ | Mobile | Compatibility |
|---|---|---|---|
| Static level, fixed sun | LightmapGI + real-time sun shadows | LightmapGI | LightmapGI |
| Day/night cycle, large outdoor | SDFGI | Sky ambient + DirectionalLight3D | Sky ambient + DirectionalLight3D |
| Small dynamic interiors | VoxelGI | LightmapGI + ReflectionProbes | LightmapGI + ReflectionProbes |
| Procedural levels (nothing to bake) | SDFGI | Ambient + a few shadowed lights | Ambient + few unshadowed lights |

**Light budgets**

| Renderer | Limit | Setting |
|---|---|---|
| Forward+ | 512 clustered elements (omni + spot lights + decals + reflection probes) in view | `rendering/limits/cluster_builder/max_clustered_elements` |
| Mobile | 8 omni + 8 spot lights per mesh | — split large meshes so lights don't compete |
| Compatibility | 8 omni + 8 spot lights per object; 32 renderable lights per type (omni, spot) per frame | `rendering/limits/opengl/max_lights_per_object`, `max_renderable_lights` |

Rules that hold everywhere:

- **Shadows are the expensive part, not lights.** Keep one shadowed `DirectionalLight3D`; turn `shadow_enabled` off on fill lights and small props.
- **Bake what doesn't move.** Set static lights' `light_bake_mode` to Static so the lightmap carries them and they cost nothing at runtime. Baking needs a Forward+ or Mobile capable editor; the baked result plays on all three renderers.
- **Fade distant lights** with `distance_fade_enabled` instead of leaving dozens active.

Light and GI node setup: **3d-essentials** (Sections 3 and 5).

---

## 3. Anti-Aliasing

| Method | Cost | Smooths | Renderers | Notes |
|---|---|---|---|---|
| MSAA 2×/4×/8× (`msaa_3d`) | Medium–high | Geometry edges | All three | 2× or 4× is usually the sweet spot; no help with shader/texture shimmer |
| FXAA (`screen_space_aa`) | Low | Everything, blurry | Forward+, Mobile | Cheapest whole-image option |
| SMAA (Godot 4.5+) | Low–medium | Everything, sharper than FXAA | Forward+, Mobile | Tune `rendering/anti_aliasing/quality/smaa_edge_detection_threshold` |
| TAA (`use_taa`) | Medium | Everything incl. specular shimmer | Forward+ only | Ghosting on particles and skinned meshes |
| FSR 2 at scale `1.0` | Medium | Like TAA, sharper | Forward+ only | Set `scaling_3d_mode` to FSR 2 and `scaling_3d_scale = 1.0` |

The project settings (`rendering/anti_aliasing/quality/*`) are read once at startup. To change AA from a settings menu, set the root viewport:

```gdscript
func apply_antialiasing(msaa: Viewport.MSAA, use_fxaa: bool, use_taa: bool) -> void:
    var vp := get_viewport()
    vp.msaa_3d = msaa
    vp.screen_space_aa = Viewport.SCREEN_SPACE_AA_FXAA if use_fxaa else Viewport.SCREEN_SPACE_AA_DISABLED
    vp.use_taa = use_taa and is_forward_plus()
```

```csharp
public void ApplyAntialiasing(Viewport.Msaa msaa, bool useFxaa, bool useTaa)
{
    Viewport vp = GetViewport();
    vp.Msaa3D = msaa;
    vp.ScreenSpaceAA = useFxaa ? Viewport.ScreenSpaceAAEnum.Fxaa : Viewport.ScreenSpaceAAEnum.Disabled;
    vp.UseTaa = useTaa && IsForwardPlus();
}
```

Setting an unsupported mode does not crash; Godot ignores it and logs a warning (an editor error on 4.3–4.5). Gate the options in the UI instead. 2D has its own `msaa_2d`, which smooths 2D geometry edges such as lines and polygons.

---

## 4. 3D Resolution Scaling

Render 3D below native resolution and upscale it — the biggest single GPU saving on fill-rate-bound scenes. 2D and UI stay at native resolution.

| `scaling_3d_mode` | Renderers | Notes |
|---|---|---|
| Bilinear | All | Also the only mode that supersamples (`scale > 1.0`) |
| FSR 1 | Forward+ | Spatial upscaler; `rendering/scaling_3d/fsr_sharpness` (default `0.2`, lower = sharper) |
| FSR 2 | Forward+ | Temporal; replaces TAA; best quality per pixel |
| MetalFX Spatial / Temporal (Godot 4.4+) | Apple Metal: spatial on Forward+/Mobile, temporal on Forward+ | Falls back to FSR when unavailable |
| Nearest (Godot 4.7+) | All | Crisp pixel look; use integer divisors (`0.5`, `0.333`, `0.25`) |

Offer presets rather than a raw slider. These are AMD's FSR 1 scales, which work as well with FSR 2: **Ultra Quality 0.77, Quality 0.67, Balanced 0.59, Performance 0.5**.

```gdscript
const FSR_PRESETS := {"ultra_quality": 0.77, "quality": 0.67, "balanced": 0.59, "performance": 0.5}


func apply_upscaling(preset: String) -> void:
    var vp := get_viewport()
    if preset == "native":
        vp.scaling_3d_mode = Viewport.SCALING_3D_MODE_BILINEAR
        vp.scaling_3d_scale = 1.0
        return
    vp.scaling_3d_mode = Viewport.SCALING_3D_MODE_FSR2 if is_forward_plus() else Viewport.SCALING_3D_MODE_BILINEAR
    vp.scaling_3d_scale = FSR_PRESETS.get(preset, 1.0)
```

```csharp
private static readonly System.Collections.Generic.Dictionary<string, float> FsrPresets = new()
{
    { "ultra_quality", 0.77f }, { "quality", 0.67f }, { "balanced", 0.59f }, { "performance", 0.5f },
};

public void ApplyUpscaling(string preset)
{
    Viewport vp = GetViewport();
    if (preset == "native")
    {
        vp.Scaling3DMode = Viewport.Scaling3DModeEnum.Bilinear;
        vp.Scaling3DScale = 1.0f;
        return;
    }
    vp.Scaling3DMode = IsForwardPlus() ? Viewport.Scaling3DModeEnum.Fsr2 : Viewport.Scaling3DModeEnum.Bilinear;
    vp.Scaling3DScale = FsrPresets.GetValueOrDefault(preset, 1.0f);
}
```

Lower scales blur textures; on Forward+ and Mobile, Godot lowers the mipmap bias automatically by `log2(scale)` to compensate (plus `-0.5` with TAA).

---

## 5. SubViewports and Render Targets

A `SubViewport` renders its own scene (or a second camera on the same world) into a texture: minimaps, security cameras, portraits, 3D models in UI, low-resolution pixel-art 3D. **Each active SubViewport is another full render**, so control when it updates.

| `render_target_update_mode` | Use for |
|---|---|
| `UPDATE_WHEN_VISIBLE` (default) | Live views shown on screen |
| `UPDATE_ONCE` | Snapshots — inventory icons, character portraits, a frozen photo |
| `UPDATE_DISABLED` | Pause an off-screen view entirely |
| `UPDATE_ALWAYS` | Feeds a material even when its container is hidden |

Show it in UI with a `SubViewportContainer` (`stretch = true` sizes the viewport to the container; `stretch_shrink = 3` renders at a third of the size for a chunky pixel look), or use `sub_viewport.get_texture()` as a `ViewportTexture` on any material. SubViewports have their own `msaa_3d`, `scaling_3d_*`, and `use_taa` — they do **not** inherit the root viewport's settings.

```gdscript
# Render a 3D model to a texture once, e.g. for an inventory icon.
func capture_icon(sub_viewport: SubViewport) -> ImageTexture:
    sub_viewport.render_target_update_mode = SubViewport.UPDATE_ONCE
    await RenderingServer.frame_post_draw
    return ImageTexture.create_from_image(sub_viewport.get_texture().get_image())
```

```csharp
// Render a 3D model to a texture once, e.g. for an inventory icon.
public async Task<ImageTexture> CaptureIcon(SubViewport subViewport)
{
    subViewport.RenderTargetUpdateMode = SubViewport.UpdateMode.Once;
    await ToSignal(RenderingServer.Singleton, RenderingServer.SignalName.FramePostDraw);
    return ImageTexture.CreateFromImage(subViewport.GetTexture().GetImage());
}
```

Set `transparent_bg = true` on the SubViewport for icons with an alpha background. Split-screen setup: **camera-system**; minimaps: **hud-system**.

---

## 6. Shader Compilation Stutter

The first time a material, light combination, or effect is drawn, the GPU pipeline is compiled, which can hitch a frame.

- **Godot 4.4+** compiles pipelines in the background with ubershaders on Forward+ and Mobile, which removes most of this hitching. Projects on 4.3 benefit from upgrading.
- The **pipeline cache** (`rendering/rendering_device/pipeline_cache/enable`, on by default) makes the second launch faster than the first.
- The **Shader Baker** (Godot 4.5+, export preset option) shortens the first launch on D3D12 and Metal — see **shader-basics** and **export-pipeline**.
- On Compatibility, and for effects that still hitch, show each material once behind a loading screen (spawn the effect off-camera or at zero scale for a frame).

---

## 7. Measuring

Read rendering stats from `Performance` and switch `Viewport.debug_draw` to see where the cost is.

```gdscript
func _process(_delta: float) -> void:
    $Stats.text = "draw calls %d | primitives %d | VRAM %.0f MB" % [
        Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),
        Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME),
        Performance.get_monitor(Performance.RENDER_VIDEO_MEM_USED) / 1048576.0,
    ]


func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("debug_overdraw"):
        var vp := get_viewport()
        vp.debug_draw = Viewport.DEBUG_DRAW_DISABLED if vp.debug_draw == Viewport.DEBUG_DRAW_OVERDRAW else Viewport.DEBUG_DRAW_OVERDRAW
```

```csharp
public override void _Process(double delta)
{
    GetNode<Label>("Stats").Text = string.Format("draw calls {0} | primitives {1} | VRAM {2:F0} MB",
        Performance.GetMonitor(Performance.Monitor.RenderTotalDrawCallsInFrame),
        Performance.GetMonitor(Performance.Monitor.RenderTotalPrimitivesInFrame),
        Performance.GetMonitor(Performance.Monitor.RenderVideoMemUsed) / 1048576.0);
}

public override void _UnhandledInput(InputEvent @event)
{
    if (@event.IsActionPressed("debug_overdraw"))
    {
        Viewport vp = GetViewport();
        vp.DebugDraw = vp.DebugDraw == Viewport.DebugDrawEnum.Overdraw ? Viewport.DebugDrawEnum.Disabled : Viewport.DebugDrawEnum.Overdraw;
    }
}
```

Useful `debug_draw` modes: `OVERDRAW` (transparency and particle cost), `UNSHADED` (is it lighting or geometry?), `LIGHTING`, `WIREFRAME` (call `RenderingServer.set_debug_generate_wireframes(true)` before the meshes load). The editor's **Debugger → Visual Profiler** splits GPU time per pass. Profiling method: **godot-optimization**.

---

## 8. Graphics Settings Menu

Players expect presets (Low / Medium / High / Ultra) plus individual toggles, saved between sessions. Apply runtime settings to the root viewport, environment toggles to the active `Environment`, and store the choice in a `ConfigFile` under `user://`.

Full preset table, apply code, and persistence in GDScript and C#: [references/graphics-settings.md](references/graphics-settings.md).

---

## 9. Common Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Effects vanish on phone or web build | Built the look on Forward+, shipped on Mobile/Compatibility | Preview with the target renderer; plan lighting per Section 2 |
| TAA or FSR option does nothing | Not Forward+ (warning in output) | Gate the option on the running renderer (Section 1 helper) |
| Changing the AA project setting in game has no effect | Project settings are read at startup | Set the root `Viewport` properties |
| Lights flicker on and off on Mobile | More than 8 omni or 8 spot lights touch one mesh | Split the mesh, bake static lights, or fade distant lights |
| Minimap halves the frame rate | SubViewport renders full quality every frame | Lower its size, disable its shadows/effects, update every few frames |
| SubViewport looks aliased while the game doesn't | SubViewports don't inherit root AA/scaling | Set `msaa_3d` / `scaling_3d_*` on the SubViewport |
| Pixel-art 3D looks smeared | Bilinear upscaling | `SubViewportContainer.stretch_shrink` with nearest texture filter, or Nearest scaling (4.7+) |
| Hitch the first time an effect plays | Pipeline compilation | Upgrade to 4.4+, pre-warm behind a loading screen |

---

## 10. Checklist

- [ ] Renderer chosen per target platform; `.mobile` / `.web` overrides reviewed
- [ ] The look is checked on the lightest renderer that ships
- [ ] Lighting plan written down: what is baked, what is real-time, which lights cast shadows
- [ ] Light counts within the renderer's budget (512 clustered / 8+8 per mesh on Mobile and Compatibility)
- [ ] AA method matches the renderer; menu hides unsupported options
- [ ] 3D resolution scaling offered as presets (FSR 2 on Forward+, bilinear elsewhere)
- [ ] Every SubViewport has a deliberate update mode, size, and its own AA settings
- [ ] Draw calls, primitives, and VRAM checked with `Performance` monitors on target hardware
- [ ] Graphics settings saved to `user://` and re-applied on startup
