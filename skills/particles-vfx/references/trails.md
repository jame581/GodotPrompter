# Particle Trails

Reference for `skills/particles-vfx/SKILL.md` — enabling trails (Forward+ / Mobile only), trail mesh types.

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. Trails (Forward+ and Mobile only)

Trails create ribbon or tube shapes that follow each particle's path.

### Setup

```
GPUParticles3D
├── Trail Enabled = true
├── Trail Lifetime = 0.3
├── Process Material (ParticleProcessMaterial)
└── Draw Pass 1 (mesh for particle head)
```

The trail mesh is auto-generated. Configure its appearance:

| Property                 | Description                                     |
|--------------------------|--------------------------------------------------|
| `trail_enabled`          | Turn trails on/off                              |
| `trail_lifetime`         | How long the trail lingers (seconds)            |

### Trail Mesh Types

For Draw Pass 1, create a **RibbonTrailMesh** or **TubeTrailMesh**:

| Mesh Type          | Shape                       | Best For               |
|--------------------|-----------------------------|------------------------|
| `RibbonTrailMesh`  | Flat quad strip             | Sword swings, streaks  |
| `TubeTrailMesh`    | Cylindrical                 | Lasers, energy trails  |

```gdscript
var particles := GPUParticles3D.new()
particles.trail_enabled = true
particles.trail_lifetime = 0.3
particles.amount = 20

var trail_mesh := RibbonTrailMesh.new()
trail_mesh.size = 0.2  # trail width
trail_mesh.sections = 4
trail_mesh.section_length = 0.1
particles.draw_pass_1 = trail_mesh
```

```csharp
var particles = new GpuParticles3D();
particles.TrailEnabled = true;
particles.TrailLifetime = 0.3f;
particles.Amount = 20;

var trailMesh = new RibbonTrailMesh();
trailMesh.Size = 0.2f;
trailMesh.Sections = 4;
trailMesh.SectionLength = 0.1f;
particles.DrawPass1 = trailMesh;
```

> **Important:** Trail materials need **Use Particle Trails** enabled in the StandardMaterial3D's Transform section to render correctly.

---

