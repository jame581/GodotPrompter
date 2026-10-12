---
type: llm
focus: last_message
weight: 2
---
Pass only if BOTH hold: (1) the in-range check extends `ConditionLeaf` and the attack extends `ActionLeaf`; (2) each overrides a method named exactly `tick` with two parameters, the actor and the blackboard (`func tick(actor, blackboard)`), returning the constants SUCCESS, FAILURE or RUNNING. Fail if a leaf extends `BTAction`, `BTCondition`, `BeehaveAction` or a plain `Node`, if the override is named `_tick` or takes a delta argument, or if it returns a bool.
