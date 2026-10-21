# TileMap System

Reference for `skills/2d-essentials/SKILL.md` — TileSet setup, atlas properties, physics on tiles, terrain autotiling, scattering, multiple layers, custom data on tiles, scene collection tiles, tile collision bumps (Godot 4.5+ TileMapLayer auto-merge).

> ← Back to [SKILL.md](../SKILL.md)

---
## 2. TileMap System

> **Deprecation notice:** The old `TileMap` node (with in-node layer management) is deprecated as of Godot 4.3. Use individual `TileMapLayer` nodes instead — one node per layer. All examples in this skill use the current `TileMapLayer` approach. If you encounter legacy code using the old `TileMap` node, migrate by replacing it with separate `TileMapLayer` nodes sharing the same `TileSet` resource.

### TileSet Resource Setup

1. Add a `TileMapLayer` node
2. Create a new `TileSet` resource in its inspector
3. Set **Tile Size** (e.g. 16×16) BEFORE creating atlases
4. Drag your tilesheet texture into the TileSet panel → answer "Yes" to auto-create tiles

**Save the TileSet** as an external `.tres` resource (click dropdown → Save) to reuse across levels.

### TileSet Properties

| Property | Purpose |
|----------|---------|
| `Tile Shape` | Square (default), Isometric, Half-Offset Square, Hexagon |
| `Tile Size` | Tile dimensions in pixels |
| `Rendering > UV Clipping` | Clip tiles by their coordinates |

### Atlas Properties

| Property | Purpose |
|----------|---------|
| `Margins` | Edge margins in pixels |
| `Separation` | Gap between tiles in pixels |
| `Texture Region Size` | Size of each tile on the atlas |
| `Use Texture Padding` | 1px transparent border to prevent bleeding (recommended ON) |

### Physics on Tiles

1. TileSet inspector → unfold **Physics Layers** → Add Element
2. In the atlas tile editor, select a tile → press `F` for default rectangle collision
3. Click to add polygon points, right-click to remove, drag edges to insert

### Terrain Autotiling

Terrains automatically select the correct tile based on neighboring tiles.

1. TileSet inspector → **Terrain Sets** → Add Element
2. Choose mode:
   - **Match Corners and Sides** — full 3×3 matching (47 tiles for complete set)
   - **Match Corners** — 2×2 matching (simpler, fewer tiles)
   - **Match Sides** — sides only, ignore corners (minimal set)
3. Add terrains within each set (e.g. "Grass", "Dirt", "Water")
4. Configure **Terrain Peering Bits** on each tile in the atlas editor

### Painting Tiles

| Mode | Shortcut | Notes |
|------|----------|-------|
| Paint | Left-click | `Shift` = line, `Ctrl+Shift` = rectangle |
| Erase | Right-click | Also works with Paint/Line/Rect modes |
| Picker | `Ctrl+click` | Pick tile from placed tiles |
| Bucket Fill | — | Toggle Contiguous checkbox for fill-all behavior |
| Terrain Connect | — | Tiles connect to all neighbors |
| Terrain Path | — | Tiles connect only within current stroke |

### Scattering and Randomization

Enable **randomization** to randomly choose from selected tiles when painting. Set **Scattering** > 0 for a chance of placing no tile (useful for non-repeating detail like grass tufts).

### Multiple Layers

Use multiple `TileMapLayer` nodes for foreground/background separation. Only one tile per layer at a given position — overlap via multiple layers.

```
Level
├── TileMapLayer (Background — behind player)
├── TileMapLayer (Midground — player level)
├── Player
└── TileMapLayer (Foreground — in front of player, higher z_index)
```

### Custom Data on Tiles

1. TileSet inspector → **Custom Data Layers** → Add (e.g. `damage: float`, `destructible: bool`)
2. Set values per tile in the atlas editor

```gdscript
# Read custom data from a tile at runtime
var tile_map: TileMapLayer = $TileMapLayer
var cell: Vector2i = tile_map.local_to_map(global_position)
var tile_data: TileData = tile_map.get_cell_tile_data(cell)
if tile_data:
    var damage: float = tile_data.get_custom_data("damage")
```

```csharp
var tileMap = GetNode<TileMapLayer>("TileMapLayer");
Vector2I cell = tileMap.LocalToMap(GlobalPosition);
TileData tileData = tileMap.GetCellTileData(cell);
if (tileData != null)
{
    float damage = tileData.GetCustomData("damage").AsSingle();
}
```

### Scene Collection Tiles

Place entire scenes as tiles (e.g. doors, chests, spawn points with AudioStreamPlayer2D or particles). Greater performance overhead — each is instanced individually. Use for gameplay elements, not mass terrain.

### Tile Collision Bumps

Characters snagging on edges between adjacent tile colliders is a common issue:
- Since Godot 4.5, `TileMapLayer` merges the collision shapes of similar tiles inside each physics quadrant — **Physics Quadrant Size** (`physics_quadrant_size`, default 16) — which removes most edge snagging. Before 4.5 every tile had its own shape.
- For persistent issues, manually merge adjacent collision polygons into single `StaticBody2D` shapes
- Using `CharacterBody2D` with `floor_snap_length > 0` also reduces edge catching

> See **physics-system** for more collision troubleshooting.

---

