# Passthrough (Mixed Reality)

Reference for `skills/xr-development/SKILL.md` — enabling OpenXR passthrough, blend modes, Quest-specific notes.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Passthrough (Mixed Reality)

Passthrough blends the real world with virtual content (AR/MR).

```gdscript
func enable_passthrough() -> void:
    var xr_interface: XRInterface = XRServer.find_interface("OpenXR")
    if xr_interface:
        # Request passthrough blend mode
        xr_interface.environment_blend_mode = XRInterface.XR_ENV_BLEND_MODE_ALPHA_BLEND
        # Make the background transparent
        get_viewport().transparent_bg = true
        RenderingServer.set_default_clear_color(Color(0, 0, 0, 0))
```

```csharp
private void EnablePassthrough()
{
    var xrInterface = XRServer.FindInterface("OpenXR");
    if (xrInterface != null)
    {
        // Request passthrough blend mode
        xrInterface.EnvironmentBlendMode = XRInterface.EnvironmentBlendModeEnum.AlphaBlend;
        // Make the background transparent
        GetViewport().TransparentBg = true;
        RenderingServer.SetDefaultClearColor(new Color(0, 0, 0, 0));
    }
}
```

> **Passthrough support:** Meta Quest 3/Pro, Pico 4, Varjo XR-4. Not all headsets support it. Apple Vision Pro is not an OpenXR target in Godot (see Section 8).

---

