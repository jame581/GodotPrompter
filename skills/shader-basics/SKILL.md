---
name: shader-basics
description: Use when implementing shaders — Godot shader language, visual shaders, common visual recipes, and post-processing effects
---

# Shaders in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs.

> **Related skills:** **animation-system** for shader-driven effects like hit flash, **godot-optimization** for shader performance considerations, **camera-system** for post-processing camera effects, **2d-essentials** for 2D lighting, pixel-art shaders, and CanvasTexture normal maps, **3d-essentials** for spatial shaders and environment materials, **particles-vfx** for custom particle shaders, **tween-animation** for animating shader parameters at runtime.

---

## 1. Core Concepts

### Shader Types

| Shader Type      | Applied To               | Use For                                          |
|------------------|--------------------------|--------------------------------------------------|
| `canvas_item`    | 2D nodes (Sprite2D, Control, etc.) | 2D effects — outlines, dissolve, color swap |
| `spatial`        | 3D meshes (MeshInstance3D)         | 3D materials — water, terrain, toon shading |
| `particles`      | GPUParticles2D/3D                  | Custom particle behavior                    |
| `sky`            | WorldEnvironment                   | Procedural sky rendering                    |
| `fog`            | FogVolume                          | Volumetric fog effects                      |

### Shader vs ShaderMaterial

```
Shader (.gdshader)        → The code (GLSL-like language)
ShaderMaterial            → Instance of a shader with specific uniform values
CanvasItemMaterial / StandardMaterial3D → Built-in materials (no code needed)
```

Multiple nodes can share the same Shader but have different ShaderMaterial instances with different uniform values (e.g., same dissolve shader but different dissolve progress per enemy).

### Creating a Shader

1. Select a node (e.g., Sprite2D)
2. In Inspector → Material → New ShaderMaterial
3. On the ShaderMaterial → Shader → New Shader
4. Edit the `.gdshader` file in the built-in editor

Or create a `.gdshader` file directly in the FileSystem dock.

---

## 2. Godot Shader Language Basics

Godot uses a GLSL ES 3.0-like language with Godot-specific additions.

### Minimal Canvas Item Shader

```glsl
shader_type canvas_item;

void fragment() {
    // COLOR is the output pixel color
    // TEXTURE is the sprite's texture
    // UV is the texture coordinate (0,0 top-left to 1,1 bottom-right)
    vec4 tex = texture(TEXTURE, UV);
    COLOR = tex;
}
```

### Minimal Spatial Shader

```glsl
shader_type spatial;

void fragment() {
    // ALBEDO is the base color (vec3)
    ALBEDO = vec3(0.8, 0.2, 0.2);
}
```

### Built-in Variables (canvas_item)

| Variable   | Type   | Description                           |
|------------|--------|---------------------------------------|
| `UV`       | `vec2` | Texture coordinates                   |
| `COLOR`    | `vec4` | Output color (set this in `fragment()`) |
| `TEXTURE`  | `sampler2D` | The node's texture                |
| `VERTEX`   | `vec2` | Vertex position (in `vertex()`)       |
| `TIME`     | `float`| Elapsed time in seconds               |
| `SCREEN_UV`| `vec2` | Screen-space UV (for screen effects)  |

> `SCREEN_TEXTURE` was removed in Godot 4.0. To read the screen, declare a uniform: `uniform sampler2D screen_texture : hint_screen_texture, filter_linear_mipmap;`

### Built-in Variables (spatial)

| Variable    | Type   | Description                           |
|-------------|--------|---------------------------------------|
| `ALBEDO`    | `vec3` | Base surface color                    |
| `METALLIC`  | `float`| Metallic value (0.0–1.0)             |
| `ROUGHNESS` | `float`| Roughness value (0.0–1.0)            |
| `NORMAL`    | `vec3` | Surface normal (for normal mapping)   |
| `EMISSION`  | `vec3` | Emissive color                        |
| `ALPHA`     | `float`| Transparency (enable in render mode)  |
| `VERTEX`    | `vec3` | Vertex position (in `vertex()`)       |

