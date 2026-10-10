---
type: llm
focus: last_message
---
Pass if loading handles both a missing save file and a file that fails to open or parse (a null or error check before the data is used), so a corrupt or absent slot does not crash the game. Fail if the load code uses the parsed result without checking it.
