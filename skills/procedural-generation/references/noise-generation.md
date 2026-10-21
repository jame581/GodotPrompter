# Noise-Based Generation (FastNoiseLite)

Reference for `skills/procedural-generation/SKILL.md` — basic noise map, noise type reference, 2D terrain with TileMapLayer.

> ← Back to [SKILL.md](../SKILL.md)

---
## 2. Noise-Based Generation (FastNoiseLite)

Godot's built-in `FastNoiseLite` resource provides Simplex, Perlin, Cellular, and Value noise.

### Basic Noise Map

```gdscript
var noise := FastNoiseLite.new()

func setup_noise(gen_seed: int) -> void:
    noise.seed = gen_seed
    noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
    noise.frequency = 0.02           # lower = larger features
    noise.fractal_type = FastNoiseLite.FRACTAL_FBM
    noise.fractal_octaves = 4        # detail layers
    noise.fractal_lacunarity = 2.0   # frequency multiplier per octave
    noise.fractal_gain = 0.5         # amplitude multiplier per octave

func get_height(x: int, y: int) -> float:
    # Returns -1.0 to 1.0
    return noise.get_noise_2d(float(x), float(y))
```

```csharp
private FastNoiseLite _noise = new();

public void SetupNoise(int genSeed)
{
    _noise.Seed = genSeed;
    _noise.NoiseType = FastNoiseLite.NoiseTypeEnum.SimplexSmooth;
    _noise.Frequency = 0.02f;
    _noise.FractalType = FastNoiseLite.FractalTypeEnum.Fbm;
    _noise.FractalOctaves = 4;
    _noise.FractalLacunarity = 2.0f;
    _noise.FractalGain = 0.5f;
}

public float GetHeight(int x, int y) => _noise.GetNoise2D(x, y);
```

### Noise Type Reference

| Type | Character | Use For |
|------|-----------|---------|
| `TYPE_SIMPLEX_SMOOTH` | Smooth, organic | Terrain height, clouds, temperature |
| `TYPE_PERLIN` | Classic smooth | Similar to Simplex, slightly different artifacts |
| `TYPE_CELLULAR` | Voronoi cells | Cave systems, biome boundaries, crystal patterns |
| `TYPE_VALUE` | Blocky, aliased | Retro terrain, pixel-art maps |
| `TYPE_VALUE_CUBIC` | Smoothed blocky | Smoother value noise |

### 2D Terrain with TileMapLayer

```gdscript
extends Node2D

@onready var tile_map: TileMapLayer = $TileMapLayer

var noise := FastNoiseLite.new()
var width: int = 80
var height: int = 60

func _ready() -> void:
    noise.seed = 42
    noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
    noise.frequency = 0.05
    generate_map()

func generate_map() -> void:
    for x in width:
        for y in height:
            var value: float = noise.get_noise_2d(float(x), float(y))
            var tile_coords: Vector2i = _noise_to_tile(value)
            tile_map.set_cell(Vector2i(x, y), 0, tile_coords)  # source_id=0

func _noise_to_tile(value: float) -> Vector2i:
    # Map noise value (-1 to 1) to tile atlas coordinates
    if value < -0.3:
        return Vector2i(0, 0)   # deep water
    elif value < -0.1:
        return Vector2i(1, 0)   # shallow water
    elif value < 0.2:
        return Vector2i(2, 0)   # grass
    elif value < 0.5:
        return Vector2i(3, 0)   # forest
    else:
        return Vector2i(4, 0)   # mountain
```

```csharp
public partial class TerrainGenerator : Node2D
{
    private TileMapLayer _tileMap;
    private FastNoiseLite _noise = new();
    private int _width = 80, _height = 60;

    public override void _Ready()
    {
        _tileMap = GetNode<TileMapLayer>("TileMapLayer");
        _noise.Seed = 42;
        _noise.NoiseType = FastNoiseLite.NoiseTypeEnum.SimplexSmooth;
        _noise.Frequency = 0.05f;
        GenerateMap();
    }

    private void GenerateMap()
    {
        for (int x = 0; x < _width; x++)
            for (int y = 0; y < _height; y++)
            {
                float value = _noise.GetNoise2D(x, y);
                Vector2I tileCoords = NoiseToTile(value);
                _tileMap.SetCell(new Vector2I(x, y), 0, tileCoords);
            }
    }

    private Vector2I NoiseToTile(float value) => value switch
    {
        < -0.3f => new(0, 0),
        < -0.1f => new(1, 0),
        < 0.2f  => new(2, 0),
        < 0.5f  => new(3, 0),
        _       => new(4, 0),
    };
}
```

---

