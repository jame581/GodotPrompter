---
type: llm
focus: last_message
---
Pass if the loop decides the conversation is over by testing the value returned from `get_next_dialogue_line` / `GetNextDialogueLine` for null: `while line:`, `if not line:`, `line == null` / `line != null`, `is null` / `is not null` all count. Fail if the returned line is never tested for null, or if the only end-of-conversation test compares the line with an empty dictionary (`{}`), calls `is_empty()` on it, or inspects only `next_id`.
