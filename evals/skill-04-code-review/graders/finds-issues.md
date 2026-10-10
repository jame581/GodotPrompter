---
type: llm
focus: last_message
weight: 2
---
The script has four planted issues: (A) variables and functions have no static types; (B) a CharacterBody2D is moved by changing position in _process instead of setting velocity and calling move_and_slide() in _physics_process; (C) a hard-coded absolute node path ("/root/Main/Player") is looked up with get_node() every frame instead of being cached or found through a group, export, or signal; (D) remove_child() before queue_free() is redundant. Pass if the review clearly identifies at least THREE of the four. Fail if it identifies two or fewer.
