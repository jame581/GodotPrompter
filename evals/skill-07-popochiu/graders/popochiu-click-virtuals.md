---
type: llm
focus: last_message
---
Pass only if BOTH hold: (1) the door script extends `PopochiuProp` and puts the click behaviour in an override named `_on_click()` and the key behaviour in `_on_item_used(item)`, both with the leading underscore; (2) the walk and the line of dialogue are awaited calls on the player character through the `C` autoload, such as `await C.player.walk_to_clicked()` and `await C.player.say("It's locked.")`. Fail if the script overrides `on_click()` or `on_item_used()` without the underscore, uses `on_interact()` / `_on_interact()` / `_input_event()`, or calls `say()` / a walk method without `await` outside an `E.queue([...])` list.
