---
type: llm
focus: last_message
weight: 2
---
Pass only if the answer explains that the cause is a Godot 4.7 change to the device IDs of keyboard and mouse input events: they used to be `0`, and in 4.7 keyboard events report `InputEvent.DEVICE_ID_KEYBOARD` (value `16`) and/or mouse events report `InputEvent.DEVICE_ID_MOUSE` (value `32`). Naming either constant or either numeric value, together with the statement that it is no longer `0`, is enough. Fail if the answer says keyboard and mouse events still have device `0` on 4.7, if it never says the keyboard/mouse device ID changed in 4.7, or if it blames something else instead (stick drift or joypad noise events, the emulation device `-1`, joypad index ordering, or a bug in the user's Input Map).
