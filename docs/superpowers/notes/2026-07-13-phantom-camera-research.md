# Phantom Camera — Godot 4.x Research Digest (for the `phantom-camera` skill)

> Gathered 2026-07-13 from a shallow clone of https://github.com/ramokz/phantom-camera pinned to tag
> **v0.11.0.2** (commit `e46886219870c07cf534826888b53cf7834278ab`), cloned to
> `$SCRATCH/pcam-v0.11.0.2`. Primary source-of-truth: `addons/phantom_camera/scripts/**/*.gd` (verbatim
> GDScript with doc-comments). Cross-checked against https://phantom-camera.dev (Overview,
> PhantomCamera2D/3D, PhantomCameraHost, follow-mode, look-at-mode, and tween pages) — **CAUTION**: the
> live docs site tracks a newer/rolling version than the pin; every name below was verified against the
> v0.11.0.2 source, not the site.

## 1. Release metadata

| Field | Value |
|---|---|
| **Version** | 0.11.0.2 (`addons/phantom_camera/plugin.cfg`) |
| **Min Godot** | 4.4+ (README badge `Godot-4.4%2B-blue`; confirmed by `PROPERTY_HINT_TOOL_BUTTON` usage in `phantom_camera_3d.gd`, a 4.4 addition) |
| **License** | MIT — Copyright (c) 2022 Marcus Skov |
| **Language** | Pure GDScript — no C# API, no GDExtension binary |
| **Repo** | https://github.com/ramokz/phantom-camera |
| **Stability** | Pre-1.0 (`0.x`) — minor versions may break API |

## 2. Install

Asset Library (recommended): search "Phantom Camera" in Godot's AssetLib → Download (select only the
`phantom_camera` directory) → enable in **Project → Project Settings → Plugins**.

GitHub zip: extract `addons/phantom_camera/` into the project root, then enable the plugin the same way.

`plugin.gd` (`_enable_plugin()`) auto-registers an autoload singleton named `PhantomCameraManager`
(`res://addons/phantom_camera/scripts/managers/phantom_camera_manager.gd`) and calls
`EditorInterface.restart_editor()` — **the editor restarts itself** the first time the plugin is enabled.
No manual autoload setup is required. `_enter_tree()` also registers six custom node types:
`PhantomCamera2D`, `PhantomCamera3D`, `PhantomCameraHost`, `PhantomCameraNoiseEmitter2D`,
`PhantomCameraNoiseEmitter3D`, and `PhantomCameraTweenDirector`.

## 3. Node model

Source: `addons/phantom_camera/scripts/phantom_camera_host/phantom_camera_host.gd`,
`phantom_camera/phantom_camera_2d.gd`, `phantom_camera/phantom_camera_3d.gd`.

- **`PhantomCameraHost`** (`extends Node`) is added **as a child of the scene's real `Camera2D` /
  `Camera3D`** — not the other way around. `_get_configuration_warnings()` explicitly checks
  `get_parent() is Camera2D` (2D) / `get_parent().is_class("Camera3D")` (3D) and returns an error string
  if the parent doesn't match. Only the first `PhantomCameraHost` child of a given camera is used.
- **`PhantomCamera2D`** (`extends Node2D`) / **`PhantomCamera3D`** (`extends Node3D`) are placed anywhere
  else in the scene (siblings of the player, trigger areas, cutscene rigs, etc.) — they are **not**
  children of the Camera or Host. Any number can exist; the Host picks the one with the highest
  `priority` among those sharing a `host_layers` bit with the Host's `host_layers`.
- `PhantomCameraHost.camera_2d: Camera2D` / `camera_3d: Node` are populated from `get_parent()` in
  `_enter_tree()`. For 2D, the Host also force-disables `Camera2D.position_smoothing_enabled` on attach
  ("to prevent overlap with the interpolation of the PCam2D").
