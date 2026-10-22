# Visual Shaders

Reference for `skills/shader-basics/SKILL.md` — when to choose a visual shader, creating one, the key nodes, and the Godot 4.7 node changes.

> ← Back to [SKILL.md](../SKILL.md)

Visual shaders provide a node-based graph editor — no code required.

### When to Use Visual Shaders

| Use Visual Shaders When | Use Code Shaders When |
|--------------------------------|------------------------------------|
| Prototyping effects quickly | Complex math or branching logic |
| Artists need to tweak values | Need precise control over every line |
| Learning shader concepts | Performance-critical shaders |
| Simple effects (color adjust, UV scroll) | Loops or advanced techniques |

### Creating a Visual Shader

1. Select node → Inspector → Material → New ShaderMaterial
2. Shader → New VisualShader
3. Click the shader to open the Visual Shader editor
4. Add nodes from the palette, connect pins
5. Output nodes (Output, FragmentOutput) are pre-placed

### Key Visual Shader Nodes

| Node | Purpose |
|---------------------|--------------------------------------|
| `Texture2D` | Sample a texture |
| `ColorConstant` | Solid color value |
| `VectorOp` | Math operations on vectors |
| `FloatOp` | Math operations on floats (`IntOp` for integers) |
| `Mix` | Lerp between two values |
| `Step` / `SmoothStep` | Threshold / smooth threshold |
| `Time` | Current time (for animation) |
| `UV` | Texture coordinates |
| `FloatParameter`, `ColorParameter`, … | Expose a uniform to Inspector (`Input` nodes read built-ins such as `TIME` and `UV`) |

> Visual shaders compile to the same GPU code as written shaders. There is no performance difference.

> **Godot 4.7+:** Two new spatial `Input` nodes — `in_shadow_pass` (vertex/fragment; maps to the `IN_SHADOW_PASS` built-in, `true` when the shader is being rendered in a shadow mapping pass — render objects differently in shadow maps than in the regular pass) and `specular_amount` (`light()`; maps to `SPECULAR_AMOUNT` — `2.0` × `light_specular` for OmniLight3D/SpotLight3D, `1.0` for DirectionalLight3D).

> ⚠️ **Changed in Godot 4.7:** The `LinearToSRGB` visual shader node no longer clamps its output to `[0.0, 1.0]` when using the Forward+ or Mobile renderer — HDR values above `1.0` now pass through. Graphs that relied on the implicit clamp produce different output; add an explicit `Clamp` node to restore the old behavior. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).
