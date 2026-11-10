---
type: llm
focus: last_message
---
Pass if, when a line has responses, the code picks the first response whose `is_allowed` is true (C#: `IsAllowed`) — for example by filtering or looping over the responses. Dialogue Manager returns responses whose condition failed, flagged `is_allowed == false`, so taking `responses[0]` unconditionally is wrong. Fail if the code takes the first response without checking `is_allowed` / `IsAllowed` in either language, or invents a different property for this.
