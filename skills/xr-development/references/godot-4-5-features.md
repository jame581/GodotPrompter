# Godot 4.5+ XR Features

Reference for `skills/xr-development/SKILL.md` — D3D12 OpenXR backend, foveated rendering on Mobile Vulkan, Application SpaceWarp, OpenXR Render Models, visionOS export.

> ← Back to [SKILL.md](../SKILL.md)

---
## 8. Godot 4.5+ XR Features

### D3D12 OpenXR Backend (Windows) (Godot 4.5+)

On Windows, Godot 4.5 adds a Direct3D 12 rendering backend for OpenXR. Previously, Windows XR builds used Vulkan (Forward+/Mobile) or OpenGL (Compatibility). D3D12 is relevant for Quest Link and SteamVR on machines with good D3D12 driver support.

**Enable in Project Settings:**

1. **Project Settings → Rendering → Rendering Device → Driver** → select `D3D12` (Windows only)
2. Re-export the Windows build — no code changes required.

> **When to use D3D12:** If your target audience runs Quest Link or SteamVR on Windows and encounters Vulkan driver issues, D3D12 can be more stable. Vulkan is the default in 4.5; projects created in Godot 4.6+ default to D3D12 on Windows (`rendering/rendering_device/driver.windows`).

---

### Foveated Rendering on Mobile Vulkan (Godot 4.5+)

Standalone VR headsets (Meta Quest, Pico) running the **Mobile Vulkan** renderer now support foveated rendering via the `VK_EXT_fragment_density_map` extension. The peripheral view is rendered at lower resolution while the foveal region stays sharp, significantly reducing GPU load.

**Enable in Project Settings (core engine — no plugin setting):**

1. Use the **Mobile** renderer (`rendering/renderer/rendering_method.mobile = "mobile"`).
2. Set **XR → OpenXR → Foveation Level** (`xr/openxr/foveation_level`: 0 = off, 1 = low, 2 = medium, 3 = high).
3. Optionally enable **Foveation Dynamic** (`xr/openxr/foveation_dynamic`) to let the level vary with load.
4. The engine requests `XR_FB_foveation_vulkan` / `VK_EXT_fragment_density_map` itself — no Vulkan code needed.

> **Note:** Foveated rendering requires the Mobile Vulkan renderer. It has no effect on the Forward+ renderer or on PC VR headsets. Test GPU utilization with and without it on device using Meta's OVR Metrics Tool or Pico's equivalents.

---

### Application SpaceWarp (ASW) (Godot 4.5+)

Application SpaceWarp is a frame-synthesis technique supported on Meta Quest and Pico headsets. The GPU renders every other frame at half rate; the SpaceWarp runtime synthesizes the missing frames using motion vectors. This halves the rendering budget while maintaining perceived smoothness.

**Enable via the OpenXR Vendors plugin:**

1. Update to **Godot OpenXR Vendors** plugin 4.1.0+ (`XR_FB_space_warp`, Godot 4.5+ only).
2. Enable **Project Settings → XR → OpenXR → Extensions → Meta → Application Space Warp** (`xr/openxr/extensions/meta/application_space_warp`; needs Advanced Settings on).
3. Ensure the **Motion Vectors** rendering pass is active — the vendor plugin enables this automatically when ASW is on.
4. While ASW is on, the app renders at half the display rate and the runtime generates the in-between frames.

> **Caution:** SpaceWarp can introduce ghosting artifacts on fast-moving objects, and it is not supported on the Forward+ renderer. Godot 4.6 adds a separate core alternative, `xr/openxr/extensions/frame_synthesis`, which should not be enabled together with ASW. Test thoroughly on device.

---

### OpenXR Render Models (Godot 4.5+)

The OpenXR Render Models extension lets the platform supply animated, branded controller meshes at runtime. You no longer need to bundle Quest Touch or Pico controller meshes in your project.

**Enable:**

1. Enable **Project Settings → XR → OpenXR → Extensions → Render Model** (`xr/openxr/extensions/render_model`, default off). This is a core engine feature — no vendor plugin needed.
2. Add an `OpenXRRenderModelManager` node under your `XROrigin3D`. It creates and removes `OpenXRRenderModel` children as devices appear.
3. Set its `tracker` to Left Hand / Right Hand to limit it to one hand, or leave it on Any as a direct child of `XROrigin3D`.

```gdscript
# The manager adds an OpenXRRenderModel child per detected device; no mesh assignment needed.
@onready var render_models: OpenXRRenderModelManager = $XROrigin3D/OpenXRRenderModelManager

func _ready() -> void:
    render_models.tracker = OpenXRRenderModelManager.RENDER_MODEL_TRACKER_ANY
    render_models.render_model_added.connect(func(model: OpenXRRenderModel) -> void: print(model.get_top_level_path()))
```

```csharp
// Assign the OpenXRRenderModelManager node (a child of XROrigin3D) in the Inspector.
[Export] public OpenXRRenderModelManager RenderModels { get; set; }

public override void _Ready()
{
    RenderModels.Tracker = OpenXRRenderModelManager.RenderModelTracker.Any;
    RenderModels.RenderModelAdded += model => GD.Print(model.GetTopLevelPath());
}
```

> **Availability:** Render Models require the XR runtime to support the `XR_EXT_render_model` extension; check `OpenXRRenderModelExtension.is_active()` and fall back to bundled meshes when it is not active.

---

### visionOS Export (Godot 4.5+)

Godot 4.5 adds native **visionOS** (Apple Vision Pro) export through a dedicated **visionOS** export platform, built on the shared Apple Embedded driver that iOS also uses. Windowed visionOS apps (running in the Shared Space) can be exported directly without additional tooling beyond Xcode.

**Setup:**

1. Export from macOS with Xcode and the visionOS SDK installed.
2. In **Export → Add Preset**, select **visionOS** (a separate preset from iOS).
3. Fill in the same signing fields as iOS (Team ID, bundle identifier); `application/min_visionos_version` sets the deployment target.
4. Build and deploy via Xcode as usual.

> **Note:** Only windowed (flat-plane) apps are supported in Godot 4.5–4.7. Immersive / Full Space apps are not, and OpenXR is not available on visionOS.
