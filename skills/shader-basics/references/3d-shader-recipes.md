# 3D Shader Recipes

Reference for `skills/shader-basics/SKILL.md` — spatial shader recipes: toon/cel shading, rim lighting (Fresnel), simple water surface.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Common 3D Shader Recipes

### Toon / Cel Shading

```glsl
shader_type spatial;

uniform vec4 base_color : source_color = vec4(0.8, 0.3, 0.3, 1.0);
uniform int shade_levels : hint_range(2, 8) = 3;

void fragment() {
    ALBEDO = base_color.rgb;
}

void light() {
    // Quantize the light to discrete steps
    float NdotL = dot(NORMAL, LIGHT);
    float intensity = clamp(NdotL, 0.0, 1.0);
    float stepped = floor(intensity * float(shade_levels)) / float(shade_levels);
    DIFFUSE_LIGHT += ALBEDO * ATTENUATION * LIGHT_COLOR * stepped;
}
```

### Rim Lighting / Fresnel

```glsl
shader_type spatial;

uniform vec4 rim_color : source_color = vec4(0.5, 0.8, 1.0, 1.0);
uniform float rim_power : hint_range(0.1, 10.0) = 3.0;

void fragment() {
    ALBEDO = vec3(0.3);
    float fresnel = pow(1.0 - dot(NORMAL, VIEW), rim_power);
    EMISSION = rim_color.rgb * fresnel;
}
```

### Simple Water Surface

```glsl
shader_type spatial;
render_mode blend_mix, depth_draw_opaque, cull_back;

uniform vec4 water_color : source_color = vec4(0.1, 0.3, 0.6, 0.8);
uniform sampler2D wave_noise : filter_linear_mipmap, repeat_enable;
uniform float wave_speed : hint_range(0.0, 1.0) = 0.05;
uniform float wave_height : hint_range(0.0, 2.0) = 0.3;

void vertex() {
    float wave = texture(wave_noise, VERTEX.xz * 0.1 + TIME * wave_speed).r;
    VERTEX.y += wave * wave_height;
}

void fragment() {
    ALBEDO = water_color.rgb;
    ALPHA = water_color.a;
    METALLIC = 0.6;
    ROUGHNESS = 0.1;
}
```

---