### Uniforms (Shader Parameters)

Uniforms expose shader values to the Inspector and code.

```glsl
shader_type canvas_item;

uniform float speed : hint_range(0.0, 10.0, 0.1) = 1.0;
uniform vec4 tint_color : source_color = vec4(1.0, 1.0, 1.0, 1.0);
uniform sampler2D noise_texture : filter_linear_mipmap;

void fragment() {
    vec4 tex = texture(TEXTURE, UV);
    COLOR = tex * tint_color;
}
```

### Common Uniform Hints

| Hint                        | Type         | Description                         |
|-----------------------------|--------------|-------------------------------------|
| `hint_range(min, max, step)` | `float/int` | Slider in Inspector                 |
| `source_color`              | `vec4`       | Color picker in Inspector           |
| `filter_linear_mipmap`      | `sampler2D`  | Texture filtering mode              |
| `repeat_enable`             | `sampler2D`  | Allow texture tiling                |
| `hint_normal`               | `sampler2D`  | Treat as normal map                 |

### Setting Uniforms from Code

#### GDScript

```gdscript
var mat: ShaderMaterial = $Sprite2D.material
mat.set_shader_parameter("speed", 2.0)
mat.set_shader_parameter("tint_color", Color.RED)
```

#### C#

```csharp
var mat = GetNode<Sprite2D>("Sprite2D").Material as ShaderMaterial;
mat.SetShaderParameter("speed", 2.0f);
mat.SetShaderParameter("tint_color", Colors.Red);
```

---

## 3. Common 2D Shader Recipes

The canvas_item recipes most projects need: **dissolve** (noise + edge glow), **outline** (sample neighbors, expand alpha), **flash-white** (uniform-driven hit effect), **color swap** (palette shift), **scrolling UV** (water/lava/clouds), **wave distortion**.

> See [references/2d-shader-recipes.md](references/2d-shader-recipes.md) for complete shader code for all six recipes.

---

## 4. Common 3D Shader Recipes

Spatial-shader recipes: **toon/cel shading** (banded NdotL), **rim lighting / Fresnel** (1 - NdotV), **simple water surface** (UV scroll + normal-map blend + Fresnel).

> See [references/3d-shader-recipes.md](references/3d-shader-recipes.md) for the full shader source for each recipe.

---

## 5. Visual Shaders

Visual shaders provide a node-based graph editor — no code required.

### When to Use Visual Shaders

| Use Visual Shaders When        | Use Code Shaders When              |
|--------------------------------|------------------------------------|
| Prototyping effects quickly    | Complex math or branching logic    |
| Artists need to tweak values   | Need precise control over every line |
| Learning shader concepts       | Performance-critical shaders       |
| Simple effects (color adjust, UV scroll) | Loops or advanced techniques |

### Creating a Visual Shader

1. Select node → Inspector → Material → New ShaderMaterial
2. Shader → New VisualShader
3. Click the shader to open the Visual Shader editor
4. Add nodes from the palette, connect pins
5. Output nodes (Output, FragmentOutput) are pre-placed

### Key Visual Shader Nodes

| Node                | Purpose                              |
|---------------------|--------------------------------------|
| `Texture2D`         | Sample a texture                     |
| `ColorConstant`     | Solid color value                    |
| `VectorOp`          | Math operations on vectors           |
| `ScalarOp`          | Math operations on floats            |
| `Mix`               | Lerp between two values              |
| `Step` / `SmoothStep` | Threshold / smooth threshold      |
| `Time`              | Current time (for animation)         |
| `UV`                | Texture coordinates                  |
| `Input` (custom)    | Expose a uniform to Inspector        |

> Visual shaders compile to the same GPU code as written shaders. There is no performance difference.

