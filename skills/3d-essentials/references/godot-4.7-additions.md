> ← Back to [SKILL.md](../SKILL.md)

# Godot 4.7+ 3D Node Additions

## GridMap octant queries

`GridMap` exposes its internal octants for spatial queries — `cell_octant_size = 8` (cells per octant, per axis) plus:

| Method | Returns |
|---|---|
| `get_used_octants()` | All octants containing cells |
| `get_used_octants_by_item(item)` | Octants containing a specific item |
| `get_octants_in_bounds(bounds)` | All octants in range, **including empty ones** |
| `get_used_octants_in_bounds(bounds)` | Only non-empty octants in range |
| `get_used_cells_in_octant(octant_coords)` | Cells within one octant |
| `get_used_cells_in_octant_by_item(octant_coords, item)` | Cells of a given item within one octant |
| `get_octant_coords_from_cell_coords(cell_coords)` | The octant a cell belongs to |

Octant and cell coordinates are `Vector3i` (returned in `Array[Vector3i]`); `bounds` is a local-space `AABB`.

Use these to avoid iterating every cell when you only care about a region — culling, streaming, or region-scoped gameplay queries over a large `GridMap`.

## CSGShape3D automatic smoothing

`CSGShape3D` gains automatic smoothing:

- `autosmooth` (default `false`) — enable smoothing.
- `smoothing_angle` (default `50.0`) — faces meeting at an angle **greater** than this are smoothed; smaller angles stay sharp.
- A `smoothing_angle` below `0.1` disables all smoothing, which doubles as a performance escape hatch.

Children of a `CSGCombiner3D` are treated as a single mesh for smoothing purposes.
