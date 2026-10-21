# 2D Particle Systems

Reference for `skills/2d-essentials/SKILL.md` — GPUParticles2D vs CPUParticles2D, basic setup, time properties, full ParticleProcessMaterial 2D properties, emission shapes from textures, flipbook animation, visibility rect, common 2D particle recipes.

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. 2D Particle Systems

### GPUParticles2D vs CPUParticles2D

| Feature | GPUParticles2D | CPUParticles2D |
|---------|----------------|----------------|
| Performance (many particles) | Better | Worse |
| Low-end GPU support | May have issues | More compatible |
| Material | ParticleProcessMaterial | Built-in properties |
| Shader customization | Yes | No |

Use `GPUParticles2D` by default. Convert between types via the toolbar menu.

### Basic Setup

1. Add `GPUParticles2D` node
2. In `Process Material`, create new `ParticleProcessMaterial`
3. Assign a `Texture` (particle sprite)
4. Configure emission, velocity, scale, color

### Key Time Properties

| Property | Purpose |
|----------|---------|
| `Lifetime` | Particle lifespan in seconds |
| `One Shot` | Emit once then stop (explosions, impacts) |
| `Preprocess` | Simulate N seconds before first draw (torches, ambient mist) |
| `Speed Scale` | Global speed multiplier |
| `Explosiveness` | 0 = steady stream, 1 = all particles at once |
| `Randomness` | Random variation on initial values |
| `Local Coords` | On = particles move with node, Off = world space (default) |

### ParticleProcessMaterial Properties

**Emission:**

| Property | Purpose |
|----------|---------|
| `Direction` | Base emission direction (default: right) |
| `Spread` | Angle variance from direction (180 = all directions) |
| `Initial Velocity` | Emission speed (pixels/sec) — must be > 0 for Spread to work |

**Motion:**

| Property | Purpose |
|----------|---------|
| `Gravity` | Applied to all particles |
| `Linear Acceleration` | Per-particle acceleration |
| `Radial Acceleration` | Positive = away from center, negative = toward |
| `Tangential Acceleration` | Perpendicular to radial direction |
| `Damping` | Friction — forces particles to slow down (sparks, explosions) |
| `Angular Velocity` | Rotation speed (degrees/sec) |
| `Orbit Velocity` | Orbital motion around emission center |

**Appearance:**

| Property | Purpose |
|----------|---------|
| `Scale` | Particle scale over lifetime (Min/Max + Curve) |
| `Color` | Static color or gradient (via `Color Ramp`) |
| `Hue Variation` | Randomize hue on spawn |

Most properties support **Min/Max** range (randomized on spawn) and a **Curve** (multiplied over particle lifetime).

### Emission Shapes from Textures

Select GPUParticles2D → **Particles** menu → **Load Emission Mask**:
- **Solid Pixels** — spawn from any non-transparent pixel
- **Border Pixels** — spawn from outer edges only
- **Directed Border Pixels** — border + direction away from center (requires Initial Velocity)
- **Capture from Pixel** — particles inherit color from mask at spawn point

### Flipbook Animation

1. Create `CanvasItemMaterial` in the GPUParticles2D's Material slot
2. Enable `Particle Animation`, set `H Frames` and `V Frames`
3. In ParticleProcessMaterial → Animation: set Speed Min/Max = 1 for linear playback
4. Animation FPS = number of frames / Lifetime

### Visibility Rect

The AABB used for culling. Auto-generate via **Particles** menu → **Generate Visibility Rect**. If particles disappear when the emitter goes offscreen, increase this rect.

### Common Particle Recipes

**Fire:**
```
Direction: (0, -1), Spread: 15°, Initial Velocity: 50-100
Gravity: (0, -20), Damping: 5
Scale: 1.0 → 0.0 (curve), Color Ramp: yellow → orange → transparent
```

**Sparks:**
```
Direction: (0, -1), Spread: 45°, Initial Velocity: 200-400
Gravity: (0, 200), Damping: 10, Explosiveness: 0.8
Scale: 0.5, Lifetime: 0.5, One Shot: true
```

**Dust Trail:**
```
Direction: (0, 0), Spread: 180°, Initial Velocity: 10-30
Gravity: (0, -5), Damping: 3, Local Coords: false
Scale: 0.5 → 1.5 (curve), Color Ramp: white → transparent
```

---

