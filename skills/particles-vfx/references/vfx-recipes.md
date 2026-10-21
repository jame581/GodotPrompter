# Common VFX Recipes

Reference for `skills/particles-vfx/SKILL.md` — fire (2D), explosion burst (one-shot), dust/footstep puff. Full GDScript wiring + recommended ParticleProcessMaterial settings.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Common VFX Recipes

### Fire (2D)

```gdscript
func create_fire() -> GPUParticles2D:
    var fire := GPUParticles2D.new()
    fire.amount = 50
    fire.lifetime = 0.8
    fire.local_coords = false

    var mat := ParticleProcessMaterial.new()
    mat.direction = Vector3(0, -1, 0)  # upward in 2D (Y is inverted)
    mat.spread = 15.0
    mat.initial_velocity_min = 40.0
    mat.initial_velocity_max = 80.0
    mat.gravity = Vector3(0, 0, 0)  # no gravity for fire
    mat.scale_min = 0.5
    mat.scale_max = 1.0
    mat.damping_min = 3.0
    mat.damping_max = 5.0

    # Color: bright yellow → orange → transparent
    var grad := GradientTexture1D.new()
    var g := Gradient.new()
    g.set_color(0, Color(1.0, 0.9, 0.3, 1.0))
    g.add_point(0.4, Color(1.0, 0.4, 0.0, 0.8))
    g.set_color(1, Color(0.5, 0.1, 0.0, 0.0))
    grad.gradient = g
    mat.color_ramp = grad

    # Shrink over lifetime
    var curve := CurveTexture.new()
    var c := Curve.new()
    c.add_point(Vector2(0.0, 1.0))
    c.add_point(Vector2(1.0, 0.0))
    curve.curve = c
    mat.scale_curve = curve

    fire.process_material = mat
    fire.texture = preload("res://textures/particles/soft_circle.png")
    return fire
```

### Explosion Burst (One-Shot)

```gdscript
func spawn_explosion(pos: Vector2) -> void:
    var particles := GPUParticles2D.new()
    particles.amount = 30
    particles.lifetime = 0.5
    particles.one_shot = true
    particles.explosiveness = 1.0  # all at once
    particles.position = pos

    var mat := ParticleProcessMaterial.new()
    mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_SPHERE
    mat.emission_sphere_radius = 5.0
    mat.direction = Vector3(0, 0, 0)
    mat.spread = 180.0  # full sphere
    mat.initial_velocity_min = 100.0
    mat.initial_velocity_max = 200.0
    mat.damping_min = 5.0
    mat.damping_max = 10.0
    mat.scale_min = 0.5
    mat.scale_max = 1.5

    var grad := GradientTexture1D.new()
    var g := Gradient.new()
    g.set_color(0, Color(1.0, 1.0, 0.5, 1.0))
    g.set_color(1, Color(1.0, 0.3, 0.0, 0.0))
    grad.gradient = g
    mat.color_ramp = grad

    particles.process_material = mat
    particles.texture = preload("res://textures/particles/soft_circle.png")
    add_child(particles)
    particles.emitting = true

    # Auto-cleanup after particles die
    get_tree().create_timer(particles.lifetime + 0.5).timeout.connect(particles.queue_free)
```

```csharp
public void SpawnExplosion(Vector2 pos)
{
    var particles = new GpuParticles2D();
    particles.Amount = 30;
    particles.Lifetime = 0.5f;
    particles.OneShot = true;
    particles.Explosiveness = 1.0f;
    particles.Position = pos;

    var mat = new ParticleProcessMaterial();
    mat.EmissionShape = ParticleProcessMaterial.EmissionShapeEnum.Sphere;
    mat.EmissionSphereRadius = 5.0f;
    mat.Direction = Vector3.Zero;
    mat.Spread = 180.0f;
    mat.InitialVelocityMin = 100.0f;
    mat.InitialVelocityMax = 200.0f;
    mat.DampingMin = 5.0f;
    mat.DampingMax = 10.0f;
    mat.ScaleMin = 0.5f;
    mat.ScaleMax = 1.5f;

    var grad = new GradientTexture1D();
    var g = new Gradient();
    g.SetColor(0, new Color(1.0f, 1.0f, 0.5f, 1.0f));
    g.SetColor(1, new Color(1.0f, 0.3f, 0.0f, 0.0f));
    grad.Gradient = g;
    mat.ColorRamp = grad;

    particles.ProcessMaterial = mat;
    particles.Texture = GD.Load<Texture2D>("res://textures/particles/soft_circle.png");
    AddChild(particles);
    particles.Emitting = true;

    GetTree().CreateTimer(particles.Lifetime + 0.5f).Timeout += particles.QueueFree;
}
```

### Dust / Footstep Puff

```gdscript
func spawn_dust(pos: Vector2) -> void:
    var dust := GPUParticles2D.new()
    dust.amount = 8
    dust.lifetime = 0.4
    dust.one_shot = true
    dust.explosiveness = 0.8
    dust.position = pos

    var mat := ParticleProcessMaterial.new()
    mat.direction = Vector3(0, -1, 0)
    mat.spread = 60.0
    mat.initial_velocity_min = 20.0
    mat.initial_velocity_max = 40.0
    mat.gravity = Vector3(0, 50, 0)  # settle downward in 2D
    mat.scale_min = 0.3
    mat.scale_max = 0.6
    mat.color = Color(0.7, 0.65, 0.55, 0.6)

    var grad := GradientTexture1D.new()
    var g := Gradient.new()
    g.set_color(0, Color(1, 1, 1, 0.6))
    g.set_color(1, Color(1, 1, 1, 0.0))
    grad.gradient = g
    mat.color_ramp = grad

    dust.process_material = mat
    dust.texture = preload("res://textures/particles/soft_circle.png")
    add_child(dust)
    dust.emitting = true
    get_tree().create_timer(1.0).timeout.connect(dust.queue_free)
```

---

