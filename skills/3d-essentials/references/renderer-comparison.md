> ← Back to [SKILL.md](../SKILL.md)

# Renderer Comparison

| Feature | Forward+ | Mobile | Compatibility |
|---|---|---|---|
| SSAO / SSIL / SSR / Volumetric Fog / SDFGI / VoxelGI | Yes | No | No |
| LightmapGI / Glow / Bloom | Yes | Yes | Yes |
| Max Omni+Spot per mesh | 512 clustered | 8+8 | 8+8 (adjustable) |
| Target | Desktop/Console | Mobile/Mid-range | Low-end/WebGL |

Choose in **Project Settings → Rendering → Renderer → Rendering Method**. Rule of thumb: Forward+ for desktop, Mobile for mobile, Compatibility only for web or very low-end hardware.

> **Godot 4.7+:** Vulkan raytracing (RenderingDevice BLAS/TLAS and raytracing pipelines) shipped experimental in 4.7 and is not yet recommended for production.
