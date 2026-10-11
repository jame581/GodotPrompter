---
type: llm
focus: last_message
---
Pass if the answer explains that the cause is a Godot 4.7 change: the default `area_mask` of `AudioStreamPlayer3D` (and `AudioStreamPlayer2D`) went from 1 to 0, so players left at the default no longer respond to an area's bus override. Fail if the answer does not attribute the breakage to a changed default in 4.7, or says the area bus override feature was removed or renamed.
