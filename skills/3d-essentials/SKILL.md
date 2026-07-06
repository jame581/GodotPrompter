---
name: 3d-essentials
description: Use when working with 3D-specific systems — materials, lighting, shadows, environment, global illumination, fog, LOD, occlusion culling, and decals in Godot 4.3+
---

# 3D Essentials in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **player-controller** for CharacterBody3D movement, **physics-system** for 3D collision shapes and raycasting, **camera-system** for Camera3D follow and transitions, **shader-basics** for spatial shaders and post-processing, **godot-optimization** for 3D performance tuning, **animation-system** for AnimationTree and 3D animation blending.

---

## 1. 3D Coordinate System & Core Nodes

### Coordinate System

Godot uses a **right-handed** coordinate system with metric units (1 unit = 1 meter):

| Axis | Direction | Color  |
|------|-----------|--------|
| X    | Right     | Red    |
| Y    | Up        | Green  |
| Z    | Out of screen (+Z toward viewer) | Blue |

> Cameras and lights point along **-Z** by default. When a character "faces forward," they look along -Z.

### Essential 3D Nodes

| Node               | Purpose                                         |
|--------------------|-------------------------------------------------|
| `Node3D`           | Base transform node — position, rotation, scale |
| `MeshInstance3D`    | Displays a mesh with a material                 |
| `Camera3D`         | Required to render 3D — perspective or orthogonal |
| `DirectionalLight3D` | Sun/moon — parallel rays, cheapest light      |
| `OmniLight3D`      | Point light — emits in all directions           |
| `SpotLight3D`      | Cone light — flashlights, spotlights            |
| `WorldEnvironment` | Sky, fog, tonemap, post-processing              |
| `Decal`            | Projected texture onto surfaces                 |
| `GPUParticles3D`   | GPU-driven particle effects                     |
| `CSGBox3D` etc.    | Constructive Solid Geometry — prototyping       |
| `GridMap`           | 3D tile-based level building                   |

> **Godot 4.7+:** `GridMap` exposes its internal octants for spatial queries — `cell_octant_size = 8` (cells per octant, per axis) plus `get_used_octants()`, `get_used_octants_by_item(item)`, `get_octants_in_bounds(bounds)` (includes empty octants), `get_used_octants_in_bounds(bounds)`, `get_used_cells_in_octant(octant_coords)`, `get_used_cells_in_octant_by_item(octant_coords, item)`, and `get_octant_coords_from_cell_coords(cell_coords)`. Octant and cell coordinates are `Vector3i` (returned in `Array[Vector3i]`); `bounds` is a local-space `AABB`.

> **Godot 4.7+:** `CSGShape3D` gains automatic smoothing — enable `autosmooth` (default `false`) and tune `smoothing_angle` (default `50.0`): faces meeting at an angle greater than `smoothing_angle` are smoothed, smaller angles stay sharp; a value below `0.1` disables all smoothing (a performance escape hatch). Children of a `CSGCombiner3D` are treated as a single mesh.

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

| Material             | Use For                                     | Notes                          |
|----------------------|---------------------------------------------|--------------------------------|
| `StandardMaterial3D` | Most 3D objects — PBR workflow              | No code; Inspector-driven      |
| `ORMMaterial3D`      | Same as Standard but with packed ORM texture | Occlusion+Roughness+Metallic in one texture |
| `ShaderMaterial`     | Custom effects — toon, water, dissolve      | Requires spatial shader code   |

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

| Light               | Shape         | Shadows | Cost    | Max Visible          |
|---------------------|---------------|---------|---------|----------------------|
| `DirectionalLight3D` | Parallel rays | PSSM    | Cheapest | 8 (Forward+)       |
| `OmniLight3D`       | Sphere        | Cube/Dual Paraboloid | Medium | 512 clustered* |
| `SpotLight3D`       | Cone          | Single texture | Cheap | 512 clustered*     |
| `AreaLight3D` (4.7+) | Rectangle    | PCSS soft      | Most expensive | — |

*Forward+ shares 512 clustered element slots among omni lights, spot lights, decals, and reflection probes.

### Light Properties

Key knobs: `light_color`, `light_energy` (HDR — values >1 are valid), `shadow_enabled` (big perf hit), `directional_shadow_mode`, `directional_shadow_max_distance` (lower = sharper shadows).

