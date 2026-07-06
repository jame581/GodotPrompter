---
name: 2d-essentials
description: Use when working with 2D-specific systems — TileMaps, parallax scrolling, 2D lights and shadows, canvas layers, particles 2D, custom drawing, and 2D meshes in Godot 4.3+
---

# 2D Essentials in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **player-controller** for CharacterBody2D movement patterns, **animation-system** for AnimatedSprite2D and sprite animation, **physics-system** for collision shapes and raycasting, **camera-system** for Camera2D follow and shake, **shader-basics** for 2D shaders and post-processing, **godot-optimization** for rendering and draw call tuning.

---

## 1. Canvas Layers and Draw Order

### Draw Order Rules

Within a single canvas layer, nodes draw in **scene tree order** — nodes listed lower in the Scene panel draw **on top**. Use `z_index` to override without rearranging the tree.

```gdscript
# Draw this node above siblings (default z_index is 0)
z_index = 10

# Make z_index relative to parent (default: false = global)
z_as_relative = true
```

### CanvasLayer

`CanvasLayer` creates a separate rendering layer with its own transform, independent of the camera. Higher `layer` values draw on top.

| Layer | Typical Use |
|-------|-------------|
| -1 | Parallax backgrounds |
| 0 | Default game layer (all Node2D without CanvasLayer) |
| 1 | HUD / UI overlay |
| 2 | Pause menu, screen transitions |

```
# Scene tree example
Main
├── ParallaxBackground (CanvasLayer, layer = -1)
│   └── Parallax2D
├── World (Node2D — default layer 0)
│   ├── TileMapLayer
│   └── Player
└── HUD (CanvasLayer, layer = 1)
    └── Control
```

> **Note:** CanvasLayers are NOT required to control draw order. For objects within the same game world, use `z_index` or scene tree ordering. CanvasLayers are for elements that should be independent of the camera (HUD, parallax, transitions).

### Canvas Transform

`Camera2D` works by modifying the viewport's `canvas_transform`. For manual control:

```gdscript
# Scroll the canvas directly (equivalent to camera movement)
get_viewport().canvas_transform = Transform2D(0, Vector2(-200, 0))
```

### Coordinate Conversion

```gdscript
# Local to canvas (world) coordinates
var world_pos: Vector2 = get_global_transform() * local_pos
var local_pos: Vector2 = get_global_transform().affine_inverse() * world_pos

# Local to screen coordinates (accounts for camera, stretch, window)
var screen_pos: Vector2 = get_viewport().get_screen_transform() * get_global_transform_with_canvas() * local_pos
```

```csharp
// Local to canvas (world) coordinates
Vector2 worldPos = GetGlobalTransform() * localPos;
Vector2 localFromWorld = GetGlobalTransform().AffineInverse() * worldPos;

// Local to screen coordinates
Vector2 screenPos = GetViewport().GetScreenTransform() * GetGlobalTransformWithCanvas() * localPos;
```

---


## 2. TileMap System

`TileMapLayer` (Godot 4.5+) is the modern API — one tilemap = one node = one layer. Drive painting with a `TileSet` resource (atlas + properties + physics + custom data). Use **terrain autotiling** for biome-aware tile selection, **scene collection tiles** for placing scene instances on tiles.

> See [references/tilemap.md](references/tilemap.md) for full TileSet setup, atlas / physics / terrain configuration, custom data on tiles, scene collection tiles, and the 4.5+ tile-collision-bump auto-merge fix.

---

## 3. Parallax Scrolling

`Parallax2D` (Godot 4.4+) replaces the older `ParallaxBackground`/`ParallaxLayer` pair. Set `scroll_scale` per layer (0 = static, 1 = follows camera 1:1, fractional values for depth). Add `repeat_size` for infinite tiling.

> See [references/parallax.md](references/parallax.md) for `Parallax2D` setup, side-scroller layer example, infinite repeat, split-screen parallax, common mistakes.

---

## 4. 2D Lights and Shadows

`PointLight2D` and `DirectionalLight2D` cast lighting onto sprites — pair with a normal map for 3D-style shading or use additive-blend illumination on flat sprites. Cast shadows with `LightOccluder2D`.

> See [references/lights-and-shadows.md](references/lights-and-shadows.md) for node overview, PointLight2D properties, shadow settings, cull masks, occluders, 2D normal maps, pixel-art lighting tips, and additive-sprite fake-light tricks.

---

## 5. 2D Particle Systems

`GPUParticles2D` for high counts (≥ 50 particles, GPU-driven), `CPUParticles2D` for low counts or platforms without GPU support. Both share the same `ParticleProcessMaterial` interface; differences are mainly performance.

