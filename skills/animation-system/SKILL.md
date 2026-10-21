---
name: animation-system
description: Use when implementing animations — AnimationPlayer, AnimationTree, blend trees, state machines, sprite animation, and code-driven animation
---

# Animation System in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **state-machine** for gameplay state management, **player-controller** for movement that drives animation, **component-system** for reusable animation components, **2d-essentials** for TileMaps, parallax scrolling, 2D lights, and canvas layer organization, **3d-essentials** for AnimationTree and 3D animation blending, **shader-basics** for shader-driven hit flash and dissolve effects, **tween-animation** for code-driven motion alongside keyframe animation.

---

## 1. Core Concepts

### AnimationPlayer vs AnimationTree

| Node              | Use For                                  | Complexity | Notes                                              |
|-------------------|------------------------------------------|------------|----------------------------------------------------|
| `AnimationPlayer` | Simple playback, one-shot effects        | Low        | Play/stop/queue individual clips directly          |
| `AnimationTree`   | Blending, transitions, layered animation | Medium-High| State machines and blend trees for smooth transitions |

**Rule of thumb:** Start with AnimationPlayer. Add AnimationTree when you need blending between animations (walk/run blend, directional movement, layered upper/lower body).

### Animation Workflow

```
1. Create AnimationPlayer node       → holds all animation clips
2. Add tracks in the Animation panel → keyframe properties, methods, audio
3. (Optional) Add AnimationTree      → blend/transition logic
4. Trigger from code                 → play(), travel(), set parameters
```

---

## 2. AnimationPlayer Basics

### Scene Structure

```
Character (CharacterBody2D)
├── Sprite2D
└── AnimationPlayer
```

AnimationPlayer can animate **any property** on any sibling or child node: sprite frames, modulate, position, rotation, scale, visibility, collision shape disabled state, method calls (Call Method track), audio playback (Audio Playback track).

### GDScript — Basic Playback

```gdscript
extends CharacterBody2D

@onready var anim_player: AnimationPlayer = $AnimationPlayer

func _physics_process(delta: float) -> void:
    var input_dir := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")

    if input_dir != Vector2.ZERO:
        velocity = input_dir * 200.0
        anim_player.play("walk")
    else:
        velocity = Vector2.ZERO
        anim_player.play("idle")

    move_and_slide()
```

### C# — Basic Playback

```csharp
using Godot;

public partial class Character : CharacterBody2D
{
    private AnimationPlayer _animPlayer;

    public override void _Ready()
    {
        _animPlayer = GetNode<AnimationPlayer>("AnimationPlayer");
    }

    public override void _PhysicsProcess(double delta)
    {
        Vector2 inputDir = Input.GetVector("ui_left", "ui_right", "ui_up", "ui_down");

        if (inputDir != Vector2.Zero)
        {
            Velocity = inputDir * 200.0f;
            _animPlayer.Play("walk");
        }
        else
        {
            Velocity = Vector2.Zero;
            _animPlayer.Play("idle");
        }

        MoveAndSlide();
    }
}
```

> Calling `play()` with the same animation name while it's already playing does nothing (no restart). This is safe to call every frame.

### Playback Control

```gdscript
anim_player.play("attack")
anim_player.play_backwards("attack")
anim_player.queue("idle")            # play after current
anim_player.stop()
anim_player.pause()
anim_player.play()                   # resume from paused position
anim_player.speed_scale = 2.0
anim_player.seek(0.5)
```

```csharp
_animPlayer.Play("attack");
_animPlayer.PlayBackwards("attack");
_animPlayer.Queue("idle");
_animPlayer.Stop();
_animPlayer.Pause();
_animPlayer.Play();
_animPlayer.SpeedScale = 2.0;
_animPlayer.Seek(0.5);
```

---

## 3. Animation Signals

```gdscript
func _ready() -> void:
    anim_player.animation_finished.connect(_on_animation_finished)

func _on_animation_finished(anim_name: StringName) -> void:
    match anim_name:
        "attack":
            anim_player.play("idle")
        "death":
            queue_free()
```

```csharp
public override void _Ready()
{
    _animPlayer = GetNode<AnimationPlayer>("AnimationPlayer");
    _animPlayer.AnimationFinished += OnAnimationFinished;
}

private void OnAnimationFinished(StringName animName)
{
    if (animName == "attack")
        _animPlayer.Play("idle");
    else if (animName == "death")
        QueueFree();
}
```

### Method Call Tracks

Add a **Call Method** track to trigger game logic at exact animation frames (spawn projectile at frame 5, play SFX at impact frame, enable hitbox during swing). In the Animation panel: Add Track → Call Method Track → select target node → add keyframes → set method name and arguments.

