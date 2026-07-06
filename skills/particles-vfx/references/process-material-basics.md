# ParticleProcessMaterial — Basic Property Recipes

Reference for `skills/particles-vfx/SKILL.md` — emission shape, direction/velocity/gravity, scale and color over lifetime, damping/acceleration, angular velocity. **GDScript + C# parity**.

> ← Back to [SKILL.md](../SKILL.md)

---

## 3. ParticleProcessMaterial — Essential Properties

### Emission Shape

| Shape             | Description                                    |
|-------------------|------------------------------------------------|
| `Point`           | All particles spawn at origin                  |
| `Sphere`          | Random position within a sphere                |
| `Sphere Surface`  | Random position on sphere surface only         |
| `Box`             | Random position within a box                   |
| `Ring`             | Random position on a ring/torus               |
| `Points`          | Spawn at positions from a texture/mesh         |
| `Directed Points` | Spawn at positions with normals from mesh      |

```gdscript
var mat := ParticleProcessMaterial.new()
mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_SPHERE
mat.emission_sphere_radius = 2.0
```

```csharp
var mat = new ParticleProcessMaterial();
mat.EmissionShape = ParticleProcessMaterial.EmissionShapeEnum.Sphere;
mat.EmissionSphereRadius = 2.0f;
```

### Direction, Velocity & Gravity

```gdscript
var mat := ParticleProcessMaterial.new()

# Direction particles move (normalized)
mat.direction = Vector3(0.0, 1.0, 0.0)  # upward
mat.spread = 30.0  # degrees of randomness around direction

# Speed
mat.initial_velocity_min = 5.0
mat.initial_velocity_max = 10.0

# Gravity
mat.gravity = Vector3(0.0, -9.8, 0.0)
```

```csharp
var mat = new ParticleProcessMaterial();
mat.Direction = new Vector3(0.0f, 1.0f, 0.0f);
mat.Spread = 30.0f;
mat.InitialVelocityMin = 5.0f;
mat.InitialVelocityMax = 10.0f;
mat.Gravity = new Vector3(0.0f, -9.8f, 0.0f);
```

### Scale Over Lifetime

```gdscript
mat.scale_min = 1.0
mat.scale_max = 1.5

# Scale curve — shrink over lifetime
var curve := CurveTexture.new()
var c := Curve.new()
c.add_point(Vector2(0.0, 1.0))  # full size at birth
c.add_point(Vector2(1.0, 0.0))  # zero at death
curve.curve = c
mat.scale_curve = curve
```

```csharp
var mat = new ParticleProcessMaterial();
mat.ScaleMin = 1.0f;
mat.ScaleMax = 1.5f;

var curve = new CurveTexture();
var c = new Curve();
c.AddPoint(new Vector2(0.0f, 1.0f));
c.AddPoint(new Vector2(1.0f, 0.0f));
curve.Curve = c;
mat.ScaleCurve = curve;
```

### Color Over Lifetime

```gdscript
# Gradient: white → orange → transparent
var grad := GradientTexture1D.new()
var g := Gradient.new()
g.set_color(0, Color(1.0, 1.0, 1.0, 1.0))  # start: white
g.add_point(0.5, Color(1.0, 0.5, 0.0, 0.8))  # middle: orange
g.set_color(1, Color(1.0, 0.2, 0.0, 0.0))  # end: transparent red
grad.gradient = g
mat.color_ramp = grad
```

```csharp
var grad = new GradientTexture1D();
var g = new Gradient();
g.SetColor(0, new Color(1.0f, 1.0f, 1.0f, 1.0f));
g.AddPoint(0.5f, new Color(1.0f, 0.5f, 0.0f, 0.8f));
g.SetColor(1, new Color(1.0f, 0.2f, 0.0f, 0.0f));
grad.Gradient = g;
mat.ColorRamp = grad;
```

### Damping & Acceleration

```gdscript
# Damping — slow particles down over time (smoke deceleration)
mat.damping_min = 2.0
mat.damping_max = 5.0

# Radial acceleration — push away from center (explosion) or pull in (implosion)
mat.radial_accel_min = 5.0   # positive = outward
mat.radial_accel_max = 8.0

# Tangential acceleration — orbit around center
mat.tangential_accel_min = 2.0
mat.tangential_accel_max = 3.0
```

### Angular Velocity (Rotation)

```gdscript
mat.angular_velocity_min = -90.0  # degrees per second
mat.angular_velocity_max = 90.0
```
