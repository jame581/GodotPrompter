# Blend Spaces

Reference for `skills/animation-system/SKILL.md` — driving `AnimationNodeBlendSpace1D/2D` from code and the Godot 4.7 named blend points. Also the full Godot 4.7 `sync_mode` enum, which core SKILL.md summarizes.

> ← Back to [SKILL.md](../SKILL.md)

---

## Blend Trees — BlendSpace1D / BlendSpace2D

For continuous blending (walk↔run on a speed parameter; 4/8-directional movement on a 2D vector). Set the root to **AnimationNodeBlendTree**, add a **BlendSpace1D** or **BlendSpace2D**, place animations at compass positions (e.g., walk @ 0.0, run @ 1.0; idle_down @ (0,1), idle_right @ (1,0)). Drive the blend each frame:

```gdscript
# 1D — speed blend
var blend_amount := inverse_lerp(walk_speed, run_speed, velocity.length())
anim_tree["parameters/BlendSpace1D/blend_position"] = blend_amount

# 2D — direction blend
anim_tree["parameters/BlendSpace2D/blend_position"] = input_dir
```

```csharp
_animTree.Set("parameters/BlendSpace1D/blend_position", blendAmount);
_animTree.Set("parameters/BlendSpace2D/blend_position", inputDir);
```

## Named Blend Points (Godot 4.7+)

`AnimationNodeBlendSpace1D/2D.add_blend_point()` gains an optional `name: StringName = &""` parameter, and blend point names/indices can be set and displayed in the editor. Passing a name explicitly is recommended (empty names will be deprecated); look points up with `find_blend_point_by_name()`.

```gdscript
blend_space.add_blend_point(walk_node, 0.0, -1, &"walk")
blend_space.add_blend_point(run_node, 1.0, -1, &"run")
var run_index := blend_space.find_blend_point_by_name(&"run")
```

```csharp
blendSpace.AddBlendPoint(walkNode, 0.0f, -1, "walk");
blendSpace.AddBlendPoint(runNode, 1.0f, -1, "run");
int runIndex = blendSpace.FindBlendPointByName("run");
```

## Sync Mode (Godot 4.7+)

> ⚠️ **Changed in Godot 4.7:** `AnimationNodeBlendSpace1D/2D` replace the bool `sync` property (now deprecated) with a `sync_mode` `SyncMode` enum: `SYNC_MODE_NONE = 0` (default — inactive animations are frozen), `SYNC_MODE_INDEPENDENT = 1` (the old `sync = true` behavior), `SYNC_MODE_CYCLIC_MUTABLE = 2` (cycle length computed dynamically from blend weights), `SYNC_MODE_CYCLIC_CONSTANT = 3` (one cycle per `cyclic_length` seconds — must be > 0). If an AnimationTree that blended correctly in 4.6 stops transitioning correctly, set `sync_mode` on each blend space. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).