```gdscript
func spawn_projectile() -> void:
    var bullet := preload("res://scenes/bullet.tscn").instantiate()
    get_parent().add_child(bullet)
    bullet.global_position = $Muzzle.global_position

func enable_hitbox() -> void:
    $HitboxArea/CollisionShape2D.disabled = false
```

---

## 4. Sprite Frame Animation

Two approaches for 2D character animation: `AnimatedSprite2D` (quick, frames-only) and `AnimationPlayer + Sprite2D` (full property animation). Pick AnimatedSprite2D for simple characters; AnimationPlayer when you also animate hitboxes, particles, sounds, or other properties in sync.

> See [references/sprite-animation.md](references/sprite-animation.md) for the full GDScript and C# example (a CharacterBody2D walking with `AnimatedSprite2D` driven by `Input.get_vector` and `flip_h`).

### Ping-Pong Playback (Godot 4.7+)

`SpriteFrames` replaces the bool `set_animation_loop()` (deprecated) with `set_animation_loop_mode(anim, SpriteFrames.LOOP_PINGPONG)` (also `LOOP_NONE`, `LOOP_LINEAR`); works with `AnimatedSprite2D` and `AnimatedSprite3D`.

> See [references/sprite-animation.md](references/sprite-animation.md#ping-pong-playback-godot-47) for the GDScript + C# snippet.

---

## 5. AnimationTree — Canonical State Machine

### Scene Structure

```
Character (CharacterBody2D)
├── Sprite2D
├── AnimationPlayer        ← holds all clips
└── AnimationTree          ← controls blending/transitions
    (tree_root = AnimationNodeStateMachine or AnimationNodeBlendTree)
```

**Setup:** Add AnimationTree as a sibling of AnimationPlayer. Set `anim_player` to point at the AnimationPlayer. Set `active = true`. Choose a root: **AnimationNodeStateMachine** (discrete states with transitions) or **AnimationNodeBlendTree** (continuous blending).

### State Machine Playback

The canonical pattern: cache `AnimationNodeStateMachinePlayback` from `anim_tree["parameters/playback"]`, call `travel("state")` from gameplay code (`travel()` transitions smoothly; `start()` switches immediately), and query the active state with `get_current_node()`.

> See [references/state-machine-examples.md](references/state-machine-examples.md) for the full GDScript and C# CharacterBody2D example.

### Blend Trees — BlendSpace1D / BlendSpace2D

For continuous blending (walk↔run on speed, 4/8-directional movement on a 2D vector), set the root to **AnimationNodeBlendTree**, add a **BlendSpace1D** or **BlendSpace2D**, and set `anim_tree["parameters/BlendSpace2D/blend_position"]` from gameplay code every frame.

> See [references/blend-spaces.md](references/blend-spaces.md) for blend point placement and the GDScript + C# code that drives a 1D speed blend and a 2D direction blend.

### Named Blend Points (Godot 4.7+)

`add_blend_point()` gains an optional `name` parameter (pass one: empty names will be deprecated); look points up with `find_blend_point_by_name()`.

> See [references/blend-spaces.md](references/blend-spaces.md#named-blend-points-godot-47) for the GDScript + C# snippet.

> ⚠️ **Changed in Godot 4.7:** the bool `sync` on `AnimationNodeBlendSpace1D/2D` is deprecated, replaced by the `sync_mode` property (C#: `SyncMode`), which takes an enum: `SYNC_MODE_NONE` (default — inactive animations frozen), `SYNC_MODE_INDEPENDENT` (the old `sync = true`), `SYNC_MODE_CYCLIC_MUTABLE`, `SYNC_MODE_CYCLIC_CONSTANT`. If a tree that blended correctly in 4.6 stops transitioning correctly, set `sync_mode` on each blend space. Full enum semantics: [references/blend-spaces.md](references/blend-spaces.md#sync-mode-godot-47).

---

## 6. Skeleton Modifiers (3D, 4.4+)

### LookAtModifier3D (Godot 4.4+)

Procedurally rotates a bone to look at a world-space target. Ideal for head tracking and eye contact without extra animation clips.

> See [references/skeleton-modifiers.md](references/skeleton-modifiers.md) for the full GDScript and C# example with angle limits and influence blending.

> ⚠️ **Changed in Godot 4.7:** `LookAtModifier3D.relative` defaults to `false` (rotation relative to the rest pose); only 4.6.0 used `true`. Set `relative = true` to restore it — details in [references/skeleton-modifiers.md](references/skeleton-modifiers.md).

### BoneConstraint3D (Godot 4.5+)

`AimModifier3D`, `CopyTransformModifier3D`, and `ConvertTransformModifier3D` operate **bone-relative** rather than world-space — use them when the aim/source target is itself a bone on the same skeleton (mirroring, secondary rig binding, bone-to-bone aiming).

> See [references/bone-constraints.md](references/bone-constraints.md) for the full deep dive — modifier table, scene structure, GDScript and C# examples for AimModifier3D and CopyTransformModifier3D.

### SpringBoneSimulator3D (Godot 4.4+)

Simulates spring physics on bones — hair, capes, tails, antennas bounce and sway procedurally. Add as child of `Skeleton3D`, configure spring chains (root bone, end bone, radius, stiffness, drag, gravity) in the Inspector.

> See [references/skeleton-modifiers.md](references/skeleton-modifiers.md) for property reference table and recommended starting values per use-case (hair, antennas, capes).

### Animation Markers (Godot 4.4+)

Named points/regions inside a clip (timeline → **Insert Marker...**) for subregion loops and frame-exact events without splitting clips; play a region with `play_section_with_markers()`.

> See [references/animation-markers.md](references/animation-markers.md) for the workflow and GDScript + C# code.

### Animation Retargeting (Godot 4.3+)

Godot 4.3 retargets animations from one skeleton to another during `.glb`/`.gltf` import via `SkeletonProfile` (e.g., `SkeletonProfileHumanoid`). Animations then target generic profile bone names, so any matching skeleton can play them.

> See [references/retargeting.md](references/retargeting.md) for the full import-dock setup steps.

---

## 7. IKModifier3D — Solver Comparison (Godot 4.6+)

Godot 4.6 adds `IKModifier3D`, a base class for skeletal IK solvers, with five ready-to-use solvers: `TwoBoneIK3D`, `CCDIK3D`, `FABRIK3D`, `JacobianIK3D` and `SplineIK3D`. These are `SkeletonModifier3D` children of `Skeleton3D` and work alongside other modifiers (e.g., `LookAtModifier3D`).

Pick by chain: `TwoBoneIK3D` for exactly-two-bone limbs (needs a pole node), `FABRIK3D` for simple chains without joint limits, `CCDIK3D` when joints have limits, `SplineIK3D` to follow a `Path3D`, and `JacobianIK3D` for smooth organic motion with slower tracking.

> See [references/ik-solver-comparison.md](references/ik-solver-comparison.md) for the full solver comparison table and selection guidance.

> See [references/ik-recipes.md](references/ik-recipes.md) for the full GDScript and C# recipes — arm reach with influence blending (CCDIK3D), foot placement on uneven terrain (FABRIK3D + raycast), and basic FABRIK arm IK setup.

---

## 8. Common Recipes

Two gameplay-flavored animation recipes: a hit-flash modulate tween and a buffered attack combo using AnimationPlayer's Call Method track.

> See [references/common-recipes.md](references/common-recipes.md) for the full GDScript and C# code (Hit Flash, Attack Combo with combo-window buffering).

---

## 9. Common Pitfalls

Quick symptom → cause → fix table covering animation snapping instead of blending, an inactive AnimationTree, `travel()` not transitioning, wrong track node paths, silent Call Method tracks, dead blend parameters, and per-frame `play()` resets.

> See [references/common-pitfalls.md](references/common-pitfalls.md) for the full table.

---

## 10. Implementation Checklist

- [ ] AnimationPlayer is a direct child of the animated node (not nested deeper)
- [ ] All animation track node paths are valid (no broken references after scene restructuring)
- [ ] AnimationTree `active` is set to `true` and `anim_player` points to the correct AnimationPlayer
- [ ] State machine transitions have appropriate fade times (0.1–0.2s for responsive gameplay)
- [ ] Looping animations (idle, walk, run) have loop mode set to **Loop** in the Animation panel
- [ ] One-shot animations (attack, jump, death) have loop mode set to **None**
- [ ] Call Method tracks are used for gameplay events (hitbox enable/disable, spawn projectiles, play SFX)
- [ ] Blend parameters are set from gameplay code every frame (not just on state change)
- [ ] `animation_finished` signal is connected for one-shot animations that need follow-up logic
- [ ] Head/eye tracking uses `LookAtModifier3D` instead of manual bone rotation (Godot 4.4+)
- [ ] Hair, capes, and tails use `SpringBoneSimulator3D` instead of custom physics scripts (Godot 4.4+)
- [ ] Shared animation libraries use retargeting with `SkeletonProfileHumanoid` (Godot 4.3+)
- [ ] Bone-to-bone aim/copy constraints use `AimModifier3D` / `CopyTransformModifier3D` instead of manual bone transform code (Godot 4.5+)
- [ ] Arm/leg IK uses `IKModifier3D` subclasses (`TwoBoneIK3D` with a pole node for two-bone limbs, `FABRIK3D` or `CCDIK3D` for longer chains) rather than custom IK scripts (Godot 4.6+)
