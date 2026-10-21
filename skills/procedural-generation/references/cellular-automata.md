# Cellular Automata (Cave Generation)

Reference for `skills/procedural-generation/SKILL.md` — random fill + smoothing iterations for organic cave shapes. GDScript + C# with TileMapLayer integration.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Cellular Automata (Cave Generation)

Simulates natural-looking caves by iterating a simple rule: a cell becomes wall if most of its neighbors are walls.

### GDScript

```gdscript
class_name CaveGenerator
extends RefCounted

var rng := RandomNumberGenerator.new()

func generate(width: int, height: int, gen_seed: int, fill_chance: float = 0.45, iterations: int = 5) -> Array[Array]:
    rng.seed = gen_seed

    # Step 1: Random fill
    var grid: Array[Array] = []
    for y in height:
        var row: Array[bool] = []
        for x in width:
            # true = wall, false = floor
            var is_edge: bool = x == 0 or y == 0 or x == width - 1 or y == height - 1
            row.append(is_edge or rng.randf() < fill_chance)
        grid.append(row)

    # Step 2: Smooth with cellular automata rules
    for _i in iterations:
        grid = _smooth(grid, width, height)

    return grid

func _smooth(grid: Array[Array], width: int, height: int) -> Array[Array]:
    var new_grid: Array[Array] = []
    for y in height:
        var row: Array[bool] = []
        for x in width:
            var wall_count: int = _count_neighbors(grid, x, y, width, height)
            # Rule: become wall if 5+ of 9 cells (self + 8 neighbors) are walls
            row.append(wall_count >= 5)
        new_grid.append(row)
    return new_grid

func _count_neighbors(grid: Array[Array], cx: int, cy: int, width: int, height: int) -> int:
    var count: int = 0
    for dy in range(-1, 2):
        for dx in range(-1, 2):
            var nx: int = cx + dx
            var ny: int = cy + dy
            if nx < 0 or ny < 0 or nx >= width or ny >= height:
                count += 1  # out of bounds counts as wall
            elif grid[ny][nx]:
                count += 1
    return count
```

### Usage with TileMapLayer

```gdscript
func apply_cave_to_tilemap(tile_map: TileMapLayer, grid: Array[Array]) -> void:
    var wall_tile := Vector2i(0, 0)
    var floor_tile := Vector2i(1, 0)

    for y in grid.size():
        for x in grid[y].size():
            var tile := wall_tile if grid[y][x] else floor_tile
            tile_map.set_cell(Vector2i(x, y), 0, tile)
```

### C#

```csharp
public partial class CaveGenerator : RefCounted
{
    private RandomNumberGenerator _rng = new();

    public bool[][] Generate(int width, int height, ulong genSeed, float fillChance = 0.45f, int iterations = 5)
    {
        _rng.Seed = genSeed;

        // Step 1: Random fill
        bool[][] grid = new bool[height][];
        for (int y = 0; y < height; y++)
        {
            grid[y] = new bool[width];
            for (int x = 0; x < width; x++)
            {
                bool isEdge = x == 0 || y == 0 || x == width - 1 || y == height - 1;
                grid[y][x] = isEdge || _rng.Randf() < fillChance;
            }
        }

        // Step 2: Smooth with cellular automata rules
        for (int i = 0; i < iterations; i++)
            grid = Smooth(grid, width, height);

        return grid;
    }

    private static bool[][] Smooth(bool[][] grid, int width, int height)
    {
        bool[][] newGrid = new bool[height][];
        for (int y = 0; y < height; y++)
        {
            newGrid[y] = new bool[width];
            for (int x = 0; x < width; x++)
            {
                int wallCount = CountNeighbors(grid, x, y, width, height);
                // Rule: become wall if 5+ of 9 cells (self + 8 neighbors) are walls
                newGrid[y][x] = wallCount >= 5;
            }
        }
        return newGrid;
    }

    private static int CountNeighbors(bool[][] grid, int cx, int cy, int width, int height)
    {
        int count = 0;
        for (int dy = -1; dy <= 1; dy++)
            for (int dx = -1; dx <= 1; dx++)
            {
                int nx = cx + dx, ny = cy + dy;
                if (nx < 0 || ny < 0 || nx >= width || ny >= height)
                    count++;  // out of bounds counts as wall
                else if (grid[ny][nx])
                    count++;
            }
        return count;
    }
}

public static void ApplyCaveToTilemap(TileMapLayer tileMap, bool[][] grid)
{
    var wallTile = new Vector2I(0, 0);
    var floorTile = new Vector2I(1, 0);

    for (int y = 0; y < grid.Length; y++)
        for (int x = 0; x < grid[y].Length; x++)
            tileMap.SetCell(new Vector2I(x, y), 0, grid[y][x] ? wallTile : floorTile);
}
```

---

