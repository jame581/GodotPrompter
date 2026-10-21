# Post-Processing Effects

Reference for `skills/shader-basics/SKILL.md` — ColorRect overlay pattern, vignette, CRT/scanline, SubViewport pipeline, WorldEnvironment 3D post-processing.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Post-Processing Effects

### Using a ColorRect Overlay

The simplest post-processing setup for 2D:

1. Add a **CanvasLayer** (layer = 100, to render on top)
2. Add a **ColorRect** child set to full screen
3. Assign a ShaderMaterial to the ColorRect

```
Root
├── Game (your scene)
└── CanvasLayer (layer = 100)
    └── ColorRect (full screen, shader material)
```

Set the ColorRect to fill the screen:
- Anchor Preset → Full Rect
- Mouse Filter → Ignore (so it doesn't block input)

### Vignette

```glsl
shader_type canvas_item;

uniform float vignette_intensity : hint_range(0.0, 1.0) = 0.4;
uniform float vignette_opacity : hint_range(0.0, 1.0) = 0.5;

void fragment() {
    float dist = distance(UV, vec2(0.5));
    float vignette = smoothstep(0.2, 0.7, dist * vignette_intensity * 2.0);
    COLOR = vec4(0.0, 0.0, 0.0, vignette * vignette_opacity);
}
```

### CRT / Scanline Effect

> Use this on a **SubViewportContainer** (where `TEXTURE` contains the rendered scene) or replace `TEXTURE` with a `hint_screen_texture` sampler on a ColorRect overlay.

```glsl
shader_type canvas_item;

uniform float scanline_count : hint_range(0.0, 1000.0) = 300.0;
uniform float scanline_opacity : hint_range(0.0, 1.0) = 0.15;
uniform float curvature : hint_range(0.0, 10.0) = 2.0;

void fragment() {
    // Barrel distortion for CRT curve
    vec2 uv = UV * 2.0 - 1.0;
    uv *= 1.0 + pow(length(uv), 2.0) * curvature * 0.01;
    uv = (uv + 1.0) * 0.5;

    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        COLOR = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        vec4 tex = texture(TEXTURE, uv);
        // Scanlines
        float scanline = sin(uv.y * scanline_count * 3.14159) * 0.5 + 0.5;
        tex.rgb -= scanline * scanline_opacity;
        COLOR = tex;
    }
}
```

### Using SubViewport for Post-Processing

For full-scene effects in 2D or 3D:

```
SubViewportContainer (ShaderMaterial with post-process shader)
└── SubViewport (size = window size)
    └── Your Game Scene
```

The SubViewportContainer receives the rendered SubViewport as `TEXTURE`, and the shader processes the entire frame.

### WorldEnvironment (3D Post-Processing)

For 3D, use the built-in Environment resource on WorldEnvironment:
- Tonemap (ACES, Filmic, Reinhard)
- Glow/Bloom
- SSAO, SSIL, SSR
- Depth of Field
- Color correction (brightness, contrast, saturation)
- Fog

These require **no shader code** — configure in Inspector on the Environment resource.

---