- `PhantomCameraHost.get_active_pcam() -> Node` returns the currently attached `PhantomCamera2D`/`3D`.
- `PhantomCameraHost.interpolation_mode: InterpolationMode` — `AUTO=0` (physics vs. idle chosen
  automatically based on the active PCam's follow/look-at target), `IDLE=1`, `PHYSICS=2`,
  `MANUAL=3` (call `phantom_camera_host.process(delta)` yourself; only use for manual tick control).
- Confirmed from example `.tscn` files (`examples/example_scenes/3D/*.tscn`): scene tree pattern is
  `MainCamera3D (Camera3D)` → child `PhantomCameraHost (Node)`.

## 4. Priority-based switching

Source: `phantom_camera_2d.gd` / `phantom_camera_3d.gd` `priority` property + setters;
`phantom_camera_host.gd` `_find_pcam_with_highest_priority()`, `_check_pcam_priority()`.

- `@export var priority: int = 0` — settable via `set_priority(value: int)` (clamped to `>= 0` via
  `maxi(0, value)`) / `get_priority() -> int`. Changing it emits an event through the
  `PhantomCameraManager` autoload that the Host listens for (`pcam_priority_changed`), and the Host
  re-picks the highest-priority PCam sharing a `host_layers` bit.
- `priority_override: bool` — editor-only "force preview" toggle (disabled in exported builds) that lets
  a PCam jump to active regardless of `priority`; not for runtime gameplay logic.
- `host_layers: int` (`@export_flags_2d_render` on `PhantomCamera2D`, `@export_flags_3d_render` on
  `PhantomCamera3D`) — a PCam is only eligible for a given Host if their `host_layers` bitmasks overlap.
  `set_host_layers_value(layer: int, value: bool)` toggles one bit.
- Verbatim example pattern (`examples/scripts/2D/2d_trigger_area.gd` / `3D/3d_trigger_area.gd`):
  ```gdscript
  extends Area2D
  @export var area_pcam: PhantomCamera2D

  func _entered_area(area_2d: Area2D) -> void:
      if area_2d.get_parent() is CharacterBody2D:
          area_pcam.set_priority(20)

  func _exited_area(area_2d: Area2D) -> void:
      if area_2d.get_parent() is CharacterBody2D:
          area_pcam.set_priority(0)
  ```
- Signals fired around a switch (identical shape on 2D/3D): `became_active`, `became_inactive`,
  `tween_started`, `is_tweening` (per-frame during the tween), `tween_interrupted(pcam)`,
  `tween_completed`.

## 5. Follow modes

`enum FollowMode` (identical member set on `PhantomCamera2D` and `PhantomCamera3D`, 3D adds one member):

```gdscript
# phantom_camera_2d.gd
enum FollowMode { NONE = 0, GLUED = 1, SIMPLE = 2, GROUP = 3, PATH = 4, FRAMED = 5 }

# phantom_camera_3d.gd — adds THIRD_PERSON
enum FollowMode { NONE = 0, GLUED = 1, SIMPLE = 2, GROUP = 3, PATH = 4, FRAMED = 5, THIRD_PERSON = 6 }
```

Note: the task brief's placeholder name "sticky" does **not** appear anywhere in source or docs — the
real name is **`FRAMED`** (dead-zone-based follow). Recorded verbatim from source, not guessed.

| Mode | Behavior (from doc-comments) | Key properties |
|---|---|---|
| `NONE` | No follow logic. | — |
| `GLUED` | Sticks exactly to `follow_target`. | `follow_target` |
| `SIMPLE` | Follows `follow_target` with an optional offset. | `follow_target`, `follow_offset`, `follow_damping`, `follow_damping_value` |
| `GROUP` | Follows multiple `follow_targets`, can dynamically reframe. | `follow_targets: Array[Node2D/3D]`, `auto_zoom` (2D) / `auto_follow_distance` (3D) |
| `PATH` | Follows `follow_target` while confined to the closest point on `follow_path` (`Path2D`/`Path3D`). | `follow_target`, `follow_path` |
| `FRAMED` | Applies a dead zone on the frame; camera only moves once the target tries to leave it. | `dead_zone_width`, `dead_zone_height`, `show_viewfinder_in_play`; emits `dead_zone_reached(side: Vector2)` |
| `THIRD_PERSON` (3D only) | Applies a `SpringArm3D` at the target's position; allows orbiting. | `follow_distance` (→ `SpringArm3D.spring_length`), `collision_mask`, `shape`, `margin`, `vertical_rotation_offset`, `horizontal_rotation_offset` |

Shared follow parameters (both 2D/3D unless noted): `follow_offset`, `follow_damping: bool`,
`follow_damping_value: Vector2/Vector3` (lower = snappier), `follow_axis_lock` (`FollowLockAxis` enum —
2D: `NONE, X, Y, XY`; 3D: `NONE, X, Y, Z, XY, XZ, YZ, XYZ`), `rotate_with_target: bool` (2D-only —
requires `Camera2D.ignore_rotation = false`), `lookahead: bool` + `lookahead_time`,
`lookahead_acceleration`, `lookahead_deceleration`, `lookahead_max` / `lookahead_max_value` (2D-only
lookahead subgroup; not present on `PhantomCamera3D`).

`GROUP` auto-reframe: 2D uses `auto_zoom` / `auto_zoom_min` / `auto_zoom_max` / `auto_zoom_margin`
(adjusts `Camera2D.zoom`); 3D uses `auto_follow_distance` / `auto_follow_distance_min` /
`auto_follow_distance_max` / `auto_follow_distance_divisor` (adjusts distance along local `-z`).

`THIRD_PERSON` setter/getter surface (3D-only, verified in source):
`set_third_person_rotation(Vector3)` / `get_third_person_rotation() -> Vector3` (radians, operates on
the internal `SpringArm3D.rotation`), `set_third_person_rotation_degrees` /
`get_third_person_rotation_degrees`, `set_third_person_quaternion` / `get_third_person_quaternion`,
`set_spring_length(float)` (writes both `follow_distance` and the live `SpringArm3D.spring_length`),
`set_collision_mask` / `set_collision_mask_value(layer, enabled)`, `set_shape(Shape3D)`. All of these
print an error ("Follow Mode is not set to Third Person") and no-op if `follow_mode != THIRD_PERSON`.

Public state helper on both: `is_following() -> bool`, `teleport_position()` (snap-follow, bypassing
damping), `get_transform_output() -> Transform2D/3D`.

## 6. Look-at modes (3D only)

`PhantomCamera2D` has **no** look-at system (only `rotate_with_target`, see §5). Only
`PhantomCamera3D` exposes:

```gdscript
enum LookAtMode { NONE = 0, MIMIC = 1, SIMPLE = 2, GROUP = 3 }
```

| Mode | Behavior |
|---|---|
| `NONE` | No look-at logic. |
| `MIMIC` | Copies the target's rotation directly (no re-orientation math). |
| `SIMPLE` | Looks directly at `look_at_target` (single `Node3D`). |
| `GROUP` | Looks at the centroid of `look_at_targets: Array[Node3D]`. |

Properties: `look_at_target: Node3D`, `look_at_targets: Array[Node3D]`, `look_at_offset: Vector3`,
`look_at_damping: bool` + `look_at_damping_value: float` (single scalar, unlike the per-axis
`follow_damping_value`), `up: Vector3 = Vector3.UP` and `up_target: Node3D` (continuously overrides
`up` when set). Signal: `look_at_target_changed`.

**Gotcha called out directly in source** (`phantom_camera_3d.gd`, both the `follow_mode` and
`look_at_mode` setters): combining a non-`NONE` `follow_mode` with a non-`NONE` `look_at_mode` on the
same node prints `"Warning: Using both Look At and Follow Mode on the same PCam3D has not been fully
tested yet, proceed with caution!"` at runtime. Worth flagging for skill users.

## 7. Tween resource

Source: `addons/phantom_camera/scripts/resources/tween_resource.gd` (`class_name PhantomCameraTween`,
`extends Resource`).

```gdscript
@export var duration: float = 1.0                       # seconds
@export var transition: TransitionType = TransitionType.LINEAR
@export var ease: EaseType = EaseType.EASE_IN_OUT

enum TransitionType {
    LINEAR = 0, SINE = 1, QUINT = 2, QUART = 3, QUAD = 4, EXPO = 5,
    ELASTIC = 6, CUBIC = 7, CIRC = 8, BOUNCE = 9, BACK = 10,
}
enum EaseType { EASE_IN = 0, EASE_OUT = 1, EASE_IN_OUT = 2, EASE_OUT_IN = 3 }
```

These enum members map 1:1 to Godot's built-in `Tween.TransitionType` / `Tween.EaseType` names (minus
the `TRANS_`/`EASE_` prefixes) — the Host applies them via the engine's own `Tween` internally
(`phantom_camera_host.gd::_pcam_tween`).

