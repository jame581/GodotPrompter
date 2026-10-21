---
name: xr-development
description: Use when building VR/AR/XR applications — OpenXR setup, XROrigin3D, hand tracking, controllers, passthrough, and Meta Quest deployment in Godot 4.3+
---

# XR Development in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **3d-essentials** for 3D rendering and environment, **physics-system** for 3D physics interactions, **input-handling** for non-XR input patterns, **export-pipeline** for platform exports.

---

## 1. XR Setup

### Enabling OpenXR

1. **Project Settings → Plugins → Enable:** `OpenXR` (or `OpenXR Plugin` depending on version)
2. **Project Settings → XR → OpenXR → Enabled** → `true`
3. **Project Settings → XR → Shaders → Enabled** → `true` (for XR shader support)
4. **Rendering:**
   - Use **Forward+** or **Mobile** renderer (Compatibility also works for simpler scenes)
   - Set **Project Settings → Display → Window → VSync Mode** to `Disabled` (the XR runtime controls frame timing)

### Core Scene Structure

```
Main (Node3D)
├── XROrigin3D                    ← Player's physical space origin
│   ├── XRCamera3D                ← Head-mounted display
│   ├── XRController3D (left)     ← Left controller
│   │   └── LeftHandModel (MeshInstance3D or hand tracking)
│   ├── XRController3D (right)    ← Right controller
│   │   └── RightHandModel
│   └── (XRBodyTracker via XRServer — optional full body tracking)
├── WorldEnvironment
└── GameWorld (Node3D)
    └── ... level geometry
```

### Starting XR Session

```gdscript
extends Node3D

func _ready() -> void:
    var xr_interface: XRInterface = XRServer.find_interface("OpenXR")
    if xr_interface and xr_interface.is_initialized():
        get_viewport().use_xr = true
    else:
        push_error("OpenXR not available")
```

```csharp
public partial class XRMain : Node3D
{
    public override void _Ready()
    {
        var xrInterface = XRServer.FindInterface("OpenXR");
        if (xrInterface != null && xrInterface.IsInitialized())
            GetViewport().UseXR = true;
        else
            GD.PushError("OpenXR not available");
    }
}
```

---

## 2. Controllers and Input

`XRController3D` nodes (one per hand, child of `XROrigin3D`) expose buttons via the OpenXR action map. Common buttons: trigger (`select_button`), grip (`grip_button`), thumbstick (`primary_axis` Vector2). Apply thumbstick locomotion velocity to `XROrigin3D` (not the camera).

> See [references/controllers-and-input.md](references/controllers-and-input.md) for full XRController3D wiring, OpenXR button reference, and thumbstick locomotion recipe.

---

## 3. Hand Tracking

When the headset supports hand tracking (Quest 2+, Pico 4, some SteamVR setups), `XRController3D` nodes can be configured to track hand joints. Sample finger positions for gesture detection, or bind to standard select / grip events when the user pinches.

> See [references/hand-tracking.md](references/hand-tracking.md) for hand-tracking node setup, joint sampling, and gesture-driven interactions.

---

## 4. Grabbing Objects

Standard pattern: an `Area3D` on the controller detects nearby `RigidBody3D` objects; on grip-press, parent the body to the controller and freeze it; on grip-release, restore the parent and apply the controller's velocity to launch.

