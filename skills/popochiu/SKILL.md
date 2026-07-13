---
name: popochiu
description: Use when using the Popochiu addon — point-and-click adventure framework with rooms, characters, props/hotspots, inventory, dialog trees, and a command-based GUI
---

# Popochiu

> **Related skills:** **dialogue-system** for hand-rolled dialogue data, **inventory-system** for generic inventory patterns, **save-load** for core-engine persistence.

> **Addon:** Popochiu · version `v2.1.1` · Godot 4.6 · MIT · source: https://github.com/carenalgas/popochiu · pure GDScript (no C# API — GDScript-only skill).

---

## 1. When to use Popochiu

| Approach | Best for |
|---|---|
| Hand-rolled (`dialogue-system` + `inventory-system` + `state-machine`) | Custom genre, tight control over every system, no editor tooling needed |
| **Popochiu** | Full point-and-click adventure (AGS/PowerQuest-style): rooms, walk-to-click, verb-based interaction, dialog trees, inventory, save/load — wired together with dock-generated scaffolding |

Choose Popochiu when you're building a classic point-and-click adventure and want the room/character/prop/dialog/inventory pipeline pre-built, with a dock that scaffolds new objects and autoload registries that give autocomplete (`R.House`, `C.Popsy`, `I.Key`, `D.PopsyHouseChat`). Hand-roll with `dialogue-system` + `inventory-system` + `state-machine` when your genre isn't point-and-click, or you need full control over the interaction model. Popochiu requires **Godot 4.6** and is GDScript-only (no C# API).

---

## 2. Install & project setup

1. Get Popochiu from [itch.io](https://carenalgas.itch.io/popochiu) or [GitHub Releases](https://github.com/carenalgas/popochiu/releases); copy `addons/popochiu/` into your project.
2. **Project → Project Settings → Plugins** → enable **Popochiu**. Godot prompts a restart — **Project → Reload Current Project**.
3. On first run, `PopochiuResources.init_file_structure()` scaffolds `res://game/` (layout below) plus `popochiu_data.cfg` (a `ConfigFile` registry of every room/character/item/dialog) and `popochiu_globals.gd` (an empty `Globals` autoload — add your own state here).
4. The **setup wizard** pops up automatically (re-open via the dock's "Setup" button): pick a **Game Type** (Custom/2D/Pixel — configures stretch mode), a **Resolution**, and a **GUI Template** (`9 Verb`, `Sierra`, `SimpleClick`, or Custom).
5. A companion plugin, **PopochiuImporters**, adds Aseprite import docks — enabled separately in Project Settings.

Dock-generated layout:
```
res://game/
  popochiu_globals.gd        # Globals autoload — add vars/on_save/on_load
  popochiu_data.cfg          # registry of rooms/characters/items/dialogs/GUI/setup
  autoloads/{r,c,i,d,a}.gd   # generated — never hand-edit; rewritten per new object
  rooms/<name>/room_<name>.gd (+ .tscn, state script)
  characters/<name>/character_<name>.gd (+ .tscn, state script)
  inventory_items/<name>/inventory_item_<name>.gd (+ .tscn, state script)
  dialogs/<name>/dialog_<name>.gd (+ .tres)
  gui/gui.tscn, gui/gui_commands.gd
  transition_layer/transition_layer.tscn (+ .gd)
```

---

## 3. Core concepts & the one-letter autoloads

Game scripts talk to Popochiu almost entirely through short autoload singletons (not `PopochiuUtils` or class names, which are for engine-internal code):

| Autoload | Interface | Purpose | Key signature |
|---|---|---|---|
| `E` | `Popochiu` | Core engine: queue/cutscene scripting, save/load, camera, commands | `func queue(instructions: Array, show_gui := true) -> void` |
| `R` | `PopochiuIRoom` | Room registry & navigation | `func goto_room(script_name := "", use_transition := true, store_state := true, ignore_change := false) -> void` |
| `C` | `PopochiuICharacter` | Character registry (`C.player`, `C.Popsy`) | `func walk_to_clicked(offset := Vector2.ZERO) -> void` |
| `I` | `PopochiuIInventory` | Inventory registry & active item | `func set_active_item(item: PopochiuInventoryItem = null) -> void` |
| `D` | `PopochiuIDialog` | Dialog registry & inline dialogs | `func show_inline_dialog(options: Array) -> PopochiuDialogOption` |
| `G` | `PopochiuIGraphicInterface` | GUI control: block/unblock, show/hide, hover/system text | `func show_system_text(msg: String) -> void` |
| `A` | `PopochiuIAudio` | Audio cue registry (`A.sfx_boing`) | `func is_playing_cue(cue_name: String) -> bool` |

`R`/`C`/`I`/`D` back onto **generated files** (`res://game/autoloads/*.gd`) rewritten every time you create an object in the dock — never hand-edit them; put custom logic in the object's own script instead. Two more singletons round out the surface: `T` (`PopochiuITransitionLayer`, screen transitions — §4) and `Cursor` (mouse cursor rendering).

---

## 4. Rooms & navigation

Create rooms from the dock's "Create room" button — it scaffolds `room_<name>.gd`/`.tscn` under `res://game/rooms/<name>/` with child nodes `$Props`, `$Characters`, `$Hotspots`, `$Regions`, `$WalkableAreas`, `$Markers`. A room needs at least one enabled Walkable Area or characters won't path on click.

`R.goto_room()` changes rooms — **there is no `E.goto_room()`**; room navigation lives on `R`:

```gdscript
func _on_click() -> void:
    await C.player.walk_to_clicked()
    R.goto_room("Garden")
```

`E.queue()` scripts a cutscene from an ordered instruction list — mix `Callable`s (the `queue_*` twin of any action) and plain strings:

```gdscript
func _on_room_transition_finished() -> void:
    E.queue([
        "Popsy: Finally, some fresh air.",
        C.Popsy.queue_walk_to(Vector2(400, 300)),
        "...",  # 1s pause
        C.Popsy.queue_say("Now, where did I put that key?"),
    ])
```

String shorthand accepted by `queue()`/`cutscene()`: `"Name: text"` (says a line), `"Name(emotion): text"`, `"Name[N]: text"` (auto-continues after N seconds), `"."`/`".."`/`"..."` (0.25s/0.5s/1s pauses, doubling per dot), any other string shown via `G.show_system_text()`. `E.cutscene()` is additionally skippable via the `popochiu-skip` input action (default Esc).

Room transitions go through `T` (new in 2.1) — not the deprecated `E.play_transition()`/`E.queue_play_transition()` (still present in 2.1.1 but print a runtime warning):

```gdscript
await T.play_transition("fade", 0.5, T.PLAY_MODE.IN_OUT)
```

`R.goto_room()` plays the project's default transition automatically unless called with `use_transition := false`.

---

## 5. Interactions

| Type | Base | Purpose |
|---|---|---|
| **Prop** | `PopochiuProp` (`Area2D`) | Visible/interactive scenery — sprite, optional `link_to_item`, can be a nav obstacle |
| **Hotspot** | `PopochiuHotspot` (`Area2D`) | Invisible interaction zone (no sprite of its own — e.g. part of the background art) |
| **Region** | `PopochiuRegion` (`Area2D`) | Trigger area that tints/scales a character on enter/exit; does **not** receive clicks |

Props, Hotspots, and Characters all extend `PopochiuClickable` and share one virtual lifecycle. Override these underscore-prefixed methods in generated scripts — the engine calls public wrappers (`on_click()`, etc.) that call these internally, so never override the public wrapper itself:

```gdscript
# prop_key.gd
extends PopochiuProp

func _on_click() -> void:
    await C.player.walk_to_clicked()
    I.Key.add_as_active()

func _on_item_used(item: PopochiuInventoryItem) -> void:
    if item == I.Oil:
        await C.player.say("That should stop it squeaking.")
```

Full callback set: `_on_room_set`, `_on_click`, `_on_double_click`, `_on_right_click`, `_on_middle_click`, `_on_item_used(item)`, `_on_position_changed`, `_on_movement_started`, `_on_movement_ended`.

**Command-based GUI, at a glance**: each shipped GUI template (9 Verb / Sierra / SimpleClick) registers verbs via `E.register_command(id, "Display Name", fallback)`. On click, Popochiu snake_cases the active command and looks for `on_<command>()` on the clicked object (e.g. `on_look_at()`) before falling back to `_on_click()`. Full mechanics — including `E.current_command`, registering custom commands, and the deprecated `E.active_command` snippet you may see in older tutorials — are in [references/gui.md](references/gui.md).

---

## 6. Characters & dialog basics

Create characters from the dock; the first one created becomes the Player Character. Say a line with an optional emotion:

```gdscript
await C.player.walk_to_clicked()
await C.player.say("What a mess.", "annoyed")
```

Emotions map to `voice_cues` and `avatars` export arrays (emotion name → audio cue / GUI portrait); `say()` sets `emotion` for the duration of the line, then resets it to `""`.

Start a named dialog tree from a click handler:

```gdscript
func _on_click() -> void:
    await C.player.face_clicked()
    D.PopsyHouseChat.start()
```

Dialog trees are `PopochiuDialog` resources with branching options, per-option conditions, and handler methods — full authoring pattern (including the `Array`-only `turn_on_options()`/`turn_off_options()` gotcha) is in [references/dialogs.md](references/dialogs.md).

Deep dives: [references/dialogs.md](references/dialogs.md), [references/inventory.md](references/inventory.md), [references/gui.md](references/gui.md), [references/pipeline.md](references/pipeline.md)

---

## Implementation checklist

- [ ] Popochiu enabled in **Project Settings → Plugins**; project reloaded after enabling
- [ ] Setup wizard run once (Game Type, Resolution, GUI Template) before authoring rooms
- [ ] Every room has at least one enabled Walkable Area, or characters won't path on click
- [ ] Room navigation uses `R.goto_room()` — not a nonexistent `E.goto_room()`
- [ ] Cutscene scripting uses `E.queue([...])`/`E.cutscene([...])`, not bare `queue_*()` calls (those are silent no-ops outside a queue)
- [ ] Non-`queue_` action calls (`say()`, `walk_to()`, …) are `await`ed, or they run concurrently instead of sequentially
- [ ] Room transitions use `T.play_transition()`, not the deprecated `E.play_transition()`
- [ ] `res://game/autoloads/{r,c,i,d,a}.gd` are never hand-edited — they're dock-regenerated
- [ ] Custom persisted fields live on the generated `*_state.gd` resource (JSON-safe types, or `_on_save`/`_on_load` overrides for complex ones)
- [ ] `turn_on_options()`/`turn_off_options()`/`turn_off_forever_options()` are called with an `Array`, even for one id
- [ ] Command handlers use `on_<command>()` (verb-specific) or the `_on_click()` fallback — never override the public `on_click()` wrapper itself
- [ ] GUI template chosen once and treated as a starting point — switching templates later replaces the whole `res://game/gui/` tree
