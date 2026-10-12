---
type: llm
focus: last_message
weight: 2
---
Pass only if BOTH hold: (1) each line is fetched with an awaited call to `DialogueManager.get_next_dialogue_line(resource, title_or_id)` (C#: `await DialogueManager.GetNextDialogueLine(...)`); (2) the loop advances by passing the current line's `next_id` when there are no choices and the chosen response's `next_id` when there are (C#: `NextId`). Fail if the call is not awaited, or if lines are fetched or advanced with other method names such as `get_next_line`, `get_line`, `next()`, `advance()` or `get_next_dialogue`.
