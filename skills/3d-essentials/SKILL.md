---
name: 3d-essentials
description: Use when working with 3D-specific systems — materials, lighting, shadows, environment, global illumination, fog, LOD, occlusion culling, and decals in Godot 4.3+
---

# 3D Essentials in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **rendering-pipeline** for renderer choice, lighting strategy, AA and resolution scaling, **player-controller** for CharacterBody3D movement, **physics-system** for 3D collision shapes and raycasting, **camera-system** for Camera3D follow and transitions, **shader-basics** for spatial shaders and post-processing, **godot-optimization** for 3D performance tuning, **animation-system** for AnimationTree and 3D animation blending.

---

## 1. 3D Coordinate System & Core Nodes

### Coordinate System

Godot uses a **right-handed** coordinate system with metric units (1 unit = 1 meter):

| Axis | Direction | Color |
|------|-----------|--------|
| X | Right | Red |
| Y | Up | Green |
| Z | Out of screen (+Z toward viewer) | Blue |

> Cameras and lights point along **-Z** by default. When a character "faces forward," they look along -Z.

### Essential 3D Nodes

| Node | Purpose |
|--------------------|-------------------------------------------------|
| `Node3D` | Base transform node — position, rotation, scale |
| `MeshInstance3D` | Displays a mesh with a material |
| `Camera3D` | Required to render 3D — perspective or orthogonal |
| `DirectionalLight3D` | Sun/moon — parallel rays, cheapest light |
| `OmniLight3D` | Point light — emits in all directions |
| `SpotLight3D` | Cone light — flashlights, spotlights |
| `WorldEnvironment` | Sky, fog, tonemap, post-processing |
| `Decal` | Projected texture onto surfaces |
| `GPUParticles3D` | GPU-driven particle effects |
| `CSGBox3D` etc. | Constructive Solid Geometry — prototyping |
| `GridMap` | 3D tile-based level building |

> **Godot 4.7+:** `GridMap` exposes its internal octants for spatial queries (`cell_octant_size`, `get_used_octants()`, `get_octants_in_bounds()` and friends) so you can scope work to a region instead of walking every cell. `CSGShape3D` gains `autosmooth` / `smoothing_angle` for automatic face smoothing. Full method table and semantics: [references/godot-4.7-additions.md](references/godot-4.7-additions.md)

### Minimal 3D Scene

```
World (Node3D)
├── Camera3D
├── DirectionalLight3D
├── WorldEnvironment
├── MeshInstance3D (floor)
└── MeshInstance3D (player model)
```

---

## 2. Materials

### StandardMaterial3D vs ShaderMaterial

| Material | Use For | Notes |
|----------------------|---------------------------------------------|--------------------------------|
| `StandardMaterial3D` | Most 3D objects — PBR workflow | No code; Inspector-driven |
| `ORMMaterial3D` | Same as Standard but with packed ORM texture | Occlusion+Roughness+Metallic in one texture |
| `ShaderMaterial` | Custom effects — toon, water, dissolve | Requires spatial shader code |

### Key StandardMaterial3D Properties

The PBR core: `albedo_color` / `albedo_texture` (base color), `metallic` (0 dielectric → 1 metal), `roughness` (0 mirror → 1 matte), `normal_map` (surface detail), `ao_texture` (ambient occlusion). Add `emission` + `emission_energy_multiplier` for self-illumination, `heightmap_texture` for parallax, `rim` / `clearcoat` for material flair.

### Transparency Modes

Prefer Alpha Scissor (fast, shadowed cutouts) or Alpha Hash (dithered — hair) over plain Alpha (slow, no shadows); Depth Pre-Pass suits mostly-opaque meshes with transparent edges.

