# Curves and Paths

Reference for `skills/math-essentials/SKILL.md` — `Curve` resources, `Path2D` / `Path3D`, `PathFollow` properties.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Curves & Paths

### Curve Resources

```gdscript
# Curve — 1D curve (maps x: 0.0–1.0 to y value)
var curve := Curve.new()
curve.add_point(Vector2(0.0, 0.0))  # start at 0
curve.add_point(Vector2(0.5, 1.0))  # peak at halfway
curve.add_point(Vector2(1.0, 0.0))  # back to 0
var value: float = curve.sample(0.25)  # sample at 25%

# CurveTexture — wrap Curve for use in shaders/particles
var curve_tex := CurveTexture.new()
curve_tex.curve = curve
```

### Path2D / Path3D

Paths define a Curve2D/Curve3D that nodes can follow.

```
Level (Node2D)
├── Path2D
│   └── PathFollow2D
│       └── Enemy (CharacterBody2D)
```

```gdscript
# Move along the path
@onready var path_follow: PathFollow2D = $Path2D/PathFollow2D

func _physics_process(delta: float) -> void:
    path_follow.progress += speed * delta
    # Or use ratio (0.0 to 1.0)
    # path_follow.progress_ratio += 0.1 * delta
```

```csharp
private PathFollow2D _pathFollow;

public override void _Ready()
{
    _pathFollow = GetNode<PathFollow2D>("Path2D/PathFollow2D");
}

public override void _PhysicsProcess(double delta)
{
    _pathFollow.Progress += speed * (float)delta;
}
```

### PathFollow Properties

| Property         | Description                                      |
|------------------|--------------------------------------------------|
| `progress`       | Distance along the curve in pixels/units         |
| `progress_ratio` | 0.0–1.0 position along the curve                |
| `loop`           | Wrap around when reaching the end                |
| `rotates`        | Auto-rotate to face the curve direction          |
| `cubic_interp`   | Use cubic interpolation for smoother following   |

---

