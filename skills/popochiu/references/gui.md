# Popochiu — GUI Templates & the Command Framework

> Deep dive for [../SKILL.md](../SKILL.md) §5. Source: `addons/popochiu/editor/helpers/popochiu_gui_templates_helper.gd`, `addons/popochiu/engine/objects/gui/popochiu_commands.gd`, `.../gui/templates/9_verb/9_verb_commands.gd`, cross-checked against `docs/src/the-engine-handbook/gui-commands-and-fallbacks.md`.

## Shipped templates

| Template | Class | Style |
|---|---|---|
| `9_verb` | `NineVerbCommands` (10 verbs) | SCUMM-style — Monkey Island 2 / Thimbleweed Park |
| `sierra` | `SierraCommands` (4 verbs) | SCI-style — King's Quest VI |
| `simple_click` | `SimpleClickCommands` (no verb buttons) | Left/right click only — Beneath a Steel Sky / Broken Sword |

Each has a `_high_res` sibling folder (`9_verb_high_res`, `sierra_high_res`, `simple_click_high_res`) — six template folders exist on disk for three conceptual GUIs. If a high-res-specific commands script is missing, `copy_gui_template` falls back to the base (non-high-res) commands template. A **Custom** option (`PopochiuResources.GUI_CUSTOM`) copies a minimal starter instead of a preset.

## Selection & swapping

The Setup wizard's GUI tab (or the dock's "Setup" button later) calls `PopochiuGUITemplatesHelper.copy_gui_template(template_name, on_progress, on_complete)`, which:

1. Copies `<id>/<id>_gui.tscn` → `res://game/gui/gui.tscn`.
2. Copies that template's component scenes into `res://game/gui/**` so you can edit them freely.
3. Copies `<id>_commands_template.gd` → `res://game/gui/gui_commands.gd`.
4. Records the chosen template name in `popochiu_data.cfg` (`ui`, `template`).

**Switching templates later replaces the whole `res://game/gui/` tree**, including any component copies you've hand-edited — treat the initial choice as load-bearing, or back up custom GUI edits before switching.

## Command dispatch mechanics

1. Each GUI template's `*Commands` class (`extends PopochiuCommands`) registers its verbs in `_init()` via `E.register_command(id, "Display Name", fallback_callable)`, e.g. `E.register_command(Commands.LOOK_AT, "Look at", look_at)`. `Commands` here is a **local enum defined on the template's own commands class** (`9_verb_commands.gd`) — there is no global `Commands` enum shared across templates.
2. On click, `PopochiuClickable.handle_command(button_idx)` snake_cases the active command's name and looks for `on_<command>()` (or `on_right_<command>()` / `on_middle_<command>()`) on the clicked object.
3. If that method doesn't exist, dispatch falls back to the generic `_on_click()` / `_on_right_click()` / `_on_middle_click()`. If that virtual calls `E.command_fallback()`, the engine invokes the command's registered fallback `Callable` (e.g. `NineVerbCommands.look_at()`).
4. Game-level overrides live in the generated `res://game/gui/gui_commands.gd`, which `extends` the template's commands class (e.g. `extends NineVerbCommands`) and can override any fallback method, `fallback()` itself (the id `-1` global default), or register new commands with `E.register_command_without_id(name, fallback) -> int`.

```gdscript
# game/gui/gui_commands.gd
extends NineVerbCommands

func look_at() -> void:
    # Fallback methods take no arguments — read the clicked object off E.clicked.
    await C.player.face_clicked()
    await C.player.say("Nothing special about that.")
```

## Reading the current command

`E.current_command: int` is the active command id (settable — assigning it emits `command_selected`); `E.get_current_command_name() -> String` returns its display name; `E.get_command_name(id) -> String` looks up any registered command's name.

**Docs-site drift warning:** the live tutorial page's inline example uses `E.active_command` and a global `Commands.LOOK_AT` enum (`match E.active_command: Commands.LOOK_AT: ...`). Neither exists in the v2.1.1 engine source — that snippet is stale. Use `E.current_command` / `E.get_current_command_name()` and a template-local `Commands` enum instead, as shown above.
