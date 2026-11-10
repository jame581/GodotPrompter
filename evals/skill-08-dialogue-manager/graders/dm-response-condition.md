---
type: llm
focus: last_message
---
Dialogue Manager 4 requires response conditions to be self-closing. Pass if the sample `.dialogue` text gates the second choice with a self-closing condition on the response line, `- Some text [if GameState.has_key /]` (a `=> cue` jump, if present, comes after the `/]`). Fail if the response condition is written without the closing ` /]` (the Dialogue Manager 3 form `- Some text [if GameState.has_key]`, which version 4 compiles without error but never applies), if the choice is gated only by an `if` block around the response, or if no `.dialogue` sample is given.
