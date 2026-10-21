# BSP Dungeon Generation

Reference for `skills/procedural-generation/SKILL.md` — Binary Space Partitioning for room-based dungeons, corridor connection. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 3. BSP Dungeon Generation

Binary Space Partitioning recursively splits a rectangle into rooms, then connects them with corridors. Produces classic roguelike dungeon layouts.

### GDScript

```gdscript
class_name BSPDungeon
extends RefCounted

var rng := RandomNumberGenerator.new()
var min_room_size: int = 5
var rooms: Array[Rect2i] = []

func generate(bounds: Rect2i, gen_seed: int) -> Array[Rect2i]:
    rng.seed = gen_seed
    rooms.clear()
    _split(bounds)
    return rooms

func _split(area: Rect2i) -> void:
    # Stop splitting if area is small enough to be a room
    if area.size.x <= min_room_size * 2 and area.size.y <= min_room_size * 2:
        # Shrink to create room with margins
        var room := Rect2i(
            area.position + Vector2i(1, 1),
            area.size - Vector2i(2, 2)
        )
        if room.size.x >= min_room_size and room.size.y >= min_room_size:
            rooms.append(room)
        return

    # Choose split direction based on aspect ratio
    var split_horizontal: bool
    if area.size.x > area.size.y * 1.25:
        split_horizontal = false  # split vertically (wide room)
    elif area.size.y > area.size.x * 1.25:
        split_horizontal = true   # split horizontally (tall room)
    else:
        split_horizontal = rng.randi() % 2 == 0

    if split_horizontal:
        var split_y: int = rng.randi_range(
            area.position.y + min_room_size,
            area.end.y - min_room_size
        )
        _split(Rect2i(area.position, Vector2i(area.size.x, split_y - area.position.y)))
        _split(Rect2i(Vector2i(area.position.x, split_y), Vector2i(area.size.x, area.end.y - split_y)))
    else:
        var split_x: int = rng.randi_range(
            area.position.x + min_room_size,
            area.end.x - min_room_size
        )
        _split(Rect2i(area.position, Vector2i(split_x - area.position.x, area.size.y)))
        _split(Rect2i(Vector2i(split_x, area.position.y), Vector2i(area.end.x - split_x, area.size.y)))
```

### Connecting Rooms with Corridors

```gdscript
func connect_rooms(tile_map: TileMapLayer, floor_tile: Vector2i) -> void:
    for i in range(rooms.size() - 1):
        var center_a: Vector2i = rooms[i].position + rooms[i].size / 2
        var center_b: Vector2i = rooms[i + 1].position + rooms[i + 1].size / 2

        # L-shaped corridor: horizontal then vertical
        if rng.randi() % 2 == 0:
            _carve_horizontal(tile_map, center_a.x, center_b.x, center_a.y, floor_tile)
            _carve_vertical(tile_map, center_a.y, center_b.y, center_b.x, floor_tile)
        else:
            _carve_vertical(tile_map, center_a.y, center_b.y, center_a.x, floor_tile)
            _carve_horizontal(tile_map, center_a.x, center_b.x, center_b.y, floor_tile)

func _carve_horizontal(tile_map: TileMapLayer, x1: int, x2: int, y: int, tile: Vector2i) -> void:
    for x in range(mini(x1, x2), maxi(x1, x2) + 1):
        tile_map.set_cell(Vector2i(x, y), 0, tile)

func _carve_vertical(tile_map: TileMapLayer, y1: int, y2: int, x: int, tile: Vector2i) -> void:
    for y in range(mini(y1, y2), maxi(y1, y2) + 1):
        tile_map.set_cell(Vector2i(x, y), 0, tile)
```

### C#

```csharp
public partial class BSPDungeon : RefCounted
{
    private RandomNumberGenerator _rng = new();
    private int _minRoomSize = 5;
    public Godot.Collections.Array<Rect2I> Rooms { get; } = new();

    public Godot.Collections.Array<Rect2I> Generate(Rect2I bounds, ulong genSeed)
    {
        _rng.Seed = genSeed;
        Rooms.Clear();
        Split(bounds);
        return Rooms;
    }

    private void Split(Rect2I area)
    {
        if (area.Size.X <= _minRoomSize * 2 && area.Size.Y <= _minRoomSize * 2)
        {
            var room = new Rect2I(
                area.Position + new Vector2I(1, 1),
                area.Size - new Vector2I(2, 2)
            );
            if (room.Size.X >= _minRoomSize && room.Size.Y >= _minRoomSize)
                Rooms.Add(room);
            return;
        }

        bool splitHorizontal;
        if (area.Size.X > area.Size.Y * 1.25f)
            splitHorizontal = false;
        else if (area.Size.Y > area.Size.X * 1.25f)
            splitHorizontal = true;
        else
            splitHorizontal = _rng.Randi() % 2 == 0;

        if (splitHorizontal)
        {
            int splitY = _rng.RandiRange(
                area.Position.Y + _minRoomSize,
                area.End.Y - _minRoomSize
            );
            Split(new Rect2I(area.Position, new Vector2I(area.Size.X, splitY - area.Position.Y)));
            Split(new Rect2I(new Vector2I(area.Position.X, splitY), new Vector2I(area.Size.X, area.End.Y - splitY)));
        }
        else
        {
            int splitX = _rng.RandiRange(
                area.Position.X + _minRoomSize,
                area.End.X - _minRoomSize
            );
            Split(new Rect2I(area.Position, new Vector2I(splitX - area.Position.X, area.Size.Y)));
            Split(new Rect2I(new Vector2I(splitX, area.Position.Y), new Vector2I(area.End.X - splitX, area.Size.Y)));
        }
    }

    public void ConnectRooms(TileMapLayer tileMap, Vector2I floorTile)
    {
        for (int i = 0; i < Rooms.Count - 1; i++)
        {
            Vector2I centerA = Rooms[i].Position + Rooms[i].Size / 2;
            Vector2I centerB = Rooms[i + 1].Position + Rooms[i + 1].Size / 2;

            if (_rng.Randi() % 2 == 0)
            {
                CarveHorizontal(tileMap, centerA.X, centerB.X, centerA.Y, floorTile);
                CarveVertical(tileMap, centerA.Y, centerB.Y, centerB.X, floorTile);
            }
            else
            {
                CarveVertical(tileMap, centerA.Y, centerB.Y, centerA.X, floorTile);
                CarveHorizontal(tileMap, centerA.X, centerB.X, centerB.Y, floorTile);
            }
        }
    }

    private static void CarveHorizontal(TileMapLayer tileMap, int x1, int x2, int y, Vector2I tile)
    {
        for (int x = Mathf.Min(x1, x2); x <= Mathf.Max(x1, x2); x++)
            tileMap.SetCell(new Vector2I(x, y), 0, tile);
    }

    private static void CarveVertical(TileMapLayer tileMap, int y1, int y2, int x, Vector2I tile)
    {
        for (int y = Mathf.Min(y1, y2); y <= Mathf.Max(y1, y2); y++)
            tileMap.SetCell(new Vector2I(x, y), 0, tile);
    }
}
```

---