> See [references/grabbing-objects.md](references/grabbing-objects.md) for the full physics-based grabbing implementation (GDScript + C#).

---

## 5. XR UI Interaction

For UI in VR, render a `Control` tree to a `SubViewport`, map its texture onto a `Quad` mesh placed in 3D space. Pointer: a `RayCast3D` from the controller hits the quad, the hit position is converted back to 2D viewport coords, an `InputEventMouseMotion` is forwarded into the SubViewport.

> See [references/xr-ui.md](references/xr-ui.md) for the SubViewport-on-quad recipe and pointer/ray interaction.

---

## 6. Passthrough (Mixed Reality)

For headsets that support it (Quest 2+, Pico 4), set `OpenXRInterface.environment_blend_mode = XR_ENVIRONMENT_BLEND_MODE_ALPHA_BLEND` and clear the `WorldEnvironment` background to transparent. The user sees the real world with virtual content composited on top.

> See [references/passthrough.md](references/passthrough.md) for the full enabling steps and Quest-specific notes.

---

## 7. Meta Quest Export

### Setup

1. Install Android Build Template: **Project → Install Android Build Template**
2. Install OpenXR Vendors plugin: **Project → Project Settings → Plugins → Enable `Godot OpenXR Vendors`** (or install from AssetLib)
3. **Export → Add → Android**
4. In the Android export preset:
   - **XR Features → XR Mode** → `OpenXR`
   - **XR Features → Hand Tracking** → `Optional` or `Required`
   - **XR Features → Passthrough** → `Optional` (if needed)
   - **Architectures → arm64** → enabled (Quest is ARM)
5. Set minimum API level to 29+

### Performance Settings for Quest

| Setting | Recommended Value |
|---------|-------------------|
| Renderer | Mobile |
| MSAA | 2x or 4x (VR needs antialiasing) |
| Texture Compression | ETC2/ASTC |
| Target FPS | 72 (Quest 2) or 90 (Quest 3) |

> **Critical:** VR must maintain consistent frame rate. Dropped frames cause nausea. Profile aggressively and keep draw calls low.

> ⚠️ **Changed in Godot 4.7:** New project settings `xr/openxr/foveation_eye_tracked` and `xr/openxr/foveation_with_subsampled_images` both default to `true` — when the foveation level is not "Disabled", eye-tracked foveation is used where the headset supports it, and subsampled images are used on Vulkan for a bigger foveation win. Subsampled images are incompatible with many screen-space features (e.g., FXAA, glow); if any are enabled, subsampled images are automatically disabled with a log warning. Set either setting to `false` to opt out. See [GH-117868](https://github.com/godotengine/godot/pull/117868).

---

## 8. Godot 4.5+ XR Features

Godot 4.5 adds a D3D12 OpenXR backend on Windows (Quest Link / SteamVR alternative to Vulkan), foveated rendering on the Mobile Vulkan renderer, Application SpaceWarp frame synthesis for Quest/Pico, OpenXR Render Models for platform-native controller meshes, and windowed visionOS export via a dedicated visionOS preset. All are core Project Settings except SpaceWarp, which needs the Godot OpenXR Vendors plugin — no engine-level code changes.

> See [references/godot-4-5-features.md](references/godot-4-5-features.md) for enabling steps, GDScript + C# render-model snippets, and per-feature caveats.

---

## 9. Godot 4.6+ XR Features

### OpenXR 1.1 Support (Godot 4.6+)

Godot 4.6 requests OpenXR 1.1 from the runtime, unlocking 1.1 features (promoted interaction profiles and paths, etc.) without any project-level change, and falls back to 1.0 if the runtime rejects it.

> **Note:** To force a version, set `xr/openxr/target_api_version` (e.g. `1.0.48`; empty by default).

---

### Spatial Entities — Anchors, Plane Tracking, Marker Tracking (Godot 4.6+)

Godot 4.6 adds the OpenXR **Spatial Entities** extensions (experimental API): **spatial anchors** that persist virtual object positions across sessions, **plane detection** for floors, walls and ceilings, and **marker tracking** for QR codes and image markers. Enable them under **XR → OpenXR → Extensions → Spatial Entity** (all off by default; anchors with the default `RID()` context also need **Enable Spatial Anchors** and **Enable Builtin Anchor Detection**). Create an anchor with `OpenXRSpatialAnchorCapability.create_new_anchor(local_transform, RID())`, which returns an `OpenXRAnchorTracker`, and show it with an `XRAnchor3D` whose `tracker` is that tracker's name. There is no `XRSpatialAnchor` class.

> See [references/spatial-entities.md](references/spatial-entities.md) for the GDScript + C# anchor placement recipe, the C# singleton lookup, anchor persistence across sessions, and the 4.7 `next` parameter on `create_new_anchor()`.

---

## 10. Godot 4.7+ XR Features

Godot 4.7 adds the OpenXR user presence extension: `OpenXRInterface.user_presence_changed(is_user_present: bool)` fires when the headset is put on or taken off (not during startup or shutdown), with `is_user_presence_supported()` and `is_user_present()` to check and poll. Typical use: pause the game and mute audio while the headset is off. `OpenXRCompositionLayer` also gains `eye_visibility` (`EYE_VISIBILITY_BOTH`, `_LEFT`, `_RIGHT`) to show a layer to one eye only, and `create_new_anchor()` gains an optional `next` parameter for vendor create-info structs.

> See [references/godot-4-7-features.md](references/godot-4-7-features.md) for the user presence and eye visibility recipes (GDScript + C#), and [references/spatial-entities.md](references/spatial-entities.md#spatial-anchor-extensibility-godot-47) for the anchor `next` parameter.

---

## 11. Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Black screen in headset | `use_xr = true` not set on viewport | Set in `_ready()` after checking XR interface |
| Controller input not firing | Wrong signal name for the platform | Check OpenXR action map bindings in Project Settings |
| Objects scale wrong in VR | Scene not built at real-world scale | Use 1 unit = 1 meter throughout the scene |
| Motion sickness from locomotion | Smooth rotation | Use snap turning (30° increments) or add a vignette during movement |
| UI unreadable in VR | Panel too far away or too small | Place UI at 1–2m distance, use SubViewport at 1024+ resolution |
| Hand tracking jittery | Raw joint data used directly | Apply smoothing (lerp toward new position each frame) |
| Export fails on Quest | Missing Android build template or wrong architecture | Install Android Build Template; enable arm64; set API level 29+ |

---

## 12. Implementation Checklist

- [ ] OpenXR is enabled in Project Settings
- [ ] Scene uses `XROrigin3D` → `XRCamera3D` + `XRController3D` hierarchy
- [ ] XR session is started with `get_viewport().use_xr = true` after interface check
- [ ] World is built at 1 unit = 1 meter scale
- [ ] Controller input uses OpenXR action names (`trigger_click`, `grip_click`, etc.)
- [ ] Fallback exists for hand tracking → controller tracking
- [ ] UI panels use SubViewport rendered on a 3D mesh
- [ ] Locomotion includes comfort options (snap turn, vignette)
- [ ] VSync is disabled (XR runtime handles frame timing)
- [ ] Quest export uses Mobile renderer, arm64 architecture, API level 29+
- [ ] On Windows Quest Link / SteamVR builds, consider D3D12 backend if Vulkan drivers are problematic (Godot 4.5+)
- [ ] Foveated rendering enabled via `xr/openxr/foveation_level` on the Mobile renderer for standalone Quest/Pico targets (Godot 4.5+)
- [ ] Application SpaceWarp evaluated for performance budget on Meta Quest / Pico targets (Godot 4.5+)
- [ ] `OpenXRRenderModelManager` + `xr/openxr/extensions/render_model` used for controller visuals where supported (Godot 4.5+)
- [ ] visionOS export uses the dedicated visionOS preset; windowed apps only through 4.7 (Godot 4.5+)
- [ ] Spatial anchors are created with `OpenXRSpatialAnchorCapability` and shown with `XRAnchor3D`, with the spatial entities extension enabled (Godot 4.6+)
- [ ] Headset on/off handled via `OpenXRInterface.user_presence_changed` — pause/mute when the user is away (Godot 4.7+)
- [ ] Foveation defaults reviewed — `xr/openxr/foveation_eye_tracked` and `xr/openxr/foveation_with_subsampled_images` are on by default; disable subsampled images if you rely on FXAA/glow (Godot 4.7+)