- Both `PhantomCamera2D` and `PhantomCamera3D` own `@export var tween_resource: PhantomCameraTween =
  PhantomCameraTween.new()` — a `Resource`, shareable across multiple PCams (assign the same `.tres` to
  reuse timing) or left as a unique per-node instance (default).
- `tween_on_load: bool = true` — if a PCam is the highest-priority one *and* is instantiated at runtime,
  it tweens the camera into place on load unless this is set to `false` (skips straight to the target
  transform).
- Convenience passthrough properties/setters exist directly on the PCam so callers don't need to reach
  into the resource: `tween_duration` / `set_tween_duration(float)` / `get_tween_duration()`,
  `tween_transition` / `set_tween_transition(int)` / `get_tween_transition()`, `tween_ease` /
  `set_tween_ease(int)` / `get_tween_ease()`. `get_tween_duration()` returns `0.0` and
  `get_tween_transition()` returns `0` (LINEAR) if `tween_resource` is `null` (instant cut).
- Signals fired during a Host-driven tween: `tween_started` (once), `is_tweening` (every frame of the
  tween), `tween_interrupted(pcam)` (a higher-priority PCam preempted mid-tween — argument is the
  interrupting PCam), `tween_completed` (once, on finish).
- A separate `PhantomCameraTweenDirector` node/resource pair
  (`scripts/phantom_camera/phantom_camera_tween_director.gd`,
  `scripts/resources/tween_director_resource.gd`) exists for per-transition-pair overrides (e.g. "when
  switching specifically from PCam A to PCam B, use these tween settings instead") — out of scope for
  this skill's core sections; worth a one-line mention only if space allows.

## 8. Gotchas / drift found

1. **"Sticky" is not a real name.** The task brief's placeholder ("sticky/framed") doesn't exist in
   source or on the live docs site — the only name is `FRAMED`. Using `FRAMED` exclusively in the skill.
2. **`PhantomCameraHost` must be a *child* of the `Camera2D`/`Camera3D`**, not a sibling or parent. This
   is enforced at the `_get_configuration_warnings()` level and easy to get backwards when translating
   from Cinemachine (Unity) mental models where the brain/rig relationship differs.
3. **2D has no look-at system.** Only `rotate_with_target` (boolean, copies rotation, 2D-only). Don't
   imply `look_at_mode` exists on `PhantomCamera2D`.
4. **2D lookahead has a `_max`/`_max_value` velocity clamp subgroup that 3D's `PhantomCamera3D` doesn't
   expose** — confirmed by absence of `lookahead_max`/`lookahead_max_value` exports in
   `phantom_camera_3d.gd` (searched, not present); 3D still has `lookahead`/`lookahead_time`/
   `lookahead_acceleration`/`lookahead_deceleration`.
5. **Follow + Look At combination is explicitly marked "not fully tested"** by the addon's own runtime
   warning (3D only, since 2D has no look-at). Flagged in §6 above.
6. **Editor auto-restart on enable.** `_enable_plugin()` calls `EditorInterface.restart_editor()`
   immediately after registering the autoload — expected, not a bug, but worth a heads-up in Install so
   users aren't surprised.
7. **Physics interpolation tip.** `_check_physics_body()` in both 2D/3D scripts prints a runtime tip if
   the followed target is a `PhysicsBody2D/3D` and Project Settings → Physics → Common →
   Physics Interpolation is disabled, recommending it be enabled to avoid jitter. Silenceable via
   Project Settings → Phantom Camera → Tips → Show Jitter Tips.
8. **Docs-site vs. tag drift**: not directly diffable without live network access to phantom-camera.dev
   from this environment; all facts in this note are sourced from the v0.11.0.2 GDScript source
   (doc-comments + code), which is authoritative for the pin. No contradictions were found between the
   README's feature list and the source during this pass, but the skill should be re-verified against
   source (not the live site) on any future version bump given the addon is pre-1.0.

## Skill-authoring implications

- **GDScript-only**: zero `csharp` blocks — no C# API exists in this addon (confirmed: no `.cs` files,
  no `GodotSharp`/NuGet references anywhere in the v0.11.0.2 tree). Every code section in the skill will
  emit an intentional `csharp-parity-accepted` validator warning; `phantom-camera` is already on the
  validator's GDScript-only allowlist (Task 3).
  Note: a `PhantomCamera.csproj`/`.sln` exist at repo root, but these build the **addon's own editor
  tooling for the Godot-C#-hybrid dev workflow**, not a public C# API for game code — do not present
  them as a C# usage path.
- **Section mapping to source**: §3 → host + camera model section; §4 → priority switching section;
  §5 → follow modes section; §6 → look-at (3D) section; §7 → tweening section.
- **Cross-refs**: `camera-system` (hand-rolled camera patterns this addon replaces/complements),
  `tween-animation` (the easing/transition vocabulary `PhantomCameraTween` builds on).
