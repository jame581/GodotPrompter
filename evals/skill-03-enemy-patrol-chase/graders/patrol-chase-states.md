---
type: llm
focus: last_message
---
Pass if patrol and chase are explicit states (an enum, state nodes, or equivalent) with a transition in both directions: patrol to chase when the player is detected, and chase back to patrol when the player is lost or out of range. Fail if the enemy can never return to patrolling.
