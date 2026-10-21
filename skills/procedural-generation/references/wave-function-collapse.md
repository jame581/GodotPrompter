# Wave Function Collapse (WFC)

Reference for `skills/procedural-generation/SKILL.md` — tile-set constraint solver. Concept overview and simplified algorithm in GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. Wave Function Collapse (WFC) — Concept

WFC generates patterns by collapsing tile possibilities based on adjacency constraints. It produces visually coherent results from a small set of rules.

### Core Algorithm (Simplified)

```gdscript
class_name SimpleWFC
extends RefCounted

# Each cell holds a set of possible tile indices
var grid: Array[Array] = []   # grid[y][x] = Array[int] (possible tiles)
var rules: Dictionary = {}     # rules[tile_id] = {"up": [...], "down": [...], "left": [...], "right": [...]}
var rng := RandomNumberGenerator.new()

func setup(width: int, height: int, tile_count: int, gen_seed: int) -> void:
    rng.seed = gen_seed
    grid.clear()
    for y in height:
        var row: Array[Array] = []
        for x in width:
            var possibilities: Array[int] = []
            for t in tile_count:
                possibilities.append(t)
            row.append(possibilities)
        grid.append(row)

func collapse() -> bool:
    while true:
        # Find cell with fewest possibilities (lowest entropy)
        var min_cell := Vector2i(-1, -1)
        var min_count := 999
        for y in grid.size():
            for x in grid[y].size():
                var count: int = grid[y][x].size()
                if count > 1 and count < min_count:
                    min_count = count
                    min_cell = Vector2i(x, y)

        if min_cell == Vector2i(-1, -1):
            return true  # all collapsed — success

        # Collapse: pick a random possibility
        var cell: Array[int] = grid[min_cell.y][min_cell.x]
        if cell.is_empty():
            return false  # contradiction — no valid tiles
        var chosen: int = cell[rng.randi() % cell.size()]
        grid[min_cell.y][min_cell.x] = [chosen]

        # Propagate constraints to neighbors
        _propagate(min_cell)

    return true

func _propagate(pos: Vector2i) -> void:
    var stack: Array[Vector2i] = [pos]
    while not stack.is_empty():
        var current: Vector2i = stack.pop_back()
        var current_tiles: Array[int] = grid[current.y][current.x]

        for dir in [Vector2i(0, -1), Vector2i(0, 1), Vector2i(-1, 0), Vector2i(1, 0)]:
            var neighbor: Vector2i = current + dir
            if neighbor.x < 0 or neighbor.y < 0 or neighbor.y >= grid.size() or neighbor.x >= grid[0].size():
                continue

            var dir_name: String = _dir_to_name(dir)
            var allowed: Array[int] = []
            for tile in current_tiles:
                if rules.has(tile) and rules[tile].has(dir_name):
                    for allowed_tile in rules[tile][dir_name]:
                        if allowed_tile not in allowed:
                            allowed.append(allowed_tile)

            var neighbor_tiles: Array[int] = grid[neighbor.y][neighbor.x]
            var new_tiles: Array[int] = neighbor_tiles.filter(func(t: int) -> bool: return t in allowed)

            if new_tiles.size() < neighbor_tiles.size():
                grid[neighbor.y][neighbor.x] = new_tiles
                stack.append(neighbor)

func _dir_to_name(dir: Vector2i) -> String:
    if dir == Vector2i(0, -1): return "up"
    if dir == Vector2i(0, 1):  return "down"
    if dir == Vector2i(-1, 0): return "left"
    return "right"
```

### C#

```csharp
public partial class SimpleWFC : RefCounted
{
    // grid[y][x] = list of possible tile indices
    private List<int>[][] _grid = [];
    // rules[tileId]["up"|"down"|"left"|"right"] = list of allowed neighbour tile ids
    private Godot.Collections.Dictionary<int, Godot.Collections.Dictionary<string, Godot.Collections.Array<int>>> _rules = new();
    private RandomNumberGenerator _rng = new();

    public void Setup(int width, int height, int tileCount, ulong genSeed)
    {
        _rng.Seed = genSeed;
        _grid = new List<int>[height][];
        for (int y = 0; y < height; y++)
        {
            _grid[y] = new List<int>[width];
            for (int x = 0; x < width; x++)
            {
                _grid[y][x] = new List<int>();
                for (int t = 0; t < tileCount; t++)
                    _grid[y][x].Add(t);
            }
        }
    }

    public bool Collapse()
    {
        while (true)
        {
            // Find cell with fewest possibilities (lowest entropy)
            var minCell = new Vector2I(-1, -1);
            int minCount = 999;
            for (int y = 0; y < _grid.Length; y++)
                for (int x = 0; x < _grid[y].Length; x++)
                {
                    int count = _grid[y][x].Count;
                    if (count > 1 && count < minCount)
                    {
                        minCount = count;
                        minCell = new Vector2I(x, y);
                    }
                }

            if (minCell == new Vector2I(-1, -1))
                return true;  // all collapsed — success

            // Collapse: pick a random possibility
            var cell = _grid[minCell.Y][minCell.X];
            if (cell.Count == 0)
                return false;  // contradiction — no valid tiles
            int chosen = cell[(int)(_rng.Randi() % (uint)cell.Count)];
            _grid[minCell.Y][minCell.X] = [chosen];

            // Propagate constraints to neighbors
            Propagate(minCell);
        }
    }

    private void Propagate(Vector2I pos)
    {
        var stack = new Stack<Vector2I>();
        stack.Push(pos);
        while (stack.Count > 0)
        {
            var current = stack.Pop();
            var currentTiles = _grid[current.Y][current.X];

            foreach (var dir in new[] { new Vector2I(0, -1), new Vector2I(0, 1), new Vector2I(-1, 0), new Vector2I(1, 0) })
            {
                var neighbor = current + dir;
                if (neighbor.X < 0 || neighbor.Y < 0 || neighbor.Y >= _grid.Length || neighbor.X >= _grid[0].Length)
                    continue;

                string dirName = DirToName(dir);
                var allowed = new HashSet<int>();
                foreach (int tile in currentTiles)
                    if (_rules.TryGetValue(tile, out var tileRules) && tileRules.TryGetValue(dirName, out var allowedTiles))
                        foreach (int allowedTile in allowedTiles)
                            allowed.Add(allowedTile);

                var neighborTiles = _grid[neighbor.Y][neighbor.X];
                var newTiles = neighborTiles.Where(t => allowed.Contains(t)).ToList();

                if (newTiles.Count < neighborTiles.Count)
                {
                    _grid[neighbor.Y][neighbor.X] = newTiles;
                    stack.Push(neighbor);
                }
            }
        }
    }

    private static string DirToName(Vector2I dir)
    {
        if (dir == new Vector2I(0, -1)) return "up";
        if (dir == new Vector2I(0, 1))  return "down";
        if (dir == new Vector2I(-1, 0)) return "left";
        return "right";
    }
}
```

> **For production WFC**, consider the community addon [godot-wfc](https://github.com/AlexeyBond/godot-wfc) which provides editor integration, TileMap support, and 3D grid WFC.

---

