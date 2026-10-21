# Popochiu — Asset Pipeline, Audio, Transitions & Save/Load

> Deep dive for [../SKILL.md](../SKILL.md) §4. Covers the parts of the engine that don't fit the core rooms/characters/dialog/inventory narrative.

## Aseprite importer

`res://addons/popochiu/editor/importers/` ships as its own plugin ("PopochiuImporters", enabled independently in Project Settings from the main Popochiu plugin). It provides dedicated import docks per object type (`aseprite_importer_dock_{character,inventory,room}.gd`) that shell out to the `aseprite` CLI executable to export a sprite sheet + JSON tag/frame data from a `.aseprite`/`.ase` file, then build Godot `SpriteFrames`/`AnimationLibrary` resources from the tags. This is the recommended way to bring animated characters, props, and room art into a room/character/item's generated scene without manually slicing sprite sheets.

## Audio (`A`)

`A` (`PopochiuIAudio`) itself exposes two helpers:

```gdscript
func semitone_to_pitch(pitch: float) -> float
func is_playing_cue(cue_name: String) -> bool
```

Actual playback lives on the audio cue resources, reachable as generated `A.<cue_name>` properties (one per cue registered in the dock, mirroring the `R`/`C`/`I`/`D` autocomplete pattern):

- `PopochiuAudioCue` base: `fade(duration := 1.0, wait_to_end := false, from := -80.0, to := INF, position_2d := Vector2.ZERO)`, `stop(fade_duration := 0.0)`, `change_stream_pitch(pitch)`, `change_stream_volume(volume)`, `is_playing() -> bool`. Exported fields: `audio: AudioStream`, `loop`, `is_2d`, `can_play_simultaneous`, `pitch`, `volume`, `rnd_pitch`, `rnd_volume`, `max_distance`, `bus`.
- `AudioCueSound`: `play(wait_to_end := false, position_2d := Vector2.ZERO) -> void`.
- `AudioCueMusic`: `play(fade_duration := 0.0, music_position := 0.0) -> void`.

Every cue's `play`/`fade`/`stop` has a `queue_*` `Callable`-returning twin for use inside `E.queue([...])`. Rule of thumb: don't `await` music (`A.mx_theme.play()` — let it run in the background), but do `await` when a cutscene beat depends on a sound finishing (`await A.sfx_boing.play(true)`).

## Room transitions (`T`)

`T` (`PopochiuITransitionLayer`) is a **new singleton as of 2.1** and supersedes the deprecated `E.play_transition()`:

```gdscript
func play_transition(anim_name := "", duration := -1.0, mode := -1, color := Color(-1, -1, -1, -1)) -> void   # queue_play_transition() twin
func show_curtain(color := Color(-1, -1, -1, -1)) -> void
func hide_curtain() -> void
func get_all_transitions_list() -> PackedStringArray
func get_predefined_transitions_list() -> PackedStringArray
func get_custom_transitions_list() -> PackedStringArray
```

`T.PLAY_MODE` re-exports `PopochiuTransitionLayer.PLAY_MODE`, including at least `IN_OUT` and `PLAY_AND_REVERSE`. `R.goto_room()` automatically plays the project's default transition unless called with `use_transition := false` — you only need `T.play_transition()` directly for cutscene-driven or non-room-change transitions (e.g. a curtain around a dialog-heavy scripted sequence).

## Save/load

Fully covered by `E`:

```gdscript
func has_save() -> bool
func saves_count() -> int
func get_saves_descriptions() -> Dictionary          # {slot_number: description}
func save_game(slot := 1, description := "") -> void    # emits game_saved
func load_game(slot := 1) -> void                        # emits game_load_started, then game_loaded(data)
```

Up to 4 slots by default, written as flat JSON to `user://save_N.json`.

**Persistence model:**
- **Auto-persisted built-ins** per room object: `position`, `visible`, `modulate`/`self_modulate`, `clickable`, `walk_to_point`/`look_at_point`, `baseline`, `interaction_polygon`(+`_position`), click counters. Characters additionally persist facing, `light_mask`, `dialog_pos`, face/follow settings. Rooms track `visited`/`visited_first_time`/`visited_times`.
- **Custom state**: add fields to the generated `*_state.gd` (extends `PopochiuRoomData` / `PopochiuCharacterData` / `PopochiuInventoryItemData`) — auto-saved only if JSON-safe (`bool`/`int`/`float`/`String`, or `Array`/`Dictionary` of those).
- **Complex types**: override `_on_save() -> Dictionary` / `_on_load(data: Dictionary) -> void` on the data resource (stubbed in every generated `*_state.gd`, and in dialog scripts too) to flatten/rebuild `Vector2`, `Color`, custom inner classes, etc.
- **`Globals` persistence**: safe-typed properties on `Globals` auto-persist; complex data needs **public** (no-underscore) `on_save()`/`on_load()` methods added manually to `res://game/popochiu_globals.gd` — these are not stubbed by default, unlike the underscore-prefixed virtuals on data resources.
- Two independent mechanisms coexist: cross-room persistence (in-memory, via data resources staying loaded while the game runs) vs. save/load-to-disk (JSON at `user://save_N.json`, up to 4 slots). Don't conflate them — a bug in `_on_save`/`_on_load` only breaks disk saves, not cross-room state during a single play session.
