> ← Back to [SKILL.md](../SKILL.md)

# Particle Performance and Common Pitfalls

## Performance Tips

| Technique                    | Savings              | When to Use                          |
|------------------------------|----------------------|--------------------------------------|
| Lower `amount`               | Linear GPU savings   | Always — use minimum needed          |
| `fixed_fps = 30` (default)   | 30 Hz updates instead of every frame (`0`) | Keep it for background and ambient particles |
| `amount_ratio` < 1.0         | Scale down dynamically | Quality settings slider              |
| Smaller textures             | Less VRAM + bandwidth | Mobile, many particle systems        |
| `local_coords = true`        | Cheaper transforms   | When particles should move with node |
| Disable `turbulence`         | Removes 3D noise cost | Mobile/web targets                   |
| Fewer `trail_sections`       | Less trail geometry  | When trail smoothness isn't critical |
| `visibility_rect` (2D)       | Skips off-screen     | Always set for 2D particles          |

## Seeking the Particle Timeline (Godot 4.7+)

`request_particles_process(process_time, process_time_residual = 0.0)` — on `GPUParticles2D/3D` and `CPUParticles2D/3D` — requests extra process time during a single frame. `process_time` is simulated with emitting on; the 4.7-added `process_time_residual` is simulated with emitting turned off. Combined with `speed_scale = 0.0`, this lets you seek a paused particle system's timeline (e.g., scrubbing VFX in a cutscene or replay).

```gdscript
$GPUParticles3D.speed_scale = 0.0
# Simulate 1.5s with emission on, then 0.25s with emission off
$GPUParticles3D.request_particles_process(1.5, 0.25)
```

```csharp
var particles = GetNode<GpuParticles3D>("GPUParticles3D");
particles.SpeedScale = 0.0f;
particles.RequestParticlesProcess(1.5f, 0.25f);
```

## Dynamic Quality Scaling

```gdscript
# Adjust particle density based on quality setting
func set_particle_quality(level: float) -> void:
    # level: 0.25 (low) to 1.0 (high)
    for particles in get_tree().get_nodes_in_group("particles"):
        if particles is GPUParticles2D or particles is GPUParticles3D:
            particles.amount_ratio = level
```

```csharp
public void SetParticleQuality(float level)
{
    foreach (var node in GetTree().GetNodesInGroup("particles"))
    {
        if (node is GpuParticles2D p2d)
            p2d.AmountRatio = level;
        else if (node is GpuParticles3D p3d)
            p3d.AmountRatio = level;
    }
}
```

## Common Pitfalls

| Symptom                              | Cause                                          | Fix                                                              |
|--------------------------------------|-------------------------------------------------|------------------------------------------------------------------|
| Particles invisible                  | No texture (2D) or no draw pass mesh (3D)       | Set texture or assign a mesh to Draw Pass 1                      |
| Particles appear then vanish immediately | `lifetime` too short                         | Increase `lifetime` (default 1.0s)                               |
| One-shot doesn't re-trigger          | `emitting = true` is ignored while the previous burst's particles are alive | Call `restart()` (clears old particles and sets `emitting = true`) |
| Particles emit in wrong direction    | `direction` or `gravity` misconfigured          | In 2D, Y is inverted — upward is `Vector3(0, -1, 0)`            |
| Particles don't follow the node      | `local_coords` is `false`                       | Set `local_coords = true` for attached effects                   |
| Particles pop in (no pre-warming)    | No `preprocess` time set                        | Set `preprocess` to 1–2x `lifetime` for ambient effects          |
| Color ramp has no effect             | Base `color` multiplies the ramp; a dark or transparent `color` hides it | Set the base `color` to white when using `color_ramp`  |
| Trails not rendering                 | Missing trail material setup or wrong renderer   | Enable "Use Particle Trails" on material; use Forward+ or Mobile |
| Attractors have no effect            | `attractor_interaction_enabled` turned off (default `true`) | Re-enable on the ParticleProcessMaterial          |
| Subemitter not spawning              | Child `amount` is too low to accommodate spawns  | Increase child system's `amount`                                 |
| Particles stutter or look uneven     | `fixed_fps` differs from the frame rate (0 follows it) | Test with the default `fixed_fps = 30`; with moving colliders the class docs recommend 0 or a value at/above the frame rate |