> See [references/materials-and-lighting-recipes.md](references/materials-and-lighting-recipes.md#transparency-modes) for the comparison table.

### Setting Materials from Code & Material Instancing

Create a `StandardMaterial3D` at runtime, assign to `mesh.material_override`, and drive emissive flashes via Tween. Use `.duplicate()` to make per-instance copies so changing one mesh's material doesn't affect others.

> See [references/materials-and-lighting-recipes.md](references/materials-and-lighting-recipes.md) for the full GDScript and C# recipes (basic material setup, emissive flash, per-instance duplicate, dynamic OmniLight3D explosion).

---

## 3. Lighting

### Light Types Comparison

| Light | Shape | Shadows | Cost | Max Visible |
|---------------------|---------------|---------|---------|----------------------|
| `DirectionalLight3D` | Parallel rays | PSSM | Cheapest | 8 (Forward+) |
| `OmniLight3D` | Sphere | Cube/Dual Paraboloid | Medium | 512 clustered* |
| `SpotLight3D` | Cone | Single texture | Cheap | 512 clustered* |
| `AreaLight3D` (4.7+) | Rectangle | PCSS soft | Most expensive | — |

*Forward+ shares 512 clustered element slots among omni lights, spot lights, decals, and reflection probes.

### Light Properties

Key knobs: `light_color`, `light_energy` (HDR — values >1 are valid), `shadow_enabled` (big perf hit), `directional_shadow_mode`, `directional_shadow_max_distance` (lower = sharper shadows).

> See [references/materials-and-lighting-recipes.md](references/materials-and-lighting-recipes.md#light-properties) for the properties table and the GDScript + C# sun setup snippet.

### AreaLight3D (Godot 4.7+)

`AreaLight3D` emits light from a rectangle along the node's **-Z** (neon tubes, screens, softbox panels), with PCSS soft shadows driven by `light_size`. Mobile support is limited and Compatibility cannot cast area-light shadows; in Forward+ one visible area light adds clustered-lighting cost to *all* rendered objects, so reserve it for cinematics or high-end targets.

> See [references/materials-and-lighting-recipes.md](references/materials-and-lighting-recipes.md#arealight3d-godot-47) for the full property table and the GDScript + C# setup recipe.

### Dynamic Point Light

Spawn an `OmniLight3D` at runtime, drive its energy with a tween, queue-free on completion. Common for explosions, muzzle flashes, magic effects.

> See [references/materials-and-lighting-recipes.md](references/materials-and-lighting-recipes.md#dynamic-point-light) for the full GDScript and C# recipe.

### Shadow Configuration & Bake Modes

Prefer `shadow_normal_bias` over `shadow_bias` against acne; keep `directional_shadow_max_distance` at the minimum needed (50–100 m typical). Bake modes: Disabled (fully real-time, default), Static (fully baked, no runtime cost), Dynamic (indirect baked, direct real-time).

> See [references/materials-and-lighting-recipes.md](references/materials-and-lighting-recipes.md#shadow-configuration-tips) for the shadow-tuning table and the bake-modes table.

---

## 4. Environment & Post-Processing

Configure global rendering — sky background, tonemapping, glow, SSR, SSAO/SSIL/SDFGI, depth-of-field — through a `WorldEnvironment` node holding an `Environment` resource. Pick a tonemap (`Linear`, `Reinhard`, `Filmic`, `ACES`, or `AgX`) on the Environment resource. Forward+ enables SSAO, SSIL, SSR, and SDFGI; the Mobile renderer omits them, and Compatibility has only SSAO (since 4.6).

> See [references/environment-and-post.md](references/environment-and-post.md) for the full setup recipes (sky options, tonemap modes, all post-processing effects, the 4.6+ glow blend and default changes, AgX `tonemap_agx_white` / `tonemap_agx_contrast` controls, and the 4.6+ SSR quality upgrade).

> **Godot 4.7+:** `display/window/hdr/request_hdr_output` requests HDR display output (read at startup; toggle `Window.hdr_output_requested` at runtime). ⚠️ The `rendering/reflections/sky_reflections/roughness_layers` default is `8` again after `7` in 4.6.0–4.6.1. Details in [references/environment-and-post.md](references/environment-and-post.md#hdr-output-and-sky-reflection-layers-godot-47).

## 5. Global Illumination

Five GI options trade quality for cost: none (ambient only) → ReflectionProbe (localized) → LightmapGI (best quality, baked) → VoxelGI (small/medium dynamic) → SDFGI (large open-world). VoxelGI and SDFGI require Forward+; LightmapGI plays on all three renderers but bakes only in a Forward+ or Mobile editor. The 4.5+ subsection below applies across GI methods.

> See [references/global-illumination.md](references/global-illumination.md) for the methods comparison table, ReflectionProbe scene + code recipe, LightmapGI bake workflow, and SDFGI configuration.

### Specular Occlusion & Bent Normal Maps (Godot 4.5+)

Since 4.5, indirect specular is dimmed by the ambient light reaching each pixel, in all renderers — on by default, no re-bake; disable globally with `rendering/reflections/specular_occlusion/enabled` or per shader with `render_mode specular_occlusion_disabled`. The `StandardMaterial3D` **Bent Normal** slot takes a baked bent normal map for better indirect lighting on hero assets.

> See [references/global-illumination.md](references/global-illumination.md#specular-occlusion-from-ambient-light-godot-45) for when each one matters and the bent normal setup.

---

## 6. Fog

Three layers: depth/height fog set on `WorldEnvironment.environment` (cheap, all renderers), volumetric fog (Forward+ only — godrays through depth), and `FogVolume` nodes for localized fog effects (interior rooms, pits, atmospheric volumes).

> See [references/fog-recipes.md](references/fog-recipes.md) for the full GDScript and C# recipes — depth/height fog setup, volumetric fog parameters and performance notes, and FogVolume placement.

> ⚠️ **Changed in Godot 4.7:** New project setting `rendering/environment/fog/use_legacy_blending` (default `false`) restores the volumetric fog blending of Godot 4.5 and earlier ([GH-119414](https://github.com/godotengine/godot/pull/119414); also on the 4.6 branch). The blending itself changed in **4.6**, which made it more physically accurate, so fog tuned on 4.5 looks brighter after upgrading ([GH-112494](https://github.com/godotengine/godot/pull/112494)). Enable the setting to get the old look back exactly; otherwise lower the fog density or the lights' Volumetric Fog Energy.

## 7. Decals

`Decal` nodes project a texture onto whatever surfaces fall within their bounding box — bullet holes, blood splatter, ground details, signage. All renderers support decals; performance scales with overdraw and decal count.

> See [references/decals.md](references/decals.md) for the scene setup, runtime spawning recipe (GDScript + C#), and the per-renderer decal limits.

---

## 8. Optimization — LOD, Culling, MultiMesh

Four tools: automatic mesh LOD (set on import or per `MeshInstance3D`), manual `VisibilityRange` for staged swaps, occlusion culling via `OccluderInstance3D`, and `MultiMeshInstance3D` for thousands of identical meshes in one draw call.

> See [references/lod-and-culling.md](references/lod-and-culling.md) for setup recipes for each tool plus the MultiMesh runtime population example.

## 9. Renderer Comparison

Pick the renderer before you build the look: **Forward+** (desktop default) is the only one with SDFGI and volumetric fog, **Mobile** trades those for performance on tile-based GPUs, and **Compatibility** (GLES3-class) drops most advanced lighting entirely. Advice that assumes SDFGI silently fails on the other two.

Full feature-by-renderer table and selection guidance: [references/renderer-comparison.md](references/renderer-comparison.md)

---

## 10. Common Pitfalls

Quick symptom → cause → fix table covering black scenes, dark objects without ambient light, shadow acne and peter-panning, popping shadows, flat materials, invisible decals, transparency sorting artifacts, SDFGI light leaking, missing volumetric fog, and invisible MultiMesh instances.

> See [references/common-pitfalls.md](references/common-pitfalls.md) for the full table.

---

## 11. Implementation Checklist

- [ ] Scene has Camera3D, at least one light source, and WorldEnvironment
- [ ] Environment has a sky material (procedural or HDR panorama) for ambient and reflected light
- [ ] Tonemap mode is set (Filmic or ACES for realistic look, AgX for physically accurate)
- [ ] DirectionalLight3D has shadows enabled with `shadow_normal_bias` tuned to prevent acne
- [ ] `directional_shadow_max_distance` is set to the minimum needed (50–100m typical)
- [ ] Static geometry uses StandardMaterial3D with appropriate PBR textures (albedo, normal, roughness, metallic)
- [ ] Transparent materials use Alpha Scissor or Alpha Hash instead of Alpha where possible (performance + shadows)
- [ ] ReflectionProbes are placed in rooms/areas with reflective surfaces
- [ ] GI method chosen based on project needs (LightmapGI for static, SDFGI for large dynamic, VoxelGI for small dynamic)
- [ ] Mesh LOD is enabled on import (default for glTF/Blend — verify OBJ files)
- [ ] Occlusion culling is enabled and baked for scenes with heavy occlusion (indoor, urban)
- [ ] MultiMeshInstance3D is used for instanced geometry (grass, trees, props) instead of individual nodes
- [ ] Renderer matches target platform (Forward+ desktop, Mobile mobile, Compatibility web)
- [ ] Specular occlusion (on by default since Godot 4.5) is left enabled, or disabled deliberately via `rendering/reflections/specular_occlusion/enabled` where reflections look too dim
- [ ] Hero assets with complex surface detail use bent normal maps in the StandardMaterial3D Bent Normal slot for improved indirect lighting (Godot 4.5+)
- [ ] After upgrading to Godot 4.6, glow settings are re-tuned if appearance has changed (default blend mode is now Screen and glow is blended before tonemapping)
- [ ] AgX `tonemap_agx_white` and `tonemap_agx_contrast` are adjusted when using AgX tonemapper for precise look control (Godot 4.6+)
- [ ] After upgrading, volumetric fog (blending changed in 4.6; 4.7 adds `use_legacy_blending`) and sky reflections (`roughness_layers` differed in 4.6.0–4.6.1) are re-checked
