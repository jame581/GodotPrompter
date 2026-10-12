---
type: llm
focus: last_message
weight: 2
---
The script has five planted issues: (A) in die(), code after `await` runs after queue_free(), so the scene change never happens — the freed node's coroutine is dropped; (B) a signal is connected inside _process(), so connect() runs every frame; (C) load() of the bullet scene runs on every shot instead of preload() or a cached PackedScene; (D) input is read with a hard-coded key constant (KEY_SPACE) instead of an Input Map action; (E) free() is called on a physics body inside its own collision callback instead of queue_free(). Pass if the review clearly identifies at least FOUR of the five AND one of them is (A), stated as the code after the await not running (not merely as "awaiting after queue_free is risky"). Fail otherwise.
