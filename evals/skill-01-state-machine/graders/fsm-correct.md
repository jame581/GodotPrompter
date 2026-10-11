---
type: llm
focus: last_message
---
Pass if every state change goes through one place (the state machine) that calls the outgoing state's exit hook and then the incoming state's entry hook. Hooks defined once on a base state class and inherited count: a state does not have to override them itself. Fail if states are switched by assigning the current-state variable directly, with no exit and entry calls, or if move_and_slide() is called with arguments.
