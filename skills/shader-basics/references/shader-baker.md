# Shader Baker — Export-time Pre-compilation (Godot 4.5+)

Reference for `skills/shader-basics/SKILL.md` — enabling steps and the with/without comparison.

> ← Back to [SKILL.md](../SKILL.md)

---
## 11. Shader Baker — Export-time Pre-compilation (Godot 4.5+)

The Shader Baker converts your project's shaders to the target driver's intermediate format (SPIR-V for Vulkan, DXIL for Direct3D 12, Metal's format on Apple platforms) at export time instead of at first launch. This shortens the first load, most on Metal and D3D12 where the conversion is slow. It cannot bake final pipelines, so it does not remove the stutter the first time a material renders; that still needs pipeline precompilation.

### Enabling Shader Baker

Shader baking is configured per export preset:

1. Open **Project → Export**
2. Select (or create) an export preset for your target platform
3. In the preset options, locate **Shader Baker** and set it to **Enabled**
4. Export as normal — the baked shaders are embedded in the `.pck`, which grows by a few megabytes

### What It Does

| Stage | Without Shader Baker | With Shader Baker |
|-------|----------------------|-------------------|
| Export | Fast | Slightly slower; PCK a few MB larger |
| First launch | Slow: shaders converted for the driver on the player's machine | Faster: the conversion is already done |
| First use of a material in game | Pipeline compiled on the GPU (can stutter) | Unchanged — pipelines are still compiled at runtime |

> **When to use:** Enable it for release builds on Direct3D 12 and Metal, where the gain is largest; Vulkan gains less. It has no effect on the Compatibility renderer. The editor can only bake for drivers its own OS supports, so D3D12 presets must be exported from Windows and Metal presets from macOS. For development builds, leave it off to keep iteration fast.

Shader Baker operates at the Godot export pipeline level — see the **export-pipeline** skill for how to configure export presets.
