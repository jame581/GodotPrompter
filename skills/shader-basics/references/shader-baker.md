# Shader Baker — Export-time Pre-compilation (Godot 4.5+)

Reference for `skills/shader-basics/SKILL.md` — enabling steps and the with/without comparison.

> ← Back to [SKILL.md](../SKILL.md)

---
## 11. Shader Baker — Export-time Pre-compilation (Godot 4.5+)

The Shader Baker pre-compiles all your project's shaders for the target platform at export time rather than at runtime. This eliminates the stutter players experience the first time a new material renders in-game, which is especially severe on macOS/Apple Silicon (Metal) and D3D12 (Windows) where shader translation is expensive.

### Enabling Shader Baker

Shader baking is configured per export preset:

1. Open **Project → Export**
2. Select (or create) an export preset for your target platform
3. In the preset options, locate **Shader Baker** and set it to **Enabled**
4. Export as normal — baked shader cache files are bundled into the export

### What It Does

| Stage | Without Shader Baker | With Shader Baker |
|-------|----------------------|-------------------|
| Export | Fast | Slower (compiles shaders) |
| First material use in game | Stutter (compiles shader on GPU) | Instant (pre-compiled) |
| Subsequent loads | Cached after first run | Always cached |

> **When to use:** Enable Shader Baker for all release builds targeting desktop (macOS, Windows/D3D12) or mobile. The extra export time is worth the stutter-free player experience. For development builds, leave it off to keep iteration fast.

Shader Baker operates at the Godot export pipeline level — see the **export-pipeline** skill for how to configure export presets.