> **Godot 4.7+:** Two new spatial `Input` nodes — `in_shadow_pass` (vertex/fragment; maps to the `IN_SHADOW_PASS` built-in, `true` when the shader is being rendered in a shadow mapping pass — render objects differently in shadow maps than in the regular pass) and `specular_amount` (`light()`; maps to `SPECULAR_AMOUNT` — `2.0` × `light_specular` for OmniLight3D/SpotLight3D, `1.0` for DirectionalLight3D).

> ⚠️ **Changed in Godot 4.7:** The `LinearToSRGB` visual shader node no longer clamps its output to `[0.0, 1.0]` when using the Forward+ or Mobile renderer — HDR values above `1.0` now pass through. Graphs that relied on the implicit clamp produce different output; add an explicit `Clamp` node to restore the old behavior. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

---

## 6. Post-Processing Effects

The standard pattern: full-rect `ColorRect` with a canvas_item shader on top of the gameplay canvas. For 3D, use a `WorldEnvironment` Adjustment, Glow, or custom shader. For chained effects, render the world to a `SubViewport` then sample its texture in a final shader pass.

> See [references/post-processing.md](references/post-processing.md) for the ColorRect overlay pattern, vignette + CRT/scanline shader source, the SubViewport pipeline, and WorldEnvironment 3D post-processing notes.

---

## 7. Compositor Effects (Godot 4.3+)

`CompositorEffect` runs custom render passes within Godot's render pipeline (post-tonemap or pre-tonemap). Use when ColorRect overlays aren't enough — multi-pass effects, depth-aware effects, custom AO/SSR variants. Heavier setup than a screen-space shader; reach for it only when needed.

> See [references/compositor-effects.md](references/compositor-effects.md) for setup, a custom CompositorEffect GDScript example, and built-in Compositor use cases.

---

## 8. Render Modes

Render modes go on the first line after `shader_type` and control how the shader interacts with the rendering pipeline.

### Canvas Item Render Modes

```glsl
shader_type canvas_item;
render_mode unshaded;           // Ignore all lighting
render_mode light_only;         // Only visible where lit
render_mode blend_add;          // Additive blending (glow, fire)
render_mode blend_mix;          // Standard alpha blending (default)
render_mode blend_premul_alpha; // Pre-multiplied alpha
```

### Spatial Render Modes

```glsl
shader_type spatial;
render_mode unshaded;              // No lighting calculations
render_mode cull_disabled;         // Render both sides of faces
render_mode depth_draw_always;     // Always write to depth buffer
render_mode specular_toon;         // Toon specular model
render_mode diffuse_toon;          // Toon diffuse model
render_mode blend_add;             // Additive blending
```

---

## 9. Stencil Buffer Effects (Godot 4.5+)

Godot 4.5 exposes stencil write/read in spatial and canvas_item shaders via `stencil_write_mode`, `stencil_read_mode`, `stencil_value`, etc. across all rendering backends. Enables portals, X-ray vision, outline masks, and holes-in-geometry effects that previously required compositor-level work.

> See [references/stencil-buffer.md](references/stencil-buffer.md) for render-mode reference and the X-ray vision portal worked example.

---

## 10. SMAA Antialiasing (Godot 4.5+)

Sub-pixel Morphological Antialiasing (SMAA 1x) is a built-in post-processing AA mode added in Godot 4.5. It produces sharper, more temporally stable results than FXAA and is less costly than MSAA for deferred-heavy scenes.

### Enabling SMAA

1. Open **Project Settings**
2. Navigate to **Rendering → Anti Aliasing → Quality**
3. Set **Screen Space AA** to **SMAA**

SMAA can be combined with MSAA (for geometry edge aliasing) or used standalone. It does not require any shader code changes.

| AA Mode | Sharpness | GPU cost | Ghosting |
|---------|-----------|----------|----------|
| Disabled | N/A | None | None |
| FXAA | Low (blurry) | Very low | Low |
| **SMAA** | High | Low | Very low |
| TAA | Medium (slight blur) | Medium | Possible |
| MSAA 4x | High | High | None |

