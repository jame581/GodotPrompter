---
type: llm
focus: last_message
---
Pass only if ALL hold: (1) pathing uses a NavigationAgent2D on a scene with a NavigationRegion2D — not hand-written pathfinding and not straight-line movement toward the target; (2) the agent is driven by setting target_position and reading get_next_path_position(); (3) the enemy moves by setting velocity and calling move_and_slide() with no arguments.