> See [references/materials-and-lighting-recipes.md](references/materials-and-lighting-recipes.md#light-properties) for the properties table and the GDScript + C# sun setup snippet.

### AreaLight3D (Godot 4.7+)

`AreaLight3D` emits light from a rectangle along the node's **-Z** — neon tubes, screens, softbox panels — with PCSS soft shadows driven by `light_size`. Key properties: `area_size = Vector2(1, 1)` (meters), `area_range = 5.0`, `area_attenuation = 1.0` (`2.0` = physically accurate inverse square), `area_normalize_energy = true` (resizing keeps total output stable), optional `area_texture` for textured emission (Forward+/Mobile only). Mobile support is limited and Compatibility cannot cast area-light shadows; in Forward+, a single visible area light adds clustered-lighting cost to *all* rendered objects — reserve for cinematics or high-end targets.

> See [references/materials-and-lighting-recipes.md](references/materials-and-lighting-recipes.md#arealight3d-godot-47) for the full property table and the GDScript + C# setup recipe.

### Dynamic Point Light

Spawn an `OmniLight3D` at runtime, drive its energy with a tween, queue-free on completion. Common for explosions, muzzle flashes, magic effects.

> See [references/materials-and-lighting-recipes.md](references/materials-and-lighting-recipes.md#dynamic-point-light) for the full GDScript and C# recipe.

### Shadow Configuration & Bake Modes

Prefer `shadow_normal_bias` over `shadow_bias` against acne; keep `directional_shadow_max_distance` at the minimum needed (50–100 m typical). Bake modes: Disabled (fully real-time, default), Static (fully baked, no runtime cost), Dynamic (indirect baked, direct real-time).

> See [references/materials-and-lighting-recipes.md](references/materials-and-lighting-recipes.md#shadow-configuration-tips) for the shadow-tuning table and the bake-modes table.

---

## 4. Environment & Post-Processing

Configure global rendering — sky background, tonemapping, glow, SSR, SSAO/SSIL/SDFGI, depth-of-field — through a `WorldEnvironment` node holding an `Environment` resource. Pick a tonemap (`Linear`, `Reinhard`, `Filmic`, `ACES`, or `AgX`) on the Environment resource. Forward+ enables SSAO, SSIL, SSR, and SDFGI; mobile/compatibility renderers omit these.

> See [references/environment-and-post.md](references/environment-and-post.md) for the full setup recipes (sky options, tonemap modes, all post-processing effects, the 4.6+ glow-before-tonemapping pipeline change, AgX `tonemap_white` / `tonemap_contrast` controls, and the 4.6+ SSR quality upgrade).

> **Godot 4.7+:** `display/window/hdr/request_hdr_output` (default `false`, promoted to a basic project setting) requests HDR display output for the main window and editor where supported, auto-switching between HDR and SDR as screens or system settings change; it forces `Viewport.use_hdr_2d` on for the main viewport (other `SubViewport`s must enable it themselves). Read only at startup — toggle `Window.hdr_output_requested` at runtime.

> ⚠️ **Changed in Godot 4.7:** The `rendering/reflections/sky_reflections/roughness_layers` default changed from `7` to `8`, altering sky-reflection roughness mip distribution for projects that left it at the default. Set it back to `7` to keep the 4.6 output. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

## 5. Global Illumination

Five GI options trade quality for cost: none (ambient only) → ReflectionProbe (localized) → LightmapGI (best quality, baked) → VoxelGI (small/medium dynamic) → SDFGI (large open-world). VoxelGI/SDFGI/LightmapGI require Forward+. The 4.5+ subsections below (Specular Occlusion, Bent Normal Maps) stay inline because they apply across GI methods.

> See [references/global-illumination.md](references/global-illumination.md) for the methods comparison table, ReflectionProbe scene + code recipe, LightmapGI bake workflow, and SDFGI configuration.

### Specular Occlusion from Ambient Light (Godot 4.5+)

Godot 4.5+ automatically computes specular occlusion from the ambient light probe when **LightmapGI**, **VoxelGI**, or **SDFGI** is active. Prevents unrealistically bright speculars in areas that receive little indirect light (under eaves, inside crevices, in corners). No API change — re-bake after upgrading to see the improvement on metallic / low-roughness surfaces. ReflectionProbe alone does not provide specular occlusion.

### Bent Normal Maps (Godot 4.5+)

Bent normal maps encode the mean unoccluded direction from each texel — the average direction toward open sky across the hemisphere. When assigned to the **Bent Normal** slot on `StandardMaterial3D`, Godot uses this information to improve indirect lighting directionality and specular occlusion accuracy. The result is more realistic ambient lighting on complex surfaces like cloth, carved stone, or organic shapes.

**Inspector setup:** In `StandardMaterial3D`, enable **Bent Normal** → assign your tangent-space bent normal texture (baked from Marmoset, Substance, or xNormal).

> **Most visible on:** materials that combine low roughness or high metallic values with baked GI (LightmapGI / VoxelGI / SDFGI). On fully rough dielectric surfaces the benefit is subtler. Use on hero assets; skip on background geometry.

> See [references/materials-and-lighting-recipes.md](references/materials-and-lighting-recipes.md) for the runtime-assignment GDScript + C# code path (the Inspector setup above is the typical case).

---

## 6. Fog

Three layers: depth/height fog set on `WorldEnvironment.environment` (cheap, all renderers), volumetric fog (Forward+ only — godrays through depth), and `FogVolume` nodes for localized fog effects (interior rooms, pits, atmospheric volumes).

> See [references/fog-recipes.md](references/fog-recipes.md) for the full GDScript and C# recipes — depth/height fog setup, volumetric fog parameters and performance notes, and FogVolume placement.

> ⚠️ **Changed in Godot 4.7:** Volumetric fog is now blended using transmittance instead of opacity, so existing volumetric fog can look different after upgrading. Enable the project setting `rendering/environment/fog/use_legacy_blending` (default `false`) to restore the previous behavior. See [GH-119414](https://github.com/godotengine/godot/pull/119414).

## 7. Decals

`Decal` nodes project a texture onto whatever surfaces fall within their bounding box — bullet holes, blood splatter, ground details, signage. All renderers support decals; performance scales with overdraw and decal count.

> See [references/decals.md](references/decals.md) for the scene setup, runtime spawning recipe (GDScript + C#), and the per-renderer decal limits.

---

## 8. Optimization — LOD, Culling, MultiMesh

Four tools: automatic mesh LOD (set on import or per `MeshInstance3D`), manual `VisibilityRange` for staged swaps, occlusion culling via `OccluderInstance3D`, and `MultiMeshInstance3D` for thousands of identical meshes in one draw call.

> See [references/lod-and-culling.md](references/lod-and-culling.md) for setup recipes for each tool plus the MultiMesh runtime population example.

## 9. Renderer Comparison

| Feature | Forward+ | Mobile | Compatibility |
|---|---|---|---|
| SSAO / SSIL / SSR / Volumetric Fog / SDFGI / VoxelGI | Yes | No | No |
| LightmapGI / Glow / Bloom | Yes | Yes | Yes |
| Max Omni+Spot per mesh | 512 clustered | 8+8 | 8+8 (adjustable) |
| Target | Desktop/Console | Mobile/Mid-range | Low-end/WebGL |

Choose in **Project Settings → Rendering → Renderer → Rendering Method**. Rule of thumb: Forward+ for desktop, Mobile for mobile, Compatibility only for web or very low-end hardware.

> **Godot 4.7+:** Vulkan raytracing (RenderingDevice BLAS/TLAS and raytracing pipelines) shipped experimental in 4.7 and is not yet recommended for production.

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
- [ ] Projects using LightmapGI/VoxelGI/SDFGI take advantage of automatic specular occlusion by upgrading to Godot 4.5+ (no API change required)
- [ ] Hero assets with complex surface detail use bent normal maps in the StandardMaterial3D Bent Normal slot for improved indirect lighting (Godot 4.5+)
- [ ] After upgrading to Godot 4.6, glow settings are re-tuned if appearance has changed (glow now runs before tonemapping)
- [ ] AgX `tonemap_white` and `tonemap_contrast` are adjusted when using AgX tonemapper for precise look control (Godot 4.6+)
- [ ] After upgrading to Godot 4.7, volumetric fog and sky reflections are re-checked (fog blending and the `roughness_layers` default changed)
