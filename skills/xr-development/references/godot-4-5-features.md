# Godot 4.5+ XR Features

Reference for `skills/xr-development/SKILL.md` — D3D12 OpenXR backend, foveated rendering on Mobile Vulkan, Application SpaceWarp, OpenXR Render Models, visionOS export.

> ← Back to [SKILL.md](../SKILL.md)

---
## 8. Godot 4.5+ XR Features

### D3D12 OpenXR Backend (Windows) (Godot 4.5+)

On Windows, Godot 4.5 adds a Direct3D 12 rendering backend for OpenXR. Previously, Windows XR builds required Vulkan. D3D12 is relevant for Quest Link and SteamVR on machines with good D3D12 driver support.

**Enable in Project Settings:**

1. **Project Settings → Rendering → Rendering Device → Driver** → select `D3D12` (Windows only)
2. Re-export the Windows build — no code changes required.

> **When to use D3D12:** If your target audience runs Quest Link or SteamVR on Windows and encounters Vulkan driver issues, D3D12 can be more stable. Vulkan remains the default and is typically preferred for performance.

---

### Foveated Rendering on Mobile Vulkan (Godot 4.5+)

Standalone VR headsets (Meta Quest, Pico) running the **Mobile Vulkan** renderer now support foveated rendering via the `VK_EXT_fragment_density_map` extension. The peripheral view is rendered at lower resolution while the foveal region stays sharp, significantly reducing GPU load.

**Enable via the OpenXR Vendors plugin:**

1. Install or update the **Godot OpenXR Vendors** plugin (Project Settings → Plugins).
2. In the Android export preset, ensure **Renderer** is set to **Mobile** (not Forward+).
3. In the vendor plugin settings, enable **Foveated Rendering** and choose a density level (e.g., `LOW`, `MEDIUM`, `HIGH`).
4. The `VK_EXT_fragment_density_map` device extension is requested automatically by the plugin at runtime — no Vulkan code needed.

> **Note:** Foveated rendering requires the Mobile Vulkan renderer. It has no effect on the Forward+ renderer or on PC VR headsets. Test GPU utilization with and without it on device using Meta's OVR Metrics Tool or Pico's equivalents.

---

### Application SpaceWarp (ASW) (Godot 4.5+)

Application SpaceWarp is a frame-synthesis technique supported on Meta Quest and Pico headsets. The GPU renders every other frame at half rate; the SpaceWarp runtime synthesizes the missing frames using motion vectors. This halves the rendering budget while maintaining perceived smoothness.

**Enable via the OpenXR Vendors plugin:**

1. Update to **Godot OpenXR Vendors** plugin 4.x (supports ASW).
2. In the Android export preset extras, enable **Application SpaceWarp**.
3. Ensure the **Motion Vectors** rendering pass is active — the vendor plugin enables this automatically when ASW is on.
4. Set your target frame rate to **half the native headset rate** (e.g., 40 Hz on Quest 3 at 80 Hz mode) in your XR session configuration.

> **Caution:** SpaceWarp can introduce ghosting artifacts on fast-moving objects. Disable per-object if you see visual glitches. Test thoroughly on device.

---

### OpenXR Render Models (Godot 4.5+)

The OpenXR Render Models extension lets the platform supply animated, branded controller meshes at runtime. You no longer need to bundle Quest Touch or Pico controller meshes in your project.

**Enable:**

1. Update to **Godot OpenXR Vendors** plugin 4.x.
2. In Project Settings (or via the vendor plugin toggle), enable **OpenXR Render Models**.
3. In your scene, add `OpenXRRenderModel` nodes as children of each `XRController3D` — the plugin populates them with the platform-native mesh automatically.

```gdscript
# The render model node auto-populates; no manual mesh assignment needed.
# You can show/hide it to toggle between your own model and the platform model:
@onready var render_model: Node3D = $XRController3D/OpenXRRenderModel

func _ready() -> void:
    render_model.visible = true  # Use platform-native controller model
```

```csharp
// The render model node auto-populates; no manual mesh assignment needed.
// Assign the OpenXRRenderModel node in the Inspector.
[Export] public Node3D RenderModel { get; set; }

public override void _Ready()
{
    RenderModel.Visible = true; // Use platform-native controller model
}
```

> **Availability:** Render Models require the platform runtime to support the `XR_EXT_hand_tracking_data_source` or equivalent render model extension. Confirmed on Meta Quest and Pico runtimes. Fall back to bundled meshes when the node has no mesh loaded.

---

### visionOS Export (Godot 4.5+)

Godot 4.5 adds native **visionOS** (Apple Vision Pro) export via the unified "Apple Embedded" platform driver. Windowed visionOS apps (running in the Shared Space) can be exported directly without additional tooling beyond Xcode.

**Setup:**

1. Ensure you have Xcode 15.4+ with the visionOS SDK installed.
2. In **Export → Add Preset**, select **Apple Embedded** — it covers iOS, iPadOS, and visionOS.
3. Set **Target SDK** to `visionOS` in the preset options.
4. For XR content in visionOS Full Space, use OpenXR with the appropriate entitlements — see Apple's documentation for `ARKit` + `Passthrough` entitlements.
5. Build and deploy via Xcode as usual.

> **Note:** visionOS Full Space XR (immersive mode) requires Apple's `com.apple.developer.arkit` entitlement and is distinct from windowed Shared Space mode. The OpenXR path on visionOS mirrors the passthrough workflow in Section 6.
