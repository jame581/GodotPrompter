---
type: llm
focus: last_message
---
Pass if the leaf code reads the stored player from the blackboard with `blackboard.get_value("target")` (a default argument or a blackboard-name argument is fine) and every other blackboard access in the answer uses `set_value`, `has_value` or `erase_value`. Fail if any blackboard access uses `get_var` / `set_var`, `blackboard.get(...)` / `blackboard.set(...)`, `blackboard["target"]`, or property access such as `blackboard.target`.
