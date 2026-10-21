---
name: procedural-generation
description: Use when implementing procedural generation — noise-based terrain, BSP dungeons, cellular automata caves, wave function collapse, and seeded randomness in Godot 4.3+
---

# Procedural Generation in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **2d-essentials** for TileMapLayer usage, **3d-essentials** for 3D terrain meshes, **math-essentials** for vectors and transforms, **godot-optimization** for chunk loading and performance.

---

## 1. Seeded Randomness

Always use seeds for reproducible generation. This enables shareable seeds, replay, and deterministic testing.

### GDScript

```gdscript
# RandomNumberGenerator — per-instance, seedable
var rng := RandomNumberGenerator.new()

func generate_level(level_seed: int) -> void:
    rng.seed = level_seed

    var width: int = rng.randi_range(20, 40)
    var height: int = rng.randi_range(15, 30)
    var enemy_count: int = rng.randi_range(3, 8)
    var treasure_chance: float = rng.randf_range(0.05, 0.15)

# AVOID: Global randf()/randi() — not reproducible across calls
# USE: rng.randf(), rng.randi(), rng.randf_range(), rng.randi_range()
```

### C#

```csharp
private RandomNumberGenerator _rng = new();

public void GenerateLevel(ulong levelSeed)
{
    _rng.Seed = levelSeed;

    int width = _rng.RandiRange(20, 40);
    int height = _rng.RandiRange(15, 30);
    int enemyCount = _rng.RandiRange(3, 8);
    float treasureChance = _rng.RandfRange(0.05f, 0.15f);
}
```

> **Tip:** Generate a seed from a string for shareable level codes: `var seed: int = "MyLevel".hash()`

---

## 2. Noise-Based Generation (FastNoiseLite)

`FastNoiseLite` for height maps, biome distribution, 2D terrain. Key params: `noise_type` (Perlin / Simplex / Cellular / Value), `frequency` (lower = larger features), `seed`. For terrain, sample noise at each tile coord, threshold the value to pick a tile.

> See [references/noise-generation.md](references/noise-generation.md) for the basic noise-map recipe, noise-type reference table, and 2D terrain + TileMapLayer walkthrough.

---

## 3. BSP Dungeon Generation

Binary Space Partitioning recursively splits a rectangle into smaller rectangles, carves a room inside each leaf, connects siblings with corridors. Produces grid-aligned room-based dungeons (think roguelike).

> See [references/bsp-dungeons.md](references/bsp-dungeons.md) for the full recursive partition + room placement + corridor connection algorithm in GDScript + C#.

---

## 4. Cellular Automata (Cave Generation)

Fill a grid with random walls/floors at ~45% density, then iterate "a cell becomes a wall if ≥ 5 of 8 neighbors are walls" 4-5 times. The result is organic cave shapes — no straight corridors.

> See [references/cellular-automata.md](references/cellular-automata.md) for the full GDScript + C# implementation with TileMapLayer integration.

---

## 5. Wave Function Collapse (WFC)

WFC is a constraint solver: given a tile set with adjacency rules, pick the lowest-entropy cell, collapse it to a valid tile, propagate constraints, repeat. Produces tile-rule-respecting output but is non-trivial to implement.

> See [references/wave-function-collapse.md](references/wave-function-collapse.md) for concept overview and a simplified GDScript + C# implementation.

---

## 6. Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Same level every time | Not seeding the RNG | Set `rng.seed` before generation |
| Different results on different platforms | Using global `randf()` / `randi()` | Use a dedicated `RandomNumberGenerator` instance |
| Noise looks blocky | Frequency too high | Lower `frequency` (try 0.01–0.05) |
| Caves are all wall or all floor | `fill_chance` too extreme or too few iterations | Use fill_chance 0.40–0.50 and 4–6 iterations |
| BSP rooms overlap | Split position too close to edge | Ensure `min_room_size` buffer in split calculation |
| WFC contradiction (no valid tile) | Adjacency rules too restrictive | Add more allowed neighbors or implement backtracking |
| Generation takes too long | Processing entire map in one frame | Use `await get_tree().process_frame` to spread across frames, or use a thread |

---

## 7. Implementation Checklist

- [ ] All generation uses a seedable `RandomNumberGenerator`, never global `randf()`/`randi()`
- [ ] Seeds are stored with save data so levels can be reproduced
- [ ] `FastNoiseLite` frequency and octaves are tuned for the game's tile/world scale
- [ ] Large generation is spread across frames or run on a thread to avoid freezing
- [ ] Generated TileMapLayer content uses terrain autotiling when possible (not hardcoded tile coords)
- [ ] BSP dungeons verify all rooms are connected before finalizing
- [ ] Cave generation runs a flood-fill to ensure reachability between key points
- [ ] Player spawn point is validated to be on a floor tile, not inside a wall
