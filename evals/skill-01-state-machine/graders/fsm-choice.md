---
type: llm
focus: last_message
---
Pass if the answer picks a state machine structure that scales to the seven named states — one node or class per state, or a hierarchical or parallel machine — AND justifies the pick by contrasting it with at least one named alternative (for example a single enum with a match statement) with a reason tied to the number of states or the complexity. Fail if it puts all seven states in one enum-and-match script without acknowledging that approach's limits, or if it gives no reason for the structure it picked.
