---
type: llm
focus: last_message
weight: 2
---
Pass only if BOTH hold: (1) the custom task extends `BTAction` (or `BTTask`) and does its work in an override named `_tick` taking a delta argument (C#: `_Tick(double delta)`) that returns SUCCESS, FAILURE or RUNNING (C#: `Status.Success` / `Status.Failure` / `Status.Running`); (2) it reads the target position from the blackboard with `blackboard.get_var(...)` (C#: `Blackboard.GetVar(...)`). Fail if the task extends `ActionLeaf` or `BeehaveNode`, if the method is `tick(actor, blackboard)` without the leading underscore, or if the blackboard is read with `get_value(...)`, `blackboard.get(...)` or `blackboard[...]`.
