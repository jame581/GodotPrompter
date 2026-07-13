# Popochiu — Godot 4.x Research Digest (for the `popochiu` skill)

> Gathered 2026-07-13 from a git worktree of the local clone at
> `C:/Users/jame_/source/repos/Godot/popochiu` (branch `develop` — untouched), checked out at tag **v2.1.1**
> (commit `784d147`, "Release 2.1.1"). Worktree created at `C:/Users/jame_/AppData/Local/Temp/pw-popochiu-v211`
> (short path — the plugin's deeply nested GUI-template asset tree exceeds Windows `MAX_PATH` under the
> session scratchpad path) and removed after research completed.
> Primary sources: `addons/popochiu/**/*.gd` (engine, interfaces, script templates — verbatim),
> `addons/popochiu/plugin.cfg` + `project.godot` (metadata, autoloads),
> `docs/src/**/*.md` inside the same worktree (tutorial docs, pinned to v2.1.1 — **not** the live docs site).
> Every API signature below cites its source file path relative to the worktree root.

## 1. Release metadata

| Field | Value |
|---|---|
| **Version** | 2.1.1 (`addons/popochiu/plugin.cfg`: `version="2.1.1"`) |
| **Godot** | 4.6 (`project.godot`: `config/features=PackedStringArray("4.6")`) |
| **License** | MIT — "Copyright (c) 2022 Mateo Robayo Rogríguez" (`LICENSE`) |
| **Repo** | https://github.com/carenalgas/popochiu |
| **Language** | GDScript only (no C# in the addon; game code is GDScript) |
| **Plugin name** | "Popochiu" (`addons/popochiu/plugin.cfg`); dock title "Popochiu 2.0" (`addons/popochiu/popochiu_plugin.gd:25`) |
| **Docs site** | https://carenalgas.github.io/popochiu/ (`addons/popochiu/popochiu_resources.gd:44`) — may track `develop`, newer than v2.1.1; see §10 for confirmed drift |
| **Companion plugin** | `res://addons/popochiu/editor/importers/plugin.cfg` — "PopochiuImporters" (Aseprite importer docks), enabled separately in `project.godot` |

## 2. Install & setup wizard

**Install** (`docs/src/getting-started/installing-popochiu.md`):
1. Get Godot 4.x, create/open a project.
2. Get Popochiu from itch.io or GitHub Releases; unzip and copy the `addons/` folder into the project.
3. `Project > Project Settings > Plugins` tab → enable **Popochiu**.
4. Godot prompts a restart → `Project > Reload Current Project`.
5. Successful install prints a banner in the Output panel (bilingual ES/EN message + ASCII art), sourced from `addons/popochiu/popochiu_plugin.gd:7-9,50-53`.

Two editor plugins are registered in `project.godot` (`[editor_plugins] enabled=`):
`addons/popochiu/editor/gizmos/plugin.cfg`, `addons/popochiu/editor/importers/plugin.cfg`, `addons/popochiu/plugin.cfg`.

**First run — `PopochiuResources.init_file_structure()`** (`addons/popochiu/popochiu_resources.gd:216-270`):
- Creates `res://game/`, `res://game/autoloads/`, `res://game/rooms/`, `res://game/characters/`,
  `res://game/inventory_items/`, `res://game/dialogs/`, `res://game/transition_layer/`,
  `res://game/transition_layer/textures/` (`_get_directories()`, line 567).
- Copies the transition layer scene/script into `res://game/transition_layer/`.
- Creates `res://game/popochiu_data.cfg` (empty `ConfigFile`) and `res://game/popochiu_globals.gd`
  (`extends Node`).
- Calls `create_auto_loads()` to stub out `res://game/autoloads/{r,c,i,d,a}.gd` (see §3).

**Setup wizard popup** (`addons/popochiu/editor/popups/setup/setup.gd`) — a 3-tab `TabContainer`
(`wizard_steps`) shown on first project run (per `docs/src/how-to-develop-a-game/game-setup.md`):
1. **Game Type**: `Custom` / `2D` / `Pixel` — preconfigures Godot's stretch mode (`canvas_items`) and
   stretch aspect (`keep`); `Pixel` also forces `Nearest` texture filtering.
2. **Resolution**: native game resolution (viewport size) + playing-window resolution
   (`display/window/size/window_width_override`/`window_height_override`).
3. **GUI Template**: pick one of the three shipped templates (9 Verbs / Sierra / SimpleClick) or Custom —
   applied via `PopochiuGUITemplatesHelper.copy_gui_template()` (see §8).

Re-open the wizard any time via the "Setup" button in the main dock. Setup state is tracked by
`PopochiuResources.is_setup_done()` reading `popochiu_data.cfg` section `setup`, key `done`
(`addons/popochiu/popochiu_resources.gd:547-548`).

**Dock-generated `game/` layout** (confirmed against `docs/src/how-to-develop-a-game/create-the-first-room.md`
and the `PopochiuResources` path constants, lines 199-211):
```
res://game/
  popochiu_globals.gd          # Globals autoload — empty `extends Node` stub, add your own vars/on_save/on_load
  popochiu_data.cfg            # ConfigFile registry of every room/character/item/dialog + GUI template + setup flags
  autoloads/{r,c,i,d,a}.gd     # generated PR%/PC%/PII%/PD% preload + typed getter stubs (see §3)
  rooms/<room_name>/room_<room_name>.gd (+ .tscn, state script)
  characters/<char_name>/character_<char_name>.gd (+ .tscn, state script)
  inventory_items/<item_name>/inventory_item_<item_name>.gd (+ .tscn, state script)
  dialogs/<dialog_name>/dialog_<dialog_name>.gd (+ .tres resource)
  gui/gui.tscn, gui/gui_commands.gd   # copied from the selected GUI template, freely editable
  transition_layer/transition_layer.tscn (+ .gd)
```
Example room asset path from the tutorial: `game/rooms/house/props/background/house_bg.png`.

## 3. Autoload singletons

Registered in `addons/popochiu/popochiu_plugin.gd:33-42` (`_init()`, `EditorPlugin.add_autoload_singleton`)
and mirrored in `project.godot` `[autoload]`:

| Name | Script/scene | Interface class | Purpose |
|---|---|---|---|
| `Globals` | `res://game/popochiu_globals.gd` | — (plain `Node`) | Dev-defined global game state; safe types auto-save/load |
| `Cursor` | `res://addons/popochiu/engine/cursor/cursor.gd` (`cursor.tscn`) | `PopochiuCursor` (`CanvasLayer`) | Mouse cursor rendering, cursor type texture swap |
| `E` | `res://addons/popochiu/engine/popochiu.tscn` | `Popochiu` (`class_name Popochiu`, `Node`) | Core engine: queue/cutscene scripting, save/load, room-change trigger, commands, camera access |
| `R` | `res://game/autoloads/r.gd` (generated) | `PopochiuIRoom` (`addons/popochiu/engine/interfaces/i_room.gd`) | Room registry/navigation: `R.House.get_prop(...)`, room state, `goto_room()` |
| `C` | `res://game/autoloads/c.gd` (generated) | `PopochiuICharacter` (`i_character.gd`) | Character registry: `C.player`, `C.Popsy`, camera ownership |
| `I` | `res://game/autoloads/i.gd` (generated) | `PopochiuIInventory` (`i_inventory.gd`) | Inventory registry: `I.Key.add()`, active item |
| `D` | `res://game/autoloads/d.gd` (generated) | `PopochiuIDialog` (`i_dialog.gd`) | Dialog registry: `D.ChatWithPopsy.start()`, inline dialogs |
| `A` | `res://game/autoloads/a.gd` (generated) | `PopochiuIAudio` (`i_audio.gd`) | Audio cue registry: `A.sfx_boing.play()` |
| `G` | `res://addons/popochiu/engine/interfaces/i_graphic_interface.gd` | `PopochiuIGraphicInterface` | GUI control: block/unblock, show/hide, hover/system text |
| `T` | `res://addons/popochiu/engine/interfaces/i_transition_layer.gd` | `PopochiuITransitionLayer` | Screen transitions/curtain (new in 2.1 — supersedes deprecated `E.play_transition`) |

All singletons `Engine.register_singleton()` themselves in their own `_init()` (e.g. `i_room.gd:39-41`
`Engine.register_singleton(&"R", self)`), and are also reachable via `PopochiuUtils.{e,r,c,i,d,a,g,t,cursor,globals}`
lazy-getters (`addons/popochiu/engine/others/popochiu_utils.gd:7-27,146-233`) — engine-internal code uses
`PopochiuUtils.x`; game scripts use the short globals (`E`, `R`, `C`, …) directly.

`R`/`C`/`I`/`D` autoload files are **generated and rewritten** by
`PopochiuResources.update_autoloads()` (`popochiu_resources.gd:286-334`) each time an object is created in
the dock: it inserts a `const PR<Name> := preload(...)`, a `var <name>: PR<Name> : get = get_<name>`, and a
`func get_<name>() -> PR<Name>: return get_runtime_<type>("<name>")` block per object, giving autocomplete
for `R.House`, `C.Popsy`, `I.Key`, `D.PopsyHouseChat` in scripts.

## 4. `E` (`Popochiu`) engine API

Source: `addons/popochiu/engine/popochiu.gd`. `E.camera` is `@onready var camera: PopochiuMainCamera`
(line 117, `%PopochiuMainCamera` — a child of the `Popochiu` scene).

**Queue / cutscene scripting** (lines 206-390):
```gdscript
func queue_wait(time := 1.0) -> Callable                              # line 206
func wait(time := 1.0) -> void                                        # line 211
func queue(instructions: Array, show_gui := true) -> void              # line 226
func cutscene(instructions: Array) -> void                             # line 265 — skippable via "popochiu-skip" input action (default ESC)
func queueable(node: Object, method: String, params := [], signal_name := "") -> Callable  # line 362
```
`queue()` accepts `Callable`s (typically `queue_*` variants) and `String`s. String shorthand syntax
(confirmed in `docs/src/the-engine-handbook/await-and-queue-functions.md`):
`"CharName: text"` (says line), `"CharName(emotion): text"` (with emotion),
`"CharName[N]: text"` (auto-continue after N seconds), `"."` `".."` `"..."` (pauses of 0.25s/0.5s/1s,
doubling per extra dot), any other plain string → shown via `G.show_system_text()`.
`E.cutscene_skipped` (bool, `popochiu.gd:70`) flags a skip; `E.await_stopped` (line 45) is a signal that is
**never emitted** — awaiting it permanently suspends an instruction chain (used internally to let new
player clicks interrupt walking).

**Room-change trigger**: `E` itself has **no** `goto_room()` — that lives on `R` (`PopochiuIRoom.goto_room`,
see §6). `E.load_game()` calls `PopochiuUtils.r.goto_room(...)` internally (`popochiu.gd:425`).
`E` does retain two **deprecated** transition wrappers (line 366-387, `@deprecated Available in 2.1 - Will
be removed in 2.2`): `queue_play_transition()` / `play_transition()` — both now print a warning and forward
to `T.play_transition()`.

**Save/load surface** (lines 390-429; full behavioral spec in
`docs/src/the-engine-handbook/working-with-game-state.md`):
```gdscript
func has_save() -> bool
func saves_count() -> int
func get_saves_descriptions() -> Dictionary        # {slot_number: description}
func save_game(slot := 1, description := "") -> void    # emits `game_saved`
func load_game(slot := 1) -> void                        # emits `game_load_started`, then `game_loaded(data)`
```
Up to 4 slots by default, written as flat JSON to `user://save_N.json`. Custom persisted data must be
JSON-safe (`bool`/`int`/`float`/`String`, or `Array`/`Dictionary` of those) or handled via `_on_save()` /
`_on_load()` overrides on the object's data resource (see §9).

**Command framework hooks**: `register_command(id, command_name, fallback: Callable)`,
`register_command_without_id(command_name, fallback) -> int`, `command_fallback()`,
`get_command_name(id) -> String`, `get_current_command_name() -> String`, `current_command: int` (settable,
emits `command_selected`) — full mechanics in §8.

**Camera access**: `E.camera` (`PopochiuMainCamera`, `addons/popochiu/engine/objects/popochiu_main_camera.gd`):
```gdscript
func shake(strength := 1.0, duration := 1.0) -> void            # line 66; queue_shake() at line 61
func shake_bg(strength := 1.0, duration := 1.0) -> void          # line 84 — non-blocking; queue_shake_bg() at line 78
func stop_shake() -> void                                        # line 113
func change_offset(offset := Vector2.ZERO) -> void                # line 53; queue_change_offset() at 48
func change_zoom(target := Vector2.ONE, duration := 1.0) -> void  # line 104; queue_change_zoom() at 97
func restore_default_limits() -> void                             # line 121
```
`E.stop_camera_shake()` is `@deprecated` (line 431-433) — "Now this is done by
`PopochiuMainCamera.stop_shake`", i.e. call `E.camera.stop_shake()` directly.

**Misc engine members**: `E.playing_queue: bool`, `E.gui: PopochiuGraphicInterface`, `E.history: Array`
(game event log via `add_history(data: Dictionary)`), `E.settings: PopochiuSettings`,
`E.hovered` / `E.clicked: PopochiuClickable`, `E.width`/`E.height`/`E.half_width`/`E.half_height` (readonly,
viewport-derived), `E.get_text(msg: String) -> String` (translation passthrough respecting
`settings.use_translations`).

## 5. Rooms & clickables

**Node/resource types** (`addons/popochiu/engine/objects/**`):

| Type | Base class | Extends | Purpose |
|---|---|---|---|
| Room | `PopochiuRoom` (`room/popochiu_room.gd`) | `Node2D` | A location/screen; scene has `$Props`, `$Characters`, `$Hotspots`, `$Regions`, `$WalkableAreas`, `$Markers` child nodes (confirmed in `room/popochiu_room.tscn`) |
| Prop | `PopochiuProp` (`prop/popochiu_prop.gd`) | `PopochiuClickable` → `Area2D` | Visual/interactive scenery element; can carry sprite frames, `link_to_item`, be a navigation `obstacle` |
| Hotspot | `PopochiuHotspot` (`hotspot/popochiu_hotspot.gd`) | `PopochiuClickable` → `Area2D` | Invisible interaction zone (sky, distant object) — has no sprite of its own |
| Region | `PopochiuRegion` (`region/popochiu_region.gd`) | `Area2D` | Trigger area for character tint/scale-by-depth on enter/exit; not a `PopochiuClickable` |
| Walkable Area | `PopochiuWalkableArea` (`walkable_area/popochiu_walkable_area.gd`) | `Node2D` | Defines navigable floor via a `NavigationRegion2D` child named `Perimeter`; a room can hold several, only one is "active" at a time |
| Marker | plain Godot `Marker2D` | `Node2D` | Named waypoint, fetched via `R.get_marker(name)` / `R.get_marker_position(name)` — no Popochiu subclass |
| Character | `PopochiuCharacter` (`character/popochiu_character.gd`) | `PopochiuClickable` → `Area2D` | See §6 |
| Inventory Item | `PopochiuInventoryItem` (`inventory_item/popochiu_inventory_item.gd`) | `Node` (not `PopochiuClickable` — has its own click handling) | See §7 |
| Dialog | `PopochiuDialog` (`dialog/popochiu_dialog.gd`) | `Resource` | Branching dialog tree — see §7 |
| Dialog Option | `PopochiuDialogOption` (`dialog/popochiu_dialog_option.gd`) | `Resource` | A single selectable line |

**When to use which**: Props are for anything visible (background, furniture, collectibles) — the engine
only cares about their `visible` and `clickable` flags (per
`docs/src/how-to-develop-a-game/create-the-first-room.md`). Hotspots are for interaction zones with no
dedicated sprite (part of the background art, e.g. a window). Regions modify a character passing through
them (tint/scale) and do **not** receive clicks. Walkable Areas gate where characters can path — a room
needs at least one enabled Walkable Area or characters won't move on click
(`room/popochiu_room.gd:_ensure_active_walkable_area`). Markers are named points for
`teleport_to_marker()` / `get_marker_position()`.

**`PopochiuClickable` base lifecycle callbacks** (`addons/popochiu/engine/objects/clickable/popochiu_clickable.gd`,
`#region Virtual`, lines 133-186 — shared by Prop, Hotspot, Character):
```gdscript
func _on_room_set() -> void            # line 135 — room assigned
func _on_click() -> void               # line 141
func _on_double_click() -> void        # line 147
func _on_right_click() -> void         # line 153
func _on_middle_click() -> void        # line 159
func _on_item_used(item: PopochiuInventoryItem) -> void   # line 166
func _on_position_changed() -> void    # line 174
func _on_movement_started() -> void    # line 179
func _on_movement_ended() -> void      # line 184
```
These are the **real, confirmed** names — every generated script template
(`addons/popochiu/engine/templates/{prop,hotspot,character}_template.gd`) overrides exactly this set. The
engine calls the public non-underscore wrappers `on_click()`, `on_double_click()`, `on_right_click()`,
`on_middle_click()`, `on_item_used()`, which in turn call the underscore virtuals — do not override the
public wrappers.

**GUI-command dispatch** (see §8 for full mechanics) additionally calls `on_<command>()` /
`on_right_<command>()` methods (e.g. `on_look_at()`) when present, *before* falling back to `_on_click()`
/ `_on_right_click()`.

**`PopochiuClickable` shared API** (selected, `popochiu_clickable.gd`):
```gdscript
func move_to(pos: Vector2, speed := 100.0, transition_type := Tween.TRANS_LINEAR, ease_type := Tween.EASE_IN_OUT) -> void   # line 347 — tween-based; ignores walkable areas
func teleport_to_position(pos: Vector2, offset := Vector2.ZERO) -> void    # line 404
func teleport_to_prop(id: String, offset := Vector2.ZERO) -> void          # line 434
func teleport_to_hotspot(id: String, offset := Vector2.ZERO) -> void       # line 448
func teleport_to_marker(id: String, offset := Vector2.ZERO) -> void        # line 462
func enable() / disable() -> void                                          # lines 199-218 — toggles visible+clickable
func ever_invoked(command: int) -> bool / first_invoked(command: int) -> bool / count_invoked(command: int) -> int  # lines 469-482
```
Every public method has a `queue_*` Callable-returning twin for use inside `E.queue([...])` (the
`queue_<name>()` pattern is universal across the codebase — see §Gotchas for the naming rule).

**`PopochiuRoom` virtual lifecycle** (`room/popochiu_room.gd`, lines 126-147, confirmed against
`engine/templates/room_template.gd`):
```gdscript
func _on_room_entered() -> void              # room in tree, not yet visible — set initial state here
func _on_room_transition_finished() -> void   # room now visible — start cutscenes here
func _on_room_exited() -> void                # room about to unload, no children in $Characters
```
Key `PopochiuRoom` public methods: `get_prop/get_hotspot/get_region/get_walkable_area/get_marker(name)`,
`get_props/get_hotspots/get_regions/get_walkable_areas/get_markers/get_characters() -> Array`,
`add_character(chr)` / `remove_character(chr)`, `set_active_walkable_area(name)`,
`has_player: bool` (export), `hide_gui: bool` (export, hides GUI on room load — for cutscenes/menus).

**`PopochiuRegion` virtual lifecycle** (`region/popochiu_region.gd:90+`, confirmed against
`engine/templates/region_template.gd`):
```gdscript
func _on_character_entered(chr: PopochiuCharacter) -> void   # default: applies `tint` to character; call super(chr) to keep it
func _on_character_exited(chr: PopochiuCharacter) -> void
```

## 6. Characters

Source: `addons/popochiu/engine/objects/character/popochiu_character.gd` (1978 lines — read selectively),
cross-checked against `engine/templates/character_template.gd` and
`docs/src/how-to-develop-a-game/create-characters.md`.

**Creation via dock**: the main Popochiu dock has a "Create character" button; the popup names the
character and generates `res://game/characters/<name>/character_<name>.gd` (+ `.tscn`, + a
`character_<name>_state.gd` extending `PopochiuCharacterData`), and registers it in `popochiu_data.cfg`
under section `characters`. `PopochiuCharactersHelper.define_player()` (called from `E._ready()`,
`popochiu.gd:161`) assigns the Player-controlled Character (PC).

**Movement / walking API** (line numbers from `popochiu_character.gd`):
```gdscript
func walk(target_pos: Vector2) -> void                 # line 464 — plays walk anim, flips sprite; queue_walk() at 458
func walk_to(pos: Vector2) -> void                      # line 751 — alias used by game scripts; queue_walk_to() at 746
func idle() -> void                                     # line 438; queue_idle() at 432
func stop_walking() -> void                              # line 514 — emits `stopped_walk`; queue_stop_walking() at 509
func face_up/face_down/face_left/face_right/face_up_left/face_up_right/face_down_left/face_down_right() -> void   # lines 530-621, each with a queue_face_*() twin
func face_clicked() -> void                              # line 636 — faces E.clicked; queue_face_clicked() at 630
func face_away() -> void                                 # line 657 — turns 180°; queue_face_away() at 651
func grab() -> void                                      # line 730 — plays grab anim, awaits `grab_done`; queue_grab() at 725
```
`ICharacter` (`C`) convenience wrappers delegate to `C.player`: `C.walk_to_clicked(offset)`,
`C.walk_to_clicked_blocking(offset)`, `C.face_clicked()`, `C.change_camera_owner(c)`
(`addons/popochiu/engine/interfaces/i_character.gd:59-116`).

**Saying lines**:
```gdscript
func say(dialog: String, emo := "") -> void    # line 681 — plays talk anim, optional emotion voice cue, emits PopochiuICharacter.character_spoke, waits for G.dialog_line_finished; queue_say() at 674
func stop_talking() -> void                     # line 716 — interrupts current line
```

**Emotions**: `emotion: String` property (line 164, default `""`); `say(dialog, emo)` sets it for the
duration of the line, then resets to `""` after (lines 688-707). Two `@export` arrays map emotion names
to assets: `voice_cues` (`{emotion: String, variations: Array[PopochiuAudioCue]}`) and `avatars`
(`{emotion: String, avatar: Texture}`) — used to pick a voice-over cue / GUI avatar per emotion (lines
72-76, 105-107 doc comments).

**Follow/face-another-character**: `follow_character_outside_room: bool`, `follow_character_offset: Vector2`,
`follow_character_threshold: Vector2`, `face_character: String` (script_name of another character to
continuously face) — all `@export` (lines 76-104). Cross-room following is handled by
`PopochiuIRoom._collect_cross_room_followers()`/`_add_cross_room_followers()` (`i_room.gd:422-548`).

**Character virtual lifecycle** (confirmed against `engine/templates/character_template.gd`, mirrors
`PopochiuClickable`'s set plus animation hooks):
```gdscript
func _on_room_set() -> void
func _on_click() / _on_double_click() / _on_right_click() / _on_middle_click() -> void
func _on_item_used(item: PopochiuInventoryItem) -> void
func _play_idle() / _play_walk(target_pos: Vector2) / _play_talk() / _play_grab() -> void   # override + call super() to extend default anim playback
func _on_movement_started() / _on_movement_ended() -> void
```

**State script** (`character_<name>_state.gd`, template at `engine/templates/character_state_template.gd`):
extends `PopochiuCharacterData`; override `_on_save() -> Dictionary` / `_on_load(data: Dictionary) -> void`
for custom persisted fields (see §9).

## 7. Dialogs

Source: `addons/popochiu/engine/objects/dialog/popochiu_dialog.gd` (`PopochiuDialog extends Resource`) and
`popochiu_dialog_option.gd` (`PopochiuDialogOption extends Resource`), plus
`addons/popochiu/engine/interfaces/i_dialog.gd` (`D` singleton) and the tutorial
`docs/src/how-to-develop-a-game/script-your-first-dialogue.md`.

**Resource structure**: a dialog tree is a `.tres` `PopochiuDialog` resource with an `options:
Array[PopochiuDialogOption]` export. Each `PopochiuDialogOption` has (`popochiu_dialog_option.gd:10-20`):
`id: String`, `text: String`, `visible: bool` (default `true`), `disabled: bool` (default `false`),
`always_on: bool` (default `false`, can't be disabled), plus runtime `used: bool` / `used_times: int`.
Options are authored either in the Inspector (Add Element on the `options` array) or from code via
`create_option(id: String, config: Dictionary = {}) -> PopochiuDialogOption` inside the virtual
`_on_build_options(existing_options)` (lines 35-36, 95-103).

**Dialog virtual lifecycle** (`popochiu_dialog.gd:19-77`, confirmed against
`engine/templates/dialog_template.gd`):
```gdscript
func _on_build_options(existing_options: Array[PopochiuDialogOption]) -> Array[PopochiuDialogOption]  # optional; mix Inspector + code options
func _on_start() -> void            # must await something — engine awaits this before showing options
func _option_selected(opt: PopochiuDialogOption) -> void   # called on selection; OR define per-option `_on_option_<snake_case_id>(opt)` methods instead
func _on_save() -> Dictionary / _on_load(data: Dictionary) -> void
```
Instead of one big `_option_selected` `match`, Popochiu also auto-calls a method named
`_on_option_<snake_case(option.id)>` if it exists (`popochiu_dialog.gd:239-250`, e.g. option id `BYE2` →
`_on_option_bye_2`).

**Option branching / condition pattern** (verified example from the tutorial,
`script-your-first-dialogue.md`):
```gdscript
func _option_selected(opt: PopochiuDialogOption) -> void:
	match opt.id:
		"MessyRoom":
			await D.say_selected()
			await C.Popsy.say("Errr... sorry, I forgot to tidy up!")
			turn_off_options(["MessyRoom"])
			turn_on_options(["AskBored"])
		"Bye":
			await D.say_selected()
			stop()
		_:
			stop()   # fallback — always include one so an unhandled option doesn't soft-lock the dialog
	_show_options()
```
`PopochiuDialog` public API used in condition/branching logic: `turn_on_options(ids: Array)`,
`turn_off_options(ids: Array)`, `turn_off_forever_options(ids: Array)` (all take an **Array** of ids, not a
bare string — `popochiu_dialog.gd:137-156`), `get_option(opt_id: String) -> PopochiuDialogOption`,
`start()` / `stop()` (with `queue_start()`/`queue_stop()` twins).
`PopochiuDialogOption` instance methods: `turn_on()`, `turn_off()`, `turn_off_forever()`
(`popochiu_dialog_option.gd:41-55`).

**`D` (`PopochiuIDialog`) API** used from dialog/room scripts (`i_dialog.gd`):
```gdscript
func show_inline_dialog(options: Array) -> PopochiuDialogOption   # line 74 — ad hoc option list outside a named tree
func finish_dialog() -> void                                       # line 94
func say_selected() -> void                                        # line 99 — makes C.player say selected_option.text
func create_gibberish(input_string: String) -> String              # line 111 — bbcode-preserving text scrambler (spoiler masking, unknown-language effect)
func get_instance(script_name: String) -> PopochiuDialog            # line 139
```
`D.active: bool`, `D.current_dialog: PopochiuDialog`, `D.selected_option: PopochiuDialogOption`,
`D.trees: Dictionary` (per-dialog state cache), `D.prev_dialog: PopochiuDialog`.
Signals: `dialog_started(dlg)`, `option_selected(opt)`, `dialog_finished(dlg)`,
`dialog_options_requested(options)`, `inline_dialog_requested(options)`.

Starting a dialog from a character click (verified tutorial pattern):
```gdscript
func _on_click() -> void:
	await C.player.face_clicked()
	D.PopsyHouseChat.start()
```

## 8. Inventory

Source: `addons/popochiu/engine/objects/inventory_item/popochiu_inventory_item.gd`
(`PopochiuInventoryItem extends Node` — **not** a `PopochiuClickable**) and
`addons/popochiu/engine/interfaces/i_inventory.gd` (`I` singleton).

**Item creation**: dock "Create inventory item" button → generates
`res://game/inventory_items/<name>/inventory_item_<name>.gd` (+ `.tscn`, +
`inventory_item_<name>_state.gd` extending `PopochiuInventoryItemData`), registered in `popochiu_data.cfg`
under `inventory_items`.

**`I` (`PopochiuIInventory`) API** (`i_inventory.gd`):
```gdscript
func clean_inventory(in_bg := false) -> void          # line 87
func show_inventory(time := 1.0) -> void               # line 100; queue_show_inventory() at 113
func hide_inventory(use_anim := true) -> void           # line 118; queue_hide_inventory() at 127
func get_item_instance(item_name: String) -> PopochiuInventoryItem   # line 136
func set_active_item(item: PopochiuInventoryItem = null) -> void      # line 167
func is_item_in_inventory(item_name: String) -> bool     # line 176
func has_item_been_collected(item_name: String) -> bool   # line 182
func is_full() -> bool                                     # line 189 — checks PopochiuSettings.inventory_limit
func deselect_active() -> void                              # line 197
```
`I.active: PopochiuInventoryItem` (currently selected/cursor item), `I.clicked`, `I.items: Array`,
`I.items_states: Dictionary`. Signals: `item_added`, `item_add_done`, `item_removed`, `item_remove_done`,
`item_replaced`, `item_replace_done`, `item_discarded`, `item_selected`, `inventory_show_requested`,
`inventory_shown`, `inventory_hide_requested`.

**Add / remove / combine (`PopochiuInventoryItem` instance API)**:
```gdscript
func add(animate := true) -> void                # line 116; queue_add() at 102
func add_as_active(animate := true) -> void        # line 151; queue_add_as_active() at 145 — adds AND makes it the active cursor item
func remove(animate := false) -> void               # line 185; queue_remove() at 171
func replace(new_item: PopochiuInventoryItem) -> void   # line 226; queue_replace() at 212 — item-combining primitive
func discard(animate := false) -> void                # line 255; queue_discard() at 248 — removes without destroying the instance
```
**Combining items** pattern (from the doc comment on `queue_replace`, `popochiu_inventory_item.gd:198-211`
— this is the script of `InventoryItemHook.gd`, i.e. `I.Hook`):
```gdscript
func on_item_used(item: PopochiuInventoryItem) -> void:
	if item == I.Rope:
		E.queue([
			I.Rope.queue_remove(),
			queue_replace(I.RopeWithHook)
		])
```
**Using an item on a scene object** — every `PopochiuClickable` (Prop, Hotspot, Character) implements
`_on_item_used(item: PopochiuInventoryItem)`, called when the player clicks the object while `I.active` is
set (verified tutorial example, `docs/src/how-to-develop-a-game/use-inventory-items.md`):
```gdscript
func _on_item_used(item: PopochiuInventoryItem) -> void:
	if item == I.ToyCar:
		await C.player.walk_to_clicked()
		await C.player.say("Honey, here is your toy car!")
		I.ToyCar.remove()
```
Item virtual lifecycle (`engine/templates/inventory_item_template.gd`): `_on_click()`, `_on_right_click()`,
`_on_middle_click()`, `_on_item_used(item)` (item-on-item combining), `_on_added_to_inventory()`,
`_on_discard()` (both call `super()` to preserve default GUI feedback).

**Prop `link_to_item`**: a Prop can export `link_to_item := ""` naming an inventory item's `script_name`;
the prop auto-hides once that item is collected (`engine/objects/prop/popochiu_prop.gd:34-37,110-117`), and
exposes `_on_linked_item_removed()` / `_on_linked_item_discarded()` virtuals for when the link breaks.

## 9. GUI, command framework, audio, transitions, save/load, Aseprite

### GUI templates

Shipped templates, each with a `_high_res` companion variant, at
`addons/popochiu/engine/objects/gui/templates/`: **`9_verb`** (`NineVerbCommands`, 10 verbs — SCUMM-style,
Monkey Island 2/Thimbleweed Park), **`sierra`** (`SierraCommands`, 4 verbs — SCI-style, King's Quest VI),
**`simple_click`** (`SimpleClickCommands`, no verb buttons — left/right click only, Beneath a Steel
Sky/Broken Sword style) (table confirmed in
`docs/src/the-engine-handbook/gui-commands-and-fallbacks.md` and folder names in
`engine/objects/gui/templates/`). A **Custom** option (`PopochiuResources.GUI_CUSTOM = "custom"`) copies a
minimal starter instead of a preset.

**Selection mechanism**: the Setup wizard's GUI tab (or the "Setup" dock button later) calls
`PopochiuGUITemplatesHelper.copy_gui_template(template_name, on_progress, on_complete)`
(`addons/popochiu/editor/helpers/popochiu_gui_templates_helper.gd:11-88`), which:
1. Copies `GUI_TEMPLATES_FOLDER/<id>/<id>_gui.tscn` → `res://game/gui/gui.tscn`.
2. Copies that template's component scenes into `res://game/gui/**` so devs can edit them freely.
3. Copies `GUI_SCRIPT_TEMPLATES_FOLDER/<id>_commands_template.gd` → `res://game/gui/gui_commands.gd`.
4. Records the chosen template name in `popochiu_data.cfg` (`ui`, `template`).
Switching templates later **replaces** the whole `res://game/gui/` tree (component copies included).

### Command framework

Verified end-to-end against `addons/popochiu/engine/objects/gui/popochiu_commands.gd`,
`.../gui/templates/9_verb/9_verb_commands.gd`, and
`docs/src/the-engine-handbook/gui-commands-and-fallbacks.md`:
1. Each GUI template's `*Commands` class (`extends PopochiuCommands`) registers its verbs in `_init()` via
   `E.register_command(id, "Display Name", fallback_callable)`, e.g.
   `E.register_command(Commands.LOOK_AT, "Look at", look_at)` where `Commands` is a **local enum defined on
   the template's commands class** (`9_verb_commands.gd:10-21`) — there is no global `Commands` enum.
2. On click, `PopochiuClickable.handle_command(button_idx)` (`clickable/popochiu_clickable.gd:298-323`)
   snake_cases the active command name and looks for `on_<command>()` (or `on_right_<command>()` /
   `on_middle_<command>()`) on the clicked object.
3. If that method doesn't exist, it falls back to the generic `_on_click()` / `_on_right_click()` /
   `_on_middle_click()`. If that virtual calls `E.command_fallback()`, the engine invokes the
   command's registered fallback Callable (e.g. `NineVerbCommands.look_at()`).
4. Game-level overrides live in the generated `res://game/gui/gui_commands.gd`, which `extends` the
   template's commands class (e.g. `extends NineVerbCommands`) and can override any fallback method,
   `fallback()` itself (the id `-1` global default, `PopochiuCommands._init()`,
   `popochiu_commands.gd:9`), or register new commands with
   `E.register_command_without_id(name, fallback) -> int`.

### Audio (`A`)

`A` (`PopochiuIAudio`, `addons/popochiu/engine/interfaces/i_audio.gd`) exposes
`semitone_to_pitch(pitch: float) -> float` and `is_playing_cue(cue_name: String) -> bool`; actual playback
lives on the audio cue resources themselves, exposed as generated `A.<cue_name>` properties (populated by
`PopochiuResources.update_autoloads()` from the `audio` section of `popochiu_data.cfg`):
- `PopochiuAudioCue` base (`engine/audio_manager/audio_cue.gd`): `fade(duration:=1.0, wait_to_end:=false,
  from:=-80.0, to:=INF, position_2d:=Vector2.ZERO)`, `stop(fade_duration:=0.0)`,
  `change_stream_pitch(pitch)`, `change_stream_volume(volume)`, `is_playing() -> bool`. Exported fields:
  `audio: AudioStream`, `loop`, `is_2d`, `can_play_simultaneous`, `pitch`, `volume`, `rnd_pitch`,
  `rnd_volume`, `max_distance`, `bus`.
- `AudioCueSound` (`audio_cue_sound.gd`): `play(wait_to_end:=false, position_2d:=Vector2.ZERO)`.
- `AudioCueMusic` (`audio_cue_music.gd`): `play(fade_duration:=0.0, music_position:=0.0)`.
Every cue's `play`/`fade`/`stop` has a `queue_*` Callable twin for `E.queue([...])`.
Rule of thumb (docs): don't `await` music (`A.mx_theme.play()`), do `await` when you need the sound to
finish (`await A.sfx_boing.play(true)`).

### Room transitions (`T`)

`T` (`PopochiuITransitionLayer`, `addons/popochiu/engine/interfaces/i_transition_layer.gd`) — **new
singleton as of 2.1**, supersedes the deprecated `E.play_transition()`:
```gdscript
func play_transition(anim_name := "", duration := -1.0, mode := -1, color := Color(-1,-1,-1,-1)) -> void   # line 50; queue_play_transition() at 79
func show_curtain(color := Color(-1,-1,-1,-1)) -> void    # line 89
func hide_curtain() -> void                                 # line 100
func get_all_transitions_list() / get_predefined_transitions_list() / get_custom_transitions_list() -> PackedStringArray
```
`T.PLAY_MODE` re-exports `PopochiuTransitionLayer.PLAY_MODE` (line 34) — includes at least
`IN_OUT` and `PLAY_AND_REVERSE` (both referenced in docs examples). Room changes
(`R.goto_room`, §5/§ interfaces) automatically play the project's default transition unless
`use_transition := false` is passed.

### Save/load

Fully covered by `E.save_game`/`E.load_game` (§4). Persistence model (verified against
`docs/src/the-engine-handbook/working-with-game-state.md`, cross-checked with `i_room.gd:room_readied` and
`PopochiuResources.store_properties`/`copy_popochiu_object_properties`):
- **Auto-persisted** built-ins per room object: `position`, `visible`, `modulate`/`self_modulate`,
  `clickable`, `walk_to_point`/`look_at_point`, `baseline`, `interaction_polygon`(+`_position`), click
  counters. Characters additionally persist facing, `light_mask`, `dialog_pos`, face/follow settings.
  Rooms track `visited`/`visited_first_time`/`visited_times`.
- **Custom state**: add fields to the generated `*_state.gd` (extends `PopochiuRoomData` /
  `PopochiuCharacterData` / `PopochiuInventoryItemData`) — auto-saved only if JSON-safe
  (`bool`/`int`/`float`/`String`, or `Array`/`Dictionary` of those).
- **Complex types**: override `_on_save() -> Dictionary` / `_on_load(data: Dictionary) -> void` on the data
  resource (stubbed in every generated `*_state.gd` and in `dialog_template.gd`) to flatten/rebuild
  `Vector2`, `Color`, custom inner classes, etc.
- **`Globals` persistence**: safe-typed properties on `Globals` auto-persist; complex data needs
  **public** (no-underscore) `on_save()`/`on_load()` methods added manually to
  `res://game/popochiu_globals.gd` (not stubbed by default — distinct from the underscore-prefixed
  virtuals on data resources).
- Two independent mechanisms: cross-room persistence (in-memory, via data resources staying loaded) vs.
  save/load-to-disk (JSON at `user://save_N.json`, up to 4 slots).

### Aseprite importer

`res://addons/popochiu/editor/importers/` ships as its own plugin ("PopochiuImporters",
`editor/importers/plugin.cfg`), enabled independently in `project.godot`. It provides dedicated import
docks per object type (`aseprite_importer_dock_{character,inventory,room}.gd`) that shell out to the
`aseprite` CLI executable (`aseprite/aseprite_controller.gd:_execute`) to export a sprite sheet + JSON
tag/frame data from a `.aseprite`/`.ase` file, then build Godot `SpriteFrames`/`AnimationLibrary` resources
from the tags via `animation_creator_{sprite2d,texture_rect}.gd`. Referenced (not detailed) in
`docs/src/how-to-develop-a-game/create-the-first-room.md`: "Popochiu also provides a powerful automated
importer that will make creating rooms and characters a breeze."

## 10. Gotchas

1. **`E` has no `goto_room()`** — it's `R.goto_room(script_name, use_transition:=true, store_state:=true,
   ignore_change:=false)` (`i_room.gd:156-219`). Don't assume the engine singleton owns room navigation;
   `R` does. `E.load_game()` calls `PopochiuUtils.r.goto_room(...)` internally.
2. **Deprecated transition API on `E`**: `E.queue_play_transition()` / `E.play_transition()`
   (`popochiu.gd:366-387`) are marked `@deprecated Available in 2.1 - Will be removed in 2.2` and print a
   runtime warning telling devs to use `T.play_transition()` instead. The skill should teach `T`, not `E`,
   for transitions, and flag the old methods as deprecated-not-forbidden (still present in 2.1.1).
   Likewise `E.stop_camera_shake()` is deprecated in favor of `E.camera.stop_shake()`.
3. **Docs-site vs v2.1.1 source drift — `gui-commands-and-fallbacks.md` example is stale/inaccurate**: the
   page's inline example uses `E.active_command` and a global `Commands.LOOK_AT` enum
   (`match E.active_command: Commands.LOOK_AT: ...`). Neither exists in the v2.1.1 engine source: the real
   property is `E.current_command: int` (with `E.get_current_command_name() -> String`), and `Commands` is
   a **local enum defined per GUI-template commands class** (e.g. `NineVerbCommands.Commands`,
   `9_verb_commands.gd:10-21`), not a global. The skill should use `on_<command>()` methods or
   `E.get_current_command_name()`/`E.current_command`, not the docs' `active_command` snippet, when
   authoring the equivalent example.
4. **`PopochiuInventoryItem` is not a `PopochiuClickable`** — it `extends Node`, not `Area2D` via
   `PopochiuClickable`, even though it shares the same virtual-method *names* (`_on_click`,
   `_on_right_click`, `_on_middle_click`, `_on_item_used`) by convention, plus its own
   `_on_added_to_inventory()` / `_on_discard()` (`inventory_item/popochiu_inventory_item.gd`). Don't
   document it as a `PopochiuClickable` subtype.
5. **`turn_on_options`/`turn_off_options`/`turn_off_forever_options` take an `Array`, always** — even for a
   single id, e.g. `turn_off_options(["MessyRoom"])`, not `turn_off_options("MessyRoom")`
   (`popochiu_dialog.gd:137-156`; explicitly called out as a common mistake in
   `script-your-first-dialogue.md`).
6. **`queue_*` methods do nothing if called outside `E.queue([...])`/`E.cutscene([...])`** — they only
   build and return a `Callable`; calling e.g. `C.player.queue_say("Hi")` standalone is a silent no-op.
   Confirmed as "one of the most common mistakes" in `docs/src/the-engine-handbook/await-and-queue-functions.md`.
   The companion mistake is forgetting `await` on the non-`queue_` immediate versions, which causes actions
   to run concurrently instead of sequentially.
7. **GUI template folders have `_high_res` siblings** (`9_verb_high_res`, `sierra_high_res`,
   `simple_click_high_res`) alongside the base three — six template folders exist on disk for three
   conceptual GUIs. `PopochiuGUITemplatesHelper.copy_gui_template` falls back to the non-high-res commands
   template if a high-res-specific one is missing (`.gd_helper.gd:39-40`,
   `commands_template_path.replace("_high_res", "")`).
8. **Windows path length**: the plugin's GUI template asset tree nests very deeply
   (`addons/popochiu/engine/objects/gui/templates/9_verb_high_res/components/9_verb_inventory_grid_high_res/…`).
   A `git worktree add` under a long temp path (as originally attempted in this research task, under the
   session scratchpad) hit `Filename too long` on Windows even with the repo itself checked out fine
   elsewhere; a short worktree path (e.g. `C:/Users/<user>/AppData/Local/Temp/pw-popochiu-v211`) was needed
   to complete the checkout without enabling `core.longpaths`. The skill/tutorials should not assume deep
   nested paths are always safe on Windows checkouts.
9. **`res://game/autoloads/{r,c,i,d}.gd` are dock-generated and rewritten on every new object** — devs
   should not hand-edit the generated `const`/`var`/`func get_*()` blocks between the `# ---- classes`,
   `# ---- nodes`, `# ---- functions` markers (`popochiu_resources.gd:126-136,286-334`); custom logic
   belongs in the individual object scripts (`room_<name>.gd`, `character_<name>.gd`, …), not the autoload
   stubs.
10. **The-engine-handbook is thin in v2.1.1**: only `await-and-queue-functions.md`,
    `gui-commands-and-fallbacks.md`, `index.md`, `scripting-overview.md`, `scripting-principles.md`,
    `working-with-game-state.md`, and `wrapping-up.md` exist under `docs/src/the-engine-handbook/` in this
    tag — there is no dedicated audio, transitions, or Aseprite-importer handbook page pinned at v2.1.1
    (a `scripting-reference/` folder exists but is empty except `.gitkeep`). Those three areas (§9 audio,
    transitions, Aseprite) were therefore documented here directly from source, not from tutorial prose;
    if the live docs site has since added such pages, treat this note's source-derived signatures as
    authoritative for v2.1.1 over anything newer on the site.

## Skill-authoring implications

- **Autoload-first structure**: teach `E`/`R`/`C`/`I`/`D`/`A`/`G`/`T`/`Cursor` as the primary API surface —
  game scripts almost never touch `PopochiuUtils` (engine-internal) or class names directly.
- **`queue_*` convention**: every mutating action-method ships an immediate `await`-style version and a
  `queue_`-prefixed Callable-returning twin; teach this pairing once, generically, rather than per-method.
- **Command dispatch vs. generic click virtuals**: cover both entry points (`on_<command>()` /
  `_on_click()` fallback chain) since GUI templates other than SimpleClick rely on the former.
- **Cross-refs to plan**: `dialogue-system` skill (Popochiu has its own dialog resource model, worth a
  contrast note), `state-machine`/`resource-pattern` (data-resource state pattern in §9), `save-load`
  skill (JSON-to-`user://` pattern is a good real-world example), `godot-project-setup` (dock-generated
  `game/` layout parallels a project scaffold).
- **Pattern X candidate**: the full command-registration/fallback-chain mechanics (§8) and the
  cross-room character-following implementation (§6/§5 `_collect_cross_room_followers`) are deep enough to
  push into a `references/` deep-dive rather than the core `SKILL.md`, to respect the ≤16 KB budget.
