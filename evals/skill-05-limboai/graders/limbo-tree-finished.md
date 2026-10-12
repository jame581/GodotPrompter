---
type: llm
focus: last_message
---
Pass only if the enemy script detects the end of the tree by connecting to the BTPlayer signal named `updated` (C#: the `Updated` event), which carries the tree's status, and restarts with `restart()` (C#: `Restart()`). Fail if the code that detects the tree finishing connects to `behavior_tree_finished` (deprecated), or to any other signal name such as `finished`, `tree_finished` or `completed`. Mentioning `behavior_tree_finished` only to say it is deprecated is fine.
