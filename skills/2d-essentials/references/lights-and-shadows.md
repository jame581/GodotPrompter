# 2D Lights and Shadows

Reference for `skills/2d-essentials/SKILL.md` — node overview, basic setup, PointLight2D properties, shadow settings, light cull masks, occluders, normal maps for 2D, pixel-art lighting tips, additive-sprite fake lights.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. 2D Lights and Shadows

### Node Overview

| Node | Purpose |
|------|---------|
| `CanvasModulate` | Darkens the entire scene (sets ambient color) |
| `PointLight2D` | Omnidirectional/spot light from a point |
| `DirectionalLight2D` | Uniform light from a direction (sun/moon) |
| `LightOccluder2D` | Casts shadows from light sources |

### Basic Setup

1. Add `CanvasModulate` to the scene → set color to dark (e.g. `Color(0.1, 0.1, 0.15)`)
2. Add `PointLight2D` → assign a `Texture` (light shape/gradient) → set `Energy` for intensity
3. For shadows: enable `Shadow > Enabled` on the light, add `LightOccluder2D` nodes to shadow-casting objects

> **Warning:** The background color (Project Settings → Rendering → Environment → Default Clear Color) does NOT receive 2D lighting. Use a full-screen `Sprite2D` or `ColorRect` as your background instead.

### PointLight2D Properties

| Property | Purpose |
|----------|---------|
| `Texture` | Light shape (size determined by texture size) |
| `Texture Scale` | Multiplier for light size (larger = more expensive) |
| `Color` | Light tint |
| `Energy` | Intensity multiplier |
| `Height` | Virtual height for normal mapping (0 = parallel to surface) |
| `Blend Mode` | Add (default), Subtract (negative light), Mix (linear interpolation) |

### Shadow Settings

| Property | Purpose |
|----------|---------|
| `Shadow > Enabled` | Must be enabled for shadows |
| `Shadow > Color` | Shadow tint (default: black) |
| `Shadow > Filter` | None (pixel-art), PCF5 (soft), PCF13 (softest, expensive) |
| `Shadow > Filter Smooth` | Softening amount (higher = softer, may cause banding) |
| `Shadow > Item Cull Mask` | Which LightOccluder2D nodes cast shadows |

### Light Cull Masks

Both lights and occluders have cull masks:
- **Light's Item Cull Mask** → controls which `CanvasItem` nodes receive this light
- **Light's Shadow Item Cull Mask** → controls which `LightOccluder2D` nodes cast shadows for this light
- **LightOccluder2D's Occluder Light Mask** → controls which lights this occluder casts shadows for

### Creating Occluders

- **From Sprite2D:** Select Sprite2D → Sprite2D menu → **Create LightOccluder2D Sibling**
- **Manual:** Add `LightOccluder2D` node → click "+" to create polygon → draw points

### Normal Maps for 2D

Apply per-pixel lighting with normal maps using `CanvasTexture`:

1. Create `CanvasTexture` resource
2. Set `Diffuse > Texture` to the base color sprite
3. Set `Normal Map > Texture` to the normal map
4. Optionally set `Specular > Texture` for reflections
5. Assign the `CanvasTexture` as the Sprite2D's texture

| Property | Purpose |
|----------|---------|
| `Specular > Shininess` | Specular exponent (lower = diffuse, higher = focused) |
| `Specular > Color` | Tint for reflections |

> **Tip:** Use [Laigter](https://azagaya.itch.io/laigter) (free, open source) to generate normal maps from 2D sprites.

### Pixel-Art Lighting

Standard 2D lighting renders at viewport pixel resolution, not texture texel resolution. For pixelated lighting that matches pixel-art aesthetics:

```glsl
shader_type canvas_item;

uniform float pixel_size : hint_range(1.0, 16.0) = 4.0;

void fragment() {
    LIGHT_VERTEX.xy = floor(LIGHT_VERTEX.xy / pixel_size) * pixel_size;
    SHADOW_VERTEX = floor(SHADOW_VERTEX / pixel_size) * pixel_size;
    COLOR = texture(TEXTURE, UV);
}
```

Apply this shader via `ShaderMaterial` on each lit sprite that should have pixelated lighting.

### Additive Sprites as Fake Lights

Set `CanvasItemMaterial > Blend Mode` to **Add** on a Sprite2D for a cheap glow effect. Faster than real lights but no shadows, no normal map support, and inaccurate blending in dark areas.

---

