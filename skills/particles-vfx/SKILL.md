---
name: particles-vfx
description: Use when implementing particle effects — GPUParticles2D/3D, ParticleProcessMaterial, emission shapes, subemitters, trails, attractors, collision, and common VFX recipes
---

# Particle Systems in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **shader-basics** for custom particle shaders, **3d-essentials** for lighting and environment that affect particles, **2d-essentials** for 2D rendering context, **tween-animation** for code-driven VFX timing, **godot-optimization** for particle performance tuning.

---

## 1. Core Concepts

### GPU vs CPU Particles

| Node                | Processing | Features                                | Use For                        |
|---------------------|------------|-----------------------------------------|--------------------------------|
| `GPUParticles2D`    | GPU        | Full features, high counts, trails      | Most 2D effects                |
| `GPUParticles3D`    | GPU        | Full features, attractors, collision    | Most 3D effects                |
| `CPUParticles2D`    | CPU        | Simpler, no trails/attractors           | Low-end devices, few particles |
| `CPUParticles3D`    | CPU        | Simpler, no trails/attractors           | Low-end devices, few particles |

**Rule of thumb:** Use GPU particles by default. Switch to CPU particles only for low-end/web targets or when you need CPU-side particle positions (e.g., spawning objects at particle locations).

> You can convert between GPU and CPU particles in the editor: select the node → toolbar → **Convert to CPUParticles2D/3D** (or vice versa).

### Particle System Architecture

```
GPUParticles2D/3D
├── Process Material (ParticleProcessMaterial)   ← physics, emission, color
├── Draw Pass 1 (Mesh)                            ← what each particle looks like
└── (Optional) Draw Pass 2-4                      ← additional meshes
```

### Minimal Setup

1. Add a **GPUParticles2D** (or 3D) node
2. In Inspector → Process Material → **New ParticleProcessMaterial**
3. Set **Amount** (number of particles)
4. Configure emission, direction, velocity, gravity
5. (2D) Set **Texture** for particle appearance
6. (3D) Set **Draw Pass 1** mesh (QuadMesh for billboards, or custom mesh)

---

## 2. Key Node Properties

### GPUParticles2D/3D Properties

| Property          | Type     | Description                                         |
|-------------------|----------|-----------------------------------------------------|
| `emitting`        | `bool`   | Start/stop emission                                 |
| `amount`          | `int`    | Total particles alive at once                       |
| `lifetime`        | `float`  | Seconds each particle lives                         |
| `one_shot`        | `bool`   | Emit once then stop                                 |
| `preprocess`      | `float`  | Simulate this many seconds before first frame       |
| `speed_scale`     | `float`  | Time multiplier for particle physics                |
| `explosiveness`   | `float`  | 0.0 = spread over lifetime, 1.0 = all at once      |
| `fixed_fps`       | `int`    | Lock particle update rate (0 = match render FPS)    |
| `local_coords`    | `bool`   | Particles move with the node (true) or stay in world (false) |
| `draw_order`      | `enum`   | Index, Lifetime, or Reverse Lifetime                |
| `amount_ratio`    | `float`  | Fraction of particles to emit (0.0–1.0)             |

### One-Shot vs Continuous

```gdscript
# Continuous emitter (fire, smoke, ambient dust)
$GPUParticles2D.one_shot = false
$GPUParticles2D.emitting = true

# One-shot burst (explosion, impact splash)
$GPUParticles2D.one_shot = true
$GPUParticles2D.emitting = false  # arm it
# Later, trigger:
$GPUParticles2D.restart()
$GPUParticles2D.emitting = true
```

```csharp
// Continuous
var particles = GetNode<GpuParticles2D>("GPUParticles2D");
particles.OneShot = false;
particles.Emitting = true;

// One-shot burst
particles.OneShot = true;
particles.Emitting = false;
// Trigger:
particles.Restart();
particles.Emitting = true;
```

### Local Billboard Alignment (Godot 4.7+)