> **When to use SMAA:** Prefer SMAA over FXAA for most desktop projects — it delivers noticeably sharper text and thin edges with a similar performance profile. Combine SMAA + MSAA 2x for best quality at moderate cost.

This is an editor/export setting only — no runtime API is needed.

---

## 11. Shader Baker — Export-time Pre-compilation (Godot 4.5+)

The Shader Baker pre-compiles all project shaders for the target platform at export time, eliminating the stutter players experience the first time a new material renders in-game — especially severe on macOS/Apple Silicon (Metal) and Windows (D3D12), where shader translation is expensive. Enable it per export preset for release builds; leave it off for development builds to keep exports fast. It operates at the Godot export pipeline level — see the **export-pipeline** skill for export preset configuration.

> See [references/shader-baker.md](references/shader-baker.md) for enabling steps and the with/without comparison.

---

## 12. Common Pitfalls

| Symptom                             | Cause                                             | Fix                                                              |
|-------------------------------------|----------------------------------------------------|------------------------------------------------------------------|
| Shader has no visible effect        | Material not assigned or shader not saved           | Check node's Material property in Inspector                      |
| Transparent parts render as black   | Alpha not handled in shader                        | Set `COLOR.a = tex.a;` and use appropriate blend mode            |
| Uniform doesn't appear in Inspector | Typo in uniform name or wrong type                 | Re-save the shader; check for compilation errors                 |
| Texture appears stretched/tiled     | Missing `repeat_enable` or wrong UV scale          | Add `repeat_enable` hint to sampler2D uniform                    |
| Shader works in editor but not in game | Screen texture uniform needs backbuffer          | Use `hint_screen_texture` on a `sampler2D` uniform (Godot 4.x)  |
| Performance drops with many shaders | Each unique shader = draw call break               | Share ShaderMaterial instances; use uniforms for variation        |
| Screen-space UV is wrong            | `SCREEN_UV` not available in some contexts         | Ensure the node is rendered in the correct viewport              |
| Visual shader node missing          | Node was renamed or removed in newer Godot version | Check Godot docs for the current node name                       |

> ⚠️ **Changed in Godot 4.7:** `textureQueryLod()` is available only in the fragment shader, and Godot 4.7 enforces this with a compile error — shaders calling it from `vertex()` stop compiling after upgrading. Move the call into `fragment()`. See [GH-118962](https://github.com/godotengine/godot/pull/118962).

---

## 13. Implementation Checklist

- [ ] Shader type matches the node type (`canvas_item` for 2D, `spatial` for 3D)
- [ ] Uniforms use appropriate hints (`hint_range`, `source_color`, `filter_linear_mipmap`)
- [ ] Shared visual effects use the same Shader resource with separate ShaderMaterial instances
- [ ] Post-processing shaders are on a CanvasLayer (2D) or WorldEnvironment (3D), not on game objects
- [ ] `TEXTURE` is sampled in canvas_item shaders (otherwise sprite content is lost)
- [ ] Alpha-transparent shaders set `COLOR.a` correctly and use `blend_mix` render mode
- [ ] Animated shader parameters (dissolve, flash) are driven by Tweens or AnimationPlayer, not `_process`
- [ ] Screen-reading shaders use `hint_screen_texture` on a `sampler2D` uniform (Godot 4.x approach)
- [ ] Complex shaders are profiled with the Godot profiler to check GPU frame time
- [ ] Stencil effects use two-pass materials (write pass first, read pass second) with correct render priority (Godot 4.5+)
- [ ] SMAA is preferred over FXAA for desktop builds (sharper edges, similar cost) — set in Project Settings → Rendering → Anti Aliasing (Godot 4.5+)
- [ ] Shader Baker is enabled in all release export presets to eliminate first-use compilation stutters (Godot 4.5+)