> See [references/2d-particles.md](references/2d-particles.md) for the GPU-vs-CPU distinguishing choices, basic setup, ParticleProcessMaterial 2D properties, emission from textures, flipbook, visibility rect, common 2D recipes.

---

## 6. Custom Drawing

Override `_draw()` on any `CanvasItem` to draw lines, polygons, text, or arbitrary shapes. Call `queue_redraw()` to trigger a re-render (never call `_draw()` directly).

> See [references/custom-drawing.md](references/custom-drawing.md) for the `_draw()` method, redrawing patterns, full drawing-methods reference, default font usage, `@tool` editor preview, line-width gotchas.

> **Godot 4.7+:** `DrawableTexture2D` — a runtime-drawable texture type — shipped experimental in 4.7 and is not yet recommended for production.

---

## 7. 2D Meshes

### When to Use

`MeshInstance2D` replaces `Sprite2D` when large transparent areas waste GPU fill rate. The GPU draws the entire texture quad including fully transparent pixels — a mesh eliminates those.

### Converting Sprite2D to MeshInstance2D

1. Select the `Sprite2D`
2. Menu: **Sprite2D → Convert to MeshInstance2D**
3. Adjust growth and simplification parameters
4. Click "Convert 2D Mesh"

Best candidates:
- Screen-sized images with transparency
- Parallax layers with irregular shapes
- Layered images with large transparent borders
- Mobile/low-end GPU targets

---

## 8. 2D Antialiasing

### Per-Node Antialiasing (Recommended)

Many drawing methods support an `antialiased` parameter:

```gdscript
draw_line(Vector2.ZERO, Vector2(100, 50), Color.WHITE, 2.0, true)  # antialiased = true
```

```csharp
// Equivalent in a CanvasItem subclass (e.g., a custom Control or Node2D):
public override void _Draw()
{
    DrawLine(new Vector2(0, 0), new Vector2(100, 50), Colors.White, width: 2.0f, antialiased: true);
}
```

`Line2D` has an `Antialiased` property in the inspector — set it via `line2D.Antialiased = true` in C# or as an Inspector toggle in the editor. This works by generating additional geometry — no MSAA needed.

> ⚠️ **Changed in Godot 4.7:** `CanvasItem` antialiased line drawing no longer adds the antialiasing feather. The feather made `draw_line()`-style lines appear thicker than intended, so antialiased lines render thinner after upgrading — projects that relied on the old look must draw a thicker `width`. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

### MSAA 2D

Available in Forward+ and Mobile renderers only (NOT Compatibility).

**Project Settings → Rendering → Anti Aliasing → Quality → MSAA 2D**

Levels: 2x, 4x, 8x.

| MSAA affects | MSAA does NOT affect |
|-------------|---------------------|
| Geometry edges (lines, polygons) | Aliasing within nearest-neighbor textures |
| Sprite edges touching texture edges | Custom 2D shader output |
| | Font rendering |
| | Specular aliasing with Light2D |

> **For pixel art:** Do NOT enable MSAA 2D — it blurs intentionally sharp edges. Use the per-node `antialiased` parameter selectively.

---

## 9. 2D Snapping and Pixel-Perfect

### Editor Snapping

Three-dot menu in the 2D toolbar:
- **Grid Step** — snap to grid (configure Grid Offset and Step)
- **Rotation Step** — snap rotation to degrees
- **Smart Snap** — snap to parent, node anchors, sides, centers, guides

### Runtime Pixel Snap

For pixel-art games, enable pixel snapping to prevent subpixel jitter:

- **Node2D:** Project Settings → Rendering → 2D → Snapping → `Snap 2D Transforms to Pixel`
- **Vertices:** Project Settings → Rendering → 2D → Snapping → `Snap 2D Vertices to Pixel`
- **Controls:** Project Settings → GUI → General → `Snap Controls to Pixels`

---

## 10. Implementation Checklist

- [ ] Background is a Sprite2D or ColorRect (not the default clear color) so it receives 2D lighting
- [ ] TileSet is saved as an external `.tres` resource for reuse across levels
- [ ] TileSet has `Use Texture Padding` enabled to prevent texture bleeding
- [ ] Parallax2D textures have top-left at (0,0), not centered
- [ ] `repeat_size` matches actual texture dimensions
- [ ] `repeat_times` is increased if the camera can zoom out
- [ ] LightOccluder2D nodes are added to shadow-casting objects when shadows are enabled
- [ ] Light and occluder cull masks are configured to avoid unnecessary light calculations
- [ ] GPUParticles2D has a valid Visibility Rect (auto-generate via Particles menu)
- [ ] `queue_redraw()` is called when custom drawing state changes
- [ ] Collision shapes on tiles use the Physics Layer system, not manual CollisionShape2D nodes
- [ ] Large transparent sprites are converted to MeshInstance2D on mobile/low-end targets