`GPUParticles3D` gains `TRANSFORM_ALIGN_LOCAL_BILLBOARD` (`= 4`): each particle's Z axis faces the camera while preserving a given axis — X or Y, chosen via `transform_align_axis`. For billboarded particles, `transform_align_channel_filter` selects which custom channel to read to calculate their angle. `ParticleProcessMaterial` pairs this with per-axis rotation velocity: enable `use_rotation_velocity_3d`, then set `rotation_velocity_3d_min/max` (`Vector3`, on the particle's local axes) and optionally `rotation_velocity_3d_curve` (per-axis curve over lifetime).

```gdscript
# 3D only — billboard toward the camera while keeping the Y axis fixed.
# Assumes a ParticleProcessMaterial is assigned (section 1 setup).
$GPUParticles3D.transform_align = GPUParticles3D.TRANSFORM_ALIGN_LOCAL_BILLBOARD
$GPUParticles3D.transform_align_axis = RenderingServer.PARTICLES_ALIGN_AXIS_Y

var mat: ParticleProcessMaterial = $GPUParticles3D.process_material
mat.use_rotation_velocity_3d = true
mat.rotation_velocity_3d_min = Vector3(-2.0, 0.0, 0.0)
mat.rotation_velocity_3d_max = Vector3(2.0, 0.0, 0.0)
```

```csharp
// Assumes a ParticleProcessMaterial is assigned (section 1 setup).
var particles = GetNode<GpuParticles3D>("GPUParticles3D");
particles.TransformAlign = GpuParticles3D.TransformAlignEnum.LocalBillboard;
particles.TransformAlignAxis = RenderingServer.ParticlesTransformAlignAxis.Y;

var mat = (ParticleProcessMaterial)particles.ProcessMaterial;
mat.UseRotationVelocity3D = true;
mat.RotationVelocity3DMin = new Vector3(-2.0f, 0.0f, 0.0f);
mat.RotationVelocity3DMax = new Vector3(2.0f, 0.0f, 0.0f);
```

---

## 3. ParticleProcessMaterial — Essential Properties

The material drives per-particle behavior: **emission shape** (Point / Sphere / Box / Ring / Points / Directed Points), **direction + spread + initial velocity**, **gravity**, **scale and color over lifetime** (via `scale_curve` / `color_ramp`), **damping**, **radial/tangential acceleration**, and **angular velocity**.

> See [references/process-material-basics.md](references/process-material-basics.md) for the emission-shape table and GDScript + C# snippets for each property group.

### Per-Axis 3D Scale & Rotation (Godot 4.7+)

Randomize scale and initial orientation per axis instead of uniformly. `use_scale_3d` enables `scale_3d_min/max` (`Vector3` random scale per particle); `use_rotation_3d` enables `rotation_3d_min/max` (`Vector3`, degrees — works only in 3D).

```gdscript
mat.use_scale_3d = true
mat.scale_3d_min = Vector3(0.5, 1.0, 0.5)
mat.scale_3d_max = Vector3(1.0, 2.0, 1.0)

mat.use_rotation_3d = true  # 3D only
mat.rotation_3d_min = Vector3(0.0, -180.0, 0.0)  # degrees
mat.rotation_3d_max = Vector3(0.0, 180.0, 0.0)
```

```csharp
mat.UseScale3D = true;
mat.Scale3DMin = new Vector3(0.5f, 1.0f, 0.5f);
mat.Scale3DMax = new Vector3(1.0f, 2.0f, 1.0f);

mat.UseRotation3D = true;  // 3D only
mat.Rotation3DMin = new Vector3(0.0f, -180.0f, 0.0f);  // degrees
mat.Rotation3DMax = new Vector3(0.0f, 180.0f, 0.0f);
```

### Inheriting Emitter Scale (Godot 4.7+)

`particle_flag_inherit_emitter_scale` (default `false`): if `true`, particles inherit the scale of the emitter node. Has no effect when `local_coords` is `true`, since particles in local space are already affected by the emitter's scale.

```gdscript
mat.particle_flag_inherit_emitter_scale = true
```

```csharp
mat.ParticleFlagInheritEmitterScale = true;
```

---

## 4. Common VFX Recipes

The recipes most projects need: **fire** (2D, looped emission with hot-color gradient + scale-down), **explosion burst** (one-shot, high-amount short-lifetime), **dust / footstep puff** (one-shot, scale-up + rapid fade).

> See [references/vfx-recipes.md](references/vfx-recipes.md) for ready-to-use GDScript wiring and recommended `ParticleProcessMaterial` settings for all three.

