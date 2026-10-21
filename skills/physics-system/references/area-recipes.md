# Area Recipes

Reference for `skills/physics-system/SKILL.md` — Zero-G zones and point-gravity (black hole / planet) using Area3D space override.

> ← Back to [SKILL.md](../SKILL.md)

---
### Gravity Override (Zero-G Zone)

```gdscript
extends Area3D

func _ready() -> void:
    gravity_space_override = Area3D.SPACE_OVERRIDE_REPLACE
    gravity = 0.0
```

```csharp
public partial class ZeroGZone : Area3D
{
    public override void _Ready()
    {
        GravitySpaceOverride = SpaceOverride.Replace;
        Gravity = 0.0f;
    }
}
```

### Point Gravity (Black Hole / Planet)

```gdscript
extends Area2D

func _ready() -> void:
    gravity_space_override = Area2D.SPACE_OVERRIDE_COMBINE
    gravity_point = true
    gravity_point_center = Vector2.ZERO  # Relative to Area2D position
    gravity = 500.0
```

```csharp
public partial class GravityWell : Area2D
{
    public override void _Ready()
    {
        GravitySpaceOverride = SpaceOverride.Combine;
        GravityPoint = true;
        GravityPointCenter = Vector2.Zero;
        Gravity = 500.0f;
    }
}
```


## Overlap Detection (canonical)

```gdscript
extends Area2D

func _ready() -> void:
    body_entered.connect(_on_body_entered)
    body_exited.connect(_on_body_exited)

func _on_body_entered(body: Node2D) -> void:
    if body.name == "Player":
        print("Player entered the zone")
```

```csharp
public partial class Zone : Area2D
{
    public override void _Ready()
    {
        BodyEntered += OnBodyEntered;
    }

    private void OnBodyEntered(Node2D body)
    {
        if (body.Name == "Player")
            GD.Print("Player entered the zone");
    }
}
```

Use `area_entered` / `area_exited` for Area-to-Area overlap (e.g. hitbox vs hurtbox).

## Space Override Modes

When multiple areas overlap, they're processed by `priority` (highest first):

| Mode | Behavior |
|------|----------|
| `SPACE_OVERRIDE_DISABLED` | No override |
| `SPACE_OVERRIDE_COMBINE` | Adds to running total, continues processing |
| `SPACE_OVERRIDE_REPLACE` | Replaces running total, ignores lower-priority areas |
| `SPACE_OVERRIDE_COMBINE_REPLACE` | Adds to total, then stops processing |
| `SPACE_OVERRIDE_REPLACE_COMBINE` | Replaces total, continues processing |
