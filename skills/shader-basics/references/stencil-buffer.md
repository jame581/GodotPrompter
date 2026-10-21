# Stencil Buffer Effects (Godot 4.5+)

Reference for `skills/shader-basics/SKILL.md` — the `stencil_mode` statement for writing and reading the stencil buffer, X-ray vision portal worked example.

> ← Back to [SKILL.md](../SKILL.md)

---
## 9. Stencil Buffer Effects (Godot 4.5+)

Godot 4.5 exposes hardware stencil operations on all backends (Vulkan, D3D12, Metal, GLES3). Stencils let you mark pixels during one draw pass and test against those marks in a later pass — enabling portals, X-ray vision through walls, per-object masks, and holes-in-geometry that were impossible without custom CompositorEffect code before 4.5.

### How It Works

The stencil works in two passes:
1. **Write pass** — marks pixels with a reference value using `stencil_mode write, <ref>;`
2. **Read pass** — tests pixels against the written value using `stencil_mode read, compare_equal, <ref>;`

### Stencil Modes (spatial shaders only)

Stencil state is its own statement, separate from `render_mode`: `stencil_mode <flags>, <compare>, <reference>;`. canvas_item shaders have no stencil modes.

| `stencil_mode` argument | Effect |
|-------------------------|--------|
| `read` | Tests this draw against the stencil buffer (transparent pass only) |
| `write` | Writes the reference value to the stencil buffer |
| `write_depth_fail` | Writes the reference value where the depth test fails |
| `compare_always`, `compare_equal`, `compare_not_equal`, `compare_less`, `compare_less_or_equal`, `compare_greater`, `compare_greater_or_equal` | Comparison function |
| integer `0`–`255` | Reference value |

### Example — X-Ray Vision Portal

Pass 1: Mask shader marks where the portal mesh is rendered.

```glsl
// portal_mask.gdshader
shader_type spatial;
render_mode unshaded;
stencil_mode write, 1;

void fragment() {
    // Write stencil value 1 everywhere the portal mesh appears.
    // The portal itself can be invisible — just set ALPHA = 0 if needed.
    ALBEDO = vec3(0.0);
    ALPHA = 0.0;
}
```

Pass 2: X-ray shader only draws where stencil value is 1.

```glsl
// xray_object.gdshader
shader_type spatial;
render_mode unshaded, depth_test_disabled;
stencil_mode read, compare_equal, 1;

void fragment() {
    // Only visible inside the portal area. Writing ALPHA puts this in the
    // transparent pass, the only pass that can read the stencil buffer.
    ALBEDO = vec3(0.2, 0.8, 1.0);
    ALPHA = 1.0;
}
```

In your scene, assign `portal_mask.gdshader` to the portal mesh and `xray_object.gdshader` to the character/object you want to see through walls. Render priority controls draw order (portal mask must render before the x-ray pass).

> **Note:** `stencil_mode` is a Godot 4.5+ feature and is still marked experimental; the modes in the table above are the full list ([PR #80710](https://github.com/godotengine/godot/pull/80710)). `StandardMaterial3D` exposes the same thing through its Stencil properties (`stencil_mode`: Outline / X-Ray / Custom) with no shader code. Both example shaders compile on 4.7.2; the rendered result was not checked.

> **When to use:** Use stencil effects for portal/window cutouts, selective object highlights, and masking effects. For per-object outlines without stencils, the multi-pass highlight approach in Section 3 is simpler.

C# uses the same shader code and `ShaderMaterial.SetShaderParameter()` API — stencil state is set by the `.gdshader` `stencil_mode` statement (or the `BaseMaterial3D` stencil properties), not in GDScript/C#.

---