---

## 5. Trails (Forward+ and Mobile only)

Set `trail_enabled = true` on `GPUParticles2D/3D` and assign a `Mesh` (`RibbonTrailMesh` or `TubeTrailMesh`). Trails are NOT supported in the Compatibility renderer.

> See [references/trails.md](references/trails.md) for the setup and trail-mesh-type comparison.

---

## 6. Subemitters

A particle can spawn another particle scene at lifecycle events (birth, collision, death, manual). Configure via `ParticleProcessMaterial.SubEmitterMode` + `subemitter` property on the parent particles node.

> See [references/subemitters.md](references/subemitters.md) for trigger modes, scene setup, GDScript and C# (v1.6.0 parity), and limitations.

> ⚠️ **Changed in Godot 4.7:** Subemitter velocity inheritance was reworked ([GH-118062](https://github.com/godotengine/godot/pull/118062)). With `sub_emitter_keep_velocity = true` (default `false`), subemitted particles inherit the parent particle's velocity when they spawn. Subemitter effects authored on earlier versions may look different after upgrading — re-check initial velocity and spread on affected systems.

---

## 7. Attractors & Collision (3D)

`GPUParticlesAttractor*3D` (Box / Sphere / Vector Field) pulls particles toward a region. `GPUParticlesCollision*3D` (Box / Sphere / SDF / HeightField) lets particles bounce off geometry. Both Forward+/Mobile only; no 2D equivalents.

> See [references/attractors-and-collision.md](references/attractors-and-collision.md) for full setup of each attractor and collision type.

---

## 8. Turbulence

Set `turbulence_enabled = true` on `ParticleProcessMaterial` and tune `turbulence_noise_strength` (0.5–2.0 typical), `turbulence_noise_scale` (lower = larger swirls), `turbulence_noise_speed` (animate the noise field). Cheap effect for "alive" smoke, fire, dust.

---

## 9. Flipbook Animation (2D)

Sprite-sheet animated particles via `ParticleProcessMaterial.AnimSpeedMin/Max` + `CanvasItemMaterial.ParticlesAnimHFrames/VFrames` for the sheet layout. Particles cycle through frames over their lifetime.

> See [references/flipbook-animation.md](references/flipbook-animation.md) for the full setup with GDScript + C# (v1.6.0 parity).

---

## 10. Performance and Common Pitfalls

The biggest wins are the obvious ones: keep `amount` at the minimum that reads well, set `fixed_fps = 30` for ambient systems, always set `visibility_rect` on 2D particles, and expose `amount_ratio` as a quality slider. Godot 4.7+ adds `request_particles_process()` for seeking a paused timeline.

Most "broken particles" reports are one of eleven known causes — invisible (no texture / no draw-pass mesh), vanishing (`lifetime` too short), one-shot not re-firing (needs `restart()` first), wrong direction (2D Y is inverted), or a base `color` silently overriding `color_ramp`.

Full performance table, the 4.7+ timeline-seek API, dynamic quality scaling (GDScript + C#), and the complete symptom/cause/fix table: [references/performance-and-pitfalls.md](references/performance-and-pitfalls.md)

---

## 11. Implementation Checklist

- [ ] Particle `amount` is set to the minimum needed for the visual effect
- [ ] `lifetime` matches the visual duration — not too short or too long
- [ ] `one_shot` is enabled for burst effects (explosions, impacts)
- [ ] `preprocess` is set for always-visible ambient effects (fire, smoke, dust)
- [ ] Emission shape matches the source geometry (sphere for explosions, box for area effects)
- [ ] `color_ramp` fades alpha to 0 at the end so particles don't vanish abruptly
- [ ] `scale_curve` shrinks particles over lifetime for natural fade
- [ ] `local_coords` is set correctly — `true` for attached effects, `false` for world-space
- [ ] One-shot particles are cleaned up with `queue_free` after `lifetime` + margin
- [ ] `visibility_rect` (2D) is set to prevent particles from being culled prematurely
- [ ] Dynamic quality scaling uses `amount_ratio` for player-accessible quality settings
- [ ] Performance-heavy features (turbulence, trails) are disabled on low-end targets
