---
type: llm
focus: last_message
---
Pass only if the boss shot sets its follow mode to GROUP (GDScript `follow_mode = PhantomCamera2D.FollowMode.GROUP` or the same value set in the Inspector; C# `FollowMode2D.Group`) and gives it both nodes through the array property `follow_targets` (C#: `FollowTargets`, or `Set("follow_targets", ...)`). Fail if both nodes are framed by assigning the single-node `follow_target` property, by following a hand-made midpoint node, or by computing the midpoint and zoom manually each frame.
