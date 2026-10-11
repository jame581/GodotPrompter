# Random Number Generation

Reference for `skills/math-essentials/SKILL.md` — global random functions, `RandomNumberGenerator` (seeded), weighted random selection, noise (procedural generation).

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. Random Number Generation

### Global Functions

```gdscript
var f: float = randf()                    # 0.0 to 1.0
var i: int = randi()                      # full int range
var ranged: float = randf_range(1.0, 10.0)  # 1.0 to 10.0
var ranged_int: int = randi_range(1, 6)   # 1 to 6 (inclusive)
```

```csharp
float f = GD.Randf();
uint i = GD.Randi();                               // 32-bit unsigned
float ranged = (float)GD.RandRange(1.0, 10.0);     // double overload: 1.0 to 10.0
int rangedInt = GD.RandRange(1, 6);                // int overload: 1 to 6 (inclusive)
```

### RandomNumberGenerator (Seeded)

For deterministic, reproducible randomness (procedural generation, replays).

```gdscript
var rng := RandomNumberGenerator.new()
rng.seed = 12345  # same seed = same sequence every time

var value: float = rng.randf_range(0.0, 100.0)
var roll: int = rng.randi_range(1, 20)
var normal: float = rng.randfn(0.0, 1.0)  # Gaussian distribution
```

```csharp
var rng = new RandomNumberGenerator();
rng.Seed = 12345;

float value = rng.RandfRange(0.0f, 100.0f);
int roll = rng.RandiRange(1, 20);
float normal = rng.Randfn(0.0f, 1.0f);
```

### Weighted Random Selection

```gdscript
# Weighted random pick from a loot table
func weighted_random(table: Array[Dictionary]) -> Dictionary:
    # table = [{"item": "gold", "weight": 60}, {"item": "gem", "weight": 30}, {"item": "rare", "weight": 10}]
    var total_weight: float = 0.0
    for entry in table:
        total_weight += entry["weight"]

    var roll: float = randf() * total_weight
    var cumulative: float = 0.0
    for entry in table:
        cumulative += entry["weight"]
        if roll <= cumulative:
            return entry

    return table.back()
```

```csharp
public Dictionary WeightedRandom(Godot.Collections.Array<Godot.Collections.Dictionary> table)
{
    float totalWeight = 0.0f;
    foreach (var entry in table)
        totalWeight += (float)entry["weight"];

    float roll = GD.Randf() * totalWeight;
    float cumulative = 0.0f;
    foreach (var entry in table)
    {
        cumulative += (float)entry["weight"];
        if (roll <= cumulative)
            return entry;
    }
    return table[^1];
}
```

### Noise (Procedural Generation)

```gdscript
var noise := FastNoiseLite.new()
noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
noise.frequency = 0.05
noise.seed = randi()

# Sample 2D noise at a position
var height: float = noise.get_noise_2d(x, y)  # returns -1.0 to 1.0
```

```csharp
var noise = new FastNoiseLite();
noise.NoiseType = FastNoiseLite.NoiseTypeEnum.SimplexSmooth;
noise.Frequency = 0.05f;
noise.Seed = (int)GD.Randi();
float height = noise.GetNoise2D(x, y);
```

---

