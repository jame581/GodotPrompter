---
type: llm
focus: last_message
weight: 2
---
Pass only if the code changes room by calling `R.goto_room("Garden")` (extra arguments are fine; `R.queue_goto_room` inside an `E.queue([...])` list also counts). Fail if the room change in the code is done with `E.goto_room(...)`, `get_tree().change_scene_to_file(...)` / `change_scene_to_packed(...)`, `C.player.change_room(...)`, or any call that is not on the `R` autoload. Mentioning `E.goto_room` only to say it does not exist is fine.
