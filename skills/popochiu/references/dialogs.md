# Popochiu — Dialog Trees

> Deep dive for [../SKILL.md](../SKILL.md) §6. Source: `addons/popochiu/engine/objects/dialog/popochiu_dialog.gd` (`PopochiuDialog extends Resource`), `popochiu_dialog_option.gd` (`PopochiuDialogOption extends Resource`), `addons/popochiu/engine/interfaces/i_dialog.gd` (`D` singleton).

## Resource structure

A dialog tree is a `.tres` `PopochiuDialog` resource with an `options: Array[PopochiuDialogOption]` export, created via the dock's "Create dialog" button (`res://game/dialogs/<name>/dialog_<name>.gd` + `.tres`). Each `PopochiuDialogOption` has:

| Field | Type | Default | Meaning |
|---|---|---|---|
| `id` | `String` | — | Option identifier, matched in `_option_selected` / used to derive `_on_option_<snake_case_id>` |
| `text` | `String` | — | Line shown in the options list |
| `visible` | `bool` | `true` | Shown in the current options list |
| `disabled` | `bool` | `false` | Shown but not selectable |
| `always_on` | `bool` | `false` | Can't be turned off by `turn_off_options()` |
| `used` / `used_times` | `bool` / `int` | runtime | Tracks whether/how often the option was picked |

Options are authored either in the Inspector (Add Element on the `options` array) or from code via `create_option(id: String, config: Dictionary = {}) -> PopochiuDialogOption` inside the `_on_build_options` virtual — useful when you want to mix Inspector-authored options with procedurally generated ones.

## Dialog virtual lifecycle

```gdscript
func _on_build_options(existing_options: Array[PopochiuDialogOption]) -> Array[PopochiuDialogOption]
# optional — return existing_options plus any code-created options

func _on_start() -> void
# must await something — the engine awaits this before showing options

func _option_selected(opt: PopochiuDialogOption) -> void
# called when no _on_option_<snake_case_id> method exists for the picked option

func _on_save() -> Dictionary
func _on_load(data: Dictionary) -> void
```

Instead of one big `match` in `_option_selected`, Popochiu auto-calls a method named `_on_option_<snake_case(option.id)>` if it exists — option id `BYE2` calls `_on_option_bye_2(opt)`. Pick whichever style keeps a given tree readable; both are equally supported.

## Branching / condition pattern

Verified tutorial example (`docs/src/how-to-develop-a-game/script-your-first-dialogue.md`, v2.1.1):

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
            stop()  # fallback — always include one so an unhandled option doesn't soft-lock the dialog
    _show_options()
```

`PopochiuDialog` public API used in branching logic — **all three take an `Array`, even for one id**:

```gdscript
func turn_on_options(ids: Array) -> void
func turn_off_options(ids: Array) -> void
func turn_off_forever_options(ids: Array) -> void
func get_option(opt_id: String) -> PopochiuDialogOption
func start() -> void   # queue_start() twin
func stop() -> void    # queue_stop() twin
```

`turn_off_options("MessyRoom")` (a bare string) is explicitly called out in the addon's own docs as one of the most common authoring mistakes — always wrap in `[...]`.

`PopochiuDialogOption` instance methods: `turn_on()`, `turn_off()`, `turn_off_forever()` — equivalent single-option shortcuts to the tree-level calls above.

## `D` (`PopochiuIDialog`) API

```gdscript
func show_inline_dialog(options: Array) -> PopochiuDialogOption   # ad hoc option list outside a named tree
func finish_dialog() -> void
func say_selected() -> void          # makes C.player say the selected option's text
func create_gibberish(input_string: String) -> String   # bbcode-preserving scrambler (spoiler masking, unknown-language effect)
func get_instance(script_name: String) -> PopochiuDialog
```

State: `D.active: bool`, `D.current_dialog: PopochiuDialog`, `D.selected_option: PopochiuDialogOption`, `D.trees: Dictionary` (per-dialog state cache), `D.prev_dialog: PopochiuDialog`.

Signals: `dialog_started(dlg)`, `option_selected(opt)`, `dialog_finished(dlg)`, `dialog_options_requested(options)`, `inline_dialog_requested(options)`.

## Starting a dialog

```gdscript
func _on_click() -> void:
    await C.player.face_clicked()
    D.PopsyHouseChat.start()
```

`D.PopsyHouseChat` is a dock-generated getter on the `D` autoload (`res://game/autoloads/d.gd`) — every dialog tree you create in the dock gets one, giving autocomplete for `D.<DialogName>`.
